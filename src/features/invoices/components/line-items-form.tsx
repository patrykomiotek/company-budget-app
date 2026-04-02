"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCombobox } from "@/features/products/components/product-combobox";
import { ProjectCombobox } from "@/features/projects/components/project-combobox";
import type { LineItemRow } from "../contracts/invoice.types";
import { calculateLineItem } from "../contracts/invoice.types";

interface ProductOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

import { formatAmount as formatPLN } from "@/shared/utils/format";

interface LineItemsFormProps {
  items: LineItemRow[];
  onChange: (items: LineItemRow[]) => void;
  products: ProductOption[];
  projects?: ProjectOption[];
}

function createEmptyRow(): LineItemRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    quantity: 1,
    unitPrice: 0,
    vatRate: 23,
    netAmount: 0,
    grossAmount: 0,
  };
}

export function LineItemsForm({
  items,
  onChange,
  products,
  projects = [],
}: LineItemsFormProps) {
  function updateItem(index: number, partial: Partial<LineItemRow>) {
    const updated = [...items];
    const item = { ...updated[index], ...partial };
    const { netAmount, grossAmount } = calculateLineItem(item);
    updated[index] = { ...item, netAmount, grossAmount };
    onChange(updated);
  }

  function addItem() {
    onChange([...items, createEmptyRow()]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const totalNet = items.reduce((sum, i) => sum + i.netAmount, 0);
  const totalGross = items.reduce((sum, i) => sum + i.grossAmount, 0);
  const showProjects = projects.length > 0;

  return (
    <div className="space-y-3">
      <div
        className={`grid gap-2 text-xs font-medium text-muted-foreground ${showProjects ? "grid-cols-[1fr_1fr_80px_100px_70px_90px_90px_32px]" : "grid-cols-[1fr_80px_100px_70px_90px_90px_32px]"}`}
      >
        <span>Usługa</span>
        {showProjects && <span>Projekt</span>}
        <span>Ilość</span>
        <span>Cena jedn.</span>
        <span>VAT %</span>
        <span>Netto</span>
        <span>Brutto</span>
        <span />
      </div>

      {items.map((item, index) => (
        <div
          key={item.key}
          className={`grid gap-2 items-center ${showProjects ? "grid-cols-[1fr_1fr_80px_100px_70px_90px_90px_32px]" : "grid-cols-[1fr_80px_100px_70px_90px_90px_32px]"}`}
        >
          <ProductCombobox
            value={item.name}
            onChange={(name) => updateItem(index, { name })}
            products={products}
          />
          {showProjects && (
            <ProjectCombobox
              value={item.projectName || ""}
              onChange={(projectName) => updateItem(index, { projectName })}
              projects={projects}
            />
          )}
          <Input
            type="number"
            min={0}
            step="0.001"
            value={item.quantity ?? ""}
            onChange={(e) =>
              updateItem(index, { quantity: parseFloat(e.target.value) || 0 })
            }
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={item.unitPrice ?? ""}
            onChange={(e) =>
              updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })
            }
            className="h-8 text-sm"
          />
          <Input
            type="number"
            min={0}
            max={100}
            step="1"
            value={item.vatRate}
            onChange={(e) =>
              updateItem(index, { vatRate: parseFloat(e.target.value) || 0 })
            }
            className="h-8 text-sm"
          />
          <span className="text-sm text-right tabular-nums">
            {formatPLN(item.netAmount)}
          </span>
          <span className="text-sm text-right tabular-nums">
            {formatPLN(item.grossAmount)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => removeItem(index)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="h-3 w-3 mr-1" />
        Dodaj pozycję
      </Button>

      {items.length > 0 && (
        <div className="flex justify-end gap-6 pt-2 border-t text-sm font-medium">
          <span>Netto: {formatPLN(totalNet)}</span>
          <span>Brutto: {formatPLN(totalGross)}</span>
        </div>
      )}
    </div>
  );
}
