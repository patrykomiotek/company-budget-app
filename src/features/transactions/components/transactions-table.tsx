"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
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
import { EditTransactionDialog } from "./edit-transaction-dialog";
import {
  deleteTransactionCommand,
  convertForecastToActualCommand,
} from "../services/commands/transaction-commands";
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

function isExpenseType(type: TransactionType) {
  return type === "EXPENSE" || type === "FORECAST_EXPENSE";
}

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

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak transakcji w wybranym okresie
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">Typ</TableHead>
              <TableHead className="w-[110px]">Data</TableHead>
              <TableHead className="w-[140px]">Kategoria</TableHead>
              <TableHead className="w-[180px]">Kontrahent</TableHead>
              <TableHead className="w-[100px]">Osoba</TableHead>
              <TableHead className="w-[160px]">Opis</TableHead>
              <TableHead className="w-[110px]">Nr faktury</TableHead>
              <TableHead className="w-[90px]">Status</TableHead>
              <TableHead className="w-[130px] text-right">Kwota</TableHead>
              <TableHead className="w-[110px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => {
              const badge = typeBadgeConfig[t.type];
              const income = isIncomeType(t.type);
              return (
                <TableRow
                  key={t.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/transactions/${t.id}`)}
                >
                  <TableCell>
                    <Badge
                      variant={badge.variant}
                      className="text-xs whitespace-nowrap"
                    >
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(t.date), "d MMM yyyy", { locale: pl })}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {t.categoryName}
                    </div>
                    <div>{t.subcategoryName}</div>
                  </TableCell>
                  <TableCell
                    className="truncate"
                    title={t.customerName || t.merchantName || undefined}
                  >
                    {t.customerName || t.merchantName || "—"}
                  </TableCell>
                  <TableCell className="truncate">
                    {t.employeeName || "—"}
                  </TableCell>
                  <TableCell
                    className="text-muted-foreground truncate"
                    title={t.description || undefined}
                  >
                    {t.description || "—"}
                  </TableCell>
                  <TableCell className="text-xs truncate">
                    {t.invoiceNumber || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {!isForecastType(t.type) && (
                        <>
                          <span
                            className={`text-xs ${t.isPaid ? "text-green-600" : "text-muted-foreground"}`}
                          >
                            {t.isPaid ? "Opłacone" : "Nieopłacone"}
                          </span>
                          {isExpenseType(t.type) && (
                            <span
                              className={`text-xs ${t.invoiceSent ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {t.invoiceSent ? "FV wysłana" : "FV niewysłana"}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono whitespace-nowrap ${
                      income ? "text-green-600" : "text-red-600"
                    }`}
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
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
