import { getCategoriesQuery } from "@/features/categories/services/queries/category-queries";
import { getMerchantsForSelectQuery } from "@/features/merchants/services/queries/merchant-queries";
import { getCustomersForSelectQuery } from "@/features/customers/services/queries/customer-queries";
import { getProductsQuery } from "@/features/products/services/queries/product-queries";
import { getProjectsForSelectQuery } from "@/features/projects/services/queries/project-queries";
import { ImportView } from "@/features/fakturownia/components/import-view";

export default async function ImportPage() {
  const [categories, merchants, customers, products, projects] =
    await Promise.all([
      getCategoriesQuery(),
      getMerchantsForSelectQuery(),
      getCustomersForSelectQuery(),
      getProductsQuery(),
      getProjectsForSelectQuery(),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Import z Fakturowni</h1>
      <ImportView
        categories={categories}
        merchants={merchants}
        customers={customers}
        products={products}
        projects={projects}
      />
    </div>
  );
}
