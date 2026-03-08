'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { EditTransactionDialog } from './edit-transaction-dialog';
import { deleteTransactionCommand } from '../services/commands/transaction-commands';
import type { TransactionWithDetails } from '../contracts/transaction.types';
import type { CategoryWithSubcategories } from '@/features/categories/contracts/category.types';

interface TransactionsTableProps {
  transactions: TransactionWithDetails[];
  categories: CategoryWithSubcategories[];
  merchants: { id: string; name: string }[];
}

export function TransactionsTable({ transactions, categories, merchants }: TransactionsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithDetails | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Czy na pewno chcesz usunąć tę transakcję?')) {return;}

    setDeletingId(id);
    try {
      const result = await deleteTransactionCommand(id);
      if (result.success) {
        toast.success('Transakcja usunięta');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Nie udało się usunąć transakcji');
    } finally {
      setDeletingId(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak transakcji w wybranym okresie
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Kategoria</TableHead>
            <TableHead>Podkategoria</TableHead>
            <TableHead>Sprzedawca</TableHead>
            <TableHead>Opis</TableHead>
            <TableHead className="text-right">Kwota</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(t.date), 'd MMM yyyy', { locale: pl })}
              </TableCell>
              <TableCell>
                <Badge variant={t.categoryType === 'INCOME' ? 'default' : 'secondary'}>
                  {t.categoryName}
                </Badge>
              </TableCell>
              <TableCell>{t.subcategoryName}</TableCell>
              <TableCell>{t.merchantName || '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {t.description || '—'}
              </TableCell>
              <TableCell className={`text-right font-mono whitespace-nowrap ${
                t.categoryType === 'INCOME' ? 'text-green-600' : 'text-red-600'
              }`}>
                {t.categoryType === 'INCOME' ? '+' : '-'}
                {t.amount.toFixed(2)} zł
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTransaction(t)}
                    aria-label="Edytuj transakcję"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    aria-label="Usuń transakcję"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditTransactionDialog
        transaction={editingTransaction}
        categories={categories}
        merchants={merchants}
        open={!!editingTransaction}
        onOpenChange={(open) => {
          if (!open) {setEditingTransaction(null);}
        }}
      />
    </>
  );
}
