'use server';

import { z } from 'zod';
import { prisma } from '@/shared/lib/prisma';
import { requireUser } from '@/shared/lib/auth/helpers';
import { handleCommandError } from '@/shared/utils/error-handling';
import { getActiveCompanyId } from '@/shared/lib/company/helpers';
import { findOrCreateEmployee } from '@/features/employees/services/commands/employee-commands';
import { findOrCreateProduct } from '@/features/products/services/commands/product-commands';
import { findOrCreateCustomer } from '@/features/customers/services/commands/customer-commands';
import type { OperationResult } from '@/shared/types/common';
import { TransactionType as PrismaTransactionType, Currency as PrismaCurrency } from '@/lib/generated/prisma/client';

const lineItemInputSchema = z.object({
  name: z.string().min(1, 'Nazwa pozycji jest wymagana'),
  quantity: z.number().positive('Ilość musi być większa od 0'),
  unitPrice: z.number().min(0, 'Cena nie może być ujemna'),
  vatRate: z.number().min(0).max(100),
});

const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'FORECAST_INCOME', 'FORECAST_EXPENSE']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  currency: z.enum(['PLN', 'EUR', 'USD']).default('PLN'),
  exchangeRate: z.number().positive().optional(),
  date: z.string(),
  subcategoryId: z.string().min(1, 'Wybierz podkategorię'),
  description: z.string().optional(),
  merchantName: z.string().optional(),
  companyPublicId: z.string().optional(),
  employeeName: z.string().optional(),
  customerName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDueDate: z.string().optional(),
  lineItems: z.array(lineItemInputSchema).optional(),
});

const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().min(1),
});

async function findOrCreateMerchant(name: string, userId: string): Promise<number> {
  const existing = await prisma.merchant.findFirst({
    where: { name, userId },
  });
  if (existing) return existing.id;

  const created = await prisma.merchant.create({
    data: { name, userId },
  });
  return created.id;
}

async function resolveSubcategoryId(publicId: string): Promise<number> {
  const sub = await prisma.subcategory.findUnique({
    where: { publicId },
  });
  if (!sub) throw new Error('Podkategoria nie została znaleziona');
  return sub.id;
}

async function resolveCompanyId(publicId?: string): Promise<number | null> {
  if (!publicId) {
    return await getActiveCompanyId();
  }
  const company = await prisma.company.findUnique({
    where: { publicId },
    select: { id: true },
  });
  if (!company) {
    throw new Error('Firma nie została znaleziona');
  }
  return company.id;
}

export async function createTransactionCommand(
  input: z.infer<typeof createTransactionSchema>
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = createTransactionSchema.parse(input);

    const subcategoryId = await resolveSubcategoryId(validated.subcategoryId);
    const companyId = await resolveCompanyId(validated.companyPublicId);

    let merchantId: number | null = null;
    if (validated.merchantName) {
      merchantId = await findOrCreateMerchant(validated.merchantName, user.id);
    }

    let employeeId: number | null = null;
    if (validated.employeeName && companyId && (validated.type === 'EXPENSE' || validated.type === 'FORECAST_EXPENSE')) {
      employeeId = await findOrCreateEmployee(validated.employeeName, companyId, user.id);
    }

    let customerId: number | null = null;
    if (validated.customerName && (validated.type === 'INCOME' || validated.type === 'FORECAST_INCOME')) {
      customerId = await findOrCreateCustomer(validated.customerName, user.id);
    }

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: validated.type as PrismaTransactionType,
          amount: validated.amount,
          currency: (validated.currency as PrismaCurrency) ?? 'PLN',
          exchangeRate: validated.currency !== 'PLN' ? validated.exchangeRate ?? null : null,
          date: new Date(validated.date),
          subcategoryId,
          description: validated.description || null,
          merchantId,
          companyId,
          employeeId,
          customerId,
          invoiceNumber: validated.invoiceNumber || null,
          invoiceDueDate: validated.invoiceDueDate ? new Date(validated.invoiceDueDate) : null,
          userId: user.id,
        },
      });

      if (validated.lineItems?.length) {
        for (const item of validated.lineItems) {
          const productId = await findOrCreateProduct(item.name, user.id);
          const netAmount = Math.round(item.quantity * item.unitPrice * 100) / 100;
          const grossAmount = Math.round(netAmount * (1 + item.vatRate / 100) * 100) / 100;

          await tx.transactionLineItem.create({
            data: {
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              netAmount,
              grossAmount,
              transactionId: transaction.id,
              productId,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się dodać transakcji');
  }
}

export async function updateTransactionCommand(
  input: z.infer<typeof updateTransactionSchema>
): Promise<OperationResult> {
  try {
    const user = await requireUser();
    const validated = updateTransactionSchema.parse(input);

    const transaction = await prisma.transaction.findFirst({
      where: { publicId: validated.id, userId: user.id },
    });

    if (!transaction) {
      return { success: false, error: 'Transakcja nie została znaleziona' };
    }

    const subcategoryId = await resolveSubcategoryId(validated.subcategoryId);
    const companyId = await resolveCompanyId(validated.companyPublicId);

    let merchantId: number | null = null;
    if (validated.merchantName) {
      merchantId = await findOrCreateMerchant(validated.merchantName, user.id);
    }

    let employeeId: number | null = null;
    if (validated.employeeName && companyId && (validated.type === 'EXPENSE' || validated.type === 'FORECAST_EXPENSE')) {
      employeeId = await findOrCreateEmployee(validated.employeeName, companyId, user.id);
    }

    let customerId: number | null = null;
    if (validated.customerName && (validated.type === 'INCOME' || validated.type === 'FORECAST_INCOME')) {
      customerId = await findOrCreateCustomer(validated.customerName, user.id);
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          type: validated.type as PrismaTransactionType,
          amount: validated.amount,
          currency: (validated.currency as PrismaCurrency) ?? 'PLN',
          exchangeRate: validated.currency !== 'PLN' ? validated.exchangeRate ?? null : null,
          date: new Date(validated.date),
          subcategoryId,
          description: validated.description || null,
          merchantId,
          companyId,
          employeeId,
          customerId,
          invoiceNumber: validated.invoiceNumber || null,
          invoiceDueDate: validated.invoiceDueDate ? new Date(validated.invoiceDueDate) : null,
        },
      });

      // Delete old line items and recreate
      await tx.transactionLineItem.deleteMany({
        where: { transactionId: transaction.id },
      });

      if (validated.lineItems?.length) {
        for (const item of validated.lineItems) {
          const productId = await findOrCreateProduct(item.name, user.id);
          const netAmount = Math.round(item.quantity * item.unitPrice * 100) / 100;
          const grossAmount = Math.round(netAmount * (1 + item.vatRate / 100) * 100) / 100;

          await tx.transactionLineItem.create({
            data: {
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              netAmount,
              grossAmount,
              transactionId: transaction.id,
              productId,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się zaktualizować transakcji');
  }
}

export async function deleteTransactionCommand(
  publicId: string
): Promise<OperationResult> {
  try {
    const user = await requireUser();

    const transaction = await prisma.transaction.findFirst({
      where: { publicId, userId: user.id },
    });

    if (!transaction) {
      return { success: false, error: 'Transakcja nie została znaleziona' };
    }

    await prisma.transaction.delete({
      where: { id: transaction.id },
    });

    return { success: true };
  } catch (error) {
    return handleCommandError(error, 'Nie udało się usunąć transakcji');
  }
}
