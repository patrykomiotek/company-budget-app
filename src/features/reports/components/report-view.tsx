"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "./report-filters";
import { ReportChart } from "./report-chart";
import { ReportTable } from "./report-table";
import { getReportDataQuery } from "../services/queries/report-queries";
import { useDepartment } from "@/shared/context/department-context";
import type {
  ReportFilters as ReportFiltersType,
  ReportData,
} from "../contracts/report.types";

function getDefaultFilters(departmentId?: string | null): ReportFiltersType {
  const now = new Date();
  const year = now.getFullYear();
  const dateFrom = `${year}-01-01`;
  const dateTo = `${year}-12-31`;

  return {
    reportType: "income_expenses",
    dateFrom,
    dateTo,
    grouping: "month",
    amountMode: "netto",
    departmentId: departmentId ?? undefined,
  };
}

export function ReportView() {
  const { activeDepartmentId } = useDepartment();
  const [filters, setFilters] = useState<ReportFiltersType>(() =>
    getDefaultFilters(activeDepartmentId),
  );
  const prevCompanyId = useRef(activeDepartmentId);

  // Sync departmentId filter when the sidebar company selector changes
  useEffect(() => {
    if (prevCompanyId.current !== activeDepartmentId) {
      prevCompanyId.current = activeDepartmentId;
      setFilters((prev) => ({
        ...prev,
        departmentId: activeDepartmentId ?? undefined,
      }));
    }
  }, [activeDepartmentId]);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (f: ReportFiltersType) => {
    setLoading(true);
    try {
      const result = await getReportDataQuery(f);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters filters={filters} onChange={setFilters} />
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Ładowanie raportu...
          </CardContent>
        </Card>
      )}

      {!loading && data && data.rows.length > 0 && (
        <>
          <Card>
            <CardContent className="pt-6">
              <ReportChart
                data={data}
                reportType={filters.reportType}
                amountMode={filters.amountMode}
              />
            </CardContent>
          </Card>

          <Card className="py-0">
            <CardContent className="p-0">
              <ReportTable data={data} grouping={filters.grouping} />
            </CardContent>
          </Card>
        </>
      )}

      {!loading && (!data || data.rows.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Brak danych dla wybranych filtrów
          </CardContent>
        </Card>
      )}
    </div>
  );
}
