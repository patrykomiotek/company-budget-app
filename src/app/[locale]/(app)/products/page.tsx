import { Card, CardContent } from "@/components/ui/card";
import { getProductsListQuery } from "@/features/products/services/queries/product-queries";
import { ProductsList } from "@/features/products/components/products-list";
import { CreateProductButton } from "@/features/products/components/create-product-dialog";

export default async function ProductsPage() {
  const products = await getProductsListQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produkty i usługi</h1>
        <CreateProductButton />
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <ProductsList products={products} />
        </CardContent>
      </Card>
    </div>
  );
}
