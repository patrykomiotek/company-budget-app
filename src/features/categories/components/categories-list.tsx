"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteCategoryCommand } from "../services/commands/category-commands";
import type { CategoryWithSubcategories } from "../contracts/category.types";

interface CategoriesListProps {
  categories: CategoryWithSubcategories[];
}

function CategoryTable({
  categories,
  deletingId,
  onDelete,
}: {
  categories: CategoryWithSubcategories[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
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
          <TableHead>Podkategorie</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
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
                  onClick={() => onDelete(c.id)}
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

export function CategoriesList({ categories }: CategoriesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(id: string) {
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

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  return (
    <>
      <Tabs defaultValue="expense">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="expense">
            Wydatki ({expenseCategories.length})
          </TabsTrigger>
          <TabsTrigger value="income">
            Przychody ({incomeCategories.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expense">
          <CategoryTable
            categories={expenseCategories}
            deletingId={deletingId}
            onDelete={setConfirmDeleteId}
          />
        </TabsContent>
        <TabsContent value="income">
          <CategoryTable
            categories={incomeCategories}
            deletingId={deletingId}
            onDelete={setConfirmDeleteId}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć kategorię?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Kategorie z przypisanymi
              transakcjami nie mogą być usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
