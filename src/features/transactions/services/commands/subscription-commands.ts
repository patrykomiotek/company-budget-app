"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import { getActiveDepartmentId } from "@/shared/lib/department/helpers";
import type { OperationResult } from "@/shared/types/common";
import {
  CategoryType,
  TransactionType,
  Currency as PrismaCurrency,
} from "@/lib/generated/prisma/client";

const TOOLS_CATEGORY_NAME = "Narzędzia i subskrypcje";

const createSubscriptionSchema = z.object({
  toolName: z.string().min(1, "Nazwa narzędzia jest wymagana"),
  amount: z.number().positive("Kwota musi być większa od 0"),
  currency: z.enum(["PLN", "EUR", "USD"]).default("PLN"),
  exchangeRate: z.number().positive().optional(),
  startMonth: z.string().min(7, "Wybierz miesiąc rozpoczęcia"), // YYYY-MM
  months: z.number().int().min(1).max(12),
  departmentPublicId: z.string().optional(),
  description: z.string().optional(),
});

async function findOrCreateToolsCategory(): Promise<{ categoryId: number }> {
  let category = await prisma.category.findFirst({
    where: {
      name: TOOLS_CATEGORY_NAME,
      type: CategoryType.EXPENSE,
      departmentId: null,
    },
  });
  if (!category) {
    category = await prisma.category.create({
      data: { name: TOOLS_CATEGORY_NAME, type: CategoryType.EXPENSE },
    });
  }
  return { categoryId: category.id };
}

async function findOrCreateToolSubcategory(
  toolName: string,
  categoryId: number,
): Promise<number> {
  const subcategory = await prisma.subcategory.upsert({
    where: { name_categoryId: { name: toolName, categoryId } },
    update: {},
    create: { name: toolName, categoryId },
  });
  return subcategory.id;
}

export async function createSubscriptionCommand(
  input: z.infer<typeof createSubscriptionSchema>,
): Promise<OperationResult<{ count: number }>> {
  try {
    const user = await requireUser();
    const validated = createSubscriptionSchema.parse(input);

    // Resolve department
    let departmentId: number | null = null;
    if (validated.departmentPublicId) {
      const dept = await prisma.department.findUnique({
        where: { publicId: validated.departmentPublicId },
        select: { id: true },
      });
      if (!dept) {
        return { success: false, error: "Nie znaleziono firmy" };
      }
      departmentId = dept.id;
    } else {
      departmentId = await getActiveDepartmentId();
    }

    // Find or create category + subcategory
    const { categoryId } = await findOrCreateToolsCategory();
    const subcategoryId = await findOrCreateToolSubcategory(
      validated.toolName,
      categoryId,
    );

    // Parse start month
    const [yearStr, monthStr] = validated.startMonth.split("-");
    const startYear = parseInt(yearStr, 10);
    const startMonth = parseInt(monthStr, 10);

    // Generate transactions
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < validated.months; i++) {
        const month = startMonth + i;
        const year = startYear + Math.floor((month - 1) / 12);
        const adjustedMonth = ((month - 1) % 12) + 1;
        const date = new Date(Date.UTC(year, adjustedMonth - 1, 1));

        await tx.transaction.create({
          data: {
            type: TransactionType.EXPENSE,
            amount: validated.amount,
            currency: (validated.currency as PrismaCurrency) ?? "PLN",
            exchangeRate:
              validated.currency !== "PLN"
                ? (validated.exchangeRate ?? null)
                : null,
            date,
            subcategoryId,
            departmentId,
            description:
              validated.description || `Subskrypcja: ${validated.toolName}`,
            userId: user.id,
          },
        });
      }
    });

    return { success: true, data: { count: validated.months } };
  } catch (error) {
    return handleCommandError(error, "Nie udało się utworzyć subskrypcji");
  }
}
