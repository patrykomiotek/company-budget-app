import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireUser } = vi.hoisted(() => ({
  mockPrisma: {
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
    },
    transaction: {
      updateMany: vi.fn(),
    },
  },
  mockRequireUser: vi.fn(),
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

import {
  findOrCreateCustomer,
  createCustomerCommand,
  updateCustomerCommand,
  deleteCustomerCommand,
} from "../customer-commands";

describe("customer-commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
  });

  describe("findOrCreateCustomer", () => {
    it("should find an existing customer and return its id", async () => {
      mockPrisma.customer.upsert.mockResolvedValue({ id: 42 });

      const result = await findOrCreateCustomer("Acme Corp", "user-1");

      expect(result).toBe(42);
      expect(mockPrisma.customer.upsert).toHaveBeenCalledWith({
        where: { name_userId: { name: "Acme Corp", userId: "user-1" } },
        update: {},
        create: {
          name: "Acme Corp",
          userId: "user-1",
          departmentId: undefined,
          nip: null,
          street: null,
          postalCode: null,
          city: null,
          email: null,
        },
        select: { id: true },
      });
    });

    it("should create a new customer with extra fields", async () => {
      mockPrisma.customer.upsert.mockResolvedValue({ id: 99 });

      const result = await findOrCreateCustomer("New Client", "user-1", 5, {
        nip: "1234567890",
        street: "ul. Testowa 1",
        postalCode: "00-001",
        city: "Warszawa",
        email: "test@example.com",
      });

      expect(result).toBe(99);
      expect(mockPrisma.customer.upsert).toHaveBeenCalledWith({
        where: { name_userId: { name: "New Client", userId: "user-1" } },
        update: {},
        create: {
          name: "New Client",
          userId: "user-1",
          departmentId: 5,
          nip: "1234567890",
          street: "ul. Testowa 1",
          postalCode: "00-001",
          city: "Warszawa",
          email: "test@example.com",
        },
        select: { id: true },
      });
    });
  });

  describe("createCustomerCommand", () => {
    it("should create a customer successfully", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue({ id: 1 });

      const result = await createCustomerCommand({ name: "Nowy Klient" });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Nowy Klient",
          userId: "user-1",
        }),
      });
    });

    it("should return error if customer name already exists", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 1 });

      const result = await createCustomerCommand({ name: "Existing" });

      expect(result).toEqual({
        success: false,
        error: "Klient o tej nazwie już istnieje",
      });
      expect(mockPrisma.customer.create).not.toHaveBeenCalled();
    });

    it("should return error for empty name", async () => {
      const result = await createCustomerCommand({ name: "" });

      expect(result).toEqual({
        success: false,
        error: "Nie udało się dodać klienta",
      });
    });

    it("should resolve departmentId from public id", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.department.findUnique.mockResolvedValue({ id: 7 });
      mockPrisma.customer.create.mockResolvedValue({ id: 1 });

      const result = await createCustomerCommand({
        name: "Klient z oddziałem",
        departmentId: "dept-uuid",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.department.findUnique).toHaveBeenCalledWith({
        where: { publicId: "dept-uuid" },
        select: { id: true },
      });
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          departmentId: 7,
        }),
      });
    });

    it("should set departmentId to null when department not found", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);
      mockPrisma.department.findUnique.mockResolvedValue(null);
      mockPrisma.customer.create.mockResolvedValue({ id: 1 });

      const result = await createCustomerCommand({
        name: "Klient bez oddziału",
        departmentId: "invalid-dept-uuid",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          departmentId: null,
        }),
      });
    });
  });

  describe("updateCustomerCommand", () => {
    it("should update a customer successfully", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 5,
        publicId: "cust-uuid",
      });
      mockPrisma.customer.update.mockResolvedValue({});

      const result = await updateCustomerCommand({
        id: "cust-uuid",
        name: "Updated Name",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: expect.objectContaining({
          name: "Updated Name",
        }),
      });
    });

    it("should return error if customer not found", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const result = await updateCustomerCommand({
        id: "nonexistent",
        name: "Test",
      });

      expect(result).toEqual({
        success: false,
        error: "Klient nie został znaleziony",
      });
      expect(mockPrisma.customer.update).not.toHaveBeenCalled();
    });

    it("should resolve departmentId when updating", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 5,
        publicId: "cust-uuid",
      });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 3 });
      mockPrisma.customer.update.mockResolvedValue({});

      const result = await updateCustomerCommand({
        id: "cust-uuid",
        name: "Klient",
        departmentId: "dept-uuid",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: expect.objectContaining({
          departmentId: 3,
        }),
      });
    });
  });

  describe("deleteCustomerCommand", () => {
    it("should delete a customer and unlink transactions", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 10,
        publicId: "cust-uuid",
      });
      mockPrisma.transaction.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.customer.delete.mockResolvedValue({});

      const result = await deleteCustomerCommand("cust-uuid");

      expect(result).toEqual({ success: true });
      // Verify order: unlink transactions before deleting customer
      const updateManyOrder =
        mockPrisma.transaction.updateMany.mock.invocationCallOrder[0];
      const deleteOrder =
        mockPrisma.customer.delete.mock.invocationCallOrder[0];
      expect(updateManyOrder).toBeLessThan(deleteOrder);
      expect(mockPrisma.transaction.updateMany).toHaveBeenCalledWith({
        where: { customerId: 10, userId: "user-1" },
        data: { customerId: null },
      });
      expect(mockPrisma.customer.delete).toHaveBeenCalledWith({
        where: { id: 10 },
      });
    });

    it("should return error if customer not found", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const result = await deleteCustomerCommand("nonexistent");

      expect(result).toEqual({
        success: false,
        error: "Klient nie został znaleziony",
      });
      expect(mockPrisma.customer.delete).not.toHaveBeenCalled();
    });
  });
});
