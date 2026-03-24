'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { requireUser } from '@/shared/lib/auth/helpers';
import { handleCommandError } from '@/shared/utils/error-handling';
import type { OperationResult } from '@/shared/types/common';

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  nip: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email('Niepoprawny email').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.extend({
  id: z.string().min(1),
});

export async function findOrCreateCustomer(
  name: string,
  userId: string
): Promise<number> {
  const customer = await prisma.customer.upsert({
    where: { name_userId: { name, userId } },
    update: {},
    create: { name, userId },
    select: { id: true },
  });
  return customer.id;
}

export async function createCustomerCommand(
  input: z.infer<typeof createCustomerSchema>
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createCustomerSchema.parse(input);

    const existing = await prisma.customer.findFirst({
      where: { name: validated.name, userId: user.id },
    });

    if (existing) {
      return { success: false, error: 'Klient o tej nazwie już istnieje' };
    }

    await prisma.customer.create({
      data: {
        name: validated.name,
        nip: validated.nip || null,
        street: validated.street || null,
        postalCode: validated.postalCode || null,
        city: validated.city || null,
        email: validated.email || null,
        phone: validated.phone || null,
        notes: validated.notes || null,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się dodać klienta');
  }
}

export async function updateCustomerCommand(
  input: z.infer<typeof updateCustomerSchema>
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateCustomerSchema.parse(input);

    const customer = await prisma.customer.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!customer) {
      return { success: false, error: 'Klient nie został znaleziony' };
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: validated.name,
        nip: validated.nip || null,
        street: validated.street || null,
        postalCode: validated.postalCode || null,
        city: validated.city || null,
        email: validated.email || null,
        phone: validated.phone || null,
        notes: validated.notes || null,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się zaktualizować klienta');
  }
}

export async function deleteCustomerCommand(
  publicId: string
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const customer = await prisma.customer.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!customer) {
      return { success: false, error: 'Klient nie został znaleziony' };
    }

    await prisma.transaction.updateMany({
      where: { customerId: customer.id, userId: user.id },
      data: { customerId: null },
    });

    await prisma.customer.delete({
      where: { id: customer.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się usunąć klienta');
  }
}
