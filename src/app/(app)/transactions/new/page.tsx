import { getCategoriesQuery } from '@/features/categories/services/queries/category-queries';
import { getMerchantsForSelectQuery } from '@/features/merchants/services/queries/merchant-queries';
import { getCustomersForSelectQuery } from '@/features/customers/services/queries/customer-queries';
import { getEmployeesQuery } from '@/features/employees/services/queries/employee-queries';
import { getProductsQuery } from '@/features/products/services/queries/product-queries';
import { TransactionForm } from '@/features/transactions/components/transaction-form';

export default async function NewTransactionPage() {
  const [categories, merchants, customers, employees, products] = await Promise.all([
    getCategoriesQuery(),
    getMerchantsForSelectQuery(),
    getCustomersForSelectQuery(),
    getEmployeesQuery(),
    getProductsQuery(),
  ]);

  return (
    <div className="max-w-4xl">
      <TransactionForm
        categories={categories}
        merchants={merchants}
        customers={customers}
        employees={employees}
        products={products}
      />
    </div>
  );
}
