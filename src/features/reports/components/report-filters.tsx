"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useDepartment } from "@/shared/context/department-context";
import type {
  ReportType,
  Grouping,
  AmountMode,
  ReportFilters as ReportFiltersType,
} from "../contracts/report.types";

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onChange: (filters: ReportFiltersType) => void;
}

const reportTypeLabels: Record<ReportType, string> = {
  income_expenses: "Przychody i wydatki",
  expenses: "Wydatki",
  income: "Przychody",
};

const groupingLabels: Record<Grouping, string> = {
  year: "Rok",
  quarter: "Kwartał",
  month: "Miesiąc",
  week: "Tydzień",
  day: "Dzień",
};

const amountModeLabels: Record<AmountMode, string> = {
  netto: "Netto",
  brutto: "Brutto",
  vat: "VAT",
};

export function ReportFilters({ filters, onChange }: ReportFiltersProps) {
  const { companies } = useDepartment();

  function update(partial: Partial<ReportFiltersType>) {
    onChange({ ...filters, ...partial });
  }

  const companyLabel = filters.departmentId
    ? (companies.find((c) => c.id === filters.departmentId)?.name ??
      "Wszystkie")
    : "Wszystkie";

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="grid grid-rows-[16px_32px] gap-1 content-end">
        <Label className="text-xs">Rodzaj raportu</Label>
        <Select
          value={filters.reportType}
          onValueChange={(v) => update({ reportType: v as ReportType })}
        >
          <SelectTrigger className="w-[200px]">
            <span>{reportTypeLabels[filters.reportType]}</span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(reportTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-rows-[16px_32px] gap-1 content-end">
        <Label className="text-xs">Data od</Label>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          className="w-[160px]"
        />
      </div>

      <div className="grid grid-rows-[16px_32px] gap-1 content-end">
        <Label className="text-xs">Data do</Label>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          className="w-[160px]"
        />
      </div>

      <div className="grid grid-rows-[16px_32px] gap-1 content-end">
        <Label className="text-xs">Grupowanie</Label>
        <Select
          value={filters.grouping}
          onValueChange={(v) => update({ grouping: v as Grouping })}
        >
          <SelectTrigger className="w-[140px]">
            <span>{groupingLabels[filters.grouping]}</span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupingLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-rows-[16px_32px] gap-1 content-end">
        <Label className="text-xs">Dział / oddział firmy</Label>
        <Select
          value={filters.departmentId ?? "all"}
          onValueChange={(v) =>
            update({ departmentId: !v || v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[180px]">
            <span>{companyLabel}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-rows-[16px_32px] gap-1 content-end">
        <Label className="text-xs">Kwoty</Label>
        <Select
          value={filters.amountMode}
          onValueChange={(v) => update({ amountMode: v as AmountMode })}
        >
          <SelectTrigger className="w-[120px]">
            <span>{amountModeLabels[filters.amountMode]}</span>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(amountModeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
