import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireUser } = vi.hoisted(() => ({
  mockPrisma: {
    merchant: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
  createMerchantCommand,
  updateMerchantCommand,
  deleteMerchantCommand,
} from "../merchant-commands";

describe("merchant-commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
  });

  describe("createMerchantCommand", () => {
    it("should create a merchant successfully", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue(null);
      mockPrisma.merchant.create.mockResolvedValue({ id: 1 });

      const result = await createMerchantCommand({ name: "Nowy Dostawca" });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.merchant.create).toHaveBeenCalledWith({
        data: {
          name: "Nowy Dostawca",
          nip: null,
          userId: "user-1",
        },
      });
    });

    it("should return error if merchant name already exists", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue({ id: 1 });

      const result = await createMerchantCommand({ name: "Existing" });

      expect(result).toEqual({
        success: false,
        error: "Dostawca o tej nazwie już istnieje",
      });
      expect(mockPrisma.merchant.create).not.toHaveBeenCalled();
    });

    it("should return error for empty name", async () => {
      const result = await createMerchantCommand({ name: "" });

      expect(result).toEqual({
        success: false,
        error: "Nie udało się dodać dostawcy",
      });
      expect(mockPrisma.merchant.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.merchant.create).not.toHaveBeenCalled();
    });

    it("should create a merchant with NIP", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue(null);
      mockPrisma.merchant.create.mockResolvedValue({ id: 2 });

      const result = await createMerchantCommand({
        name: "Firma z NIP",
        nip: "9876543210",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.merchant.create).toHaveBeenCalledWith({
        data: {
          name: "Firma z NIP",
          nip: "9876543210",
          userId: "user-1",
        },
      });
    });
  });

  describe("updateMerchantCommand", () => {
    it("should update a merchant successfully", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue({
        id: 5,
        publicId: "merch-uuid",
      });
      mockPrisma.merchant.update.mockResolvedValue({});

      const result = await updateMerchantCommand({
        id: "merch-uuid",
        name: "Updated Merchant",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.merchant.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          name: "Updated Merchant",
          nip: null,
          logoUrl: null,
        },
      });
    });

    it("should return error if merchant not found", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue(null);

      const result = await updateMerchantCommand({
        id: "nonexistent",
        name: "Test",
      });

      expect(result).toEqual({
        success: false,
        error: "Dostawca nie został znaleziony",
      });
      expect(mockPrisma.merchant.update).not.toHaveBeenCalled();
    });

    it("should update merchant with all fields", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue({
        id: 5,
        publicId: "merch-uuid",
      });
      mockPrisma.merchant.update.mockResolvedValue({});

      const result = await updateMerchantCommand({
        id: "merch-uuid",
        name: "Full Update",
        nip: "1112223344",
        logoUrl: "https://example.com/logo.png",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.merchant.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          name: "Full Update",
          nip: "1112223344",
          logoUrl: "https://example.com/logo.png",
        },
      });
    });
  });

  describe("deleteMerchantCommand", () => {
    it("should delete a merchant and unlink transactions", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue({
        id: 8,
        publicId: "merch-uuid",
      });
      mockPrisma.transaction.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.merchant.delete.mockResolvedValue({});

      const result = await deleteMerchantCommand({ id: "merch-uuid" });

      expect(result).toEqual({ success: true });
      // Verify order: unlink transactions before deleting merchant
      const updateManyOrder =
        mockPrisma.transaction.updateMany.mock.invocationCallOrder[0];
      const deleteOrder =
        mockPrisma.merchant.delete.mock.invocationCallOrder[0];
      expect(updateManyOrder).toBeLessThan(deleteOrder);
      expect(mockPrisma.transaction.updateMany).toHaveBeenCalledWith({
        where: { merchantId: 8, userId: "user-1" },
        data: { merchantId: null },
      });
      expect(mockPrisma.merchant.delete).toHaveBeenCalledWith({
        where: { id: 8 },
      });
    });

    it("should return error if merchant not found", async () => {
      mockPrisma.merchant.findFirst.mockResolvedValue(null);

      const result = await deleteMerchantCommand({ id: "nonexistent" });

      expect(result).toEqual({
        success: false,
        error: "Dostawca nie został znaleziony",
      });
      expect(mockPrisma.merchant.delete).not.toHaveBeenCalled();
    });
  });
});
