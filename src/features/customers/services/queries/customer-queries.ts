"use server";

import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import type {
  CustomerOption,
  CustomerItem,
} from "../../contracts/customer.types";

export async function getCustomersForSelectQuery(): Promise<CustomerOption[]> {
  const user = await requireUser();

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    select: { publicId: true, name: true, nip: true },
    orderBy: { name: "asc" },
  });

  return customers.map((c) => ({
    id: c.publicId,
    name: c.name,
    nip: c.nip,
  }));
}

export async function getCustomersListQuery(): Promise<CustomerItem[]> {
  const user = await requireUser();

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { name: "asc" },
  });

  return customers.map((c) => ({
    id: c.publicId,
    name: c.name,
    nip: c.nip,
    city: c.city,
    email: c.email,
    transactionCount: c._count.transactions,
  }));
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
    nip: customer.nip,
    street: customer.street,
    postalCode: customer.postalCode,
    city: customer.city,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
  };
}
