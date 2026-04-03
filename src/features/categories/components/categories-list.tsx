"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteCategoryCommand,
  reorderCategoriesCommand,
} from "../services/commands/category-commands";
import type { CategoryWithSubcategories } from "../contracts/category.types";

interface CategoriesListProps {
  categories: CategoryWithSubcategories[];
}

function SortableCategoryRow({
  category,
  deletingId,
  onDelete,
}: {
  category: CategoryWithSubcategories;
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 bg-background"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label="Przeciągnij aby zmienić kolejność"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{category.name}</span>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs ${category.departmentName ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}
          >
            {category.departmentName ?? "Globalna"}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {category.subcategories.map((s) => (
            <span
              key={s.id}
              className="inline-block bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Link href={`/categories/${category.id}/edit`}>
          <Button variant="ghost" size="icon" aria-label="Edytuj kategorię">
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(category.id)}
          disabled={deletingId === category.id}
          aria-label="Usuń kategorię"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SortableCategoryList({
  categories: initialCategories,
  deletingId,
  onDelete,
  onReorder,
}: {
  categories: CategoryWithSubcategories[];
  deletingId: string | null;
  onDelete: (id: string) => void;
  onReorder: (categories: CategoryWithSubcategories[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = initialCategories.findIndex((c) => c.id === active.id);
    const newIndex = initialCategories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(initialCategories, oldIndex, newIndex);
    onReorder(reordered);
  }

  if (initialCategories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak kategorii.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={initialCategories.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y">
          {initialCategories.map((c) => (
            <SortableCategoryRow
              key={c.id}
              category={c}
              deletingId={deletingId}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function CategoriesList({ categories }: CategoriesListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState(categories);

  const expenseCategories = localCategories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = localCategories.filter((c) => c.type === "INCOME");

  const handleReorder = useCallback(
    async (reordered: CategoryWithSubcategories[]) => {
      const updated = reordered.map((c, i) => ({ ...c, sortOrder: i }));

      // Optimistic update
      setLocalCategories((prev) => {
        const otherType = prev.filter((c) => c.type !== updated[0]?.type);
        return [...otherType, ...updated].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
      });

      const result = await reorderCategoriesCommand({
        categories: updated.map((c) => ({ id: c.id, sortOrder: c.sortOrder })),
      });

      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Nie udało się zmienić kolejności");
        setLocalCategories(categories);
      }
    },
    [categories, router],
  );

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deleteCategoryCommand(id);
      if (result.success) {
        toast.success("Kategoria usunięta");
        setLocalCategories((prev) => prev.filter((c) => c.id !== id));
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
          <SortableCategoryList
            categories={expenseCategories}
            deletingId={deletingId}
            onDelete={setConfirmDeleteId}
            onReorder={handleReorder}
          />
        </TabsContent>
        <TabsContent value="income">
          <SortableCategoryList
            categories={incomeCategories}
            deletingId={deletingId}
            onDelete={setConfirmDeleteId}
            onReorder={handleReorder}
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
