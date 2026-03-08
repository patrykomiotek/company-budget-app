'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MerchantCombobox } from '@/components/merchant-combobox';
import { updateTransactionCommand } from '../services/commands/transaction-commands';
import type { TransactionWithDetails } from '../contracts/transaction.types';
import type { CategoryWithSubcategories } from '@/features/categories/contracts/category.types';

interface EditTransactionDialogProps {
  transaction: TransactionWithDetails | null;
  categories: CategoryWithSubcategories[];
  merchants: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaction,
  categories,
  merchants,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [merchantName, setMerchantName] = useState('');

  useEffect(() => {
    if (transaction) {
      setType(transaction.categoryType as 'INCOME' | 'EXPENSE');
      setCategoryId(transaction.categoryId);
      setSubcategoryId(transaction.subcategoryId);
      setAmount(transaction.amount.toString());
      setDate(new Date(transaction.date).toISOString().split('T')[0]);
      setDescription(transaction.description || '');
      setMerchantName(transaction.merchantName || '');
    }
  }, [transaction]);

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);
  const typeLabel = type === 'INCOME' ? 'Przychód' : 'Wydatek';
  const categoryLabel = selectedCategory?.name ?? 'Wybierz kategorię';
  const subcategoryLabel = selectedCategory?.subcategories.find((s) => s.id === subcategoryId)?.name ?? 'Wybierz podkategorię';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction) {return;}

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Kwota musi być większa od 0');
      return;
    }

    setLoading(true);

    try {
      const result = await updateTransactionCommand({
        id: transaction.id,
        amount: parsedAmount,
        date,
        subcategoryId,
        description: description || undefined,
        merchantName: merchantName || undefined,
      });

      if (result.success) {
        toast.success('Transakcja zaktualizowana');
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edytuj transakcję</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={type} onValueChange={(v) => {
                if (!v) {return;}
                setType(v as 'INCOME' | 'EXPENSE');
                setCategoryId('');
                setSubcategoryId('');
              }}>
                <SelectTrigger>
                  <span>{typeLabel}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Wydatek</SelectItem>
                  <SelectItem value="INCOME">Przychód</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
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
                <span>{categoryLabel}</span>
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
                  <span>{subcategoryLabel}</span>
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
            <Label htmlFor="edit-amount">Kwota (PLN)</Label>
            <Input
              id="edit-amount"
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
            <Label>Sprzedawca (opcjonalnie)</Label>
            <MerchantCombobox
              value={merchantName}
              onChange={setMerchantName}
              merchants={merchants}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Opis (opcjonalnie)</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Zakupy w Biedronce"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !subcategoryId}>
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
