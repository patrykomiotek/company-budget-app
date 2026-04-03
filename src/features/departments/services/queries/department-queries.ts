"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import type { DepartmentListItem } from "../../contracts/department.types";

export async function getDepartmentsListQuery(): Promise<DepartmentListItem[]> {
  await requireUser();

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { transactions: true, employees: true, categories: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return departments.map((d) => ({
    id: d.publicId,
    name: d.name,
    categoryCount: d._count.categories,
    employeeCount: d._count.employees,
    transactionCount: d._count.transactions,
  }));
}

export async function getDepartmentByIdQuery(publicId: string) {
  await requireUser();

  const department = await prisma.department.findFirst({
    where: { publicId },
  });

  if (!department) {
    return null;
  }

  return {
    id: department.publicId,
    name: department.name,
  };
}
