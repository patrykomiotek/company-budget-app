"use server";

import { requireUser } from "@/shared/lib/auth/helpers";
import { prisma } from "@/shared/lib/prisma";
import { handleCommandError } from "@/shared/utils/error-handling";
import { getInvoice } from "../api/fakturownia-client";
import type {
  ImportedInvoiceData,
  ImportedLineItem,
} from "../../contracts/fakturownia.types";
import type { OperationResult } from "@/shared/types/common";

const DEPARTMENT_MAPPING: Record<number, string> = {
  1493345: "Web Amigos",
  1891309: "Anna PRO",
};

const SUPPORTED_CURRENCIES = new Set(["PLN", "EUR", "USD"]);

function mapCurrency(currency: string): "PLN" | "EUR" | "USD" {
  const upper = currency.toUpperCase();
  if (SUPPORTED_CURRENCIES.has(upper)) {
    return upper as "PLN" | "EUR" | "USD";
  }
  return "PLN";
}

async function resolveDepartmentPublicId(
  departmentId: number | null,
): Promise<string | undefined> {
  if (!departmentId) {
    return undefined;
  }

  const departmentName = DEPARTMENT_MAPPING[departmentId];
  if (!departmentName) {
    return undefined;
  }

  const dept = await prisma.department.findUnique({
    where: { name: departmentName },
    select: { publicId: true },
  });

  return dept?.publicId;
}

async function matchCustomerName(
  buyerName: string,
  buyerTaxNo: string | null,
  userId: string,
): Promise<string> {
  if (buyerTaxNo) {
    const byNip = await prisma.customer.findFirst({
      where: { nip: buyerTaxNo, userId },
      select: { name: true },
    });
    if (byNip) {
      return byNip.name;
    }
  }

  const byName = await prisma.customer.findFirst({
    where: { name: buyerName, userId },
    select: { name: true },
  });
  if (byName) {
    return byName.name;
  }

  return buyerName;
}

function parsePositions(
  positions: {
    name: string;
    quantity: string;
    quantity_unit: string | null;
    price_net: string;
    tax: string;
  }[],
): ImportedLineItem[] {
  return positions.map((pos) => {
    const vatRate =
      pos.tax === "np" || pos.tax === "zw" ? 0 : parseFloat(pos.tax) || 0;

    return {
      name: pos.name,
      quantity: parseFloat(pos.quantity) || 1,
      unit: pos.quantity_unit || undefined,
      unitPrice: parseFloat(pos.price_net) || 0,
      vatRate,
    };
  });
}

export async function importFakturowniaInvoiceCommand(
  invoiceId: number,
): Promise<OperationResult<ImportedInvoiceData>> {
  try {
    const user = await requireUser();

    const invoice = await getInvoice(invoiceId);

    const currency = mapCurrency(invoice.currency);
    const exchangeRate =
      currency !== "PLN" && invoice.exchange_currency_rate
        ? parseFloat(invoice.exchange_currency_rate)
        : undefined;

    const departmentPublicId = await resolveDepartmentPublicId(
      invoice.department_id,
    );
    const customerName = await matchCustomerName(
      invoice.buyer_name,
      invoice.buyer_tax_no,
      user.id,
    );

    const lineItems = parsePositions(invoice.positions ?? []);

    const data: ImportedInvoiceData = {
      invoiceNumber: invoice.number,
      date: invoice.issue_date,
      invoiceDueDate: invoice.payment_to,
      amount: parseFloat(invoice.price_net) || 0,
      currency,
      exchangeRate,
      description: `${invoice.buyer_name} — ${invoice.number}`,
      customerName,
      customerNip: invoice.buyer_tax_no ?? undefined,
      customerStreet: invoice.buyer_street ?? undefined,
      customerPostalCode: invoice.buyer_post_code ?? undefined,
      customerCity: invoice.buyer_city ?? undefined,
      customerEmail: invoice.buyer_email ?? undefined,
      departmentPublicId,
      lineItems,
      fakturowniaInvoiceId: invoice.id,
    };

    return { success: true, data };
  } catch (error) {
    return handleCommandError(
      error,
      "Nie udało się zaimportować faktury z Fakturowni",
    );
  }
}
