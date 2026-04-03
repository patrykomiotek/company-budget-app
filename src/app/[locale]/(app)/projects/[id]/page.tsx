import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  getProjectByIdQuery,
  getProjectStatsQuery,
  getProjectTransactionsQuery,
} from "@/features/projects/services/queries/project-queries";
import { ProjectStats } from "@/features/projects/components/project-stats";
import { PROJECT_STATUS_LABELS } from "@/features/projects/contracts/project.types";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
} as const;

const typeBadge: Record<
  string,
  { label: string; variant: "default" | "destructive" | "outline" }
> = {
  INCOME: { label: "Przychód", variant: "default" },
  EXPENSE: { label: "Wydatek", variant: "destructive" },
  FORECAST_INCOME: { label: "Prognoza +", variant: "outline" },
  FORECAST_EXPENSE: { label: "Prognoza -", variant: "outline" },
};

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

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const [project, stats, transactions] = await Promise.all([
    getProjectByIdQuery(id),
    getProjectStatsQuery(id, "current_month"),
    getProjectTransactionsQuery(id),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Projekty", href: "/projects" },
          { label: project.name },
        ]}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusColors[project.status],
            )}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        <Link href={`/projects/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edytuj
          </Button>
        </Link>
      </div>

      {project.customerName && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Klient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{project.customerName}</p>
          </CardContent>
        </Card>
      )}

      <ProjectStats
        projectId={id}
        initialStats={stats}
        initialInterval="current_month"
      />

      <div>
        <h2 className="text-lg font-semibold mb-3">Transakcje</h2>
        <Card className="py-0">
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak transakcji w tym projekcie.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Kontrahent</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead className="text-right">Kwota</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => {
                    const badge = typeBadge[t.type] || typeBadge.EXPENSE;
                    const isIncome =
                      t.type === "INCOME" || t.type === "FORECAST_INCOME";
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <Badge
                            variant={badge.variant}
                            className="text-xs whitespace-nowrap"
                          >
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Link
                            href={`/transactions/${t.id}`}
                            className="hover:underline"
                          >
                            {formatDate(t.date)}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.categoryName}
                        </TableCell>
                        <TableCell>
                          {t.customerName || t.merchantName || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]">
                          {t.description || "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono whitespace-nowrap",
                            isIncome ? "text-green-600" : "text-red-600",
                          )}
                        >
                          {isIncome ? "+" : "-"}
                          {formatPln(t.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
