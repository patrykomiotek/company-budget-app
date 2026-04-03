"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/shared/utils/format";
import type {
  TransactionWithDetails,
  TransactionType,
} from "../contracts/transaction.types";

const typeBadgeConfig: Record<
  TransactionType,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  INCOME: { label: "Przychód", variant: "default" },
  EXPENSE: { label: "Wydatek", variant: "destructive" },
  FORECAST_INCOME: { label: "Prognoza przychodu", variant: "outline" },
  FORECAST_EXPENSE: { label: "Prognoza wydatku", variant: "outline" },
};

function isIncomeType(type: TransactionType) {
  return type === "INCOME" || type === "FORECAST_INCOME";
}

interface TransactionDetailsProps {
  transaction: TransactionWithDetails;
}

export function TransactionDetails({
  transaction: t,
}: TransactionDetailsProps) {
  const income = isIncomeType(t.type);
  const badge = typeBadgeConfig[t.type];
  const totalNet = t.lineItems.reduce((sum, li) => sum + li.netAmount, 0);
  const totalGross = t.lineItems.reduce((sum, li) => sum + li.grossAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Transakcje
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            <span className={income ? "text-green-600" : "text-red-600"}>
              {income ? "+" : "-"}
              {formatAmount(t.amount)} {t.currency}
            </span>
          </h1>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        {t.currency !== "PLN" && t.exchangeRate && (
          <span className="text-sm text-muted-foreground">
            ≈ {formatAmount(t.amountPln)} PLN (kurs: {t.exchangeRate})
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Data"
              value={format(t.date, "d MMMM yyyy", { locale: pl })}
            />
            <DetailRow
              label="Kategoria"
              value={`${t.categoryName} / ${t.subcategoryName}`}
            />
            {t.departmentName && (
              <DetailRow label="Oddział" value={t.departmentName} />
            )}
            {t.description && <DetailRow label="Opis" value={t.description} />}
            <DetailRow
              label="Dodano"
              value={format(t.createdAt, "d MMM yyyy, HH:mm", { locale: pl })}
            />
          </CardContent>
        </Card>

        {/* Counterparty & assignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kontrahent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {t.customerName && (
              <DetailRow label="Klient" value={t.customerName} />
            )}
            {t.merchantName && (
              <DetailRow label="Dostawca" value={t.merchantName} />
            )}
            {t.employeeName && (
              <DetailRow label="Osoba" value={t.employeeName} />
            )}
            {!t.customerName && !t.merchantName && !t.employeeName && (
              <p className="text-sm text-muted-foreground">
                Brak danych kontrahenta
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice section */}
      {(t.invoiceNumber || t.invoiceDueDate) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Faktura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {t.invoiceNumber && (
              <DetailRow label="Nr faktury" value={t.invoiceNumber} />
            )}
            {t.invoiceDueDate && (
              <DetailRow
                label="Termin płatności"
                value={format(t.invoiceDueDate, "d MMMM yyyy", { locale: pl })}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Line items */}
      {t.lineItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pozycje faktury</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nazwa</th>
                    <th className="pb-2 font-medium text-right">Ilość</th>
                    <th className="pb-2 font-medium text-right">Cena jedn.</th>
                    <th className="pb-2 font-medium text-right">VAT %</th>
                    <th className="pb-2 font-medium text-right">Netto</th>
                    <th className="pb-2 font-medium text-right">Brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {t.lineItems.map((li) => (
                    <tr key={li.id} className="border-b last:border-0">
                      <td className="py-2">{li.name}</td>
                      <td className="py-2 text-right tabular-nums">
                        {li.quantity}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatAmount(li.unitPrice)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {li.vatRate}%
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatAmount(li.netAmount)}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {formatAmount(li.grossAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td colSpan={4} className="pt-2 text-right">
                      Razem:
                    </td>
                    <td className="pt-2 text-right tabular-nums">
                      {formatAmount(totalNet)}
                    </td>
                    <td className="pt-2 text-right tabular-nums">
                      {formatAmount(totalGross)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}
