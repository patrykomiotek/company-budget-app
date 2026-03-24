"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { getActiveCompanyFilter } from "@/shared/lib/company/helpers";
import type {
  MonthSummary,
  CategorySummary,
} from "@/features/transactions/contracts/transaction.types";

export async function getMonthSummaryQuery(
  year: number,
  month: number,
): Promise<MonthSummary> {
  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...companyFilter,
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
  let forecastIncome = 0;
  let forecastExpense = 0;
  const categoryMap = new Map<string, CategorySummary>();

  for (const t of transactions) {
    const rawAmount = Number(t.amount);
    const rate = t.exchangeRate ? Number(t.exchangeRate) : 1;
    const amount = Math.round(rawAmount * rate * 100) / 100;
    const cat = t.subcategory.category;
    const catPublicId = cat.publicId;

    switch (t.type) {
      case "INCOME":
        totalIncome += amount;
        break;
      case "EXPENSE":
        totalExpense += amount;
        break;
      case "FORECAST_INCOME":
        forecastIncome += amount;
        break;
      case "FORECAST_EXPENSE":
        forecastExpense += amount;
        break;
      default:
        break;
    }

    if (!categoryMap.has(catPublicId)) {
      categoryMap.set(catPublicId, {
        categoryId: catPublicId,
        categoryName: cat.name,
        total: 0,
        subcategories: [],
      });
    }

    const summary = categoryMap.get(catPublicId)!;
    summary.total += amount;

    const subPublicId = t.subcategory.publicId;
    const existingSub = summary.subcategories.find(
      (s) => s.subcategoryId === subPublicId,
    );
    if (existingSub) {
      existingSub.total += amount;
    } else {
      summary.subcategories.push({
        subcategoryId: subPublicId,
        subcategoryName: t.subcategory.name,
        total: amount,
      });
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    totalIncome: round(totalIncome),
    totalExpense: round(totalExpense),
    forecastIncome: round(forecastIncome),
    forecastExpense: round(forecastExpense),
    balance: round(totalIncome - totalExpense),
    categorySummaries: Array.from(categoryMap.values()),
  };
}

export async function getDailySummaryQuery(year: number, month: number) {
  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...companyFilter,
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
    orderBy: { date: "asc" },
  });

  const dailyMap = new Map<
    string,
    { totalIncome: number; totalExpense: number }
  >();

  for (const t of transactions) {
    // Only count actual transactions in daily summary, not forecasts
    if (t.type === "FORECAST_INCOME" || t.type === "FORECAST_EXPENSE") {
      continue;
    }

    const dateKey = t.date.toISOString().split("T")[0];
    const rawAmount = Number(t.amount);
    const rate = t.exchangeRate ? Number(t.exchangeRate) : 1;
    const amount = Math.round(rawAmount * rate * 100) / 100;

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { totalIncome: 0, totalExpense: 0 });
    }

    const daily = dailyMap.get(dateKey)!;
    if (t.type === "INCOME") {
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
