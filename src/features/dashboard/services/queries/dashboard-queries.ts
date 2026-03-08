'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireUser } from '@/shared/lib/auth/helpers';
import type { MonthSummary, CategorySummary } from '@/features/transactions/contracts/transaction.types';

export async function getMonthSummaryQuery(
  year: number,
  month: number
): Promise<MonthSummary> {
  const user = await requireUser();

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      subcategory: {
        include: { category: true },
      },
    },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap = new Map<string, CategorySummary>();

  for (const t of transactions) {
    const amount = Math.round(Number(t.amount) * 100) / 100;
    const cat = t.subcategory.category;

    if (cat.type === 'INCOME') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }

    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, {
        categoryId: cat.id,
        categoryName: cat.name,
        total: 0,
        subcategories: [],
      });
    }

    const summary = categoryMap.get(cat.id)!;
    summary.total += amount;

    const existingSub = summary.subcategories.find(
      (s) => s.subcategoryId === t.subcategoryId
    );
    if (existingSub) {
      existingSub.total += amount;
    } else {
      summary.subcategories.push({
        subcategoryId: t.subcategoryId,
        subcategoryName: t.subcategory.name,
        total: amount,
      });
    }
  }

  totalIncome = Math.round(totalIncome * 100) / 100;
  totalExpense = Math.round(totalExpense * 100) / 100;

  return {
    totalIncome,
    totalExpense,
    balance: Math.round((totalIncome - totalExpense) * 100) / 100,
    categorySummaries: Array.from(categoryMap.values()),
  };
}

export async function getDailySummaryQuery(
  year: number,
  month: number
) {
  const user = await requireUser();

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      subcategory: {
        include: { category: true },
      },
    },
    orderBy: { date: 'asc' },
  });

  const dailyMap = new Map<string, { totalIncome: number; totalExpense: number }>();

  for (const t of transactions) {
    const dateKey = t.date.toISOString().split('T')[0];
    const amount = Math.round(Number(t.amount) * 100) / 100;

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { totalIncome: 0, totalExpense: 0 });
    }

    const daily = dailyMap.get(dateKey)!;
    if (t.subcategory.category.type === 'INCOME') {
      daily.totalIncome += amount;
    } else {
      daily.totalExpense += amount;
    }
  }

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    totalIncome: Math.round(data.totalIncome * 100) / 100,
    totalExpense: Math.round(data.totalExpense * 100) / 100,
  }));
}
