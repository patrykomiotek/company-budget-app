'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { deleteMerchantCommand } from '../services/commands/merchant-commands';
import type { MerchantItem } from '../contracts/merchant.types';

interface MerchantsListProps {
  merchants: MerchantItem[];
}

export function MerchantsList({ merchants }: MerchantsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Czy na pewno chcesz usunąć tego sprzedawcę? Transakcje zostaną odłączone.')) {return;}

    setDeletingId(id);
    try {
      const result = await deleteMerchantCommand({ id });
      if (result.success) {
        toast.success('Sprzedawca usunięty');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Nie udało się usunąć sprzedawcy');
    } finally {
      setDeletingId(null);
    }
  }

  if (merchants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak sprzedawców. Dodaj sprzedawcę podczas tworzenia transakcji.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Nazwa</TableHead>
          <TableHead>NIP</TableHead>
          <TableHead className="text-right">Transakcje</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {merchants.map((m) => (
          <TableRow key={m.id}>
            <TableCell>
              <Avatar className="h-8 w-8">
                {m.logoUrl && <AvatarImage src={m.logoUrl} alt={m.name} />}
                <AvatarFallback className="text-xs">
                  {m.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{m.name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{m.nip || '—'}</TableCell>
            <TableCell className="text-right">{m.transactionCount}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/merchants/${m.id}/edit`}>
                  <Button variant="ghost" size="icon" aria-label="Edytuj sprzedawcę">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
                  aria-label="Usuń sprzedawcę"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
