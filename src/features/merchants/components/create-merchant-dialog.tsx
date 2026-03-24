"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createMerchantCommand } from "../services/commands/merchant-commands";

export function CreateMerchantButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [nip, setNip] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      const result = await createMerchantCommand({
        name: name.trim(),
        nip: nip.trim() || undefined,
      });
      if (result.success) {
        toast.success("Sprzedawca dodany");
        setName("");
        setNip("");
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
            setName("");
            setNip("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nowy sprzedawca</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchant-name">Nazwa</Label>
              <Input
                id="merchant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Altkom Akademia"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant-nip">NIP (opcjonalnie)</Label>
              <Input
                id="merchant-nip"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="np. 1234567890"
              />
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
