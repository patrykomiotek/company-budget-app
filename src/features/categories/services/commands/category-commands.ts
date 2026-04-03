"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";
import type { CategoryType } from "@/lib/generated/prisma/client";
import type { CategoryWithSubcategories } from "../../contracts/category.types";

const subcategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nazwa podkategorii jest wymagana"),
  sortOrder: z.number().int().min(0),
});

const createCategorySchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  type: z.enum(["INCOME", "EXPENSE"]),
  sortOrder: z.number().int().min(0).optional(),
  subcategories: z.array(subcategorySchema).optional(),
});

const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nazwa jest wymagana"),
  type: z.enum(["INCOME", "EXPENSE"]),
  sortOrder: z.number().int().min(0).optional(),
  subcategories: z.array(subcategorySchema).optional(),
});

export async function createCategoryCommand(
  input: z.infer<typeof createCategorySchema>,
): Promise<OperationResult> {
  try {
    await requireUser();
    const validated = createCategorySchema.parse(input);

    await prisma.category.create({
      data: {
        name: validated.name,
        type: validated.type as CategoryType,
        sortOrder: validated.sortOrder ?? 0,
        subcategories: validated.subcategories
          ? {
              create: validated.subcategories.map((s) => ({
                name: s.name,
                sortOrder: s.sortOrder,
              })),
            }
          : undefined,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się utworzyć kategorii");
  }
}

export async function updateCategoryCommand(
  input: z.infer<typeof updateCategorySchema>,
): Promise<OperationResult> {
  try {
    await requireUser();
    const validated = updateCategorySchema.parse(input);

    const category = await prisma.category.findUnique({
      where: { publicId: validated.id },
      include: { subcategories: true },
    });

    if (!category) {
      return { success: false, error: "Kategoria nie została znaleziona" };
    }

    const skippedDeletions: string[] = [];

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: category.id },
        data: {
          name: validated.name,
          type: validated.type as CategoryType,
          sortOrder: validated.sortOrder ?? category.sortOrder,
        },
      });

      if (validated.subcategories) {
        const existingIds = category.subcategories.map((s) => s.publicId);
        const incomingIds = validated.subcategories
          .map((s) => s.id)
          .filter(Boolean) as string[];

        // Delete removed subcategories (only those without transactions)
        const toDelete = existingIds.filter((id) => !incomingIds.includes(id));
        for (const publicId of toDelete) {
          const sub = category.subcategories.find(
            (s) => s.publicId === publicId,
          )!;
          const txCount = await tx.transaction.count({
            where: { subcategoryId: sub.id },
          });
          if (txCount === 0) {
            await tx.subcategory.delete({ where: { id: sub.id } });
          } else {
            skippedDeletions.push(sub.name);
          }
        }

        // Upsert subcategories
        for (const sub of validated.subcategories) {
          if (sub.id) {
            const existing = category.subcategories.find(
              (s) => s.publicId === sub.id,
            );
            if (existing) {
              await tx.subcategory.update({
                where: { id: existing.id },
                data: { name: sub.name, sortOrder: sub.sortOrder },
              });
            }
          } else {
            await tx.subcategory.create({
              data: {
                name: sub.name,
                sortOrder: sub.sortOrder,
                categoryId: category.id,
              },
            });
          }
        }
      }
    });

    if (skippedDeletions.length > 0) {
      return {
        success: true,
        error: `Nie usunięto podkategorii z transakcjami: ${skippedDeletions.join(", ")}`,
      };
    }

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować kategorii");
  }
}

export async function deleteCategoryCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    await requireUser();

    const category = await prisma.category.findUnique({
      where: { publicId },
      include: {
        subcategories: {
          include: { _count: { select: { transactions: true } } },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Kategoria nie została znaleziona" };
    }

    const hasTransactions = category.subcategories.some(
      (s) => s._count.transactions > 0,
    );

    if (hasTransactions) {
      return {
        success: false,
        error:
          "Nie można usunąć kategorii, ponieważ posiada podkategorie z przypisanymi transakcjami",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.subcategory.deleteMany({
        where: { categoryId: category.id },
      });
      await tx.category.delete({
        where: { id: category.id },
      });
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się usunąć kategorii");
  }
}

const reorderSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
    }),
  ),
  subcategories: z
    .array(
      z.object({
        id: z.string(),
        sortOrder: z.number().int().min(0),
      }),
    )
    .optional(),
});

export async function reorderCategoriesCommand(
  input: z.infer<typeof reorderSchema>,
): Promise<OperationResult> {
  try {
    await requireUser();
    const validated = reorderSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      for (const cat of validated.categories) {
        await tx.category.update({
          where: { publicId: cat.id },
          data: { sortOrder: cat.sortOrder },
        });
      }
      if (validated.subcategories) {
        for (const sub of validated.subcategories) {
          await tx.subcategory.update({
            where: { publicId: sub.id },
            data: { sortOrder: sub.sortOrder },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(
      error,
      "Nie udało się zmienić kolejności kategorii",
    );
  }
}

const quickCreateCategorySchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  type: z.enum(["INCOME", "EXPENSE"]),
  subcategoryNames: z.array(z.string().min(1)).optional(),
});

export async function quickCreateCategoryCommand(
  input: z.infer<typeof quickCreateCategorySchema>,
): Promise<OperationResult<CategoryWithSubcategories>> {
  try {
    await requireUser();
    const validated = quickCreateCategorySchema.parse(input);

    const subcategoryNames =
      validated.subcategoryNames && validated.subcategoryNames.length > 0
        ? validated.subcategoryNames
        : [validated.name];

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        type: validated.type as CategoryType,
        subcategories: {
          create: subcategoryNames.map((name, i) => ({
            name,
            sortOrder: i,
          })),
        },
      },
      include: { subcategories: true },
    });

    return {
      success: true,
      data: {
        id: category.publicId,
        name: category.name,
        type: category.type,
        sortOrder: category.sortOrder,
        subcategories: category.subcategories.map((s) => ({
          id: s.publicId,
          name: s.name,
          sortOrder: s.sortOrder,
          categoryId: category.publicId,
        })),
      },
    };
  } catch (error) {
    return handleCommandError(error, "Nie udało się utworzyć kategorii");
  }
}
