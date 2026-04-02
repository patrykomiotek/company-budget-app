import { CategoryForm } from "@/features/categories/components/category-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function NewCategoryPage() {
  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: "Kategorie", href: "/categories" },
          { label: "Nowa kategoria" },
        ]}
      />
      <CategoryForm />
    </div>
  );
}
