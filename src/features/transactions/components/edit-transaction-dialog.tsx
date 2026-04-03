"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { EmployeeCombobox } from "@/features/employees/components/employee-combobox";
import { ProjectCombobox } from "@/features/projects/components/project-combobox";
import { InvoiceFields } from "@/features/invoices/components/invoice-fields";
import { LineItemsForm } from "@/features/invoices/components/line-items-form";
import { updateTransactionCommand } from "../services/commands/transaction-commands";
import { useDepartment } from "@/shared/context/department-context";
import type {
  TransactionWithDetails,
  TransactionType,
  Currency,
} from "../contracts/transaction.types";
import { TRANSACTION_TYPE_LABELS } from "../contracts/transaction.types";
import type { CategoryWithSubcategories } from "@/features/categories/contracts/category.types";
import type { LineItemRow } from "@/features/invoices/contracts/invoice.types";
import { calculateLineItem } from "@/features/invoices/contracts/invoice.types";

interface EditTransactionDialogProps {
  transaction: TransactionWithDetails | null;
  categories: CategoryWithSubcategories[];
  merchants: { id: string; name: string }[];
  customers: { id: string; name: string; nip?: string | null }[];
  employees: { id: string; name: string }[];
  products: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isExpenseType = (type: TransactionType) =>
  type === "EXPENSE" || type === "FORECAST_EXPENSE";
const isIncomeType = (type: TransactionType) =>
  type === "INCOME" || type === "FORECAST_INCOME";
const isForecastType = (type: TransactionType) =>
  type === "FORECAST_INCOME" || type === "FORECAST_EXPENSE";
const getCategoryFilterType = (type: TransactionType) =>
  type === "INCOME" || type === "FORECAST_INCOME" ? "INCOME" : "EXPENSE";

export function EditTransactionDialog({
  transaction,
  categories,
  merchants,
  customers,
  employees,
  products,
  projects,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const router = useRouter();
  const { companies, activeDepartmentId } = useDepartment();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("PLN");
  const [exchangeRate, setExchangeRate] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [departmentId, setCompanyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItemRow[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showLineItems, setShowLineItems] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCategoryId(transaction.categoryId);
      setSubcategoryId(transaction.subcategoryId);
      setAmount(transaction.amount.toString());
      setCurrency(transaction.currency);
      setExchangeRate(transaction.exchangeRate?.toString() ?? "");
      setDate(new Date(transaction.date).toISOString().split("T")[0]);
      setDescription(transaction.description || "");
      setMerchantName(transaction.merchantName || "");
      setCustomerName(transaction.customerName || "");
      setEmployeeName(transaction.employeeName || "");
      setProjectName(transaction.projectName || "");
      setCompanyId(transaction.departmentId || activeDepartmentId || "");
      setInvoiceNumber(transaction.invoiceNumber || "");
      setInvoiceDueDate(
        transaction.invoiceDueDate
          ? new Date(transaction.invoiceDueDate).toISOString().split("T")[0]
          : "",
      );
      setIsPaid(transaction.isPaid);
      setInvoiceSent(transaction.invoiceSent);
      setLineItems(
        transaction.lineItems.map((li) => ({
          key: li.id,
          name: li.name,
          quantity: li.quantity,
          unit: li.unit || undefined,
          unitPrice: li.unitPrice,
          vatRate: li.vatRate,
          projectName: li.projectName || undefined,
          ...calculateLineItem({ ...li, unit: li.unit || undefined }),
        })),
      );
      setShowInvoice(
        !!transaction.invoiceNumber || !!transaction.invoiceDueDate,
      );
      setShowLineItems(transaction.lineItems.length > 0);
    }
  }, [transaction, activeDepartmentId]);

  const filterType = getCategoryFilterType(type);
  const filteredCategories = categories.filter((c) => c.type === filterType);
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
  const needsCompanySelection = !activeDepartmentId;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction) {
      return;
    }

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
      const result = await updateTransactionCommand({
        id: transaction.id,
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
        departmentPublicId: departmentId || undefined,
        employeeName:
          isExpenseType(type) && employeeName ? employeeName : undefined,
        projectName: projectName || undefined,
        isPaid: !isForecastType(type) ? isPaid : undefined,
        invoiceSent:
          !isForecastType(type) && isExpenseType(type)
            ? invoiceSent
            : undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDueDate: invoiceDueDate || undefined,
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
        toast.success("Transakcja zaktualizowana");
        onOpenChange(false);
        router.refresh();
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
          <DialogTitle>Edytuj transakcję</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select
                value={type}
                onValueChange={(v) => {
                  if (!v) {
                    return;
                  }
                  setType(v as TransactionType);
                  setCategoryId("");
                  setSubcategoryId("");
                  if (!isExpenseType(v as TransactionType)) {
                    setEmployeeName("");
                  }
                }}
              >
                <SelectTrigger>
                  <span>{TRANSACTION_TYPE_LABELS[type]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Wydatek</SelectItem>
                  <SelectItem value="INCOME">Przychód</SelectItem>
                  <SelectItem value="FORECAST_EXPENSE">
                    Prognoza wydatku
                  </SelectItem>
                  <SelectItem value="FORECAST_INCOME">
                    Prognoza przychodu
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
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
          </div>

          <div className="space-y-2">
            <Label>Kategoria</Label>
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
              <Label>Podkategoria</Label>
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
              <Label htmlFor="edit-amount">Kwota</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="edit-exchangeRate">Kurs do PLN</Label>
                <Input
                  id="edit-exchangeRate"
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

          {!isForecastType(type) && (
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Opłacone</span>
              </label>
              {isExpenseType(type) && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={invoiceSent}
                    onChange={(e) => setInvoiceSent(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="text-sm">Faktura wysłana</span>
                </label>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-description">Opis (opcjonalnie)</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Szkolenie storytelling"
            />
          </div>

          <div className="border rounded-md">
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-muted/50"
              onClick={() => setShowInvoice(!showInvoice)}
            >
              <span>Faktura</span>
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

          <div className="border rounded-md">
            <button
              type="button"
              className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-muted/50"
              onClick={() => setShowLineItems(!showLineItems)}
            >
              <span>Pozycje faktury</span>
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

          <DialogFooter>
            <Button type="submit" disabled={loading || !subcategoryId}>
              {loading ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
