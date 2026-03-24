'use server';

import { prisma } from '@/shared/lib/prisma';
import { ProductType } from '@/lib/generated/prisma/client';

export async function findOrCreateProduct(
  name: string,
  userId: string,
  type: 'PRODUCT' | 'SERVICE' = 'SERVICE'
): Promise<number> {
  const product = await prisma.product.upsert({
    where: { name_userId: { name, userId } },
    update: {},
    create: { name, userId, type: type as ProductType },
    select: { id: true },
  });

  return product.id;
}
