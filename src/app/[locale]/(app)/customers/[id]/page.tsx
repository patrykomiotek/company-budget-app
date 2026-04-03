import { notFound } from "next/navigation";
import Link from "next/link";
import { Crown, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  getCustomerByIdQuery,
  getCustomerMetricsQuery,
} from "@/features/customers/services/queries/customer-queries";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Aktywny",
  COMPLETED: "Zakończony",
  ARCHIVED: "Zarchiwizowany",
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const [customer, metrics] = await Promise.all([
    getCustomerByIdQuery(id),
    getCustomerMetricsQuery(id),
  ]);

  if (!customer || !metrics) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Klienci", href: "/customers" },
          { label: customer.displayName || customer.name },
        ]}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {customer.displayName || customer.name}
          </h1>
          {customer.isVip && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              <Crown className="h-3.5 w-3.5" />
              VIP
            </span>
          )}
        </div>
        <Link href={`/customers/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edytuj
          </Button>
        </Link>
      </div>

      {(customer.nip || customer.city || customer.email || customer.phone) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dane kontaktowe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {customer.nip && (
                <div>
                  <p className="text-muted-foreground">NIP</p>
                  <p className="font-medium">{customer.nip}</p>
                </div>
              )}
              {customer.email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              )}
              {customer.phone && (
                <div>
                  <p className="text-muted-foreground">Telefon</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              )}
              {customer.city && (
                <div>
                  <p className="text-muted-foreground">Miasto</p>
                  <p className="font-medium">{customer.city}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">LTV (przychód)</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPln(metrics.ltv)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Koszty</p>
            <p className="text-2xl font-bold text-red-600">
              {formatPln(metrics.totalCosts)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">
              Średnia wartość transakcji
            </p>
            <p className="text-2xl font-bold">
              {formatPln(metrics.averageTransactionValue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Transakcje</p>
            <p className="text-2xl font-bold">{metrics.transactionCount}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Usługi</h2>
        <Card className="py-0">
          <CardContent className="p-0">
            {metrics.products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak usług przypisanych do tego klienta.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead className="text-right">Ilość</TableHead>
                    <TableHead className="text-right">Przychód netto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/products/${p.id}`}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.totalQuantity}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatPln(p.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Projekty</h2>
        <Card className="py-0">
          <CardContent className="p-0">
            {metrics.projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak projektów przypisanych do tego klienta.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Przychód</TableHead>
                    <TableHead className="text-right">Koszty</TableHead>
                    <TableHead className="text-right">Zysk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/projects/${p.id}`}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            statusColors[p.status] ||
                              "bg-gray-100 text-gray-800",
                          )}
                        >
                          {statusLabels[p.status] || p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatPln(p.totalIncome)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatPln(p.totalCosts)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          p.profit >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {formatPln(p.profit)}
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
