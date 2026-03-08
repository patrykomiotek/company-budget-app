'use server';

import { prisma } from '@/shared/lib/prisma';
import type { CategoryType } from '@/lib/generated/prisma/client';
import type { CategoryWithSubcategories } from '../../contracts/category.types';

export async function getCategoryByIdQuery(
  publicId: string
): Promise<CategoryWithSubcategories | null> {
  const c = await prisma.category.findUnique({
    where: { publicId },
    include: {
      subcategories: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!c) {return null;}

  return {
    id: c.publicId,
    name: c.name,
    type: c.type,
    sortOrder: c.sortOrder,
    subcategories: c.subcategories.map((s) => ({
      id: s.publicId,
      name: s.name,
      sortOrder: s.sortOrder,
      categoryId: c.publicId,
    })),
  };
}

export async function getCategoriesQuery(
  type?: CategoryType
): Promise<CategoryWithSubcategories[]> {
  const where = type ? { type } : {};

  const categories = await prisma.category.findMany({
    where,
    include: {
      subcategories: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return categories.map((c) => ({
    id: c.publicId,
    name: c.name,
    type: c.type,
    sortOrder: c.sortOrder,
    subcategories: c.subcategories.map((s) => ({
      id: s.publicId,
      name: s.name,
      sortOrder: s.sortOrder,
      categoryId: c.publicId,
    })),
  }));
}
