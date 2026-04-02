"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createProductCommand } from "../services/commands/product-commands";
import { PRODUCT_TYPE_LABELS } from "../contracts/product.types";

export function CreateProductButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"PRODUCT" | "SERVICE">("SERVICE");

  function reset() {
    setName("");
    setType("SERVICE");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      const result = await createProductCommand({
        name: name.trim(),
        type,
      });
      if (result.success) {
        toast.success("Usługa dodana");
        reset();
        setOpen(false);
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
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Dodaj
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nowa usługa</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nazwa</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Szkolenie React"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "PRODUCT" | "SERVICE")}
              >
                <SelectTrigger>
                  <span>{PRODUCT_TYPE_LABELS[type]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE">Usługa</SelectItem>
                  <SelectItem value="PRODUCT">Produkt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Dodawanie..." : "Dodaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
