"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getProjectStatsQuery } from "../services/queries/project-queries";
import type {
  ProjectStats as ProjectStatsType,
  IntervalFilter,
} from "../contracts/project.types";
import { INTERVAL_LABELS } from "../contracts/project.types";

interface ProjectStatsProps {
  projectId: string;
  initialStats: ProjectStatsType;
  initialInterval: IntervalFilter;
}

function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

export function ProjectStats({
  projectId,
  initialStats,
  initialInterval,
}: ProjectStatsProps) {
  const [stats, setStats] = useState(initialStats);
  const [interval, setInterval] = useState<IntervalFilter>(initialInterval);
  const [isPending, startTransition] = useTransition();

  function handleIntervalChange(value: string | null) {
    if (!value) {
      return;
    }
    const newInterval = value as IntervalFilter;
    setInterval(newInterval);
    startTransition(async () => {
      const newStats = await getProjectStatsQuery(projectId, newInterval);
      setStats(newStats);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Statystyki</h2>
        <Select value={interval} onValueChange={handleIntervalChange}>
          <SelectTrigger className="w-[200px]">
            <span>{INTERVAL_LABELS[interval]}</span>
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(INTERVAL_LABELS) as [IntervalFilter, string][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "grid gap-4 grid-cols-2 md:grid-cols-4",
          isPending && "opacity-50",
        )}
      >
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Przychód</p>
            <p className="text-2xl font-bold text-green-600">
              {formatPln(stats.totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Koszty</p>
            <p className="text-2xl font-bold text-red-600">
              {formatPln(stats.totalCosts)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Zysk</p>
            <p
              className={cn(
                "text-2xl font-bold",
                stats.profit >= 0 ? "text-green-600" : "text-red-600",
              )}
            >
              {formatPln(stats.profit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Marża</p>
            <p className="text-2xl font-bold">{stats.margin.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">Transakcje</p>
            <p className="text-2xl font-bold">{stats.transactionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-2 pb-2">
            <p className="text-sm text-muted-foreground">
              Średnia wartość transakcji
            </p>
            <p className="text-2xl font-bold">
              {formatPln(stats.averageTransactionValue)}
            </p>
          </CardContent>
        </Card>
        {stats.customerLtv !== null && (
          <Card>
            <CardContent className="pt-2 pb-2">
              <p className="text-sm text-muted-foreground">LTV klienta</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPln(stats.customerLtv)}
              </p>
            </CardContent>
          </Card>
        )}
        {stats.customerAcquisitionCost !== null && (
          <Card>
            <CardContent className="pt-2 pb-2">
              <p className="text-sm text-muted-foreground">Koszt pozyskania</p>
              <p className="text-2xl font-bold text-red-600">
                {formatPln(stats.customerAcquisitionCost)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
