export interface TransactionWithDetails {
  id: string;
  amount: number;
  date: Date;
  description: string | null;
  merchantId: string | null;
  merchantName: string | null;
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  categoryType: string;
  createdAt: Date;
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  subcategoryId?: string;
  type?: 'INCOME' | 'EXPENSE';
}

export interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  total: number;
  subcategories: {
    subcategoryId: string;
    subcategoryName: string;
    total: number;
  }[];
}

export interface MonthSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categorySummaries: CategorySummary[];
}
