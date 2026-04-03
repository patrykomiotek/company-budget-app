"use server";

import { z } from "zod";
import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/lib/auth/helpers";
import { handleCommandError } from "@/shared/utils/error-handling";
import { getActiveDepartmentId } from "@/shared/lib/department/helpers";
import { findOrCreateEmployee } from "@/features/employees/services/commands/employee-commands";
import { findOrCreateProduct } from "@/features/products/services/commands/product-commands";
import { findOrCreateCustomer } from "@/features/customers/services/commands/customer-commands";
import { findOrCreateProject } from "@/features/projects/services/commands/project-commands";
import type { OperationResult } from "@/shared/types/common";
import {
  TransactionType as PrismaTransactionType,
  Currency as PrismaCurrency,
} from "@/lib/generated/prisma/client";

const lineItemInputSchema = z.object({
  name: z.string().min(1, "Nazwa pozycji jest wymagana"),
  quantity: z.number().positive("Ilość musi być większa od 0"),
  unit: z.string().optional(),
  unitPrice: z.number().min(0, "Cena nie może być ujemna"),
  vatRate: z.number().min(0).max(100),
  projectName: z.string().optional(),
});

const createTransactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "FORECAST_INCOME", "FORECAST_EXPENSE"]),
  amount: z.number().positive("Kwota musi być większa od 0"),
  currency: z.enum(["PLN", "EUR", "USD"]).default("PLN"),
  exchangeRate: z.number().positive().optional(),
  date: z.string(),
  subcategoryId: z.string().min(1, "Wybierz podkategorię"),
  description: z.string().optional(),
  merchantName: z.string().optional(),
  merchantNip: z.string().optional(),
  merchantStreet: z.string().optional(),
  merchantPostalCode: z.string().optional(),
  merchantCity: z.string().optional(),
  departmentPublicId: z.string().optional(),
  employeeName: z.string().optional(),
  customerName: z.string().optional(),
  customerNip: z.string().optional(),
  customerStreet: z.string().optional(),
  customerPostalCode: z.string().optional(),
  customerCity: z.string().optional(),
  customerEmail: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDueDate: z.string().optional(),
  lineItems: z.array(lineItemInputSchema).optional(),
  fakturowniaInvoiceId: z.number().int().positive().optional(),
  projectName: z.string().optional(),
  isPaid: z.boolean().optional(),
  invoiceSent: z.boolean().optional(),
});

const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().min(1),
});

async function findOrCreateMerchant(
  name: string,
  userId: string,
  departmentId?: number | null,
  extra?: {
    nip?: string;
    street?: string;
    postalCode?: string;
    city?: string;
  },
): Promise<number> {
  const existing = await prisma.merchant.findFirst({
    where: { name, userId },
  });
  if (existing) {
    return existing.id;
  }

  const created = await prisma.merchant.create({
    data: {
      name,
      userId,
      departmentId: departmentId ?? undefined,
      nip: extra?.nip || null,
      street: extra?.street || null,
      postalCode: extra?.postalCode || null,
      city: extra?.city || null,
    },
  });
  return created.id;
}

async function resolveSubcategoryId(publicId: string): Promise<number> {
  const sub = await prisma.subcategory.findUnique({
    where: { publicId },
  });
  if (!sub) {
    throw new Error("Podkategoria nie została znaleziona");
  }
  return sub.id;
}

async function resolveDepartmentId(publicId?: string): Promise<number | null> {
  if (!publicId) {
    return await getActiveDepartmentId();
  }
  const dept = await prisma.department.findUnique({
    where: { publicId },
    select: { id: true },
  });
  if (!dept) {
    throw new Error("Firma nie została znaleziona");
  }
  return dept.id;
}

