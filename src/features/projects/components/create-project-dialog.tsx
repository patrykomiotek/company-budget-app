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
import { CustomerCombobox } from "@/features/customers/components/customer-combobox";
import { createProjectCommand } from "../services/commands/project-commands";
import type { ProjectStatus } from "../contracts/project.types";
import { PROJECT_STATUS_LABELS } from "../contracts/project.types";

interface CreateProjectDialogProps {
  customers: { id: string; name: string; nip?: string | null }[];
}

export function CreateProjectButton({ customers }: CreateProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [customerName, setCustomerName] = useState("");

  function reset() {
    setName("");
    setStatus("ACTIVE");
    setCustomerName("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      const selectedCustomer = customers.find((c) => c.name === customerName);

      const result = await createProjectCommand({
        name: name.trim(),
        status,
        customerPublicId: selectedCustomer?.id || undefined,
      });
      if (result.success) {
        toast.success("Projekt dodany");
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowy projekt</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Nazwa projektu</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Warsztaty React"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProjectStatus)}
              >
                <SelectTrigger>
                  <span>{PROJECT_STATUS_LABELS[status]}</span>
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PROJECT_STATUS_LABELS) as [
                      ProjectStatus,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Klient (opcjonalnie)</Label>
              <CustomerCombobox
                value={customerName}
                onChange={setCustomerName}
                customers={customers}
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
