import { z } from 'zod';

export const lineItemSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana'),
  quantity: z.number().positive('Ilość musi być większa od 0'),
  unitPrice: z.number().min(0, 'Cena nie może być ujemna'),
  vatRate: z.number().min(0).max(100, 'Stawka VAT: 0-100%'),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;

export interface LineItemRow extends LineItemInput {
  key: string;
  netAmount: number;
  grossAmount: number;
}

export function calculateLineItem(item: LineItemInput): { netAmount: number; grossAmount: number } {
  const netAmount = Math.round(item.quantity * item.unitPrice * 100) / 100;
  const grossAmount = Math.round(netAmount * (1 + item.vatRate / 100) * 100) / 100;
  return { netAmount, grossAmount };
}
