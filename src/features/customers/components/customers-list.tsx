"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ArrowUpDown, Crown } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { deleteCustomerCommand } from "../services/commands/customer-commands";
import type { CustomerItem } from "../contracts/customer.types";

interface CustomersListProps {
  customers: CustomerItem[];
}

type SortField =
  | "name"
  | "totalRevenue"
  | "lastTransactionDate"
  | "transactionCount";
type SortDir = "asc" | "desc";

function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) {
    return "—";
  }
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("lastTransactionDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // Determine VIP threshold (top 20% by revenue, minimum 1)
  const vipThreshold = useMemo(() => {
    if (customers.length === 0) {
      return 0;
    }
    const sorted = [...customers]
      .map((c) => c.totalRevenue)
      .sort((a, b) => b - a);
    const topIndex = Math.max(0, Math.ceil(sorted.length * 0.2) - 1);
    return sorted[topIndex] > 0 ? sorted[topIndex] : Infinity;
  }, [customers]);

  const sorted = useMemo(() => {
    return [...customers].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.displayName || a.name).localeCompare(
            b.displayName || b.name,
          );
          break;
        case "totalRevenue":
          cmp = a.totalRevenue - b.totalRevenue;
          break;
        case "transactionCount":
          cmp = a.transactionCount - b.transactionCount;
          break;
        case "lastTransactionDate": {
          const aDate = a.lastTransactionDate || "";
          const bDate = b.lastTransactionDate || "";
          cmp = aDate.localeCompare(bDate);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [customers, sortField, sortDir]);

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

  function SortButton({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <button
        className={cn(
          "flex items-center gap-1 hover:text-foreground",
          className,
        )}
        onClick={() => toggleSort(field)}
      >
        {children}
        <ArrowUpDown
          className={cn(
            "h-3 w-3",
            sortField === field ? "opacity-100" : "opacity-30",
          )}
        />
      </button>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortButton field="name">Nazwa</SortButton>
          </TableHead>
          <TableHead className="text-right">
            <SortButton field="totalRevenue" className="ml-auto">
              Przychód
            </SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="lastTransactionDate">
              Ostatnia transakcja
            </SortButton>
          </TableHead>
          <TableHead className="text-right">
            <SortButton field="transactionCount" className="ml-auto">
              Transakcje
            </SortButton>
          </TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((c) => {
          const isVip = c.totalRevenue >= vipThreshold && c.totalRevenue > 0;
          return (
            <TableRow key={c.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Link href={`/customers/${c.id}`} className="hover:underline">
                    {c.displayName || c.name}
                  </Link>
                  {isVip && (
                    <span title="VIP — top 20% przychodu">
                      <Crown className="h-4 w-4 text-amber-500" />
                    </span>
                  )}
                </div>
                {c.displayName && (
                  <span className="block text-xs text-muted-foreground font-normal">
                    {c.name}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right text-green-600 font-medium">
                {formatPln(c.totalRevenue)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(c.lastTransactionDate)}
              </TableCell>
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
          );
        })}
      </TableBody>
    </Table>
  );
}
