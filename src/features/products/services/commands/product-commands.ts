"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";
import { ProductType } from "@/lib/generated/prisma/client";

const createProductSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  type: z.enum(["PRODUCT", "SERVICE"]).default("SERVICE"),
});

const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1),
});

export async function findOrCreateProduct(
  name: string,
  userId: string,
  type: "PRODUCT" | "SERVICE" = "SERVICE",
): Promise<number> {
  const product = await prisma.product.upsert({
    where: { name_userId: { name, userId } },
    update: {},
    create: { name, userId, type: type as ProductType },
    select: { id: true },
  });

  return product.id;
}

export async function createProductCommand(
  input: z.infer<typeof createProductSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createProductSchema.parse(input);

    const existing = await prisma.product.findFirst({
      where: { name: validated.name, userId: user.id },
    });

    if (existing) {
      return { success: false, error: "Usługa o tej nazwie już istnieje" };
    }

    await prisma.product.create({
      data: {
        name: validated.name,
        type: validated.type as ProductType,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać usługi");
  }
}

export async function updateProductCommand(
  input: z.infer<typeof updateProductSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateProductSchema.parse(input);

    const product = await prisma.product.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!product) {
      return { success: false, error: "Usługa nie została znaleziona" };
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        name: validated.name,
        type: validated.type as ProductType,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować usługi");
  }
}

export async function deleteProductCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const product = await prisma.product.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!product) {
      return { success: false, error: "Usługa nie została znaleziona" };
    }

    await prisma.transactionLineItem.updateMany({
      where: { productId: product.id },
      data: { productId: null },
    });

    await prisma.product.delete({
      where: { id: product.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się usunąć usługi");
  }
}
