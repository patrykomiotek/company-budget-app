"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { getActiveDepartmentFilter } from "@/shared/lib/department/helpers";

export interface DashboardStats {
  customerCount: number;
  projectCount: number;
  activeProjectCount: number;
  merchantCount: number;
  employeeCount: number;
  productCount: number;
  unpaidExpenseCount: number;
  unpaidIncomeCount: number;
  pendingInvoiceCount: number;
}

export async function getDashboardStatsQuery(): Promise<DashboardStats> {
  const user = await requireUser();
  const departmentFilter = await getActiveDepartmentFilter();

  const [
    customerCount,
    projectCount,
    activeProjectCount,
    merchantCount,
    employeeCount,
    productCount,
    unpaidExpenseCount,
    unpaidIncomeCount,
    pendingInvoiceCount,
  ] = await Promise.all([
    prisma.customer.count({ where: { userId: user.id } }),
    prisma.project.count({ where: { userId: user.id } }),
    prisma.project.count({
      where: { userId: user.id, status: "ACTIVE" },
    }),
    prisma.merchant.count({ where: { userId: user.id } }),
    prisma.employee.count({ where: { userId: user.id } }),
    prisma.product.count({ where: { userId: user.id } }),
    prisma.transaction.count({
      where: {
        userId: user.id,
        ...departmentFilter,
        type: "EXPENSE",
        isPaid: false,
      },
    }),
    prisma.transaction.count({
      where: {
        userId: user.id,
        ...departmentFilter,
        type: "INCOME",
        isPaid: false,
      },
    }),
    prisma.transaction.count({
      where: {
        userId: user.id,
        ...departmentFilter,
        type: "EXPENSE",
        invoiceSent: false,
        invoiceNumber: { not: null },
      },
    }),
  ]);

  return {
    customerCount,
    projectCount,
    activeProjectCount,
    merchantCount,
    employeeCount,
    productCount,
    unpaidExpenseCount,
    unpaidIncomeCount,
    pendingInvoiceCount,
  };
}
