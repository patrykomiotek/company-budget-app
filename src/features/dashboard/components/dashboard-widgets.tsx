import Link from "next/link";
import {
  Briefcase,
  FolderKanban,
  Store,
  Users,
  PackageOpen,
  CircleDollarSign,
  FileWarning,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "../services/queries/dashboard-stats-queries";

interface DashboardWidgetsProps {
  stats: DashboardStats;
}

function gridColsClass(count: number): string {
  if (count === 1) {
    return "grid-cols-1";
  }
  if (count === 2) {
    return "grid-cols-2";
  }
  return "grid-cols-3";
}

export function DashboardWidgets({ stats }: DashboardWidgetsProps) {
  const alerts = [
    stats.unpaidIncomeCount > 0 && {
      href: "/transactions?type=INCOME&isPaid=false",
      icon: CircleDollarSign,
      label: "Nieopłacone przychody",
      count: stats.unpaidIncomeCount,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    },
    stats.unpaidExpenseCount > 0 && {
      href: "/transactions?type=EXPENSE&isPaid=false",
      icon: CircleDollarSign,
      label: "Nieopłacone wydatki",
      count: stats.unpaidExpenseCount,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    },
    stats.pendingInvoiceCount > 0 && {
      href: "/transactions?type=EXPENSE&invoiceSent=false",
      icon: FileWarning,
      label: "Faktury do wysłania",
      count: stats.pendingInvoiceCount,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: typeof CircleDollarSign;
    label: string;
    count: number;
    color: string;
    bg: string;
  }>;

  const entities = [
    {
      href: "/customers",
      icon: Briefcase,
      label: "Klienci",
      count: stats.customerCount,
    },
    {
      href: "/projects",
      icon: FolderKanban,
      label: "Projekty",
      count: stats.projectCount,
    },
    {
      href: "/products",
      icon: PackageOpen,
      label: "Usługi",
      count: stats.productCount,
    },
    {
      href: "/merchants",
      icon: Store,
      label: "Dostawcy",
      count: stats.merchantCount,
    },
    {
      href: "/employees",
      icon: Users,
      label: "Współpracownicy",
      count: stats.employeeCount,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Alerts row */}
      {alerts.length > 0 && (
        <div className={`grid gap-3 ${gridColsClass(alerts.length)}`}>
          {alerts.map((alert) => (
            <Link key={alert.href} href={alert.href}>
              <Card
                className={`${alert.bg} hover:shadow-md transition-shadow cursor-pointer`}
              >
                <CardContent className="flex items-center gap-3 py-3 px-4">
                  <alert.icon className={`h-4 w-4 shrink-0 ${alert.color}`} />
                  <span className={`text-sm font-medium flex-1 ${alert.color}`}>
                    {alert.label}
                  </span>
                  <span className={`text-xl font-bold ${alert.color}`}>
                    {alert.count}
                  </span>
                  <ArrowRight
                    className={`h-3.5 w-3.5 shrink-0 opacity-50 ${alert.color}`}
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Entity counts row */}
      <div className="grid grid-cols-5 gap-3">
        {entities.map((entity) => (
          <Link key={entity.href} href={entity.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex items-center gap-4 py-4 px-5">
                <entity.icon className="h-8 w-8 text-muted-foreground/60 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {entity.label}
                  </p>
                </div>
                <p className="text-2xl font-bold shrink-0">{entity.count}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
