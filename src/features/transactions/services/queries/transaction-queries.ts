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
    where.subcategoryId = filters.subcategoryId;
  }
  if (filters?.categoryId) {
    where.subcategory = { categoryId: filters.categoryId };
  }
  if (filters?.type) {
    where.subcategory = {
      ...(where.subcategory as object),
      category: { type: filters.type },
    };
  }

  const [transactions, totalItems] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        subcategory: {
          include: { category: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  const items: TransactionWithDetails[] = transactions.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    date: t.date,
    description: t.description,
    subcategoryId: t.subcategoryId,
    subcategoryName: t.subcategory.name,
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
