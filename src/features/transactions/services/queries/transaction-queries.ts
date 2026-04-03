"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { getActiveCompanyFilter } from "@/shared/lib/company/helpers";
import type { Prisma } from "@/lib/generated/prisma/client";
import type {
  TransactionWithDetails,
  TransactionFilters,
} from "../../contracts/transaction.types";

export async function getTransactionsQuery(
  filters?: TransactionFilters,
  page = 1,
  pageSize = 50,
) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();

  const where: Prisma.TransactionWhereInput = {
    userId: user.id,
    ...companyFilter,
  };

  if (filters?.dateFrom) {
    where.date = { ...(where.date as object), gte: new Date(filters.dateFrom) };
  }
  if (filters?.dateTo) {
    where.date = { ...(where.date as object), lte: new Date(filters.dateTo) };
  }
  if (filters?.subcategoryId) {
    where.subcategory = { publicId: filters.subcategoryId };
  }
  if (filters?.categoryId) {
    where.subcategory = {
      ...(where.subcategory as object),
      category: { publicId: filters.categoryId },
    };
  }
  if (filters?.isPaid === "true") {
    where.isPaid = true;
  } else if (filters?.isPaid === "false") {
    where.isPaid = false;
  }
  if (filters?.invoiceSent === "true") {
    where.invoiceSent = true;
  } else if (filters?.invoiceSent === "false") {
    where.invoiceSent = false;
  }

  if (filters?.transactionType) {
    where.type = filters.transactionType;
  } else if (filters?.type) {
    // Legacy filter: INCOME shows INCOME + FORECAST_INCOME, EXPENSE shows EXPENSE + FORECAST_EXPENSE
    if (filters.type === "INCOME") {
      where.type = { in: ["INCOME", "FORECAST_INCOME"] };
    } else {
      where.type = { in: ["EXPENSE", "FORECAST_EXPENSE"] };
    }
  }

  const [transactions, totalItems] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        subcategory: {
          include: { category: true },
        },
        merchant: true,
        company: true,
        employee: true,
        customer: true,
        project: true,
        lineItems: {
          include: { project: true },
          orderBy: { id: "asc" },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  const items: TransactionWithDetails[] = transactions.map((t) => {
    const exchangeRate = t.exchangeRate ? Number(t.exchangeRate) : null;
    const amount = Number(t.amount);
    const amountPln = exchangeRate
      ? Math.round(amount * exchangeRate * 100) / 100
      : amount;

    return {
      id: t.publicId,
      type: t.type,
      amount,
      currency: t.currency,
      exchangeRate,
      amountPln,
      date: t.date,
      description: t.description,
      merchantId: t.merchant?.publicId ?? null,
      merchantName: t.merchant?.name ?? null,
      subcategoryId: t.subcategory.publicId,
      subcategoryName: t.subcategory.name,
      categoryId: t.subcategory.category.publicId,
      categoryName: t.subcategory.category.name,
      categoryType: t.subcategory.category.type,
      companyId: t.company?.publicId ?? null,
      companyName: t.company?.name ?? null,
      employeeId: t.employee?.publicId ?? null,
      employeeName: t.employee?.name ?? null,
      customerId: t.customer?.publicId ?? null,
      customerName: t.customer?.displayName || t.customer?.name || null,
      projectId: t.project?.publicId ?? null,
      projectName: t.project?.name ?? null,
      invoiceNumber: t.invoiceNumber,
      invoiceDueDate: t.invoiceDueDate,
      isPaid: t.isPaid,
      invoiceSent: t.invoiceSent,
      lineItems: t.lineItems.map((li) => ({
        id: li.publicId,
        name: li.name,
        quantity: Number(li.quantity),
        unit: li.unit,
        unitPrice: Number(li.unitPrice),
        vatRate: Number(li.vatRate),
        netAmount: Number(li.netAmount),
        grossAmount: Number(li.grossAmount),
        projectName: li.project?.name ?? null,
      })),
      createdAt: t.createdAt,
    };
  });

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / safePageSize),
    currentPage: safePage,
    pageSize: safePageSize,
  };
}

export async function getTransactionByIdQuery(
  publicId: string,
): Promise<TransactionWithDetails | null> {
  const user = await requireUser();

  const t = await prisma.transaction.findFirst({
    where: { publicId, userId: user.id },
    include: {
      subcategory: {
        include: { category: true },
      },
      merchant: true,
      company: true,
      employee: true,
      customer: true,
      project: true,
      lineItems: {
        include: { product: true, project: true },
        orderBy: { id: "asc" },
      },
      invoiceFile: true,
    },
  });

  if (!t) {
    return null;
  }

  const exchangeRate = t.exchangeRate ? Number(t.exchangeRate) : null;
  const amount = Number(t.amount);
  const amountPln = exchangeRate
    ? Math.round(amount * exchangeRate * 100) / 100
    : amount;

  return {
    id: t.publicId,
    type: t.type,
    amount,
    currency: t.currency,
    exchangeRate,
    amountPln,
    date: t.date,
    description: t.description,
    merchantId: t.merchant?.publicId ?? null,
    merchantName: t.merchant?.name ?? null,
    subcategoryId: t.subcategory.publicId,
    subcategoryName: t.subcategory.name,
    categoryId: t.subcategory.category.publicId,
    categoryName: t.subcategory.category.name,
    categoryType: t.subcategory.category.type,
    companyId: t.company?.publicId ?? null,
    companyName: t.company?.name ?? null,
    employeeId: t.employee?.publicId ?? null,
    employeeName: t.employee?.name ?? null,
    customerId: t.customer?.publicId ?? null,
    customerName: t.customer?.name ?? null,
    projectId: t.project?.publicId ?? null,
    projectName: t.project?.name ?? null,
    invoiceNumber: t.invoiceNumber,
    invoiceDueDate: t.invoiceDueDate,
    isPaid: t.isPaid,
    invoiceSent: t.invoiceSent,
    lineItems: t.lineItems.map((li) => ({
      id: li.publicId,
      name: li.name,
      quantity: Number(li.quantity),
      unit: li.unit,
      unitPrice: Number(li.unitPrice),
      vatRate: Number(li.vatRate),
      netAmount: Number(li.netAmount),
      grossAmount: Number(li.grossAmount),
      projectName: li.project?.name ?? null,
    })),
    createdAt: t.createdAt,
  };
}
