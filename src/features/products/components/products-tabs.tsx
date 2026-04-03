"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
      <TabsList>
        <TabsTrigger value="income">
          Przychody ({incomeProducts.length})
        </TabsTrigger>
        <TabsTrigger value="expense">
          Wydatki ({expenseProducts.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="income">
        <Card className="py-0">
          <CardContent className="p-0">
            <ProductsList products={incomeProducts} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="expense">
        <Card className="py-0">
          <CardContent className="p-0">
            <ProductsList products={expenseProducts} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
