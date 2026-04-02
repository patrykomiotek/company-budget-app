"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronDown, Download, PlusCircle, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/searchable-select";
import { MerchantCombobox } from "@/components/merchant-combobox";
import { EmployeeCombobox } from "@/features/employees/components/employee-combobox";
import { CustomerCombobox } from "@/features/customers/components/customer-combobox";
import { ProjectCombobox } from "@/features/projects/components/project-combobox";
import { InvoiceFields } from "@/features/invoices/components/invoice-fields";
import { LineItemsForm } from "@/features/invoices/components/line-items-form";
import { QuickCreateCategoryDialog } from "@/features/categories/components/quick-create-category-dialog";
import { SubscriptionDialog } from "./subscription-dialog";
import { InvoicePickerDialog } from "@/features/fakturownia/components/invoice-picker-dialog";
import { createTransactionCommand } from "../services/commands/transaction-commands";
import { useCompany } from "@/shared/context/company-context";
import type { CategoryWithSubcategories } from "@/features/categories/contracts/category.types";
import type { TransactionType, Currency } from "../contracts/transaction.types";
import type { LineItemRow } from "@/features/invoices/contracts/invoice.types";
import type { ImportedInvoiceData } from "@/features/fakturownia/contracts/fakturownia.types";

interface TransactionFormProps {
  categories: CategoryWithSubcategories[];
  merchants: { id: string; name: string }[];
  customers: { id: string; name: string; nip?: string | null }[];
  employees: { id: string; name: string }[];
  products: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}

const isIncomeType = (type: TransactionType) =>
  type === "INCOME" || type === "FORECAST_INCOME";

const isExpenseType = (type: TransactionType) =>
  type === "EXPENSE" || type === "FORECAST_EXPENSE";
const getCategoryFilterType = (type: TransactionType) =>
  type === "INCOME" || type === "FORECAST_INCOME" ? "INCOME" : "EXPENSE";

