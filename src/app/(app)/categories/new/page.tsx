import { getDepartmentsQuery } from "@/shared/lib/department/queries";
import { CategoryForm } from "@/features/categories/components/category-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default async function NewCategoryPage() {
  const departments = await getDepartmentsQuery();

  return (
    <div className="max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Kategorie", href: "/categories" },
          { label: "Nowa kategoria" },
        ]}
      />
      <CategoryForm departments={departments} />
    </div>
  );
}
