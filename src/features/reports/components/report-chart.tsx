"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatAmount } from "@/shared/utils/format";
import type {
  ReportData,
  ReportType,
  AmountMode,
} from "../contracts/report.types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface ReportChartProps {
  data: ReportData;
  reportType: ReportType;
  amountMode: AmountMode;
}

const amountLabels: Record<AmountMode, string> = {
  netto: "netto",
  brutto: "brutto",
  vat: "VAT",
};

const typeLabels: Record<ReportType, string> = {
  income_expenses: "Przychody i wydatki",
  expenses: "Wydatki",
  income: "Przychody",
};

export function ReportChart({
  data,
  reportType,
  amountMode,
}: ReportChartProps) {
  const labels = data.rows.map((r) => r.period);

  const datasets = [];

  if (reportType !== "expenses") {
    datasets.push({
      label: "Przychody",
      data: data.rows.map((r) => r.income),
      backgroundColor: "rgba(59, 130, 246, 0.8)",
      borderRadius: 4,
    });
  }

  if (reportType !== "income") {
    datasets.push({
      label: "Wydatki",
      data: data.rows.map((r) => r.expense),
      backgroundColor: "rgba(220, 120, 120, 0.8)",
      borderRadius: 4,
    });
  }

  const chartData = { labels, datasets };

  const title = `${typeLabels[reportType]} ${amountLabels[amountMode]}`;
  const subtitle = `suma łączna ${formatAmount(data.totalBalance)} zł`;

  return (
    <div>
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="h-[400px]">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top" },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    `${ctx.dataset.label ?? ""}: ${formatAmount(ctx.parsed.y ?? 0)} zł`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => `${formatAmount(Number(value))} zł`,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
