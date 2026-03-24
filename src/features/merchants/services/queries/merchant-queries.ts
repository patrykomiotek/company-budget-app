'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireUser } from '@/shared/lib/auth/helpers';
import type { MerchantItem } from '../../contracts/merchant.types';

export async function getMerchantsListQuery(): Promise<MerchantItem[]> {
  const user = await requireUser();

  const merchants = await prisma.merchant.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { name: 'asc' },
  });

  return merchants.map((m) => ({
    id: m.publicId,
    name: m.name,
    nip: m.nip,
    logoUrl: m.logoUrl,
    transactionCount: m._count.transactions,
  }));
}

export async function getMerchantByIdQuery(publicId: string) {
  const user = await requireUser();

  const merchant = await prisma.merchant.findFirst({
    where: { publicId, userId: user.id },
  });

  if (!merchant) {return null;}

  return {
    id: merchant.publicId,
    name: merchant.name,
    nip: merchant.nip,
    logoUrl: merchant.logoUrl,
  };
}

export async function getMerchantsForSelectQuery(): Promise<{ id: string; name: string }[]> {
  const user = await requireUser();

  const merchants = await prisma.merchant.findMany({
    where: { userId: user.id },
    select: { publicId: true, name: true },
    orderBy: { name: 'asc' },
  });

  return merchants.map((m) => ({
    id: m.publicId,
    name: m.name,
  }));
}
