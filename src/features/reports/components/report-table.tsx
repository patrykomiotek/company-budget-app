"use client";

import { formatAmount } from "@/shared/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportData, Grouping } from "../contracts/report.types";

interface ReportTableProps {
  data: ReportData;
  grouping: Grouping;
}

const groupingLabels: Record<Grouping, string> = {
  year: "Rok",
  quarter: "Kwartał",
  month: "Miesiąc",
  week: "Tydzień",
  day: "Dzień",
};

export function ReportTable({ data, grouping }: ReportTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">
            {groupingLabels[grouping]}
          </TableHead>
          <TableHead className="text-right">Przychody</TableHead>
          <TableHead className="text-right">Wydatki</TableHead>
          <TableHead className="text-right">Razem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.rows.map((row) => (
          <TableRow key={row.period}>
            <TableCell className="font-medium">{row.period}</TableCell>
            <TableCell className="text-right text-blue-600">
              {formatAmount(row.income)}
            </TableCell>
            <TableCell className="text-right text-red-600">
              {formatAmount(row.expense)}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${row.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatAmount(row.balance)}
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="font-bold border-t-2">
          <TableCell>Suma</TableCell>
          <TableCell className="text-right text-blue-600">
            {formatAmount(data.totalIncome)}
          </TableCell>
          <TableCell className="text-right text-red-600">
            {formatAmount(data.totalExpense)}
          </TableCell>
          <TableCell
            className={`text-right ${data.totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatAmount(data.totalBalance)}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
