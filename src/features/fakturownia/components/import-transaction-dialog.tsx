"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { MerchantCombobox } from "@/components/merchant-combobox";
import { CustomerCombobox } from "@/features/customers/components/customer-combobox";
import { ProjectCombobox } from "@/features/projects/components/project-combobox";
import { LineItemsForm } from "@/features/invoices/components/line-items-form";
import { createTransactionCommand } from "@/features/transactions/services/commands/transaction-commands";
import { useDepartment } from "@/shared/context/department-context";
import type {
  ImportedInvoiceData,
  FakturowniaInvoiceListItem,
} from "../contracts/fakturownia.types";
import type { CategoryWithSubcategories } from "@/features/categories/contracts/category.types";
import type { Currency } from "@/features/transactions/contracts/transaction.types";
import type { LineItemRow } from "@/features/invoices/contracts/invoice.types";

interface ImportTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importType: "income" | "expense";
  invoiceData: ImportedInvoiceData;
  invoice: FakturowniaInvoiceListItem;
  categories: CategoryWithSubcategories[];
  merchants: { id: string; name: string }[];
  customers: { id: string; name: string; nip?: string | null }[];
  products: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  onSuccess: () => void;
}

export function ImportTransactionDialog({
  open,
  onOpenChange,
  importType,
  invoiceData,
  invoice,
  categories,
  merchants,
  customers,
  products,
  projects,
  onSuccess,
}: ImportTransactionDialogProps) {
  const { companies, activeDepartmentId } = useDepartment();
  const [loading, setLoading] = useState(false);

  const transactionType = importType === "income" ? "INCOME" : "EXPENSE";
  const categoryFilterType = importType === "income" ? "INCOME" : "EXPENSE";

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [amount, setAmount] = useState(String(invoiceData.amount));
  const [currency, setCurrency] = useState<Currency>(invoiceData.currency);
  const [exchangeRate, setExchangeRate] = useState(
    invoiceData.exchangeRate ? String(invoiceData.exchangeRate) : "",
  );
  const [date, setDate] = useState(invoiceData.date);
  const [description, setDescription] = useState(invoiceData.description);
  const [counterpartName, setCounterpartName] = useState(() => {
    if (importType === "income") {
      const matched = customers.find(
        (c) => invoice.buyerTaxNo && c.nip === invoice.buyerTaxNo,
      );
      return matched?.name ?? invoiceData.customerName ?? "";
    }
    const matched = merchants.find(
      (m) => invoice.buyerTaxNo && m.name === invoice.buyerName,
    );
    return matched?.name ?? invoice.buyerName ?? "";
  });
  const [projectName, setProjectName] = useState("");
  const [departmentId, setCompanyId] = useState(
    invoiceData.departmentPublicId ?? activeDepartmentId ?? "",
  );
  const [invoiceNumber, setInvoiceNumber] = useState(invoiceData.invoiceNumber);
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    invoiceData.invoiceDueDate,
  );
  const [lineItems, setLineItems] = useState<LineItemRow[]>(() =>
    invoiceData.lineItems.map((li) => {
      const netAmount = Math.round(li.quantity * li.unitPrice * 100) / 100;
      const grossAmount =
        Math.round(netAmount * (1 + li.vatRate / 100) * 100) / 100;
      return {
        key: crypto.randomUUID(),
        name: li.name,
        quantity: li.quantity,
        unit: li.unit,
        unitPrice: li.unitPrice,
        vatRate: li.vatRate,
        netAmount,
        grossAmount,
      };
    }),
  );
  const [showLineItems, setShowLineItems] = useState(
    invoiceData.lineItems.length > 0,
  );

  const filteredCategories = categories.filter(
    (c) => c.type === categoryFilterType,
  );
  const selectedCategory = filteredCategories.find((c) => c.id === categoryId);
  const categoryOptions = filteredCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const subcategoryOptions =
    selectedCategory?.subcategories.map((s) => ({
      value: s.id,
      label: s.name,
    })) ?? [];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Kwota musi być większa od 0");
      return;
    }

    if (!subcategoryId) {
      toast.error("Wybierz kategorię i podkategorię");
      return;
    }

    setLoading(true);

    try {
      const result = await createTransactionCommand({
        type: transactionType,
        amount: parsedAmount,
        currency,
        exchangeRate: currency !== "PLN" ? parseFloat(exchangeRate) : undefined,
        date,
        subcategoryId,
        description: description || undefined,
        merchantName:
          importType === "expense" && counterpartName
            ? counterpartName
            : undefined,
        customerName:
          importType === "income" && counterpartName
            ? counterpartName
            : undefined,
        departmentPublicId: departmentId || undefined,
        projectName: projectName || undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDueDate: invoiceDueDate || undefined,
        fakturowniaInvoiceId: invoiceData.fakturowniaInvoiceId,
        lineItems:
          lineItems.length > 0
            ? lineItems
                .filter((li) => li.name && li.quantity > 0 && li.unitPrice > 0)
                .map((li) => ({
                  name: li.name,
                  quantity: li.quantity,
                  unit: li.unit || undefined,
                  unitPrice: li.unitPrice,
                  vatRate: li.vatRate,
                  projectName: li.projectName || undefined,
                }))
            : undefined,
      });

      if (result.success) {
        toast.success("Transakcja zaimportowana");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Importuj jako {importType === "income" ? "przychód" : "wydatek"}:{" "}
            {invoice.number}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="rounded-md bg-muted/50 p-3 text-sm flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground">
                {invoice.buyerName}
              </span>
              {invoice.buyerTaxNo && (
                <span className="ml-2 text-xs text-muted-foreground">
                  NIP: {invoice.buyerTaxNo}
                </span>
              )}
            </div>
            <span className="shrink-0 text-muted-foreground whitespace-nowrap">
              {invoiceData.amount} {invoiceData.currency} netto
            </span>
            <span className="shrink-0 text-muted-foreground whitespace-nowrap">
              {invoice.issueDate}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data wystawienia</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Oddział</Label>
              <Select
                value={departmentId}
                onValueChange={(v) => setCompanyId(v ?? "")}
              >
                <SelectTrigger>
                  <span>
                    {companies.find((c) => c.id === departmentId)?.name ??
                      "Wybierz oddział"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nr faktury</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Termin płatności</Label>
              <Input
                type="date"
                value={invoiceDueDate}
                onChange={(e) => setInvoiceDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kategoria *</Label>
            <SearchableSelect
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v);
                setSubcategoryId("");
              }}
              options={categoryOptions}
              placeholder="Wybierz kategorię"
              searchPlaceholder="Szukaj kategorii..."
            />
          </div>

          {selectedCategory && (
            <div className="space-y-2">
              <Label>Podkategoria *</Label>
              <SearchableSelect
                value={subcategoryId}
                onChange={setSubcategoryId}
                options={subcategoryOptions}
                placeholder="Wybierz podkategorię"
                searchPlaceholder="Szukaj podkategorii..."
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kwota netto</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Waluta</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
              >
                <SelectTrigger>
                  <span>{currency}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLN">PLN</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currency !== "PLN" && (
              <div className="space-y-2">
                <Label>Kurs do PLN</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{importType === "income" ? "Klient" : "Dostawca"}</Label>
            {importType === "income" ? (
              <CustomerCombobox
                value={counterpartName}
                onChange={setCounterpartName}
                customers={customers}
              />
            ) : (
              <MerchantCombobox
                value={counterpartName}
                onChange={setCounterpartName}
                merchants={merchants}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Projekt (opcjonalnie)</Label>
            <ProjectCombobox
              value={projectName}
              onChange={setProjectName}
              projects={projects}
            />
          </div>

          <div className="space-y-2">
            <Label>Opis</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {invoiceData.lineItems.length > 0 && (
            <div className="border rounded-md">
              <button
                type="button"
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-muted/50"
                onClick={() => setShowLineItems(!showLineItems)}
              >
                <span>Pozycje faktury ({invoiceData.lineItems.length})</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showLineItems ? "rotate-180" : ""}`}
                />
              </button>
              {showLineItems && (
                <div className="px-4 pb-4">
                  <LineItemsForm
                    items={lineItems}
                    onChange={setLineItems}
                    products={products}
                    projects={projects}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading || !subcategoryId}>
              {loading ? "Importowanie..." : "Importuj transakcję"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
