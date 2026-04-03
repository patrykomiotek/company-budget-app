"use client";

import { useState } from "react";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCategoryCommand,
  updateCategoryCommand,
} from "../services/commands/category-commands";
import type { CategoryWithSubcategories } from "../contracts/category.types";

interface SubcategoryInput {
  key: string;
  id?: string;
  name: string;
  sortOrder: number;
}

interface CategoryFormProps {
  category?: CategoryWithSubcategories;
  departments: { id: string; name: string }[];
}

function SortableSubcategoryRow({
  sub,
  index,
  onNameChange,
  onRemove,
}: {
  sub: SubcategoryInput;
  index: number;
  onNameChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sub.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none shrink-0"
        aria-label="Przeciągnij aby zmienić kolejność"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={sub.name}
        onChange={(e) => onNameChange(index, e.target.value)}
        placeholder="Nazwa podkategorii"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CategoryForm({ category, departments }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = !!category;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    (category?.type as "INCOME" | "EXPENSE") ?? "EXPENSE",
  );
  const [departmentId, setDepartmentId] = useState<string | null>(
    category?.departmentId ?? null,
  );
  const [subcategories, setSubcategories] = useState<SubcategoryInput[]>(
    category?.subcategories.map((s) => ({
      key: s.id,
      id: s.id,
      name: s.name,
      sortOrder: s.sortOrder,
    })) ?? [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function addSubcategory() {
    setSubcategories((prev) => [
      ...prev,
      { key: crypto.randomUUID(), name: "", sortOrder: prev.length },
    ]);
  }

  function removeSubcategory(index: number) {
    setSubcategories((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({ ...s, sortOrder: i }));
    });
  }

  function updateSubcategoryName(index: number, value: string) {
    setSubcategories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name: value } : s)),
    );
  }

  function handleSubcategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setSubcategories((prev) => {
      const oldIndex = prev.findIndex((s) => s.key === active.id);
      const newIndex = prev.findIndex((s) => s.key === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((s, i) => ({ ...s, sortOrder: i }));
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        type,
        departmentId: departmentId ?? undefined,
        subcategories: subcategories
          .filter((s) => s.name.trim())
          .map((s) => ({
            id: s.id,
            name: s.name,
            sortOrder: s.sortOrder,
          })),
      };

      const result = isEditing
        ? await updateCategoryCommand({ id: category.id, ...payload })
        : await createCategoryCommand(payload);

      if (result.success) {
        toast.success(
          isEditing ? "Kategoria zaktualizowana" : "Kategoria utworzona",
        );
        router.push("/categories");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edytuj kategorię" : "Nowa kategoria"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "INCOME" | "EXPENSE")}
                disabled={isEditing}
              >
                <SelectTrigger>
                  <span>{type === "INCOME" ? "Przychód" : "Wydatek"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Wydatek</SelectItem>
                  <SelectItem value="INCOME">Przychód</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Oddział</Label>
              <Select
                value={departmentId ?? "global"}
                onValueChange={(v) =>
                  setDepartmentId(!v || v === "global" ? null : v)
                }
              >
                <SelectTrigger>
                  <span>
                    {departmentId
                      ? (departments.find((d) => d.id === departmentId)?.name ??
                        "Wybierz")
                      : "Globalna"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Globalna</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Podkategorie</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubcategory}
              >
                <Plus className="h-4 w-4 mr-1" />
                Dodaj
              </Button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSubcategoryDragEnd}
            >
              <SortableContext
                items={subcategories.map((s) => s.key)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {subcategories.map((sub, index) => (
                    <SortableSubcategoryRow
                      key={sub.key}
                      sub={sub}
                      index={index}
                      onNameChange={updateSubcategoryName}
                      onRemove={removeSubcategory}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {subcategories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Brak podkategorii. Kliknij &quot;Dodaj&quot; aby dodać.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && "Zapisywanie..."}
              {!loading && isEditing && "Zapisz"}
              {!loading && !isEditing && "Utwórz"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
