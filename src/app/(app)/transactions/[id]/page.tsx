import { notFound } from "next/navigation";
import { getTransactionByIdQuery } from "@/features/transactions/services/queries/transaction-queries";
import { TransactionDetails } from "@/features/transactions/components/transaction-details";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface TransactionPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionPage({
  params,
}: TransactionPageProps) {
  const { id } = await params;
  const transaction = await getTransactionByIdQuery(id);

  if (!transaction) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Transakcje", href: "/transactions" },
          { label: transaction.description || transaction.subcategoryName },
        ]}
      />
      <TransactionDetails transaction={transaction} />
    </div>
  );
}
