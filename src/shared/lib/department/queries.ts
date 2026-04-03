"use server";

import { prisma } from "@/shared/lib/prisma";

export interface DepartmentOption {
  id: string;
  name: string;
}

export async function getDepartmentsQuery(): Promise<DepartmentOption[]> {
  const companies = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  return companies.map((c) => ({
    id: c.publicId,
    name: c.name,
  }));
}
