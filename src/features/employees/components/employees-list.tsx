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
import { Badge } from "@/components/ui/badge";
import { deleteEmployeeCommand } from "../services/commands/employee-commands";
import type { EmployeeItem } from "../contracts/employee.types";

interface EmployeesListProps {
  employees: EmployeeItem[];
}

export function EmployeesList({ employees }: EmployeesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tę osobę? Transakcje zostaną odłączone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteEmployeeCommand(id);
      if (result.success) {
        toast.success("Osoba usunięta");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć osoby");
    } finally {
      setDeletingId(null);
    }
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak osób. Dodaj osobę podczas tworzenia transakcji.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Imię i nazwisko</TableHead>
          <TableHead>Firma</TableHead>
          <TableHead className="text-right">Transakcje</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">{e.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{e.companyName}</Badge>
            </TableCell>
            <TableCell className="text-right">{e.transactionCount}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/employees/${e.id}/edit`}>
                  <Button variant="ghost" size="icon" aria-label="Edytuj osobę">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(e.id)}
                  disabled={deletingId === e.id}
                  aria-label="Usuń osobę"
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
