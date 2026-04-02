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
import { cn } from "@/lib/utils";
import { SortIcon } from "@/components/sort-icon";
import { deleteProjectCommand } from "../services/commands/project-commands";
import type { ProjectItem, ProjectStatus } from "../contracts/project.types";
import { PROJECT_STATUS_LABELS } from "../contracts/project.types";

interface ProjectsListProps {
  projects: ProjectItem[];
}

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

const columnHelper = createColumnHelper<ProjectItem>();

export function ProjectsList({ projects }: ProjectsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć ten projekt? Transakcje zostaną odłączone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteProjectCommand(id);
      if (result.success) {
        toast.success("Projekt usunięty");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć projektu");
    } finally {
      setDeletingId(null);
    }
  }

  const columns = [
    columnHelper.accessor("name", {
      header: "Nazwa",
      cell: (info) => (
        <Link
          href={`/projects/${info.row.original.id}`}
          className="hover:underline font-medium"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("customerName", {
      header: "Klient",
      cell: (info) => (
        <span className="text-muted-foreground text-sm">
          {info.getValue() || "—"}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              statusColors[status],
            )}
          >
            {PROJECT_STATUS_LABELS[status]}
          </span>
        );
      },
    }),
    columnHelper.accessor("totalIncome", {
      header: "Przychód",
      cell: (info) => (
        <span className="text-green-600">{formatPln(info.getValue())}</span>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor("totalCosts", {
      header: "Koszty",
      cell: (info) => (
        <span className="text-red-600">{formatPln(info.getValue())}</span>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor("profit", {
      header: "Zysk",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span
            className={cn(
              "font-medium",
              value >= 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {formatPln(value)}
          </span>
        );
      },
      meta: { align: "right" },
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
          <Link href={`/projects/${info.row.original.id}/edit`}>
            <Button variant="ghost" size="icon" aria-label="Edytuj projekt">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(info.row.original.id)}
            disabled={deletingId === info.row.original.id}
            aria-label="Usuń projekt"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    }),
  ];

  const table = useReactTable({
    data: projects,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak projektów. Dodaj projekt klikając przycisk powyżej lub podczas
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
