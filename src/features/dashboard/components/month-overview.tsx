"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthSummary } from "@/features/transactions/contracts/transaction.types";

interface MonthOverviewProps {
  summary: MonthSummary;
  monthLabel: string;
  departmentName?: string | null;
}

import { formatAmount as fmt } from "@/shared/utils/format";

export function MonthOverview({
  summary,
  monthLabel,
  departmentName,
}: MonthOverviewProps) {
  const hasForecast = summary.forecastIncome > 0 || summary.forecastExpense > 0;
  const totalExpenseForBar = summary.totalExpense + summary.forecastExpense;

  return (
    <div className="space-y-6">
      {departmentName && (
        <p className="text-sm text-muted-foreground">
          Oddział: {departmentName}
        </p>
      )}

      {/* Actual values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Przychody
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {fmt(summary.totalIncome)} zł
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wydatki
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {fmt(summary.totalExpense)} zł
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bilans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${summary.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {summary.balance >= 0 ? "+" : ""}
              {fmt(summary.balance)} zł
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast values */}
      {hasForecast && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prognoza przychodów
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-green-600/70">
                {fmt(summary.forecastIncome)} zł
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prognoza wydatków
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-red-600/70">
                {fmt(summary.forecastExpense)} zł
              </p>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Prognozowany bilans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const forecastBalance =
                  summary.totalIncome +
                  summary.forecastIncome -
                  (summary.totalExpense + summary.forecastExpense);
                return (
                  <p
                    className={`text-xl font-semibold ${forecastBalance >= 0 ? "text-green-600/70" : "text-red-600/70"}`}
                  >
                    {forecastBalance >= 0 ? "+" : ""}
                    {fmt(forecastBalance)} zł
                  </p>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {summary.categorySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Podsumowanie wg kategorii — {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.categorySummaries
                .filter((cs) => cs.total > 0)
                .sort((a, b) => b.total - a.total)
                .map((cs) => (
                  <div key={cs.categoryId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cs.categoryName}</span>
                      <span className="font-mono text-sm">
                        {fmt(cs.total)} zł
                      </span>
                    </div>
                    {totalExpenseForBar > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min((cs.total / totalExpenseForBar) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    <div className="pl-4 space-y-1">
                      {cs.subcategories
                        .sort((a, b) => b.total - a.total)
                        .map((sub) => (
                          <div
                            key={sub.subcategoryId}
                            className="flex justify-between text-sm text-muted-foreground"
                          >
                            <span>{sub.subcategoryName}</span>
                            <span className="font-mono">
                              {fmt(sub.total)} zł
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
