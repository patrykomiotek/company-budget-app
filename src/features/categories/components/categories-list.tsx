"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCategoryCommand } from "../services/commands/category-commands";
import type { CategoryWithSubcategories } from "../contracts/category.types";

interface CategoriesListProps {
  categories: CategoryWithSubcategories[];
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tę kategorię? Kategorie z transakcjami nie mogą być usunięte.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteCategoryCommand(id);
      if (result.success) {
        toast.success("Kategoria usunięta");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć kategorii");
    } finally {
      setDeletingId(null);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak kategorii.
      </div>
    );
  }

  return (
    <Table className="table-fixed w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Nazwa</TableHead>
          <TableHead className="w-[100px]">Typ</TableHead>
          <TableHead>Podkategorie</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell>
              <Badge variant={c.type === "INCOME" ? "default" : "secondary"}>
                {c.type === "INCOME" ? "Przychód" : "Wydatek"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              <div className="flex flex-wrap gap-1">
                {c.subcategories.map((s) => (
                  <span
                    key={s.id}
                    className="inline-block bg-muted rounded px-1.5 py-0.5 text-xs"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/categories/${c.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edytuj kategorię"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  aria-label="Usuń kategorię"
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
