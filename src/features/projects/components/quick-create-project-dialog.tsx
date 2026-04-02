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
import { quickCreateProjectCommand } from "../services/commands/project-commands";

interface QuickCreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: { id: string; name: string }) => void;
}

export function QuickCreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickCreateProjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  function reset() {
    setName("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Podaj nazwę projektu");
      return;
    }

    setLoading(true);
    try {
      const result = await quickCreateProjectCommand({
        name: name.trim(),
      });

      if (result.success && result.data) {
        toast.success(`Projekt "${result.data.name}" dodany`);
        onCreated(result.data);
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Nie udało się dodać projektu");
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
          <DialogTitle>Nowy projekt</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-proj-name">Nazwa projektu</Label>
            <Input
              id="quick-proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Warsztaty React"
              autoFocus
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
