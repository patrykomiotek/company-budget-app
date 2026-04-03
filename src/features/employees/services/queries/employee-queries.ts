"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import type {
  EmployeeOption,
  EmployeeItem,
} from "../../contracts/employee.types";

export async function getEmployeesQuery(
  departmentId?: number,
): Promise<EmployeeOption[]> {
  const user = await requireUser();

  const employees = await prisma.employee.findMany({
    where: {
      userId: user.id,
      ...(departmentId ? { departmentId } : {}),
    },
    select: { publicId: true, name: true, displayName: true },
    orderBy: { name: "asc" },
  });

  return employees.map((e) => ({
    id: e.publicId,
    name: e.displayName || e.name,
  }));
}

export async function getEmployeesListQuery(): Promise<EmployeeItem[]> {
  const user = await requireUser();

  const employees = await prisma.employee.findMany({
    where: { userId: user.id },
    include: {
      department: { select: { name: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
  });

  return employees.map((e) => ({
    id: e.publicId,
    name: e.name,
    displayName: e.displayName,
    departmentName: e.department.name,
    transactionCount: e._count.transactions,
  }));
}

export async function getEmployeeByIdQuery(publicId: string) {
  const user = await requireUser();

  const employee = await prisma.employee.findFirst({
    where: { publicId, userId: user.id },
    include: { department: { select: { publicId: true, name: true } } },
  });

  if (!employee) {
    return null;
  }

  return {
    id: employee.publicId,
    name: employee.name,
    displayName: employee.displayName,
    departmentId: employee.department.publicId,
    departmentName: employee.department.name,
  };
}
