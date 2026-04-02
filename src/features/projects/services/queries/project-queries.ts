"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { getActiveCompanyFilter } from "@/shared/lib/company/helpers";
import type {
  ProjectOption,
  ProjectItem,
  ProjectDetail,
  ProjectStats,
  ProjectTransaction,
  IntervalFilter,
  ProjectStatus,
} from "../../contracts/project.types";

function getIntervalDateRange(interval: IntervalFilter): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (interval) {
    case "current_month":
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 0)),
      };
    case "previous_month":
      return {
        start: new Date(Date.UTC(year, month - 1, 1)),
        end: new Date(Date.UTC(year, month, 0)),
      };
    case "current_quarter": {
      const qStart = Math.floor(month / 3) * 3;
      return {
        start: new Date(Date.UTC(year, qStart, 1)),
        end: new Date(Date.UTC(year, qStart + 3, 0)),
      };
    }
    case "previous_quarter": {
      const qStart = Math.floor(month / 3) * 3 - 3;
      const qYear = qStart < 0 ? year - 1 : year;
      const qMonth = ((qStart % 12) + 12) % 12;
      return {
        start: new Date(Date.UTC(qYear, qMonth, 1)),
        end: new Date(Date.UTC(qYear, qMonth + 3, 0)),
      };
    }
    case "current_year":
      return {
        start: new Date(Date.UTC(year, 0, 1)),
        end: new Date(Date.UTC(year, 11, 31)),
      };
    case "previous_year":
      return {
        start: new Date(Date.UTC(year - 1, 0, 1)),
        end: new Date(Date.UTC(year - 1, 11, 31)),
      };
  }
}

function convertToPln(amount: number, exchangeRate: number | null): number {
  const rate = exchangeRate ?? 1;
  return Math.round(amount * rate * 100) / 100;
}

export async function getProjectsForSelectQuery(): Promise<ProjectOption[]> {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    select: { publicId: true, name: true, status: true },
    orderBy: { name: "asc" },
  });

  return projects.map((p) => ({
    id: p.publicId,
    name: p.name,
    status: p.status as ProjectStatus,
  }));
}