export async function createTransactionCommand(
  input: z.infer<typeof createTransactionSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createTransactionSchema.parse(input);

    const subcategoryId = await resolveSubcategoryId(validated.subcategoryId);
    const departmentId = await resolveDepartmentId(
      validated.departmentPublicId,
    );

    let merchantId: number | null = null;
    if (validated.merchantName) {
      merchantId = await findOrCreateMerchant(
        validated.merchantName,
        user.id,
        departmentId,
        {
          nip: validated.merchantNip,
          street: validated.merchantStreet,
          postalCode: validated.merchantPostalCode,
          city: validated.merchantCity,
        },
      );
    }

    let employeeId: number | null = null;
    if (
      validated.employeeName &&
      departmentId &&
      (validated.type === "EXPENSE" || validated.type === "FORECAST_EXPENSE")
    ) {
      employeeId = await findOrCreateEmployee(
        validated.employeeName,
        departmentId,
        user.id,
      );
    }

    let customerId: number | null = null;
    if (
      validated.customerName &&
      (validated.type === "INCOME" || validated.type === "FORECAST_INCOME")
    ) {
      customerId = await findOrCreateCustomer(
        validated.customerName,
        user.id,
        departmentId,
        {
          nip: validated.customerNip,
          street: validated.customerStreet,
          postalCode: validated.customerPostalCode,
          city: validated.customerCity,
          email: validated.customerEmail,
        },
      );
    }

    let projectId: number | null = null;
    if (validated.projectName) {
      projectId = await findOrCreateProject(
        validated.projectName,
        user.id,
        departmentId,
      );
    }

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: validated.type as PrismaTransactionType,
          amount: validated.amount,
          currency: (validated.currency as PrismaCurrency) ?? "PLN",
          exchangeRate:
            validated.currency !== "PLN"
              ? (validated.exchangeRate ?? null)
              : null,
          date: new Date(validated.date),
          subcategoryId,
          description: validated.description || null,
          merchantId,
          departmentId,
          employeeId,
          customerId,
          projectId,
          invoiceNumber: validated.invoiceNumber || null,
          invoiceDueDate: validated.invoiceDueDate
            ? new Date(validated.invoiceDueDate)
            : null,
          fakturowniaInvoiceId: validated.fakturowniaInvoiceId ?? null,
          isPaid: validated.isPaid ?? false,
          invoiceSent: validated.invoiceSent ?? false,
          userId: user.id,
        },
      });

      if (validated.lineItems?.length) {
        for (const item of validated.lineItems) {
          const productId = await findOrCreateProduct(
            item.name,
            user.id,
            "SERVICE",
            departmentId,
          );
          const netAmount =
            Math.round(item.quantity * item.unitPrice * 100) / 100;
          const grossAmount =
            Math.round(netAmount * (1 + item.vatRate / 100) * 100) / 100;

          let lineItemProjectId: number | null = null;
          if (item.projectName) {
            lineItemProjectId = await findOrCreateProject(
              item.projectName,
              user.id,
            );
          }

          await tx.transactionLineItem.create({
            data: {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit || null,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              netAmount,
              grossAmount,
              transactionId: transaction.id,
              productId,
              projectId: lineItemProjectId,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się dodać transakcji");
  }
}

export async function updateTransactionCommand(
  input: z.infer<typeof updateTransactionSchema>,
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateTransactionSchema.parse(input);

    const transaction = await prisma.transaction.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!transaction) {
      return { success: false, error: "Transakcja nie została znaleziona" };
    }

    const subcategoryId = await resolveSubcategoryId(validated.subcategoryId);
    const departmentId = await resolveDepartmentId(
      validated.departmentPublicId,
    );

    let merchantId: number | null = null;
    if (validated.merchantName) {
      merchantId = await findOrCreateMerchant(
        validated.merchantName,
        user.id,
        departmentId,
        {
          nip: validated.merchantNip,
          street: validated.merchantStreet,
          postalCode: validated.merchantPostalCode,
          city: validated.merchantCity,
        },
      );
    }

    let employeeId: number | null = null;
    if (
      validated.employeeName &&
      departmentId &&
      (validated.type === "EXPENSE" || validated.type === "FORECAST_EXPENSE")
    ) {
      employeeId = await findOrCreateEmployee(
        validated.employeeName,
        departmentId,
        user.id,
      );
    }

    let customerId: number | null = null;
    if (
      validated.customerName &&
      (validated.type === "INCOME" || validated.type === "FORECAST_INCOME")
    ) {
      customerId = await findOrCreateCustomer(
        validated.customerName,
        user.id,
        departmentId,
        {
          nip: validated.customerNip,
          street: validated.customerStreet,
          postalCode: validated.customerPostalCode,
          city: validated.customerCity,
          email: validated.customerEmail,
        },
      );
    }

    let projectId: number | null = null;
    if (validated.projectName) {
      projectId = await findOrCreateProject(
        validated.projectName,
        user.id,
        departmentId,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          type: validated.type as PrismaTransactionType,
          amount: validated.amount,
          currency: (validated.currency as PrismaCurrency) ?? "PLN",
          exchangeRate:
            validated.currency !== "PLN"
              ? (validated.exchangeRate ?? null)
              : null,
          date: new Date(validated.date),
          subcategoryId,
          description: validated.description || null,
          merchantId,
          departmentId,
          employeeId,
          customerId,
          projectId,
          invoiceNumber: validated.invoiceNumber || null,
          invoiceDueDate: validated.invoiceDueDate
            ? new Date(validated.invoiceDueDate)
            : null,
          isPaid: validated.isPaid ?? false,
          invoiceSent: validated.invoiceSent ?? false,
        },
      });

      // Delete old line items and recreate
      await tx.transactionLineItem.deleteMany({
        where: { transactionId: transaction.id },
      });

      if (validated.lineItems?.length) {
        for (const item of validated.lineItems) {
          const productId = await findOrCreateProduct(
            item.name,
            user.id,
            "SERVICE",
            departmentId,
          );
          const netAmount =
            Math.round(item.quantity * item.unitPrice * 100) / 100;
          const grossAmount =
            Math.round(netAmount * (1 + item.vatRate / 100) * 100) / 100;

          let lineItemProjectId: number | null = null;
          if (item.projectName) {
            lineItemProjectId = await findOrCreateProject(
              item.projectName,
              user.id,
            );
          }

          await tx.transactionLineItem.create({
            data: {
              name: item.name,
              quantity: item.quantity,
              unit: item.unit || null,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              netAmount,
              grossAmount,
              transactionId: transaction.id,
              productId,
              projectId: lineItemProjectId,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się zaktualizować transakcji");
  }
}

export async function convertForecastToActualCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const transaction = await prisma.transaction.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!transaction) {
      return { success: false, error: "Transakcja nie została znaleziona" };
    }

    let newType: PrismaTransactionType;
    if (transaction.type === "FORECAST_EXPENSE") {
      newType = "EXPENSE";
    } else if (transaction.type === "FORECAST_INCOME") {
      newType = "INCOME";
    } else {
      return {
        success: false,
        error: "Tylko prognozy mogą być zamienione na rzeczywiste transakcje",
      };
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { type: newType },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(
      error,
      "Nie udało się zamienić prognozy na transakcję",
    );
  }
}

export async function deleteTransactionCommand(
  publicId: string,
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const transaction = await prisma.transaction.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!transaction) {
      return { success: false, error: "Transakcja nie została znaleziona" };
    }

    await prisma.transaction.delete({
      where: { id: transaction.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, "Nie udało się usunąć transakcji");
  }
}
