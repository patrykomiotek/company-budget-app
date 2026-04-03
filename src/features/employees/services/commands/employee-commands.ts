"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";

export async function findOrCreateEmployee(
  name: string,
  departmentId: number,
  userId: string,
): Promise<number> {
  const employee = await prisma.employee.upsert({
    where: { name_departmentId: { name, departmentId } },
    update: {},
    create: { name, departmentId, userId },
    select: { id: true },
  });

  return employee.id;
}

const createEmployeeSchema = z.object({
  name: z.string().min(1, "Imię jest wymagane"),
  departmentPublicId: z.string().min(1, "Wybierz firmę"),
});

export async function createEmployeeCommand(
  input: z.infer<typeof createEmployeeSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createEmployeeSchema.parse(input);

    const dept = await prisma.department.findUnique({
      where: { publicId: validated.departmentPublicId },
      select: { id: true },
    });

    if (!dept) {
      return { success: false, error: "Firma nie została znaleziona" };
    }

    const existing = await prisma.employee.findFirst({
      where: { name: validated.name, departmentId: dept.id },
    });

    if (existing) {
      return {
        success: false,
        error: "Współpracownik o tym imieniu już istnieje w tej firmie",
      };
    }

    await prisma.employee.create({
      data: { name: validated.name, departmentId: dept.id, userId: user.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać współpracownika");
  }
}

const updateEmployeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Nazwa jest wymagana"),
});

export async function updateEmployeeCommand(
  input: z.infer<typeof updateEmployeeSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateEmployeeSchema.parse(input);

    const employee = await prisma.employee.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!employee) {
      return { success: false, error: "Osoba nie została znaleziona" };
    }

    await prisma.employee.update({
      where: { id: employee.id },
      data: { name: validated.name },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować osoby");
  }
}

export async function deleteEmployeeCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const employee = await prisma.employee.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!employee) {
      return { success: false, error: "Osoba nie została znaleziona" };
    }

    // Nullify employee on related transactions
    await prisma.transaction.updateMany({
      where: { employeeId: employee.id, userId: user.id },
      data: { employeeId: null },
    });

    await prisma.employee.delete({
      where: { id: employee.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się usunąć osoby");
  }
}
