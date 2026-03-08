'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CategoryWithSubcategories } from '../contracts/category.types';

interface CategoriesListProps {
  categories: CategoryWithSubcategories[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak kategorii.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nazwa</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead>Podkategorie</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell>
              <Badge variant={c.type === 'INCOME' ? 'default' : 'secondary'}>
                {c.type === 'INCOME' ? 'Przychód' : 'Wydatek'}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {c.subcategories.map((s) => s.name).join(', ')}
            </TableCell>
            <TableCell>
              <Link href={`/categories/${c.id}/edit`}>
                <Button variant="ghost" size="icon" aria-label="Edytuj kategorię">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
