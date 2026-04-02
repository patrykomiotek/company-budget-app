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
import { deleteProductCommand } from "../services/commands/product-commands";
import type { ProductItem } from "../contracts/product.types";
import { PRODUCT_TYPE_LABELS } from "../contracts/product.types";

interface ProductsListProps {
  products: ProductItem[];
}

export function ProductsList({ products }: ProductsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (
      !confirm(
        "Czy na pewno chcesz usunąć tę usługę? Pozycje faktur zostaną odłączone.",
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteProductCommand(id);
      if (result.success) {
        toast.success("Usługa usunięta");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Nie udało się usunąć usługi");
    } finally {
      setDeletingId(null);
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak usług. Dodaj usługę klikając przycisk powyżej lub podczas tworzenia
        transakcji.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nazwa</TableHead>
          <TableHead>Typ</TableHead>
          <TableHead className="text-right">Pozycje faktur</TableHead>
          <TableHead className="w-20"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium">
              <Link href={`/products/${p.id}`} className="hover:underline">
                {p.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={p.type === "SERVICE" ? "default" : "secondary"}>
                {PRODUCT_TYPE_LABELS[p.type] || p.type}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{p.lineItemCount}</TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Link href={`/products/${p.id}/edit`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edytuj usługę"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  aria-label="Usuń usługę"
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
