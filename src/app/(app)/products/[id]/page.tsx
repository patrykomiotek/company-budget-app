import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getProductDetailWithHistoryQuery } from "@/features/products/services/queries/product-queries";
import { PRODUCT_TYPE_LABELS } from "@/features/products/contracts/product.types";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductDetailWithHistoryQuery(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Usługi", href: "/products" },
          { label: product.name },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <Badge variant={product.type === "SERVICE" ? "default" : "secondary"}>
            {PRODUCT_TYPE_LABELS[product.type] || product.type}
          </Badge>
        </div>
        <Link href={`/products/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edytuj
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Przychód netto</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPln(product.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Sprzedana ilość</p>
            <p className="text-2xl font-bold">{product.totalQuantity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Liczba sprzedaży</p>
            <p className="text-2xl font-bold">{product.purchaseCount}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Historia sprzedaży</h2>
        <Card className="py-0">
          <CardContent className="p-0">
            {product.purchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak historii sprzedaży.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Projekt</TableHead>
                    <TableHead className="text-right">Ilość</TableHead>
                    <TableHead className="text-right">Cena jedn.</TableHead>
                    <TableHead className="text-right">Netto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.purchases.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">
                        <Link
                          href={`/transactions/${p.transactionId}`}
                          className="hover:underline"
                        >
                          {formatDate(p.date)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {p.customerName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.projectName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatPln(p.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatPln(p.netAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
