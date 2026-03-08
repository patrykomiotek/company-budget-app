'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createCategoryCommand,
  updateCategoryCommand,
} from '../services/commands/category-commands';
import type { CategoryWithSubcategories } from '../contracts/category.types';

interface SubcategoryInput {
  id?: string;
  name: string;
  sortOrder: number;
}

interface CategoryFormProps {
  category?: CategoryWithSubcategories;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = !!category;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category?.name ?? '');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(
    (category?.type as 'INCOME' | 'EXPENSE') ?? 'EXPENSE'
  );
  const [subcategories, setSubcategories] = useState<SubcategoryInput[]>(
    category?.subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      sortOrder: s.sortOrder,
    })) ?? []
  );

  function addSubcategory() {
    setSubcategories((prev) => [
      ...prev,
      { name: '', sortOrder: prev.length },
    ]);
  }

  function removeSubcategory(index: number) {
    setSubcategories((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
  }

  function updateSubcategoryName(index: number, value: string) {
    setSubcategories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name: value } : s))
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        type,
        subcategories: subcategories.filter((s) => s.name.trim()),
      };

      const result = isEditing
        ? await updateCategoryCommand({ id: category.id, ...payload })
        : await createCategoryCommand(payload);

      if (result.success) {
        toast.success(
          isEditing ? 'Kategoria zaktualizowana' : 'Kategoria utworzona'
        );
        router.push('/categories');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edytuj kategorię' : 'Nowa kategoria'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as 'INCOME' | 'EXPENSE')}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <span>{type === 'INCOME' ? 'Przychód' : 'Wydatek'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">
                    Wydatek
                  </SelectItem>
                  <SelectItem value="INCOME">
                    Przychód
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Podkategorie</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubcategory}
              >
                <Plus className="h-4 w-4 mr-1" />
                Dodaj
              </Button>
            </div>
            <div className="space-y-2">
              {subcategories.map((sub, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={sub.name}
                    onChange={(e) => updateSubcategoryName(index, e.target.value)}
                    placeholder="Nazwa podkategorii"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSubcategory(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {subcategories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Brak podkategorii. Kliknij &quot;Dodaj&quot; aby dodać.
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading
                ? 'Zapisywanie...'
                : isEditing
                  ? 'Zapisz'
                  : 'Utwórz'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
