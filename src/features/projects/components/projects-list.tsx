"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deleteProjectCommand } from "../services/commands/project-commands";
import type { ProjectItem, ProjectStatus } from "../contracts/project.types";
import { PROJECT_STATUS_LABELS } from "../contracts/project.types";

interface ProjectsListProps {
  projects: ProjectItem[];
}

const statusColors: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
};

function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

export function ProjectsList({ projects }: ProjectsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć ten projekt? Transakcje zostaną odłączone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteProjectCommand(id);
      if (result.success) {
        toast.success("Projekt usunięty");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć projektu");
    } finally {
      setDeletingId(null);
    }
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak projektów. Dodaj projekt klikając przycisk powyżej lub podczas
        tworzenia transakcji.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nazwa</TableHead>
          <TableHead>Klient</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Przychód</TableHead>
          <TableHead className="text-right">Koszty</TableHead>
          <TableHead className="text-right">Zysk</TableHead>
          <TableHead className="text-right">Transakcje</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              <Link href={`/projects/${p.id}`} className="hover:underline">
                {p.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {p.customerName || "—"}
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  statusColors[p.status],
                )}
              >
                {PROJECT_STATUS_LABELS[p.status]}
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
            <TableCell className="text-right">{p.transactionCount}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/projects/${p.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edytuj projekt"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  aria-label="Usuń projekt"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
