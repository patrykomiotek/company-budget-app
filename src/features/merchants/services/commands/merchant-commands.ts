"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";

const createMerchantSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  nip: z.string().optional(),
});

export async function createMerchantCommand(
  input: z.infer<typeof createMerchantSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createMerchantSchema.parse(input);

    const existing = await prisma.merchant.findFirst({
      where: { name: validated.name, userId: user.id },
    });

    if (existing) {
      return { success: false, error: "Dostawca o tej nazwie już istnieje" };
    }

    await prisma.merchant.create({
      data: {
        name: validated.name,
        nip: validated.nip || null,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać dostawcy");
  }
}

const updateMerchantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nazwa jest wymagana"),
  nip: z.string().optional(),
  logoUrl: z.string().url("Niepoprawny URL").optional().or(z.literal("")),
});

const deleteMerchantSchema = z.object({
  id: z.string().min(1),
});

export async function updateMerchantCommand(
  input: z.infer<typeof updateMerchantSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateMerchantSchema.parse(input);

    const merchant = await prisma.merchant.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!merchant) {
      return { success: false, error: "Dostawca nie został znaleziony" };
    }

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        name: validated.name,
        nip: validated.nip || null,
        logoUrl: validated.logoUrl || null,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować dostawcy");
  }
}

export async function deleteMerchantCommand(
  input: z.infer<typeof deleteMerchantSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = deleteMerchantSchema.parse(input);

    const merchant = await prisma.merchant.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!merchant) {
      return { success: false, error: "Dostawca nie został znaleziony" };
    }

    await prisma.transaction.updateMany({
      where: { merchantId: merchant.id, userId: user.id },
      data: { merchantId: null },
    });

    await prisma.merchant.delete({
      where: { id: merchant.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się usunąć dostawcy");
  }
}
