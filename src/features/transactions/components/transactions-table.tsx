"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowRightLeft, Columns3, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatAmount } from "@/shared/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SortIcon } from "@/components/sort-icon";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import {
  deleteTransactionCommand,
  convertForecastToActualCommand,
} from "../services/commands/transaction-commands";
import { cn } from "@/lib/utils";
import type {
  TransactionWithDetails,
  TransactionType,
} from "../contracts/transaction.types";
import type { CategoryWithSubcategories } from "@/features/categories/contracts/category.types";

interface TransactionsTableProps {
  transactions: TransactionWithDetails[];
  categories: CategoryWithSubcategories[];
  merchants: { id: string; name: string }[];
  customers: { id: string; name: string; nip?: string | null }[];
  employees: { id: string; name: string }[];
  products: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

const typeBadgeConfig: Record<
  TransactionType,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  INCOME: { label: "Przychód", variant: "default" },
  EXPENSE: { label: "Wydatek", variant: "destructive" },
  FORECAST_INCOME: { label: "Prognoza +", variant: "outline" },
  FORECAST_EXPENSE: { label: "Prognoza -", variant: "outline" },
};

function isIncomeType(type: TransactionType) {
  return type === "INCOME" || type === "FORECAST_INCOME";
}

function isForecastType(type: TransactionType) {
  return type === "FORECAST_INCOME" || type === "FORECAST_EXPENSE";
}

const columnHelper = createColumnHelper<TransactionWithDetails>();

export function TransactionsTable({
  transactions,
  categories,
  merchants,
  customers,
  employees,
  products,
  projects,
}: TransactionsTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithDetails | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  async function handleConvertForecast(id: string) {
    try {
      const result = await convertForecastToActualCommand(id);
      if (result.success) {
        toast.success("Prognoza zamieniona na transakcję");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się zamienić prognozy");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteTransactionCommand(id);
      if (result.success) {
        toast.success("Transakcja usunięta");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć transakcji");
    } finally {
      setDeletingId(null);
    }
  }

  const columns = [
    columnHelper.accessor("type", {
      header: "Typ",
      cell: (info) => {
        const badge = typeBadgeConfig[info.getValue()];
        return (
          <Badge variant={badge.variant} className="text-xs whitespace-nowrap">
            {badge.label}
          </Badge>
        );
      },
      size: 90,
      enableHiding: false,
    }),
    columnHelper.accessor("date", {
      header: "Data",
      cell: (info) => (
        <span className="whitespace-nowrap">
          {format(new Date(info.getValue()), "d MMM yyyy", { locale: pl })}
        </span>
      ),
      sortingFn: "datetime",
      size: 110,
      enableHiding: false,
    }),
    columnHelper.accessor("categoryName", {
      header: "Kategoria",
      cell: (info) => (
        <div>
          <div className="text-xs text-muted-foreground">{info.getValue()}</div>
          <div>{info.row.original.subcategoryName}</div>
        </div>
      ),
      size: 140,
    }),
    columnHelper.accessor((row) => row.customerName || row.merchantName || "", {
      id: "counterparty",
      header: "Kontrahent",
      cell: (info) => (
        <span className="truncate block" title={info.getValue() || undefined}>
          {info.getValue() || "—"}
        </span>
      ),
      size: 180,
    }),
    columnHelper.accessor("employeeName", {
      header: "Osoba",
      cell: (info) => (
        <span className="truncate block">{info.getValue() || "—"}</span>
      ),
      size: 100,
    }),
    columnHelper.accessor("description", {
      header: "Opis",
      cell: (info) => (
        <span
          className="text-muted-foreground truncate block"
          title={info.getValue() || undefined}
        >
          {info.getValue() || "—"}
        </span>
      ),
      size: 160,
    }),
    columnHelper.accessor("invoiceNumber", {
      header: "Nr faktury",
      cell: (info) => (
        <span className="text-xs truncate block">{info.getValue() || "—"}</span>
      ),
      size: 110,
    }),
    columnHelper.accessor("isPaid", {
      header: "Status",
      cell: (info) => {
        const t = info.row.original;
        if (isForecastType(t.type)) {
          return null;
        }
        return (
          <div className="flex flex-col gap-0.5">
            <span
              className={`text-xs ${t.isPaid ? "text-green-600" : "text-muted-foreground"}`}
            >
              {t.isPaid ? "Opłacone" : "Nieopłacone"}
            </span>
            {isIncomeType(t.type) && (
              <span
                className={`text-xs ${t.invoiceSent ? "text-green-600" : "text-muted-foreground"}`}
              >
                {t.invoiceSent ? "FV wysłana" : "FV niewysłana"}
              </span>
            )}
          </div>
        );
      },
      size: 90,
    }),
    columnHelper.accessor("amountPln", {
      header: "Kwota",
      enableHiding: false,
      cell: (info) => {
        const t = info.row.original;
        const income = isIncomeType(t.type);
        return (
          <div
            className={`text-right font-mono whitespace-nowrap ${income ? "text-green-600" : "text-red-600"}`}
          >
            <div>
              {income ? "+" : "-"}
              {formatAmount(t.amount)} {t.currency}
            </div>
            {t.currency !== "PLN" && t.amountPln && (
              <div className="text-xs text-muted-foreground">
                ≈ {formatAmount(t.amountPln)} PLN
              </div>
            )}
          </div>
        );
      },
      meta: { align: "right" },
      size: 130,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: (info) => {
        const t = info.row.original;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {isForecastType(t.type) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleConvertForecast(t.id)}
                aria-label="Zamień prognozę na transakcję"
                title="Zamień na rzeczywistą"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            )}
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
              onClick={() => setConfirmDeleteId(t.id)}
              disabled={deletingId === t.id}
              aria-label="Usuń transakcję"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 110,
    }),
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak transakcji w wybranym okresie
      </div>
    );
  }

  const columnLabels: Record<string, string> = {
    categoryName: "Kategoria",
    counterparty: "Kontrahent",
    employeeName: "Osoba",
    description: "Opis",
    invoiceNumber: "Nr faktury",
    isPaid: "Status",
  };

  return (
    <>
      <div>
        <div className="flex justify-end mb-2">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="h-8">
                  <Columns3 className="h-3.5 w-3.5 mr-1.5" />
                  Kolumny
                </Button>
              }
            />
            <PopoverContent align="end" className="w-48 p-2">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={col.getIsVisible()}
                      onChange={col.getToggleVisibilityHandler()}
                      className="h-4 w-4 rounded border-input"
                    />
                    {columnLabels[col.id] || col.id}
                  </label>
                ))}
            </PopoverContent>
          </Popover>
        </div>
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table className="table-fixed w-full">
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
                            style={{ width: header.getSize() }}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="inline-flex items-center gap-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {canSort && (
                                <SortIcon
                                  sorted={header.column.getIsSorted()}
                                />
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
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/transactions/${row.original.id}`)
                      }
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align =
                          (cell.column.columnDef.meta as { align?: string })
                            ?.align === "right"
                            ? "text-right"
                            : "";
                        return (
                          <TableCell key={cell.id} className={align}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

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
            <AlertDialogTitle>Usunąć transakcję?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Transakcja zostanie trwale
              usunięta.
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

      <EditTransactionDialog
        transaction={editingTransaction}
        categories={categories}
        merchants={merchants}
        customers={customers}
        employees={employees}
        products={products}
        projects={projects}
        open={!!editingTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTransaction(null);
          }
        }}
      />
    </>
  );
}
