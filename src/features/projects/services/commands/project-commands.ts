"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";
import { ProjectStatus as PrismaProjectStatus } from "@/lib/generated/prisma/client";

const createProjectSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
  customerPublicId: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.extend({
  id: z.string().min(1),
});

export async function findOrCreateProject(
  name: string,
  userId: string,
): Promise<number> {
  const project = await prisma.project.upsert({
    where: { name_userId: { name, userId } },
    update: {},
    create: { name, userId },
    select: { id: true },
  });
  return project.id;
}

export async function createProjectCommand(
  input: z.infer<typeof createProjectSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createProjectSchema.parse(input);

    const existing = await prisma.project.findFirst({
      where: { name: validated.name, userId: user.id },
    });

    if (existing) {
      return { success: false, error: "Projekt o tej nazwie już istnieje" };
    }

    let customerId: number | null = null;
    if (validated.customerPublicId) {
      const customer = await prisma.customer.findFirst({
        where: { publicId: validated.customerPublicId, userId: user.id },
        select: { id: true },
      });
      if (!customer) {
        return { success: false, error: "Klient nie został znaleziony" };
      }
      customerId = customer.id;
    }

    await prisma.project.create({
      data: {
        name: validated.name,
        status: validated.status as PrismaProjectStatus,
        customerId,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać projektu");
  }
}

const quickCreateProjectSchema = z.object({
  name: z.string().min(1, "Nazwa jest wymagana"),
});

export async function quickCreateProjectCommand(
  input: z.infer<typeof quickCreateProjectSchema>,
): Promise<OperationResult<{ id: string; name: string }>> {
  try {
    const user = await requireUser();
    const validated = quickCreateProjectSchema.parse(input);

    const existing = await prisma.project.findFirst({
      where: { name: validated.name, userId: user.id },
    });

    if (existing) {
      return { success: false, error: "Projekt o tej nazwie już istnieje" };
    }

    const project = await prisma.project.create({
      data: {
        name: validated.name,
        userId: user.id,
      },
      select: { publicId: true, name: true },
    });

    return {
      success: true,
      data: { id: project.publicId, name: project.name },
    };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać projektu");
  }
}

export async function updateProjectCommand(
  input: z.infer<typeof updateProjectSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateProjectSchema.parse(input);

    const project = await prisma.project.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!project) {
      return { success: false, error: "Projekt nie został znaleziony" };
    }

    let customerId: number | null = null;
    if (validated.customerPublicId) {
      const customer = await prisma.customer.findFirst({
        where: { publicId: validated.customerPublicId, userId: user.id },
        select: { id: true },
      });
      if (!customer) {
        return { success: false, error: "Klient nie został znaleziony" };
      }
      customerId = customer.id;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        name: validated.name,
        status: validated.status as PrismaProjectStatus,
        customerId,
      },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować projektu");
  }
}

export async function deleteProjectCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const project = await prisma.project.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!project) {
      return { success: false, error: "Projekt nie został znaleziony" };
    }

    await prisma.transaction.updateMany({
      where: { projectId: project.id, userId: user.id },
      data: { projectId: null },
    });

    await prisma.project.delete({
      where: { id: project.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się usunąć projektu");
  }
}
