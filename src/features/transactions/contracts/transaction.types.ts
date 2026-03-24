export type TransactionType = 'INCOME' | 'EXPENSE' | 'FORECAST_INCOME' | 'FORECAST_EXPENSE';
export type Currency = 'PLN' | 'EUR' | 'USD';

export interface TransactionLineItemDetail {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  netAmount: number;
  grossAmount: number;
}

export interface TransactionWithDetails {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  exchangeRate: number | null;
  amountPln: number;
  date: Date;
  description: string | null;
  merchantId: string | null;
  merchantName: string | null;
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  categoryType: string;
  companyId: string | null;
  companyName: string | null;
  employeeId: string | null;
  employeeName: string | null;
  customerId: string | null;
  customerName: string | null;
  invoiceNumber: string | null;
  invoiceDueDate: Date | null;
  lineItems: TransactionLineItemDetail[];
  createdAt: Date;
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  subcategoryId?: string;
  type?: 'INCOME' | 'EXPENSE';
  transactionType?: TransactionType;
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
  forecastIncome: number;
  forecastExpense: number;
  balance: number;
  categorySummaries: CategorySummary[];
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: 'Przychód',
  EXPENSE: 'Wydatek',
  FORECAST_INCOME: 'Prognoza przychodu',
  FORECAST_EXPENSE: 'Prognoza wydatku',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  PLN: 'PLN',
  EUR: 'EUR',
  USD: 'USD',
};
