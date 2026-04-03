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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { SortIcon } from "@/components/sort-icon";
import { deleteDepartmentCommand } from "../services/commands/department-commands";
import type { DepartmentListItem } from "../contracts/department.types";

interface DepartmentsListProps {
  departments: DepartmentListItem[];
}

const columnHelper = createColumnHelper<DepartmentListItem>();

export function DepartmentsList({ departments }: DepartmentsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteDepartmentCommand(id);
      if (result.success) {
        toast.success("Oddział usunięty");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć oddziału");
    } finally {
      setDeletingId(null);
    }
  }

  const columns = [
    columnHelper.accessor("name", {
      header: "Nazwa",
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    columnHelper.accessor("categoryCount", {
      header: "Kategorie",
      meta: { align: "right" },
      enableSorting: false,
    }),
    columnHelper.accessor("employeeCount", {
      header: "Pracownicy",
      meta: { align: "right" },
      enableSorting: false,
    }),
    columnHelper.accessor("transactionCount", {
      header: "Transakcje",
      meta: { align: "right" },
      enableSorting: false,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <div className="flex gap-1">
          <Link href={`/departments/${info.row.original.id}/edit`}>
            <Button variant="ghost" size="icon" aria-label="Edytuj oddział">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmDeleteId(info.row.original.id)}
            disabled={deletingId === info.row.original.id}
            aria-label="Usuń oddział"
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
    data: departments,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak oddziałów. Dodaj pierwszy oddział.
      </div>
    );
  }

  return (
    <>
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

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć oddział?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Oddziały z przypisanymi
              transakcjami lub pracownikami nie mogą być usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
