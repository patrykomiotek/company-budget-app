import { getCategoriesQuery } from '@/features/categories/services/queries/category-queries';
import { getMerchantsForSelectQuery } from '@/features/merchants/services/queries/merchant-queries';
import { TransactionForm } from '@/features/transactions/components/transaction-form';

export default async function NewTransactionPage() {
  const [categories, merchants] = await Promise.all([
    getCategoriesQuery(),
    getMerchantsForSelectQuery(),
  ]);

  return (
    <div className="max-w-xl">
      <TransactionForm categories={categories} merchants={merchants} />
    </div>
  );
}
