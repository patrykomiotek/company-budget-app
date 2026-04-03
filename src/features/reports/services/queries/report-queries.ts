"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import type {
  ReportFilters,
  ReportData,
  Grouping,
  AmountMode,
} from "../../contracts/report.types";

function formatPeriodKey(date: Date, grouping: Grouping): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  switch (grouping) {
    case "year":
      return `${y}`;
    case "quarter":
      return `${y}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    case "month":
      return `${y}-${m}`;
    case "week": {
      // ISO week: find the Monday of this week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date);
      monday.setDate(diff);
      const wy = monday.getFullYear();
      const wm = String(monday.getMonth() + 1).padStart(2, "0");
      const wd = String(monday.getDate()).padStart(2, "0");
      return `${wy}-${wm}-${wd}`;
    }
    case "day":
      return `${y}-${m}-${d}`;
  }
}

export async function getReportDataQuery(
  filters: ReportFilters,
): Promise<ReportData> {
  const user = await requireUser();

  const typeFilter: string[] = [];
  if (
    filters.reportType === "income_expenses" ||
    filters.reportType === "income"
  ) {
    typeFilter.push("INCOME");
  }
  if (
    filters.reportType === "income_expenses" ||
    filters.reportType === "expenses"
  ) {
    typeFilter.push("EXPENSE");
  }

  const where: Record<string, unknown> = {
    userId: user.id,
    type: { in: typeFilter },
    date: {
      gte: new Date(filters.dateFrom),
      lte: new Date(filters.dateTo),
    },
  };

  if (filters.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { publicId: filters.departmentId },
      select: { id: true },
    });
    if (dept) {
      where.departmentId = dept.id;
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      lineItems: true,
    },
    orderBy: { date: "asc" },
  });

  const periodMap = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const key = formatPeriodKey(t.date, filters.grouping);
    if (!periodMap.has(key)) {
      periodMap.set(key, { income: 0, expense: 0 });
    }
    const entry = periodMap.get(key)!;

    const amount = computeAmount(t, filters.amountMode);
    const exchangeRate = t.exchangeRate ? Number(t.exchangeRate) : 1;
    const amountPln = Math.round(amount * exchangeRate * 100) / 100;

    if (t.type === "INCOME") {
      entry.income += amountPln;
    } else {
      entry.expense += amountPln;
    }
  }

  const rows = Array.from(periodMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { income, expense }]) => ({
      period,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
    }));

  const totalIncome =
    Math.round(rows.reduce((s, r) => s + r.income, 0) * 100) / 100;
  const totalExpense =
    Math.round(rows.reduce((s, r) => s + r.expense, 0) * 100) / 100;

  return {
    rows,
    totalIncome,
    totalExpense,
    totalBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
  };
}

function computeAmount(
  t: {
    amount: { toNumber?: () => number } | number;
    lineItems: Array<{
      netAmount: { toNumber?: () => number } | number;
      grossAmount: { toNumber?: () => number } | number;
    }>;
  },
  mode: AmountMode,
): number {
  const toNum = (v: { toNumber?: () => number } | number): number => {
    if (typeof v === "number") {
      return v;
    }
    if (typeof v.toNumber === "function") {
      return v.toNumber();
    }
    return Number(v);
  };

  const nettoTotal = toNum(t.amount);

  if (mode === "netto") {
    return nettoTotal;
  }

  if (t.lineItems.length > 0) {
    const lineNetto = t.lineItems.reduce((s, li) => s + toNum(li.netAmount), 0);
    const lineGross = t.lineItems.reduce(
      (s, li) => s + toNum(li.grossAmount),
      0,
    );

    if (mode === "brutto") {
      return lineGross;
    }
    // VAT
    return lineGross - lineNetto;
  }

  // No line items — netto is all we have, brutto = netto, VAT = 0
  if (mode === "brutto") {
    return nettoTotal;
  }
  return 0;
}
