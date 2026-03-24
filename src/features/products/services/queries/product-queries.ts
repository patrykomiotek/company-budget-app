'use server';

import { prisma } from '@/shared/lib/prisma';
import { requireUser } from '@/shared/lib/auth/helpers';
import type { ProductOption } from '../../contracts/product.types';

export async function getProductsQuery(): Promise<ProductOption[]> {
  const user = await requireUser();

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    select: { publicId: true, name: true, type: true },
    orderBy: { name: 'asc' },
  });

  return products.map((p) => ({
    id: p.publicId,
    name: p.name,
    type: p.type,
  }));
}
