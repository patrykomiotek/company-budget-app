"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Crown, Pencil, Trash2 } from "lucide-react";
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
import { SortIcon } from "@/components/sort-icon";
import { deleteCustomerCommand } from "../services/commands/customer-commands";
import type { CustomerItem } from "../contracts/customer.types";

interface CustomersListProps {
  customers: CustomerItem[];
}

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

const columnHelper = createColumnHelper<CustomerItem>();

export function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastTransactionDate", desc: true },
  ]);

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

  const columns = [
    columnHelper.accessor((row) => row.displayName || row.name, {
      id: "name",
      header: "Nazwa",
      cell: (info) => {
        const c = info.row.original;
        return (
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/customers/${c.id}`}
                className="hover:underline font-medium"
              >
                {c.displayName || c.name}
              </Link>
              {c.isVip && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  <Crown className="h-3 w-3" />
                  VIP
                </span>
              )}
            </div>
            {c.displayName && (
              <span className="block text-xs text-muted-foreground">
                {c.name}
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("totalRevenue", {
      header: "Przychód",
      cell: (info) => (
        <span className="text-green-600 font-medium">
          {formatPln(info.getValue())}
        </span>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor("lastTransactionDate", {
      header: "Ostatnia transakcja",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(info.getValue())}
        </span>
      ),
      sortingFn: (rowA, rowB) => {
        const a = rowA.original.lastTransactionDate || "";
        const b = rowB.original.lastTransactionDate || "";
        return a.localeCompare(b);
      },
    }),
    columnHelper.accessor("transactionCount", {
      header: "Transakcje",
      meta: { align: "right" },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex gap-1">
          <Link href={`/customers/${info.row.original.id}/edit`}>
            <Button variant="ghost" size="icon" aria-label="Edytuj klienta">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(info.row.original.id)}
            disabled={deletingId === info.row.original.id}
            aria-label="Usuń klienta"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      size: 80,
    }),
  ];

  const table = useReactTable({
    data: customers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const align =
                (header.column.columnDef.meta as { align?: string })?.align ===
                "right"
                  ? "text-right"
                  : "";
              const canSort = header.column.getCanSort();
              return (
                <TableHead
                  key={header.id}
                  className={cn(align, canSort && "cursor-pointer select-none")}
                  style={
                    header.getSize() !== 150
                      ? { width: header.getSize() }
                      : undefined
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <span className="inline-flex items-center gap-1">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {canSort && (
                      <SortIcon sorted={header.column.getIsSorted()} />
                    )}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => {
              const align =
                (cell.column.columnDef.meta as { align?: string })?.align ===
                "right"
                  ? "text-right"
                  : "";
              return (
                <TableCell key={cell.id} className={align}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
