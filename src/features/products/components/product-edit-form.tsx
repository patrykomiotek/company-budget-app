"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { updateProductCommand } from "../services/commands/product-commands";
import { PRODUCT_TYPE_LABELS } from "../contracts/product.types";

interface ProductEditFormProps {
  product: {
    id: string;
    name: string;
    type: string;
  };
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(product.name);
  const [type, setType] = useState(product.type);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateProductCommand({
        id: product.id,
        name,
        type: type as "PRODUCT" | "SERVICE",
      });
      if (result.success) {
        toast.success("Usługa zaktualizowana");
        router.push("/products");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Edytuj usługę</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
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
            <Select value={type} onValueChange={(v) => setType(v ?? type)}>
              <SelectTrigger>
                <span>{PRODUCT_TYPE_LABELS[type] || type}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVICE">Usługa</SelectItem>
                <SelectItem value="PRODUCT">Produkt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Zapisywanie..." : "Zapisz"}
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
