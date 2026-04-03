"use server";

import { requireUser } from "@/shared/lib/auth/helpers";
import { prisma } from "@/shared/lib/prisma";
import { getInvoices } from "../api/fakturownia-client";
import type { FakturowniaInvoiceListItem } from "../../contracts/fakturownia.types";

export async function fetchFakturowniaInvoicesQuery(params?: {
  page?: number;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  kind?: string;
  income?: "yes" | "no";
  perPage?: number;
}): Promise<FakturowniaInvoiceListItem[]> {
  const user = await requireUser();

  const invoices = await getInvoices(params);

  const fakturowniaIds = invoices.map((inv) => inv.id);
  const imported = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      fakturowniaInvoiceId: { in: fakturowniaIds },
    },
    select: { fakturowniaInvoiceId: true },
  });
  const importedIds = new Set(imported.map((t) => t.fakturowniaInvoiceId));

  return invoices.map((inv) => ({
    id: inv.id,
    number: inv.number,
    kind: inv.kind,
    issueDate: inv.issue_date,
    paymentTo: inv.payment_to,
    buyerName: inv.buyer_name,
    buyerTaxNo: inv.buyer_tax_no,
    priceNet: inv.price_net,
    priceGross: inv.price_gross,
    currency: inv.currency,
    status: inv.status,
    alreadyImported: importedIds.has(inv.id),
  }));
}
