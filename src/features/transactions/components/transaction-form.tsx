'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createTransactionCommand } from '../services/commands/transaction-commands';
import type { CategoryWithSubcategories } from '@/features/categories/contracts/category.types';

interface TransactionFormProps {
  categories: CategoryWithSubcategories[];
  defaultType?: 'INCOME' | 'EXPENSE';
}

export function TransactionForm({ categories, defaultType = 'EXPENSE' }: TransactionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(defaultType);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Kwota musi być większa od 0');
      return;
    }

    setLoading(true);

    try {
      const result = await createTransactionCommand({
        amount: parsedAmount,
        date,
        subcategoryId,
        description: description || undefined,
      });

      if (result.success) {
        toast.success('Transakcja dodana');
        router.push('/transactions');
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
        <CardTitle>Dodaj transakcję</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={type} onValueChange={(v) => {
                if (!v) return;
                setType(v as 'INCOME' | 'EXPENSE');
                setCategoryId('');
                setSubcategoryId('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Wydatek</SelectItem>
                  <SelectItem value="INCOME">Przychód</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kategoria</Label>
            <Select value={categoryId} onValueChange={(v) => {
              setCategoryId(v ?? '');
              setSubcategoryId('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="space-y-2">
              <Label>Podkategoria</Label>
              <Select value={subcategoryId} onValueChange={(v) => setSubcategoryId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz podkategorię" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{selectedCategory.name}</SelectLabel>
                    {selectedCategory.subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Kwota (PLN)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis (opcjonalnie)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Zakupy w Biedronce"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !subcategoryId}>
              {loading ? 'Dodawanie...' : 'Dodaj'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
