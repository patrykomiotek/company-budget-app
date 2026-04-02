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
import { CustomerCombobox } from "@/features/customers/components/customer-combobox";
import { updateProjectCommand } from "../services/commands/project-commands";
import type { ProjectStatus } from "../contracts/project.types";
import { PROJECT_STATUS_LABELS } from "../contracts/project.types";

interface ProjectEditFormProps {
  project: {
    id: string;
    name: string;
    status: ProjectStatus;
    customerId: string | null;
    customerName: string | null;
  };
  customers: { id: string; name: string; nip?: string | null }[];
}

export function ProjectEditForm({ project, customers }: ProjectEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [customerName, setCustomerName] = useState(project.customerName || "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedCustomer = customers.find((c) => c.name === customerName);

      const result = await updateProjectCommand({
        id: project.id,
        name,
        status,
        customerPublicId: selectedCustomer?.id || undefined,
      });
      if (result.success) {
        toast.success("Projekt zaktualizowany");
        router.push("/projects");
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
        <CardTitle>Edytuj projekt</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nazwa projektu</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
