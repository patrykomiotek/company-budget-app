"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
import { FakturowniaInvoiceList } from "./fakturownia-invoice-list";
import { fetchFakturowniaInvoicesQuery } from "../services/queries/fakturownia-queries";
import { importFakturowniaInvoiceCommand } from "../services/commands/fakturownia-commands";
import type {
  ImportedInvoiceData,
  FakturowniaInvoiceListItem,
} from "../contracts/fakturownia.types";

interface InvoicePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: ImportedInvoiceData) => void;
}

export function InvoicePickerDialog({
  open,
  onOpenChange,
  onImport,
}: InvoicePickerDialogProps) {
  const [invoices, setInvoices] = useState<FakturowniaInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFakturowniaInvoicesQuery({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setInvoices(result);
    } catch {
      toast.error("Nie udało się pobrać faktur z Fakturowni");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (open) {
      fetchInvoices();
    }
  }, [open, fetchInvoices]);

  function reset() {
    setInvoices([]);
    setSelectedId(null);
    setDateFrom("");
    setDateTo("");
  }

  async function handleImport() {
    if (!selectedId) {
      return;
    }

    const selected = invoices.find((inv) => inv.id === selectedId);
    if (selected?.alreadyImported) {
      const confirmed = window.confirm(
        "Ta faktura była już zaimportowana. Czy chcesz utworzyć kolejną transakcję?",
      );
      if (!confirmed) {
        return;
      }
    }

    setImporting(true);
    try {
      const result = await importFakturowniaInvoiceCommand(selectedId);

      if (result.success && result.data) {
        onImport(result.data);
        toast.success(`Zaimportowano fakturę ${result.data.invoiceNumber}`);
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Nie udało się zaimportować faktury");
      }
    } catch {
      toast.error("Wystąpił błąd podczas importu");
    } finally {
      setImporting(false);
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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importuj fakturę z Fakturowni</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fk-date-from" className="text-xs">
                Od
              </Label>
              <Input
                id="fk-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fk-date-to" className="text-xs">
                Do
              </Label>
              <Input
                id="fk-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchInvoices}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : null}
            Filtruj
          </Button>

          <div className="border rounded-md">
            <FakturowniaInvoiceList
              invoices={invoices}
              loading={loading}
              onSelect={setSelectedId}
              selectedId={selectedId}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            disabled={!selectedId || importing}
            onClick={handleImport}
          >
            {importing ? "Importowanie..." : "Importuj"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
