"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  displayName: z.string().optional(),
  nip: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email("Niepoprawny email").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  isVip: z.boolean().optional(),
});

const updateCustomerSchema = createCustomerSchema.extend({
  id: z.string().min(1),
});

export async function findOrCreateCustomer(
  name: string,
  userId: string,
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
  input: z.infer<typeof createCustomerSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createCustomerSchema.parse(input);

    const existing = await prisma.customer.findFirst({
      where: { name: validated.name, userId: user.id },
    });

    if (existing) {
      return { success: false, error: "Klient o tej nazwie już istnieje" };
    }

    await prisma.customer.create({
      data: {
        name: validated.name,
        displayName: validated.displayName || null,
        nip: validated.nip || null,
        street: validated.street || null,
        postalCode: validated.postalCode || null,
        city: validated.city || null,
        email: validated.email || null,
        phone: validated.phone || null,
        notes: validated.notes || null,
        isVip: validated.isVip ?? false,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać klienta");
  }
}

export async function updateCustomerCommand(
  input: z.infer<typeof updateCustomerSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateCustomerSchema.parse(input);

    const customer = await prisma.customer.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!customer) {
      return { success: false, error: "Klient nie został znaleziony" };
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: validated.name,
        displayName: validated.displayName || null,
        nip: validated.nip || null,
        street: validated.street || null,
        postalCode: validated.postalCode || null,
        city: validated.city || null,
        email: validated.email || null,
        phone: validated.phone || null,
        notes: validated.notes || null,
        isVip: validated.isVip ?? false,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować klienta");
  }
}

const quickCreateCustomerSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  nip: z.string().optional(),
});

export async function quickCreateCustomerCommand(
  input: z.infer<typeof quickCreateCustomerSchema>,
): Promise<OperationResult<{ id: string; name: string; nip: string | null }>> {
  try {
    const user = await requireUser();
    const validated = quickCreateCustomerSchema.parse(input);

    const existing = await prisma.customer.findFirst({
      where: { name: validated.name, userId: user.id },
    });

    if (existing) {
      return { success: false, error: "Klient o tej nazwie już istnieje" };
    }

    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        nip: validated.nip || null,
        userId: user.id,
      },
      select: { publicId: true, name: true, nip: true },
    });

    return {
      success: true,
      data: { id: customer.publicId, name: customer.name, nip: customer.nip },
    };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać klienta");
  }
}

export async function deleteCustomerCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const customer = await prisma.customer.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!customer) {
      return { success: false, error: "Klient nie został znaleziony" };
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
    return handleCommandError(error, "Nie udało się usunąć klienta");
  }
}