export async function getProjectsListQuery(
  statusFilter?: ProjectStatus,
): Promise<ProjectItem[]> {
  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();

  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      customer: { select: { name: true } },
      transactions: {
        where: { ...companyFilter },
        select: {
          type: true,
          amount: true,
          exchangeRate: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return projects.map((p) => {
    let totalIncome = 0;
    let totalCosts = 0;

    for (const t of p.transactions) {
      const amount = convertToPln(
        Number(t.amount),
        t.exchangeRate ? Number(t.exchangeRate) : null,
      );
      if (t.type === "INCOME" || t.type === "FORECAST_INCOME") {
        totalIncome += amount;
      } else {
        totalCosts += amount;
      }
    }

    return {
      id: p.publicId,
      name: p.name,
      status: p.status as ProjectStatus,
      customerName: p.customer?.name ?? null,
      transactionCount: p.transactions.length,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalCosts: Math.round(totalCosts * 100) / 100,
      profit: Math.round((totalIncome - totalCosts) * 100) / 100,
    };
  });
}

export async function getProjectByIdQuery(
  publicId: string,
): Promise<ProjectDetail | null> {
  const user = await requireUser();

  const project = await prisma.project.findFirst({
    where: { publicId, userId: user.id },
    include: {
      customer: { select: { publicId: true, name: true } },
    },
  });

  if (!project) {
    return null;
  }

  return {
    id: project.publicId,
    name: project.name,
    status: project.status as ProjectStatus,
    customerId: project.customer?.publicId ?? null,
    customerName: project.customer?.name ?? null,
    createdAt: project.createdAt.toISOString(),
  };
}

export async function getProjectStatsQuery(
  publicId: string,
  interval: IntervalFilter,
): Promise<ProjectStats> {
  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();
  const { start, end } = getIntervalDateRange(interval);

  const project = await prisma.project.findFirst({
    where: { publicId, userId: user.id },
    select: { id: true, customerId: true },
  });

  if (!project) {
    return {
      totalIncome: 0,
      totalCosts: 0,
      profit: 0,
      margin: 0,
      transactionCount: 0,
      averageTransactionValue: 0,
      customerLtv: null,
      customerAcquisitionCost: null,
    };
  }

  // Transactions directly assigned to project
  const transactions = await prisma.transaction.findMany({
    where: {
      projectId: project.id,
      userId: user.id,
      ...companyFilter,
      date: { gte: start, lte: end },
    },
    select: {
      type: true,
      amount: true,
      exchangeRate: true,
    },
  });

  // Line items assigned to project (on transactions NOT already assigned to this project)
  const lineItems = await prisma.transactionLineItem.findMany({
    where: {
      projectId: project.id,
      transaction: {
        projectId: { not: project.id },
        userId: user.id,
        ...companyFilter,
        date: { gte: start, lte: end },
      },
    },
    select: {
      netAmount: true,
      transaction: {
        select: { type: true, exchangeRate: true },
      },
    },
  });

  let totalIncome = 0;
  let totalCosts = 0;

  for (const t of transactions) {
    const amount = convertToPln(
      Number(t.amount),
      t.exchangeRate ? Number(t.exchangeRate) : null,
    );
    if (t.type === "INCOME" || t.type === "FORECAST_INCOME") {
      totalIncome += amount;
    } else {
      totalCosts += amount;
    }
  }

  // Add line-item-level amounts
  for (const li of lineItems) {
    const amount = convertToPln(
      Number(li.netAmount),
      li.transaction.exchangeRate ? Number(li.transaction.exchangeRate) : null,
    );
    if (
      li.transaction.type === "INCOME" ||
      li.transaction.type === "FORECAST_INCOME"
    ) {
      totalIncome += amount;
    } else {
      totalCosts += amount;
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const profit = round(totalIncome - totalCosts);
  const margin = totalIncome > 0 ? round((profit / totalIncome) * 100) : 0;
  const entryCount = transactions.length + lineItems.length;
  const averageTransactionValue =
    entryCount > 0 ? round((totalIncome + totalCosts) / entryCount) : 0;

  let customerLtv: number | null = null;
  let customerAcquisitionCost: number | null = null;

  if (project.customerId) {
    const customerTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...companyFilter,
        project: { customerId: project.customerId },
      },
      select: {
        type: true,
        amount: true,
        exchangeRate: true,
      },
    });

    let ltv = 0;
    let acqCost = 0;

    for (const t of customerTransactions) {
      const amount = convertToPln(
        Number(t.amount),
        t.exchangeRate ? Number(t.exchangeRate) : null,
      );
      if (t.type === "INCOME" || t.type === "FORECAST_INCOME") {
        ltv += amount;
      } else {
        acqCost += amount;
      }
    }

    customerLtv = round(ltv);
    customerAcquisitionCost = round(acqCost);
  }

  return {
    totalIncome: round(totalIncome),
    totalCosts: round(totalCosts),
    profit,
    margin,
    transactionCount: entryCount,
    averageTransactionValue,
    customerLtv,
    customerAcquisitionCost,
  };
}

export async function getProjectTransactionsQuery(
  publicId: string,
): Promise<ProjectTransaction[]> {
  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();

  const project = await prisma.project.findFirst({
    where: { publicId, userId: user.id },
    select: { id: true },
  });

  if (!project) {
    return [];
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      ...companyFilter,
      OR: [
        { projectId: project.id },
        { lineItems: { some: { projectId: project.id } } },
      ],
    },
    include: {
      customer: { select: { name: true, displayName: true } },
      merchant: { select: { name: true } },
      subcategory: {
        include: { category: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return transactions.map((t) => ({
    id: t.publicId,
    date: t.date.toISOString().split("T")[0],
    description: t.description,
    type: t.type,
    amount: Number(t.amount),
    currency: t.currency,
    customerName: t.customer?.displayName || t.customer?.name || null,
    merchantName: t.merchant?.name || null,
    categoryName: `${t.subcategory.category.name} / ${t.subcategory.name}`,
  }));
}
