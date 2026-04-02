export interface CustomerOption {
  id: string;
  name: string;
  displayName: string | null;
  nip: string | null;
}

export interface CustomerItem {
  id: string;
  name: string;
  displayName: string | null;
  nip: string | null;
  city: string | null;
  email: string | null;
  transactionCount: number;
  totalRevenue: number;
  lastTransactionDate: string | null;
}

export interface CustomerProject {
  id: string;
  name: string;
  status: string;
  totalIncome: number;
  totalCosts: number;
  profit: number;
}

export interface CustomerProduct {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface CustomerMetrics {
  ltv: number;
  totalCosts: number;
  averageTransactionValue: number;
  transactionCount: number;
  products: CustomerProduct[];
  projects: CustomerProject[];
}
