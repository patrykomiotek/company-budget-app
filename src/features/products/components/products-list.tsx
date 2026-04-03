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
import { Badge } from "@/components/ui/badge";
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
import { deleteProductCommand } from "../services/commands/product-commands";
import type { ProductItem } from "../contracts/product.types";
import { PRODUCT_TYPE_LABELS } from "../contracts/product.types";

interface ProductsListProps {
  products: ProductItem[];
}

const columnHelper = createColumnHelper<ProductItem>();

export function ProductsList({ products }: ProductsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tę usługę? Pozycje faktur zostaną odłączone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteProductCommand(id);
      if (result.success) {
        toast.success("Usługa usunięta");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć usługi");
    } finally {
      setDeletingId(null);
    }
  }

  const columns = [
    columnHelper.accessor("name", {
      header: "Nazwa",
      cell: (info) => (
        <Link
          href={`/products/${info.row.original.id}`}
          className="hover:underline font-medium"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("type", {
      header: "Typ",
      cell: (info) => (
        <Badge
          variant={info.getValue() === "SERVICE" ? "default" : "secondary"}
        >
          {PRODUCT_TYPE_LABELS[info.getValue()] || info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor("lineItemCount", {
      header: "Pozycje faktur",
      meta: { align: "right" },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex gap-1">
          <Link href={`/products/${info.row.original.id}/edit`}>
            <Button variant="ghost" size="icon" aria-label="Edytuj usługę">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(info.row.original.id)}
            disabled={deletingId === info.row.original.id}
            aria-label="Usuń usługę"
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
    data: products,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak usług. Dodaj usługę klikając przycisk powyżej lub podczas tworzenia
        transakcji.
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 py-2">
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
