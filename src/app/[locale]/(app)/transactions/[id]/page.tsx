import { notFound } from "next/navigation";
import { getTransactionByIdQuery } from "@/features/transactions/services/queries/transaction-queries";
import { getCategoriesQuery } from "@/features/categories/services/queries/category-queries";
import { getMerchantsForSelectQuery } from "@/features/merchants/services/queries/merchant-queries";
import { getCustomersForSelectQuery } from "@/features/customers/services/queries/customer-queries";
import { getEmployeesQuery } from "@/features/employees/services/queries/employee-queries";
import { getProductsQuery } from "@/features/products/services/queries/product-queries";
import { getProjectsForSelectQuery } from "@/features/projects/services/queries/project-queries";
import { TransactionDetails } from "@/features/transactions/components/transaction-details";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface TransactionPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransactionPage({
  params,
}: TransactionPageProps) {
  const { id } = await params;
  const [
    transaction,
    categories,
    merchants,
    customers,
    employees,
    products,
    projects,
  ] = await Promise.all([
    getTransactionByIdQuery(id),
    getCategoriesQuery(),
    getMerchantsForSelectQuery(),
    getCustomersForSelectQuery(),
    getEmployeesQuery(),
    getProductsQuery(),
    getProjectsForSelectQuery(),
  ]);

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
      <TransactionDetails
        transaction={transaction}
        categories={categories}
        merchants={merchants}
        customers={customers}
        employees={employees}
        products={products}
        projects={projects}
      />
    </div>
  );
}
