"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import type {
  EmployeeOption,
  EmployeeItem,
} from "../../contracts/employee.types";

export async function getEmployeesQuery(
  companyId?: number,
): Promise<EmployeeOption[]> {
  const user = await requireUser();

  const employees = await prisma.employee.findMany({
    where: {
      userId: user.id,
      ...(companyId ? { companyId } : {}),
    },
    select: { publicId: true, name: true },
    orderBy: { name: "asc" },
  });

  return employees.map((e) => ({
    id: e.publicId,
    name: e.name,
  }));
}

export async function getEmployeesListQuery(): Promise<EmployeeItem[]> {
  const user = await requireUser();

  const employees = await prisma.employee.findMany({
    where: { userId: user.id },
    include: {
      company: { select: { name: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: [{ company: { name: "asc" } }, { name: "asc" }],
  });

  return employees.map((e) => ({
    id: e.publicId,
    name: e.name,
    companyName: e.company.name,
    transactionCount: e._count.transactions,
  }));
}

export async function getEmployeeByIdQuery(publicId: string) {
  const user = await requireUser();

  const employee = await prisma.employee.findFirst({
    where: { publicId, userId: user.id },
    include: { company: { select: { publicId: true, name: true } } },
  });

  if (!employee) {
    return null;
  }

  return {
    id: employee.publicId,
    name: employee.name,
    companyId: employee.company.publicId,
    companyName: employee.company.name,
  };
}
