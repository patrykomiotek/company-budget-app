export type ReportType = "income_expenses" | "expenses" | "income";
export type Grouping = "year" | "quarter" | "month" | "week" | "day";
export type AmountMode = "netto" | "brutto" | "vat";

export interface ReportFilters {
  reportType: ReportType;
  dateFrom: string;
  dateTo: string;
  grouping: Grouping;
  departmentId?: string;
  amountMode: AmountMode;
}

export interface ReportRow {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ReportData {
  rows: ReportRow[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
}
