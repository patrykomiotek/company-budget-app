"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
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
import { useDepartment } from "@/shared/context/department-context";
import { createSubscriptionCommand } from "../services/commands/subscription-commands";
import type { Currency } from "../contracts/transaction.types";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DURATION_OPTIONS = [
  { value: 1, label: "1 miesiąc" },
  { value: 3, label: "3 miesiące" },
  { value: 6, label: "6 miesięcy" },
  { value: 12, label: "12 miesięcy" },
];

export function SubscriptionDialog({
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const router = useRouter();
  const { companies, activeDepartmentId } = useDepartment();
  const [loading, setLoading] = useState(false);
  const [toolName, setToolName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("PLN");
  const [exchangeRate, setExchangeRate] = useState("");
  const [startMonth, setStartMonth] = useState(format(new Date(), "yyyy-MM"));
  const [months, setMonths] = useState(1);
  const [departmentId, setCompanyId] = useState(activeDepartmentId ?? "");
  const [description, setDescription] = useState("");

  const needsCompanySelection = !activeDepartmentId;

  function reset() {
    setToolName("");
    setAmount("");
    setCurrency("PLN");
    setExchangeRate("");
    setStartMonth(format(new Date(), "yyyy-MM"));
    setMonths(1);
    setDescription("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Kwota musi być większa od 0");
      return;
    }

    if (currency !== "PLN" && !exchangeRate) {
      toast.error("Podaj kurs wymiany");
      return;
    }

    if (currency !== "PLN") {
      const parsedRate = parseFloat(exchangeRate);
      if (Number.isNaN(parsedRate) || parsedRate <= 0) {
        toast.error("Podaj prawidłowy kurs wymiany");
        return;
      }
    }

    if (needsCompanySelection && !departmentId) {
      toast.error("Wybierz oddział");
      return;
    }

    setLoading(true);
    try {
      const result = await createSubscriptionCommand({
        toolName: toolName.trim(),
        amount: parsedAmount,
        currency,
        exchangeRate: currency !== "PLN" ? parseFloat(exchangeRate) : undefined,
        startMonth,
        months,
        departmentPublicId: departmentId || undefined,
        description: description || undefined,
      });

      if (result.success && result.data) {
        toast.success(
          `Utworzono ${result.data.count} transakcji dla "${toolName}"`,
        );
        reset();
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Nie udało się utworzyć subskrypcji");
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj subskrypcję narzędzia</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sub-tool">Nazwa narzędzia</Label>
            <Input
              id="sub-tool"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="np. Slack, Google Workspace, Figma"
              autoFocus
              required
            />
          </div>

          {needsCompanySelection && (
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Waluta</Label>
              <Select
                value={currency}
                onValueChange={(v) => {
                  setCurrency((v ?? "PLN") as Currency);
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
            <div className="space-y-2">
              <Label htmlFor="sub-amount">Kwota / miesiąc</Label>
              <Input
                id="sub-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {currency !== "PLN" && (
            <div className="space-y-2">
              <Label htmlFor="sub-rate">Kurs do PLN</Label>
              <Input
                id="sub-rate"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-start">Miesiąc rozpoczęcia</Label>
              <Input
                id="sub-start"
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Okres</Label>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                      months === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-input"
                    }`}
                    onClick={() => setMonths(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-desc">Opis (opcjonalnie)</Label>
            <Input
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="np. Plan Business"
            />
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Zostanie utworzonych <strong>{months}</strong> transakcji (
            {amount ? `${amount} ${currency}` : "..."} / mies.) w kategorii{" "}
            <strong>Narzędzia i subskrypcje</strong> →{" "}
            <strong>{toolName || "..."}</strong>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={loading || !toolName.trim()}>
              {loading ? "Tworzenie..." : `Utwórz ${months} transakcji`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
