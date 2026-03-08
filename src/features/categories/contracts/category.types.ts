import type { CategoryType } from '@/lib/generated/prisma/client';

export interface CategoryWithSubcategories {
  id: string;
  name: string;
  type: CategoryType;
  sortOrder: number;
  subcategories: SubcategoryItem[];
}

export interface SubcategoryItem {
  id: string;
  name: string;
  sortOrder: number;
  categoryId: string;
}
