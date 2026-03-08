import { getCategoriesQuery } from '@/features/categories/services/queries/category-queries';
import { TransactionForm } from '@/features/transactions/components/transaction-form';

export default async function NewTransactionPage() {
  const categories = await getCategoriesQuery();

  return (
    <div className="max-w-xl">
      <TransactionForm categories={categories} />
    </div>
  );
}
