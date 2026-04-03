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
import { createEmployeeCommand } from "../services/commands/employee-commands";

interface DepartmentOption {
  id: string;
  name: string;
}

interface CreateEmployeeButtonProps {
  companies: DepartmentOption[];
}

export function CreateEmployeeButton({ companies }: CreateEmployeeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [departmentId, setCompanyId] = useState(companies[0]?.id ?? "");

  function reset() {
    setName("");
    setCompanyId(companies[0]?.id ?? "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !departmentId) {
      return;
    }

    setLoading(true);
    try {
      const result = await createEmployeeCommand({
        name: name.trim(),
        departmentPublicId: departmentId,
      });
      if (result.success) {
        toast.success("Współpracownik dodany");
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
            <DialogTitle>Nowy współpracownik</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">Imię i nazwisko</Label>
              <Input
                id="emp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Anna Wiśniewska"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Firma</Label>
              <Select
                value={departmentId}
                onValueChange={(v) => setCompanyId(v ?? "")}
              >
                <SelectTrigger>
                  <span>
                    {companies.find((c) => c.id === departmentId)?.name ??
                      "Wybierz firmę"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
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
              <Button
                type="submit"
                disabled={loading || !name.trim() || !departmentId}
              >
                {loading ? "Dodawanie..." : "Dodaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
