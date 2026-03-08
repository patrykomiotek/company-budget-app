'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CategoryWithSubcategories } from '@/features/categories/contracts/category.types';

interface TransactionFiltersProps {
  categories: CategoryWithSubcategories[];
}

export function TransactionFilters({ categories }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === 'categoryId') {
      params.delete('subcategoryId');
    }
    if (key === 'type') {
      params.delete('categoryId');
      params.delete('subcategoryId');
    }
    router.push(`/transactions?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/transactions');
  }

  const type = searchParams.get('type') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';

  const filteredCategories = type
    ? categories.filter((c) => c.type === type)
    : categories;

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-1">
        <Label className="text-xs">Typ</Label>
        <Select value={type || 'all'} onValueChange={(v) => updateFilter('type', v ?? '')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystko</SelectItem>
            <SelectItem value="EXPENSE">Wydatki</SelectItem>
            <SelectItem value="INCOME">Przychody</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Kategoria</Label>
        <Select value={categoryId || 'all'} onValueChange={(v) => updateFilter('categoryId', v ?? '')}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Od</Label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => updateFilter('dateFrom', e.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Do</Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => updateFilter('dateTo', e.target.value)}
          className="w-[160px]"
        />
      </div>

      <Button variant="ghost" size="sm" onClick={clearFilters}>
        Wyczyść filtry
      </Button>
    </div>
  );
}
