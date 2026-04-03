"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Pencil, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SortIcon } from "@/components/sort-icon";
import { deleteMerchantCommand } from "../services/commands/merchant-commands";
import type { MerchantItem } from "../contracts/merchant.types";

interface MerchantsListProps {
  merchants: MerchantItem[];
}

const columnHelper = createColumnHelper<MerchantItem>();

export function MerchantsList({ merchants }: MerchantsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tego dostawcę? Transakcje zostaną odłączone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteMerchantCommand({ id });
      if (result.success) {
        toast.success("Dostawca usunięty");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć dostawcy");
    } finally {
      setDeletingId(null);
    }
  }

  const columns = [
    columnHelper.display({
      id: "avatar",
      header: "",
      cell: (info) => {
        const m = info.row.original;
        return (
          <Avatar className="h-8 w-8">
            {m.logoUrl && <AvatarImage src={m.logoUrl} alt={m.name} />}
            <AvatarFallback className="text-xs">
              {m.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );
      },
      enableSorting: false,
      size: 48,
    }),
    columnHelper.accessor("name", {
      header: "Nazwa",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("nip", {
      header: "NIP",
      cell: (info) => (
        <span className="text-muted-foreground text-sm">
          {info.getValue() || "—"}
        </span>
      ),
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
          <Link href={`/merchants/${info.row.original.id}/edit`}>
            <Button variant="ghost" size="icon" aria-label="Edytuj dostawcę">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(info.row.original.id)}
            disabled={deletingId === info.row.original.id}
            aria-label="Usuń dostawcę"
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
    data: merchants,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (merchants.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak dostawców. Dodaj dostawcę podczas tworzenia transakcji.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 py-2 px-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 w-48"
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const align =
                  (header.column.columnDef.meta as { align?: string })
                    ?.align === "right"
                    ? "text-right"
                    : "";
                const canSort = header.column.getCanSort();
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      align,
                      canSort && "cursor-pointer select-none",
                    )}
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
    </>
  );
}
