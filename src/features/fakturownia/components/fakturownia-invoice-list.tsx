"use client";

import { Check, Loader2 } from "lucide-react";
import { formatAmount as formatNum } from "@/shared/utils/format";
import type { FakturowniaInvoiceListItem } from "../contracts/fakturownia.types";

function formatAmount(value: string, currency: string): string {
  const num = parseFloat(value);
  if (Number.isNaN(num)) {
    return `${value} ${currency}`;
  }
  return `${formatNum(num)} ${currency}`;
}

const statusLabels: Record<string, string> = {
  issued: "Wystawiona",
  sent: "Wysłana",
  paid: "Opłacona",
  partial: "Częściowo",
  rejected: "Odrzucona",
};

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  partial: "bg-yellow-100 text-yellow-800",
  issued: "bg-blue-100 text-blue-800",
  sent: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

interface FakturowniaInvoiceListProps {
  invoices: FakturowniaInvoiceListItem[];
  loading: boolean;
  onSelect: (id: number) => void;
  selectedId: number | null;
}

export function FakturowniaInvoiceList({
  invoices,
  loading,
  onSelect,
  selectedId,
}: FakturowniaInvoiceListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Pobieranie faktur...
        </span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Brak faktur do wyświetlenia
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto divide-y">
      {invoices.map((inv) => (
        <button
          key={inv.id}
          type="button"
          className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${
            selectedId === inv.id ? "bg-muted" : ""
          }`}
          onClick={() => onSelect(inv.id)}
        >
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {inv.number}
                </span>
                {inv.alreadyImported && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground shrink-0">
                    <Check className="h-3 w-3" />
                    Zaimportowano
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {inv.buyerName}
              </p>
            </div>
            <span className="text-sm font-medium whitespace-nowrap">
              {formatAmount(inv.priceNet, inv.currency)} netto
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {inv.issueDate}
            </span>
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                statusColors[inv.status] ?? "bg-gray-100 text-gray-800"
              }`}
            >
              {statusLabels[inv.status] ?? inv.status}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
