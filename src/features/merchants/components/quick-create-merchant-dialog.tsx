"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import { quickCreateMerchantCommand } from "../services/commands/merchant-commands";

interface QuickCreateMerchantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (merchant: { id: string; name: string }) => void;
}

export function QuickCreateMerchantDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateMerchantDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [nip, setNip] = useState("");

  function reset() {
    setName("");
    setNip("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Podaj nazwę dostawcy");
      return;
    }

    setLoading(true);
    try {
      const result = await quickCreateMerchantCommand({
        name: name.trim(),
        nip: nip.trim() || undefined,
      });

      if (result.success && result.data) {
        toast.success(`Dostawca "${result.data.name}" dodany`);
        onCreated(result.data);
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Nie udało się dodać dostawcy");
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nowy dostawca</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-merch-name">Nazwa dostawcy</Label>
            <Input
              id="quick-merch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. OVH Cloud"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-merch-nip">NIP (opcjonalnie)</Label>
            <Input
              id="quick-merch-nip"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="np. 1234567890"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Dodawanie..." : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
