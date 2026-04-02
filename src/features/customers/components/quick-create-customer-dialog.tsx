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
import { quickCreateCustomerCommand } from "../services/commands/customer-commands";

interface QuickCreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: {
    id: string;
    name: string;
    nip: string | null;
  }) => void;
}

export function QuickCreateCustomerDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateCustomerDialogProps) {
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
      toast.error("Podaj nazwę klienta");
      return;
    }

    setLoading(true);
    try {
      const result = await quickCreateCustomerCommand({
        name: name.trim(),
        nip: nip.trim() || undefined,
      });

      if (result.success && result.data) {
        toast.success(`Klient "${result.data.name}" dodany`);
        onCreated(result.data);
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Nie udało się dodać klienta");
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
          <DialogTitle>Nowy klient</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-cust-name">Nazwa firmy</Label>
            <Input
              id="quick-cust-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Altkom Akademia"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-cust-nip">NIP (opcjonalnie)</Label>
            <Input
              id="quick-cust-nip"
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
