import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCategoriesQuery } from "@/features/categories/services/queries/category-queries";
import { getMerchantsForSelectQuery } from "@/features/merchants/services/queries/merchant-queries";
import { getCustomersForSelectQuery } from "@/features/customers/services/queries/customer-queries";
import { getEmployeesQuery } from "@/features/employees/services/queries/employee-queries";
import { getProductsQuery } from "@/features/products/services/queries/product-queries";
import { getProjectsForSelectQuery } from "@/features/projects/services/queries/project-queries";
import { TransactionForm } from "@/features/transactions/components/transaction-form";

export default async function NewTransactionPage() {
  const [categories, merchants, customers, employees, products, projects] =
    await Promise.all([
      getCategoriesQuery(),
      getMerchantsForSelectQuery(),
      getCustomersForSelectQuery(),
      getEmployeesQuery(),
      getProductsQuery(),
      getProjectsForSelectQuery(),
    ]);

  return (
    <div className="max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Transakcje", href: "/transactions" },
          { label: "Nowa transakcja" },
        ]}
      />
      <TransactionForm
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
