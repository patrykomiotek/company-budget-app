import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategoriesQuery } from "@/features/categories/services/queries/category-queries";
import { CategoriesList } from "@/features/categories/components/categories-list";

export default async function CategoriesPage() {
  const categories = await getCategoriesQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kategorie</h1>
        <Link href="/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Nowa kategoria
          </Button>
        </Link>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <CategoriesList categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
