'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MonthSummary } from '@/features/transactions/contracts/transaction.types';

interface MonthOverviewProps {
  summary: MonthSummary;
  monthLabel: string;
}

export function MonthOverview({ summary, monthLabel }: MonthOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Przychody
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {summary.totalIncome.toFixed(2)} zł
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
              {summary.totalExpense.toFixed(2)} zł
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
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.balance >= 0 ? '+' : ''}{summary.balance.toFixed(2)} zł
            </p>
          </CardContent>
        </Card>
      </div>

      {summary.categorySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wydatki wg kategorii — {monthLabel}</CardTitle>
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
                        {cs.total.toFixed(2)} zł
                      </span>
                    </div>
                    {summary.totalExpense > 0 && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min((cs.total / summary.totalExpense) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    <div className="pl-4 space-y-1">
                      {cs.subcategories
                        .sort((a, b) => b.total - a.total)
                        .map((sub) => (
                          <div key={sub.subcategoryId} className="flex justify-between text-sm text-muted-foreground">
                            <span>{sub.subcategoryName}</span>
                            <span className="font-mono">{sub.total.toFixed(2)} zł</span>
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
