import { notFound } from "next/navigation";
import { getCategoryByIdQuery } from "@/features/categories/services/queries/category-queries";
import { CategoryForm } from "@/features/categories/components/category-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface CategoryEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryEditPage({
  params,
}: CategoryEditPageProps) {
  const { id } = await params;
  const category = await getCategoryByIdQuery(id);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: "Kategorie", href: "/categories" },
          { label: category.name },
        ]}
      />
      <CategoryForm category={category} />
    </div>
  );
}