export function TransactionForm({
  categories: initialCategories,
  merchants,
  customers,
  employees,
  products,
  projects,
}: TransactionFormProps) {
  const router = useRouter();
  const { companies, activeCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("PLN");
  const [exchangeRate, setExchangeRate] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [companyId, setCompanyId] = useState(activeCompanyId ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showLineItems, setShowLineItems] = useState(false);
  const [localCategories, setLocalCategories] = useState(initialCategories);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showFakturowniaDialog, setShowFakturowniaDialog] = useState(false);
  const [fakturowniaInvoiceId, setFakturowniaInvoiceId] = useState<
    number | undefined
  >(undefined);

  const filterType = getCategoryFilterType(type);
  const filteredCategories = localCategories.filter(
    (c) => c.type === filterType,
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

  const needsCompanySelection = !activeCompanyId;

  function handleFakturowniaImport(data: ImportedInvoiceData) {
    setType("INCOME");
    setAmount(String(data.amount));
    setCurrency(data.currency);
    if (data.exchangeRate) {
      setExchangeRate(String(data.exchangeRate));
    }
    setDate(data.date);
    setDescription(data.description);
    setCustomerName(data.customerName);
    setInvoiceNumber(data.invoiceNumber);
    setInvoiceDueDate(data.invoiceDueDate);
    setShowInvoice(true);
    setFakturowniaInvoiceId(data.fakturowniaInvoiceId);

    if (data.companyPublicId) {
      setCompanyId(data.companyPublicId);
    }

    if (data.lineItems.length > 0) {
      setLineItems(
        data.lineItems.map((li) => {
          const netAmount = Math.round(li.quantity * li.unitPrice * 100) / 100;
          const grossAmount =
            Math.round(netAmount * (1 + li.vatRate / 100) * 100) / 100;
          return {
            ...li,
            key: crypto.randomUUID(),
            netAmount,
            grossAmount,
          };
        }),
      );
      setShowLineItems(true);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Kwota musi być większa od 0");
      return;
    }

    if (currency !== "PLN" && !exchangeRate) {
      toast.error("Podaj kurs wymiany dla waluty obcej");
      return;
    }

    setLoading(true);

    try {
      const result = await createTransactionCommand({
        type,
        amount: parsedAmount,
        currency,
        exchangeRate: currency !== "PLN" ? parseFloat(exchangeRate) : undefined,
        date,
        subcategoryId,
        description: description || undefined,
        merchantName:
          isExpenseType(type) && merchantName ? merchantName : undefined,
        customerName:
          isIncomeType(type) && customerName ? customerName : undefined,
        companyPublicId: companyId || undefined,
        employeeName:
          isExpenseType(type) && employeeName ? employeeName : undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDueDate: invoiceDueDate || undefined,
        fakturowniaInvoiceId: fakturowniaInvoiceId || undefined,
        projectName: projectName || undefined,
        lineItems:
          lineItems.length > 0
            ? lineItems
                .filter((li) => li.name && li.quantity > 0 && li.unitPrice > 0)
                .map((li) => ({
                  name: li.name,
                  quantity: li.quantity,
                  unitPrice: li.unitPrice,
                  vatRate: li.vatRate,
                  projectName: li.projectName || undefined,
                }))
            : undefined,
      });

      if (result.success) {
        toast.success("Transakcja dodana");
        setCategoryId("");
        setSubcategoryId("");
        setAmount("");
        setExchangeRate("");
        setDescription("");
        setMerchantName("");
        setCustomerName("");
        setEmployeeName("");
        setProjectName("");
        setInvoiceNumber("");
        setInvoiceDueDate("");
        setLineItems([]);
        setShowInvoice(false);
        setShowLineItems(false);
        setFakturowniaInvoiceId(undefined);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Dodaj transakcję</CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFakturowniaDialog(true)}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Importuj z Fakturowni
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSubscriptionDialog(true)}
          >
            <Repeat className="h-3.5 w-3.5 mr-1.5" />
            Dodaj subskrypcję
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Typ</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "EXPENSE", label: "Wydatek" },
                  { value: "INCOME", label: "Przychód" },
                  { value: "FORECAST_EXPENSE", label: "Prognoza wydatku" },
                  { value: "FORECAST_INCOME", label: "Prognoza przychodu" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                    type === option.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  }`}
                  onClick={() => {
                    setType(option.value);
                    setCategoryId("");
                    setSubcategoryId("");
                    if (!isExpenseType(option.value)) {
                      setEmployeeName("");
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              Data <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {needsCompanySelection && (
            <div className="space-y-2">
              <Label>Oddział</Label>
              <Select
                value={companyId}
                onValueChange={(v) => setCompanyId(v ?? "")}
              >
                <SelectTrigger>
                  <span>
                    {companies.find((c) => c.id === companyId)?.name ??
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
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Kategoria <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto py-0 px-1 text-xs text-muted-foreground"
                onClick={() => setShowCategoryDialog(true)}
              >
                <PlusCircle className="h-3 w-3 mr-1" />
                Dodaj kategorię
              </Button>
            </div>
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
              <Label>
                Podkategoria <span className="text-destructive">*</span>
              </Label>
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
            <div className="space-y-2 col-span-1">
              <Label htmlFor="amount">
                Kwota netto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label>Waluta</Label>
              <Select
                value={currency}
                onValueChange={(v) => {
                  setCurrency(v as Currency);
                  if (v === "PLN") {
                    setExchangeRate("");
                  }
                }}
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
              <div className="space-y-2 col-span-1">
                <Label htmlFor="exchangeRate">Kurs do PLN</Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="np. 4.28"
                  required
                />
              </div>
            )}
          </div>

          {isExpenseType(type) ? (
            <div className="space-y-2">
              <Label>Dostawca (opcjonalnie)</Label>
              <MerchantCombobox
                value={merchantName}
                onChange={setMerchantName}
                merchants={merchants}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Klient (opcjonalnie)</Label>
              <CustomerCombobox
                value={customerName}
                onChange={setCustomerName}
                customers={customers}
              />
            </div>
          )}

          {isExpenseType(type) && (
            <div className="space-y-2">
              <Label>Osoba przypisana (opcjonalnie)</Label>
              <EmployeeCombobox
                value={employeeName}
                onChange={setEmployeeName}
                employees={employees}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Projekt (opcjonalnie)</Label>
            <ProjectCombobox
              value={projectName}
              onChange={setProjectName}
              projects={projects}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis (opcjonalnie)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Szkolenie storytelling"
            />
          </div>

          {/* Collapsible invoice section */}
          <div className="border rounded-md">
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-muted/50"
              onClick={() => setShowInvoice(!showInvoice)}
            >
              <span>Faktura (opcjonalnie)</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showInvoice ? "rotate-180" : ""}`}
              />
            </button>
            {showInvoice && (
              <div className="px-4 pb-4">
                <InvoiceFields
                  invoiceNumber={invoiceNumber}
                  invoiceDueDate={invoiceDueDate}
                  onInvoiceNumberChange={setInvoiceNumber}
                  onInvoiceDueDateChange={setInvoiceDueDate}
                />
              </div>
            )}
          </div>

          {/* Collapsible line items section */}
          <div className="border rounded-md">
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-muted/50"
              onClick={() => setShowLineItems(!showLineItems)}
            >
              <span>Pozycje faktury (opcjonalnie)</span>
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

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !subcategoryId}>
              {loading ? "Dodawanie..." : "Dodaj"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>

      <QuickCreateCategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        type={filterType}
        onCreated={(newCategory) => {
          setLocalCategories((prev) => [...prev, newCategory]);
          setCategoryId(newCategory.id);
          setSubcategoryId("");
        }}
      />

      <SubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
      />

      <InvoicePickerDialog
        open={showFakturowniaDialog}
        onOpenChange={setShowFakturowniaDialog}
        onImport={handleFakturowniaImport}
      />
    </Card>
  );
}
