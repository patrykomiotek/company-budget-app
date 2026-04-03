import { notFound } from "next/navigation";
import { getProductByIdQuery } from "@/features/products/services/queries/product-queries";
import { ProductEditForm } from "@/features/products/components/product-edit-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;
  const product = await getProductByIdQuery(id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Usługi", href: "/products" },
          { label: product.name },
        ]}
      />
      <ProductEditForm product={product} />
    </div>
  );
}
