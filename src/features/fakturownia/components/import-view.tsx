"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/shared/utils/format";
import { fetchFakturowniaInvoicesQuery } from "../services/queries/fakturownia-queries";
import { importFakturowniaInvoiceCommand } from "../services/commands/fakturownia-commands";
import { ImportTransactionDialog } from "./import-transaction-dialog";
import type { FakturowniaInvoiceListItem } from "../contracts/fakturownia.types";
import type { ImportedInvoiceData } from "../contracts/fakturownia.types";
import type { CategoryWithSubcategories } from "@/features/categories/contracts/category.types";

type ImportType = "income" | "expense";

interface ImportViewProps {
  categories: CategoryWithSubcategories[];
  merchants: { id: string; name: string }[];
  customers: { id: string; name: string; nip?: string | null }[];
  products: { id: string; name: string }[];
  projects: { id: string; name: string }[];
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

function getMonthOptions() {
  const now = new Date();
  const options: {
    value: string;
    label: string;
    dateFrom: string;
    dateTo: string;
  }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("pl-PL", {
      month: "long",
      year: "numeric",
    });
    const mm = String(month + 1).padStart(2, "0");
    const dateFrom = `${year}-${mm}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dateTo = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;
    options.push({ value: `${year}-${mm}`, label, dateFrom, dateTo });
  }
  return options;
}

function fmtAmount(value: string, currency: string): string {
  const num = parseFloat(value);
  if (Number.isNaN(num)) {
    return `${value} ${currency}`;
  }
  return `${formatAmount(num)} ${currency}`;
}

export function ImportView({
  categories,
  merchants,
  customers,
  products,
  projects,
}: ImportViewProps) {
  const router = useRouter();
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [importType, setImportType] = useState<ImportType>("income");
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [invoices, setInvoices] = useState<FakturowniaInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInvoice, setDialogInvoice] =
    useState<FakturowniaInvoiceListItem | null>(null);
  const [dialogImported, setDialogImported] =
    useState<ImportedInvoiceData | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const month = monthOptions.find((m) => m.value === selectedMonth);
      if (!month) {
        return;
      }
      const result = await fetchFakturowniaInvoicesQuery({
        dateFrom: month.dateFrom,
        dateTo: month.dateTo,
        perPage: 100,
      });
      setInvoices(result);
    } catch {
      toast.error("Nie udało się pobrać faktur z Fakturowni");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, monthOptions]);

  async function handleSelectInvoice(invoice: FakturowniaInvoiceListItem) {
    setImportingId(invoice.id);
    try {
      const result = await importFakturowniaInvoiceCommand(invoice.id);
      if (result.success && result.data) {
        setDialogInvoice(invoice);
        setDialogImported(result.data);
        setDialogOpen(true);
      } else {
        toast.error(result.error ?? "Nie udało się pobrać danych faktury");
      }
    } catch {
      toast.error("Nie udało się pobrać danych faktury");
    } finally {
      setImportingId(null);
    }
  }

  function handleDialogClose() {
    setDialogOpen(false);
  }

  function handleImportSuccess() {
    setDialogOpen(false);
    if (dialogInvoice) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === dialogInvoice.id ? { ...inv, alreadyImported: true } : inv,
        ),
      );
    }
    router.refresh();
  }

  // Show all invoices — the importType only affects how the transaction is created
  // (INCOME vs EXPENSE), not which invoices are fetched from Fakturownia
  const displayedInvoices = invoices;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid grid-rows-[16px_32px] gap-1 content-end">
              <Label className="text-xs">Typ</Label>
              <Select
                value={importType}
                onValueChange={(v) => {
                  if (v) {
                    setImportType(v as ImportType);
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <span>
                    {importType === "income" ? "Przychody" : "Wydatki"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Przychody</SelectItem>
                  <SelectItem value="expense">Wydatki</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-rows-[16px_32px] gap-1 content-end">
              <Label className="text-xs">Miesiąc</Label>
              <Select
                value={selectedMonth}
                onValueChange={(v) => {
                  if (v) {
                    setSelectedMonth(v);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <span className="capitalize">
                    {monthOptions.find((m) => m.value === selectedMonth)
                      ?.label ?? selectedMonth}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="capitalize">{m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={fetchInvoices} disabled={loading} className="h-8">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {loading ? "Pobieranie..." : "Pobierz faktury"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Pobieranie faktur z Fakturowni...
          </CardContent>
        </Card>
      )}

      {!loading && invoices.length > 0 && (
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Nr faktury</TableHead>
                    <TableHead className="w-[250px]">Kontrahent</TableHead>
                    <TableHead className="w-[110px]">NIP</TableHead>
                    <TableHead className="w-[100px]">Wystawiona</TableHead>
                    <TableHead className="w-[110px]">
                      Termin płatności
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Netto
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Brutto
                    </TableHead>
                    <TableHead className="w-[90px]">Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{inv.number}</span>
                          {inv.alreadyImported && (
                            <Badge
                              variant="secondary"
                              className="text-xs shrink-0"
                            >
                              Zaimportowano
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="truncate" title={inv.buyerName}>
                        {inv.buyerName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.buyerTaxNo || "—"}
                      </TableCell>
                      <TableCell>{inv.issueDate}</TableCell>
                      <TableCell>{inv.paymentTo}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {fmtAmount(inv.priceNet, inv.currency)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {fmtAmount(inv.priceGross, inv.currency)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? "bg-gray-100 text-gray-800"}`}
                        >
                          {statusLabels[inv.status] ?? inv.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7"
                          disabled={importingId === inv.id}
                          onClick={() => handleSelectInvoice(inv)}
                        >
                          {importingId === inv.id ? "..." : "Importuj"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && invoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Kliknij &quot;Pobierz faktury&quot; aby wczytać faktury z Fakturowni
          </CardContent>
        </Card>
      )}

      {dialogInvoice && dialogImported && (
        <ImportTransactionDialog
          key={dialogInvoice.id}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          importType={importType}
          invoiceData={dialogImported}
          invoice={dialogInvoice}
          categories={categories}
          merchants={merchants}
          customers={customers}
          products={products}
          projects={projects}
          onSuccess={handleImportSuccess}
        />
      )}
    </>
  );
}
