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
});

const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().min(1),
});

export async function createTransactionCommand(
  input: z.infer<typeof createTransactionSchema>
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createTransactionSchema.parse(input);

    const transaction = await prisma.transaction.create({
      data: {
        amount: validated.amount,
        date: new Date(validated.date),
        subcategoryId: validated.subcategoryId,
        description: validated.description || null,
        userId: user.id,
      },
    });

    return { success: true, data: transaction };
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

    const existing = await prisma.transaction.findFirst({
      where: { id: validated.id, userId: user.id },
    });

    if (!existing) {
      return { success: false, error: 'Transakcja nie została znaleziona' };
    }

    const updated = await prisma.transaction.updateMany({
      where: { id: validated.id, userId: user.id },
      data: {
        amount: validated.amount,
        date: new Date(validated.date),
        subcategoryId: validated.subcategoryId,
        description: validated.description || null,
      },
    });

    if (updated.count === 0) {
      return { success: false, error: 'Transakcja nie została znaleziona' };
    }

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się zaktualizować transakcji');
  }
}

export async function deleteTransactionCommand(
  id: string
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const deleted = await prisma.transaction.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      return { success: false, error: 'Transakcja nie została znaleziona' };
    }

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się usunąć transakcji');
  }
}
