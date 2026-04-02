"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { getActiveCompanyFilter } from "@/shared/lib/company/helpers";
import type {
  CustomerOption,
  CustomerItem,
  CustomerMetrics,
} from "../../contracts/customer.types";

export async function getCustomersForSelectQuery(): Promise<CustomerOption[]> {
  const user = await requireUser();

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    select: { publicId: true, name: true, displayName: true, nip: true },
    orderBy: { name: "asc" },
  });

  return customers.map((c) => ({
    id: c.publicId,
    name: c.name,
    displayName: c.displayName,
    nip: c.nip,
  }));
}

export async function getCustomersListQuery(): Promise<CustomerItem[]> {
  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    include: {
      transactions: {
        where: { ...companyFilter },
        select: {
          type: true,
          amount: true,
          exchangeRate: true,
          date: true,
        },
        orderBy: { date: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return customers
    .map((c) => {
      let totalRevenue = 0;
      let lastDate: Date | null = null;

      for (const t of c.transactions) {
        if (t.type === "INCOME" || t.type === "FORECAST_INCOME") {
          const raw = Number(t.amount);
          const rate = t.exchangeRate ? Number(t.exchangeRate) : 1;
          totalRevenue += Math.round(raw * rate * 100) / 100;
        }
        if (!lastDate || t.date > lastDate) {
          lastDate = t.date;
        }
      }

      return {
        id: c.publicId,
        name: c.name,
        displayName: c.displayName,
        nip: c.nip,
        city: c.city,
        email: c.email,
        transactionCount: c.transactions.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        lastTransactionDate: lastDate
          ? lastDate.toISOString().split("T")[0]
          : null,
      };
    })
    .sort((a, b) => {
      if (!a.lastTransactionDate && !b.lastTransactionDate) {
        return 0;
      }
      if (!a.lastTransactionDate) {
        return 1;
      }
      if (!b.lastTransactionDate) {
        return -1;
      }
      return b.lastTransactionDate.localeCompare(a.lastTransactionDate);
    });
}

export async function getCustomerByIdQuery(publicId: string) {
  const user = await requireUser();

  const customer = await prisma.customer.findFirst({
    where: { publicId, userId: user.id },
  });

  if (!customer) {
    return null;
  }

  return {
    id: customer.publicId,
    name: customer.name,
    displayName: customer.displayName,
    nip: customer.nip,
    street: customer.street,
    postalCode: customer.postalCode,
    city: customer.city,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
  };
}

export async function getCustomerMetricsQuery(
  publicId: string,
): Promise<CustomerMetrics | null> {
  const user = await requireUser();
  const companyFilter = await getActiveCompanyFilter();

  const customer = await prisma.customer.findFirst({
    where: { publicId, userId: user.id },
    select: { id: true },
  });

  if (!customer) {
    return null;
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      customerId: customer.id,
      userId: user.id,
      ...companyFilter,
    },
    select: {
      type: true,
      amount: true,
      exchangeRate: true,
    },
  });

  let ltv = 0;
  let totalCosts = 0;
  let totalAmount = 0;

  for (const t of transactions) {
    const rawAmount = Number(t.amount);
    const rate = t.exchangeRate ? Number(t.exchangeRate) : 1;
    const amount = Math.round(rawAmount * rate * 100) / 100;
    totalAmount += amount;

    if (t.type === "INCOME" || t.type === "FORECAST_INCOME") {
      ltv += amount;
    } else {
      totalCosts += amount;
    }
  }

  const projects = await prisma.project.findMany({
    where: {
      customerId: customer.id,
      userId: user.id,
    },
    include: {
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

  const round = (n: number) => Math.round(n * 100) / 100;

  const customerProjects = projects.map((p) => {
    let projIncome = 0;
    let projCosts = 0;

    for (const t of p.transactions) {
      const rawAmount = Number(t.amount);
      const rate = t.exchangeRate ? Number(t.exchangeRate) : 1;
      const amount = Math.round(rawAmount * rate * 100) / 100;

      if (t.type === "INCOME" || t.type === "FORECAST_INCOME") {
        projIncome += amount;
      } else {
        projCosts += amount;
      }
    }

    return {
      id: p.publicId,
      name: p.name,
      status: p.status,
      totalIncome: round(projIncome),
      totalCosts: round(projCosts),
      profit: round(projIncome - projCosts),
    };
  });

  const lineItems = await prisma.transactionLineItem.findMany({
    where: {
      transaction: {
        customerId: customer.id,
        userId: user.id,
        ...companyFilter,
      },
    },
    include: {
      product: { select: { publicId: true, name: true } },
    },
  });

  const productMap = new Map<
    string,
    { id: string; name: string; totalQuantity: number; totalRevenue: number }
  >();

  for (const li of lineItems) {
    const productKey = li.product?.publicId ?? li.name;
    const productName = li.product?.name ?? li.name;
    const productId = li.product?.publicId ?? productKey;

    if (!productMap.has(productKey)) {
      productMap.set(productKey, {
        id: productId,
        name: productName,
        totalQuantity: 0,
        totalRevenue: 0,
      });
    }

    const entry = productMap.get(productKey)!;
    entry.totalQuantity += Number(li.quantity);
    entry.totalRevenue += Number(li.netAmount);
  }

  const customerProducts = Array.from(productMap.values()).map((p) => ({
    ...p,
    totalQuantity: round(p.totalQuantity),
    totalRevenue: round(p.totalRevenue),
  }));

  return {
    ltv: round(ltv),
    totalCosts: round(totalCosts),
    averageTransactionValue:
      transactions.length > 0 ? round(totalAmount / transactions.length) : 0,
    transactionCount: transactions.length,
    products: customerProducts,
    projects: customerProjects,
  };
}
