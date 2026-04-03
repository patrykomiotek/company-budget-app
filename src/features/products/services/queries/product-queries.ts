"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import type {
  ProductOption,
  ProductItem,
  ProductDetail,
  ProductDetailWithHistory,
} from "../../contracts/product.types";

export async function getProductsQuery(): Promise<ProductOption[]> {
  const user = await requireUser();

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    select: { publicId: true, name: true, type: true },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.publicId,
    name: p.name,
    type: p.type,
  }));
}

export async function getProductsListQuery(
  transactionType?: "income" | "expense",
): Promise<ProductItem[]> {
  const user = await requireUser();

  const where: Record<string, unknown> = { userId: user.id };
  if (transactionType) {
    const types =
      transactionType === "income"
        ? ["INCOME", "FORECAST_INCOME"]
        : ["EXPENSE", "FORECAST_EXPENSE"];
    where.lineItems = {
      some: { transaction: { type: { in: types } } },
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      _count: { select: { lineItems: true } },
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => ({
    id: p.publicId,
    name: p.name,
    type: p.type,
    lineItemCount: p._count.lineItems,
  }));
}

export async function getProductByIdQuery(
  publicId: string,
): Promise<ProductDetail | null> {
  const user = await requireUser();

  const product = await prisma.product.findFirst({
    where: { publicId, userId: user.id },
  });

  if (!product) {
    return null;
  }

  return {
    id: product.publicId,
    name: product.name,
    type: product.type,
    createdAt: product.createdAt.toISOString(),
  };
}

export async function getProductDetailWithHistoryQuery(
  publicId: string,
): Promise<ProductDetailWithHistory | null> {
  const user = await requireUser();

  const product = await prisma.product.findFirst({
    where: { publicId, userId: user.id },
    include: {
      lineItems: {
        include: {
          transaction: {
            select: {
              publicId: true,
              date: true,
              exchangeRate: true,
              customer: { select: { name: true, displayName: true } },
            },
          },
          project: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    return null;
  }

  let totalRevenue = 0;
  let totalQuantity = 0;

  const purchases = product.lineItems.map((li) => {
    const qty = Number(li.quantity);
    const unitPrice = Number(li.unitPrice);
    const net = Number(li.netAmount);
    const rate = li.transaction.exchangeRate
      ? Number(li.transaction.exchangeRate)
      : 1;
    const netPln = Math.round(net * rate * 100) / 100;

    totalRevenue += netPln;
    totalQuantity += qty;

    return {
      transactionId: li.transaction.publicId,
      date: li.transaction.date.toISOString().split("T")[0],
      customerName:
        li.transaction.customer?.displayName ||
        li.transaction.customer?.name ||
        null,
      quantity: qty,
      unitPrice,
      netAmount: netPln,
      projectName: li.project?.name ?? null,
    };
  });

  return {
    id: product.publicId,
    name: product.name,
    type: product.type,
    createdAt: product.createdAt.toISOString(),
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalQuantity: Math.round(totalQuantity * 1000) / 1000,
    purchaseCount: purchases.length,
    purchases,
  };
}
