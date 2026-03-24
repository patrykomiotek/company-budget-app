"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCustomerCommand } from "../services/commands/customer-commands";
import type { CustomerItem } from "../contracts/customer.types";

interface CustomersListProps {
  customers: CustomerItem[];
}

export function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tego klienta? Transakcje zostaną odłączone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteCustomerCommand(id);
      if (result.success) {
        toast.success("Klient usunięty");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć klienta");
    } finally {
      setDeletingId(null);
    }
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak klientów. Dodaj klienta klikając przycisk powyżej lub podczas
        tworzenia transakcji.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nazwa</TableHead>
          <TableHead>NIP</TableHead>
          <TableHead>Miasto</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Transakcje</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {c.nip || "—"}
            </TableCell>
            <TableCell>{c.city || "—"}</TableCell>
            <TableCell className="text-sm">{c.email || "—"}</TableCell>
            <TableCell className="text-right">{c.transactionCount}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/customers/${c.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edytuj klienta"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  aria-label="Usuń klienta"
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
