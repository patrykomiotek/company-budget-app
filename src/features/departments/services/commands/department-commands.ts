"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
});

export async function createDepartmentCommand(
  input: z.infer<typeof createDepartmentSchema>,
): Promise<OperationResult> {
  try {
    await requireUser();
    const validated = createDepartmentSchema.parse(input);

    const existing = await prisma.department.findFirst({
      where: { name: validated.name },
    });

    if (existing) {
      return { success: false, error: "Oddział o tej nazwie już istnieje" };
    }

    await prisma.department.create({
      data: {
        name: validated.name,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać oddziału");
  }
}

const updateDepartmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nazwa jest wymagana"),
});

export async function updateDepartmentCommand(
  input: z.infer<typeof updateDepartmentSchema>,
): Promise<OperationResult> {
  try {
    await requireUser();
    const validated = updateDepartmentSchema.parse(input);

    const department = await prisma.department.findFirst({
      where: { publicId: validated.id },
    });

    if (!department) {
      return { success: false, error: "Oddział nie został znaleziony" };
    }

    const duplicate = await prisma.department.findFirst({
      where: { name: validated.name, NOT: { id: department.id } },
    });

    if (duplicate) {
      return { success: false, error: "Oddział o tej nazwie już istnieje" };
    }

    await prisma.department.update({
      where: { id: department.id },
      data: {
        name: validated.name,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować oddziału");
  }
}

export async function deleteDepartmentCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    await requireUser();

    const department = await prisma.department.findFirst({
      where: { publicId },
      include: {
        _count: { select: { transactions: true, employees: true } },
      },
    });

    if (!department) {
      return { success: false, error: "Oddział nie został znaleziony" };
    }

    if (department._count.transactions > 0) {
      return {
        success: false,
        error: "Nie można usunąć oddziału z przypisanymi transakcjami",
      };
    }

    if (department._count.employees > 0) {
      return {
        success: false,
        error: "Nie można usunąć oddziału z przypisanymi pracownikami",
      };
    }

    await prisma.department.delete({
      where: { id: department.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się usunąć oddziału");
  }
}
