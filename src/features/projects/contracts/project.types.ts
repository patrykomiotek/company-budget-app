export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface ProjectOption {
  id: string;
  name: string;
  status: ProjectStatus;
}

export interface ProjectItem {
  id: string;
  name: string;
  status: ProjectStatus;
  customerName: string | null;
  transactionCount: number;
  totalIncome: number;
  totalCosts: number;
  profit: number;
}

export interface ProjectDetail {
  id: string;
  name: string;
  status: ProjectStatus;
  customerId: string | null;
  customerName: string | null;
  createdAt: string;
}

export type IntervalFilter =
  | "current_month"
  | "previous_month"
  | "current_quarter"
  | "previous_quarter"
  | "current_year"
  | "previous_year";

export const INTERVAL_LABELS: Record<IntervalFilter, string> = {
  current_month: "Bieżący miesiąc",
  previous_month: "Poprzedni miesiąc",
  current_quarter: "Bieżący kwartał",
  previous_quarter: "Poprzedni kwartał",
  current_year: "Bieżący rok",
  previous_year: "Poprzedni rok",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: "Aktywny",
  COMPLETED: "Zakończony",
  ARCHIVED: "Zarchiwizowany",
};

export interface ProjectTransaction {
  id: string;
  date: string;
  description: string | null;
  type: string;
  amount: number;
  currency: string;
  customerName: string | null;
  merchantName: string | null;
  categoryName: string;
}

export interface ProjectStats {
  totalIncome: number;
  totalCosts: number;
  profit: number;
  margin: number;
  transactionCount: number;
  averageTransactionValue: number;
  customerLtv: number | null;
  customerAcquisitionCost: number | null;
}
