import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTransactionsQuery } from '@/features/transactions/services/queries/transaction-queries';
import { getCategoriesQuery } from '@/features/categories/services/queries/category-queries';
import { getMerchantsForSelectQuery } from '@/features/merchants/services/queries/merchant-queries';
import { getCustomersForSelectQuery } from '@/features/customers/services/queries/customer-queries';
import { getEmployeesQuery } from '@/features/employees/services/queries/employee-queries';
import { getProductsQuery } from '@/features/products/services/queries/product-queries';
import { TransactionsTable } from '@/features/transactions/components/transactions-table';
import { TransactionFilters } from '@/features/transactions/components/transaction-filters';
import type { TransactionType } from '@/features/transactions/contracts/transaction.types';

interface TransactionsPageProps {
  searchParams: Promise<{
    type?: string;
    transactionType?: string;
    categoryId?: string;
    subcategoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const parsedPage = params.page ? parseInt(params.page, 10) : 1;
  const page = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

  const [categories, merchants, customers, employees, products, result] = await Promise.all([
    getCategoriesQuery(),
    getMerchantsForSelectQuery(),
    getCustomersForSelectQuery(),
    getEmployeesQuery(),
    getProductsQuery(),
    getTransactionsQuery(
      {
        type: params.type as 'INCOME' | 'EXPENSE' | undefined,
        transactionType: params.transactionType as TransactionType | undefined,
        categoryId: params.categoryId,
        subcategoryId: params.subcategoryId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
      page
    ),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transakcje</h1>
        <Link href="/transactions/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Dodaj
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionFilters categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TransactionsTable
            transactions={result.items}
            categories={categories}
            merchants={merchants}
            customers={customers}
            employees={employees}
            products={products}
          />
        </CardContent>
      </Card>

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => {
            const filteredParams = Object.fromEntries(
              Object.entries(params).filter(([k, v]) => k !== 'page' && v)
            );
            const queryString = new URLSearchParams(filteredParams).toString();
            const href = queryString
              ? `/transactions?page=${i + 1}&${queryString}`
              : `/transactions?page=${i + 1}`;
            return (
              <Link
                key={i + 1}
                href={href}
              >
                <Button
                  variant={page === i + 1 ? 'default' : 'outline'}
                  size="sm"
                >
                  {i + 1}
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
