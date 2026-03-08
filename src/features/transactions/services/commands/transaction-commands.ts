'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { requireUser } from '@/shared/lib/auth/helpers';
import { handleCommandError } from '@/shared/utils/error-handling';
import type { OperationResult } from '@/shared/types/common';

const createTransactionSchema = z.object({
  amount: z.number().positive('Kwota musi być większa od 0'),
  date: z.string(),
  subcategoryId: z.string().min(1, 'Wybierz podkategorię'),
  description: z.string().optional(),
  merchantName: z.string().optional(),
});

const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().min(1),
});

async function findOrCreateMerchant(name: string, userId: string): Promise<number> {
  const existing = await prisma.merchant.findFirst({
    where: { name, userId },
  });
  if (existing) {return existing.id;}

  const created = await prisma.merchant.create({
    data: { name, userId },
  });
  return created.id;
}

async function resolveSubcategoryId(publicId: string): Promise<number> {
  const sub = await prisma.subcategory.findUnique({
    where: { publicId },
  });
  if (!sub) {throw new Error('Podkategoria nie została znaleziona');}
  return sub.id;
}

export async function createTransactionCommand(
  input: z.infer<typeof createTransactionSchema>
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createTransactionSchema.parse(input);

    const subcategoryId = await resolveSubcategoryId(validated.subcategoryId);

    let merchantId: number | null = null;
    if (validated.merchantName) {
      merchantId = await findOrCreateMerchant(validated.merchantName, user.id);
    }

    await prisma.transaction.create({
      data: {
        amount: validated.amount,
        date: new Date(validated.date),
        subcategoryId,
        description: validated.description || null,
        merchantId,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się dodać transakcji');
  }
}

export async function updateTransactionCommand(
  input: z.infer<typeof updateTransactionSchema>
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateTransactionSchema.parse(input);

    const transaction = await prisma.transaction.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!transaction) {
      return { success: false, error: 'Transakcja nie została znaleziona' };
    }

    const subcategoryId = await resolveSubcategoryId(validated.subcategoryId);

    let merchantId: number | null = null;
    if (validated.merchantName) {
      merchantId = await findOrCreateMerchant(validated.merchantName, user.id);
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        amount: validated.amount,
        date: new Date(validated.date),
        subcategoryId,
        description: validated.description || null,
        merchantId,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się zaktualizować transakcji');
  }
}

export async function deleteTransactionCommand(
  publicId: string
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const transaction = await prisma.transaction.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!transaction) {
      return { success: false, error: 'Transakcja nie została znaleziona' };
    }

    await prisma.transaction.delete({
      where: { id: transaction.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się usunąć transakcji');
  }
}
