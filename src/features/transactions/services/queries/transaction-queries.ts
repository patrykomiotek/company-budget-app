'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireUser } from '@/shared/lib/auth/helpers';
import type { Prisma } from '@/lib/generated/prisma/client';
import type {
  TransactionWithDetails,
  TransactionFilters,
} from '../../contracts/transaction.types';

export async function getTransactionsQuery(
  filters?: TransactionFilters,
  page = 1,
  pageSize = 50
) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  const user = await requireUser();

  const where: Prisma.TransactionWhereInput = {
    userId: user.id,
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
  if (filters?.type) {
    where.subcategory = {
      ...(where.subcategory as object),
      category: {
        ...((where.subcategory as Record<string, unknown>)?.category as object),
        type: filters.type,
      },
    };
  }

  const [transactions, totalItems] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        subcategory: {
          include: { category: true },
        },
        merchant: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  const items: TransactionWithDetails[] = transactions.map((t) => ({
    id: t.publicId,
    amount: Number(t.amount),
    date: t.date,
    description: t.description,
    merchantId: t.merchant?.publicId ?? null,
    merchantName: t.merchant?.name ?? null,
    subcategoryId: t.subcategory.publicId,
    subcategoryName: t.subcategory.name,
    categoryId: t.subcategory.category.publicId,
    categoryName: t.subcategory.category.name,
    categoryType: t.subcategory.category.type,
    createdAt: t.createdAt,
  }));

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / safePageSize),
    currentPage: safePage,
    pageSize: safePageSize,
  };
}
