import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockPrisma,
  mockRequireUser,
  mockGetActiveDepartmentId,
  mockFindOrCreateEmployee,
  mockFindOrCreateCustomer,
  mockFindOrCreateProject,
  mockFindOrCreateProduct,
} = vi.hoisted(() => ({
  mockPrisma: {
    merchant: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    subcategory: {
      findUnique: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
    },
    transaction: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transactionLineItem: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  mockRequireUser: vi.fn(),
  mockGetActiveDepartmentId: vi.fn(),
  mockFindOrCreateEmployee: vi.fn(),
  mockFindOrCreateCustomer: vi.fn(),
  mockFindOrCreateProject: vi.fn(),
  mockFindOrCreateProduct: vi.fn(),
}));

vi.mock("@/shared/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/shared/lib/auth/helpers", () => ({
  requireUser: () => mockRequireUser(),
}));

vi.mock("@/shared/utils/error-handling", () => ({
  handleCommandError: (_error: unknown, message: string) => ({
    success: false,
    error: message,
  }),
}));

vi.mock("@/shared/lib/department/helpers", () => ({
  getActiveDepartmentId: () => mockGetActiveDepartmentId(),
}));

vi.mock("@/features/employees/services/commands/employee-commands", () => ({
  findOrCreateEmployee: (...args: unknown[]) =>
    mockFindOrCreateEmployee(...args),
}));

vi.mock("@/features/customers/services/commands/customer-commands", () => ({
  findOrCreateCustomer: (...args: unknown[]) =>
    mockFindOrCreateCustomer(...args),
}));

vi.mock("@/features/projects/services/commands/project-commands", () => ({
  findOrCreateProject: (...args: unknown[]) => mockFindOrCreateProject(...args),
}));

vi.mock("@/features/products/services/commands/product-commands", () => ({
  findOrCreateProduct: (...args: unknown[]) => mockFindOrCreateProduct(...args),
}));

import {
  createTransactionCommand,
  updateTransactionCommand,
  deleteTransactionCommand,
  convertForecastToActualCommand,
} from "../transaction-commands";

describe("transaction-commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
    mockGetActiveDepartmentId.mockResolvedValue(null);
    // By default, $transaction executes the callback with the prisma mock itself
    mockPrisma.$transaction.mockImplementation(
      async (cb: (tx: typeof mockPrisma) => Promise<void>) => {
        await cb(mockPrisma);
      },
    );
  });

  describe("createTransactionCommand", () => {
    const baseExpenseInput = {
      type: "EXPENSE" as const,
      amount: 150.0,
      currency: "PLN" as const,
      date: "2026-03-15",
      subcategoryId: "sub-uuid",
      description: "Zakup materiałów",
      merchantName: "Allegro",
    };

    it("should create a basic expense transaction", async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({ id: 10 });
      mockPrisma.merchant.findFirst.mockResolvedValue(null);
      mockPrisma.merchant.create.mockResolvedValue({ id: 20 });
      mockPrisma.transaction.create.mockResolvedValue({ id: 100 });

      const result = await createTransactionCommand(baseExpenseInput);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.subcategory.findUnique).toHaveBeenCalledWith({
        where: { publicId: "sub-uuid" },
      });
      expect(mockPrisma.merchant.create).toHaveBeenCalledWith({
        data: {
          name: "Allegro",
          userId: "user-1",
          departmentId: undefined,
          nip: null,
          street: null,
          postalCode: null,
          city: null,
        },
      });
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "EXPENSE",
          amount: 150.0,
          currency: "PLN",
          subcategoryId: 10,
          merchantId: 20,
          userId: "user-1",
        }),
      });
    });

    it("should create an income transaction with customer", async () => {
      mockPrisma.subcategory.findUnique.mockResolvedValue({ id: 10 });
      mockFindOrCreateCustomer.mockResolvedValue(30);
      mockPrisma.transaction.create.mockResolvedValue({ id: 101 });

      const result = await createTransactionCommand({
        type: "INCOME",
        amount: 5000,
        currency: "PLN",
        date: "2026-03-20",
        subcategoryId: "sub-uuid",
        customerName: "Firma ABC",
        customerNip: "1234567890",
      });

      expect(result).toEqual({ success: true });
      expect(mockFindOrCreateCustomer).toHaveBeenCalledWith(
        "Firma ABC",
        "user-1",
        null,
        expect.objectContaining({ nip: "1234567890" }),
      );
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "INCOME",
          amount: 5000,
          customerId: 30,
          merchantId: null,
        }),
      });
    });

    it("should fail with invalid amount", async () => {
      const result = await createTransactionCommand({
        ...baseExpenseInput,
        amount: -100,
      });

      expect(result).toEqual({
        success: false,
        error: "Nie udało się dodać transakcji",
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("updateTransactionCommand", () => {
    const baseUpdateInput = {
      id: "tx-uuid",
      type: "EXPENSE" as const,
      amount: 200,
      currency: "PLN" as const,
      date: "2026-04-01",
      subcategoryId: "sub-uuid",
      description: "Zaktualizowany opis",
      merchantName: "Amazon",
    };

    it("should update an existing transaction", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        id: 50,
        publicId: "tx-uuid",
      });
      mockPrisma.subcategory.findUnique.mockResolvedValue({ id: 10 });
      mockPrisma.merchant.findFirst.mockResolvedValue({ id: 25 });
      mockPrisma.transaction.update.mockResolvedValue({});
      mockPrisma.transactionLineItem.deleteMany.mockResolvedValue({
        count: 0,
      });

      const result = await updateTransactionCommand(baseUpdateInput);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { publicId: "tx-uuid", userId: "user-1" },
      });
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: expect.objectContaining({
          type: "EXPENSE",
          amount: 200,
          merchantId: 25,
        }),
      });
    });

    it("should fail if transaction not found", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await updateTransactionCommand(baseUpdateInput);

      expect(result).toEqual({
        success: false,
        error: "Transakcja nie została znaleziona",
      });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("deleteTransactionCommand", () => {
    it("should delete a transaction successfully", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        id: 50,
        publicId: "tx-uuid",
      });
      mockPrisma.transaction.delete.mockResolvedValue({});

      const result = await deleteTransactionCommand("tx-uuid");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { publicId: "tx-uuid", userId: "user-1" },
      });
      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 50 },
      });
    });

    it("should fail if transaction not found", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await deleteTransactionCommand("nonexistent");

      expect(result).toEqual({
        success: false,
        error: "Transakcja nie została znaleziona",
      });
      expect(mockPrisma.transaction.delete).not.toHaveBeenCalled();
    });
  });

  describe("convertForecastToActualCommand", () => {
    it("should convert FORECAST_EXPENSE to EXPENSE", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        id: 60,
        publicId: "forecast-uuid",
        type: "FORECAST_EXPENSE",
      });
      mockPrisma.transaction.update.mockResolvedValue({});

      const result = await convertForecastToActualCommand("forecast-uuid");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 60 },
        data: { type: "EXPENSE" },
      });
    });

    it("should convert FORECAST_INCOME to INCOME", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        id: 61,
        publicId: "forecast-uuid",
        type: "FORECAST_INCOME",
      });
      mockPrisma.transaction.update.mockResolvedValue({});

      const result = await convertForecastToActualCommand("forecast-uuid");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 61 },
        data: { type: "INCOME" },
      });
    });

    it("should fail for non-forecast transaction", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        id: 62,
        publicId: "actual-uuid",
        type: "EXPENSE",
      });

      const result = await convertForecastToActualCommand("actual-uuid");

      expect(result).toEqual({
        success: false,
        error: "Tylko prognozy mogą być zamienione na rzeczywiste transakcje",
      });
      expect(mockPrisma.transaction.update).not.toHaveBeenCalled();
    });

    it("should fail if transaction not found", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await convertForecastToActualCommand("nonexistent");

      expect(result).toEqual({
        success: false,
        error: "Transakcja nie została znaleziona",
      });
    });
  });
});
