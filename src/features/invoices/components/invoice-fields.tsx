'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InvoiceFieldsProps {
  invoiceNumber: string;
  invoiceDueDate: string;
  onInvoiceNumberChange: (value: string) => void;
  onInvoiceDueDateChange: (value: string) => void;
}

export function InvoiceFields({
  invoiceNumber,
  invoiceDueDate,
  onInvoiceNumberChange,
  onInvoiceDueDateChange,
}: InvoiceFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="invoiceNumber">Nr faktury</Label>
        <Input
          id="invoiceNumber"
          value={invoiceNumber}
          onChange={(e) => onInvoiceNumberChange(e.target.value)}
          placeholder="np. FV/2026/03/001"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invoiceDueDate">Termin płatności</Label>
        <Input
          id="invoiceDueDate"
          type="date"
          value={invoiceDueDate}
          onChange={(e) => onInvoiceDueDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}
