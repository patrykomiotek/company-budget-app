import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { getMonthSummaryQuery } from "@/features/dashboard/services/queries/dashboard-queries";
import { getDashboardStatsQuery } from "@/features/dashboard/services/queries/dashboard-stats-queries";
import { MonthOverview } from "@/features/dashboard/components/month-overview";
import { DashboardWidgets } from "@/features/dashboard/components/dashboard-widgets";
import { getActiveDepartmentPublicId } from "@/shared/lib/department/helpers";
import { getDepartmentsQuery } from "@/shared/lib/department/queries";

interface DashboardPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const now = new Date();
  const parsedYear = params.year ? parseInt(params.year, 10) : NaN;
  const parsedMonth = params.month ? parseInt(params.month, 10) : NaN;
  const year = Number.isNaN(parsedYear) ? now.getFullYear() : parsedYear;
  const month =
    Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12
      ? now.getMonth() + 1
      : parsedMonth;

  const [summary, stats, activeDepartmentPublicId, companies] =
    await Promise.all([
      getMonthSummaryQuery(year, month),
      getDashboardStatsQuery(),
      getActiveDepartmentPublicId(),
      getDepartmentsQuery(),
    ]);
  const monthLabel = format(new Date(year, month - 1), "LLLL yyyy", {
    locale: pl,
  });
  const departmentName = activeDepartmentPublicId
    ? (companies.find((c) => c.id === activeDepartmentPublicId)?.name ?? null)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <a
            href={`/dashboard?year=${month === 1 ? year - 1 : year}&month=${month === 1 ? 12 : month - 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Poprzedni
          </a>
          <span className="text-sm font-medium capitalize">{monthLabel}</span>
          <a
            href={`/dashboard?year=${month === 12 ? year + 1 : year}&month=${month === 12 ? 1 : month + 1}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Następny →
          </a>
        </div>
      </div>

      <DashboardWidgets stats={stats} />

      <MonthOverview
        summary={summary}
        monthLabel={monthLabel}
        departmentName={departmentName}
      />
    </div>
  );
}
