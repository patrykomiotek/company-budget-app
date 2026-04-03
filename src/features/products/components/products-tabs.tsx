"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsList } from "./products-list";
import type { ProductItem } from "../contracts/product.types";

interface ProductsTabsProps {
  incomeProducts: ProductItem[];
  expenseProducts: ProductItem[];
}

export function ProductsTabs({
  incomeProducts,
  expenseProducts,
}: ProductsTabsProps) {
  return (
    <Tabs defaultValue="income">
      <TabsList className="mx-4 mt-4">
        <TabsTrigger value="income">
          Przychody ({incomeProducts.length})
        </TabsTrigger>
        <TabsTrigger value="expense">
          Wydatki ({expenseProducts.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="income">
        <ProductsList products={incomeProducts} />
      </TabsContent>
      <TabsContent value="expense">
        <ProductsList products={expenseProducts} />
      </TabsContent>
    </Tabs>
  );
}
