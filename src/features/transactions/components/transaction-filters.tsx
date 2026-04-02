"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { CategoryWithSubcategories } from "@/features/categories/contracts/category.types";

interface TransactionFiltersProps {
  categories: CategoryWithSubcategories[];
}

function getIntervalDates(interval: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let start: Date;
  let end: Date;

  switch (interval) {
    case "current_month":
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0);
      break;
    case "previous_month":
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0);
      break;
    case "current_quarter": {
      const qStart = Math.floor(month / 3) * 3;
      start = new Date(year, qStart, 1);
      end = new Date(year, qStart + 3, 0);
      break;
    }
    case "previous_quarter": {
      const qStart = Math.floor(month / 3) * 3 - 3;
      const qYear = qStart < 0 ? year - 1 : year;
      const qMonth = ((qStart % 12) + 12) % 12;
      start = new Date(qYear, qMonth, 1);
      end = new Date(qYear, qMonth + 3, 0);
      break;
    }
    case "current_year":
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31);
      break;
    case "previous_year":
      start = new Date(year - 1, 0, 1);
      end = new Date(year - 1, 11, 31);
      break;
    default:
      return null;
  }

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

const INTERVAL_OPTIONS = [
  "current_month",
  "previous_month",
  "current_quarter",
  "previous_quarter",
  "current_year",
  "previous_year",
] as const;

const intervalLabels: Record<string, string> = {
  custom: "Własny zakres",
  current_month: "Bieżący miesiąc",
  previous_month: "Poprzedni miesiąc",
  current_quarter: "Bieżący kwartał",
  previous_quarter: "Poprzedni kwartał",
  current_year: "Bieżący rok",
  previous_year: "Poprzedni rok",
};

function detectInterval(dateFrom: string, dateTo: string): string {
  if (!dateFrom || !dateTo) {
    return "custom";
  }
  for (const interval of INTERVAL_OPTIONS) {
    const dates = getIntervalDates(interval);
    if (dates && dates.start === dateFrom && dates.end === dateTo) {
      return interval;
    }
  }
  return "custom";
}

export function TransactionFilters({ categories }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  const transactionType = searchParams.get("transactionType") ?? "";
  const type = searchParams.get("type") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const isPaid = searchParams.get("isPaid") ?? "";
  const invoiceSent = searchParams.get("invoiceSent") ?? "";

  // Default to current month on first load if no date filters set
  useEffect(() => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    if (!dateFrom && !dateTo) {
      const dates = getIntervalDates("current_month");
      if (dates) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("dateFrom", dates.start);
        params.set("dateTo", dates.end);
        router.replace(`/transactions?${params.toString()}`);
      }
    }
  }, [dateFrom, dateTo, searchParams, router]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key === "categoryId") {
      params.delete("subcategoryId");
    }
    if (key === "type" || key === "transactionType") {
      params.delete("categoryId");
      params.delete("subcategoryId");
    }
    router.push(`/transactions?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/transactions");
  }

  function applyInterval(interval: string) {
    if (!interval || interval === "custom") {
      return;
    }
    const dates = getIntervalDates(interval);
    if (!dates) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("dateFrom", dates.start);
    params.set("dateTo", dates.end);
    router.push(`/transactions?${params.toString()}`);
  }

  const activeType = transactionType || type || "";
  const activeInterval = detectInterval(dateFrom, dateTo);

  const typeLabels: Record<string, string> = {
    all: "Wszystko",
    EXPENSE: "Wydatki",
    INCOME: "Przychody",
    FORECAST_EXPENSE: "Prognozy wydatków",
    FORECAST_INCOME: "Prognozy przychodów",
  };
  const typeLabel = typeLabels[activeType || "all"] ?? typeLabels["all"];

  const filteredCategories = activeType
    ? categories.filter((c) => {
        if (activeType === "INCOME" || activeType === "FORECAST_INCOME") {
          return c.type === "INCOME";
        }
        if (activeType === "EXPENSE" || activeType === "FORECAST_EXPENSE") {
          return c.type === "EXPENSE";
        }
        return true;
      })
    : categories;

  const categoryLabel =
    filteredCategories.find((c) => c.id === categoryId)?.name ?? "Wszystkie";

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="space-y-1">
        <Label className="text-xs">Typ</Label>
        <Select
          value={activeType || "all"}
          onValueChange={(v) => {
            const val = v ?? "";
            const params = new URLSearchParams(searchParams.toString());
            params.delete("type");
            params.delete("transactionType");
            params.delete("categoryId");
            params.delete("subcategoryId");
            if (val && val !== "all") {
              if (["INCOME", "EXPENSE"].includes(val)) {
                params.set("type", val);
              } else {
                params.set("transactionType", val);
              }
            }
            router.push(`/transactions?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <span>{typeLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystko</SelectItem>
            <SelectItem value="EXPENSE">Wydatki</SelectItem>
            <SelectItem value="INCOME">Przychody</SelectItem>
            <SelectItem value="FORECAST_EXPENSE">Prognozy wydatków</SelectItem>
            <SelectItem value="FORECAST_INCOME">Prognozy przychodów</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Kategoria</Label>
        <Select
          value={categoryId || "all"}
          onValueChange={(v) => updateFilter("categoryId", v ?? "")}
        >
          <SelectTrigger className="w-[200px]">
            <span>{categoryLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Okres</Label>
        <Select
          value={activeInterval}
          onValueChange={(v) => applyInterval(v ?? "")}
        >
          <SelectTrigger className="w-[180px]">
            <span>{intervalLabels[activeInterval]}</span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(intervalLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Od</Label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => updateFilter("dateFrom", e.target.value)}
          className="w-[160px] h-8"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Do</Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => updateFilter("dateTo", e.target.value)}
          className="w-[160px] h-8"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Opłacone</Label>
        <Select
          value={isPaid || "all"}
          onValueChange={(v) => updateFilter("isPaid", v ?? "")}
        >
          <SelectTrigger className="w-[140px]">
            <span>
              {isPaid === "true"
                ? "Tak"
                : isPaid === "false"
                  ? "Nie"
                  : "Wszystkie"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="true">Tak</SelectItem>
            <SelectItem value="false">Nie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Faktura wysłana</Label>
        <Select
          value={invoiceSent || "all"}
          onValueChange={(v) => updateFilter("invoiceSent", v ?? "")}
        >
          <SelectTrigger className="w-[160px]">
            <span>
              {invoiceSent === "true"
                ? "Tak"
                : invoiceSent === "false"
                  ? "Nie"
                  : "Wszystkie"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            <SelectItem value="true">Tak</SelectItem>
            <SelectItem value="false">Nie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" size="sm" className="h-8" onClick={clearFilters}>
        Wyczyść filtry
      </Button>
    </div>
  );
}
