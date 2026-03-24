'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { quickCreateCategoryCommand } from '../services/commands/category-commands';
import type { CategoryWithSubcategories } from '../contracts/category.types';

interface QuickCreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'INCOME' | 'EXPENSE';
  onCreated: (category: CategoryWithSubcategories) => void;
}

export function QuickCreateCategoryDialog({
  open,
  onOpenChange,
  type,
  onCreated,
}: QuickCreateCategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [subcategoryInputs, setSubcategoryInputs] = useState(['']);

  function addSubcategory() {
    setSubcategoryInputs([...subcategoryInputs, '']);
  }

  function removeSubcategory(index: number) {
    if (subcategoryInputs.length <= 1) return;
    setSubcategoryInputs(subcategoryInputs.filter((_, i) => i !== index));
  }

  function updateSubcategory(index: number, value: string) {
    const updated = [...subcategoryInputs];
    updated[index] = value;
    setSubcategoryInputs(updated);
  }

  function reset() {
    setName('');
    setSubcategoryInputs(['']);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const subcategoryNames = subcategoryInputs.map((s) => s.trim()).filter(Boolean);
    if (!name.trim()) {
      toast.error('Podaj nazwę kategorii');
      return;
    }
    if (subcategoryNames.length === 0) {
      toast.error('Dodaj przynajmniej jedną podkategorię');
      return;
    }

    setLoading(true);
    try {
      const result = await quickCreateCategoryCommand({
        name: name.trim(),
        type,
        subcategoryNames,
      });

      if (result.success && result.data) {
        toast.success(`Kategoria "${result.data.name}" utworzona`);
        onCreated(result.data);
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? 'Nie udało się utworzyć kategorii');
      }
    } catch {
      toast.error('Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Nowa kategoria ({type === 'INCOME' ? 'przychodów' : 'wydatków'})
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nazwa kategorii</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Marketing i sprzedaż"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Podkategorie</Label>
            <div className="space-y-2">
              {subcategoryInputs.map((sub, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={sub}
                    onChange={(e) => updateSubcategory(i, e.target.value)}
                    placeholder={`Podkategoria ${i + 1}`}
                  />
                  {subcategoryInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubcategory(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addSubcategory}>
              <Plus className="h-3 w-3 mr-1" />
              Dodaj podkategorię
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Tworzenie...' : 'Utwórz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
