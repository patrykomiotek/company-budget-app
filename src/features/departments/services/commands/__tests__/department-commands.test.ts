import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireUser } = vi.hoisted(() => ({
  mockPrisma: {
    department: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
  createDepartmentCommand,
  updateDepartmentCommand,
  deleteDepartmentCommand,
} from "../department-commands";

describe("department-commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
  });

  describe("createDepartmentCommand", () => {
    it("should create a department successfully", async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null);
      mockPrisma.department.create.mockResolvedValue({ id: 1 });

      const result = await createDepartmentCommand({ name: "Warszawa" });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.department.create).toHaveBeenCalledWith({
        data: { name: "Warszawa" },
      });
    });

    it("should return error if department name already exists", async () => {
      mockPrisma.department.findFirst.mockResolvedValue({ id: 1 });

      const result = await createDepartmentCommand({ name: "Warszawa" });

      expect(result).toEqual({
        success: false,
        error: "Oddział o tej nazwie już istnieje",
      });
    });

    it("should return error for empty name", async () => {
      const result = await createDepartmentCommand({ name: "" });

      expect(result).toEqual({
        success: false,
        error: "Nie udało się dodać oddziału",
      });
    });
  });

  describe("updateDepartmentCommand", () => {
    it("should update a department successfully", async () => {
      mockPrisma.department.findFirst
        .mockResolvedValueOnce({ id: 5, publicId: "dept-uuid" })
        .mockResolvedValueOnce(null);
      mockPrisma.department.update.mockResolvedValue({});

      const result = await updateDepartmentCommand({
        id: "dept-uuid",
        name: "Kraków",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.department.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { name: "Kraków" },
      });
    });

    it("should return error if department not found", async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null);

      const result = await updateDepartmentCommand({
        id: "nonexistent",
        name: "Test",
      });

      expect(result).toEqual({
        success: false,
        error: "Oddział nie został znaleziony",
      });
    });

    it("should return error if duplicate name exists", async () => {
      mockPrisma.department.findFirst
        .mockResolvedValueOnce({ id: 5, publicId: "dept-uuid" })
        .mockResolvedValueOnce({ id: 10, name: "Kraków" });

      const result = await updateDepartmentCommand({
        id: "dept-uuid",
        name: "Kraków",
      });

      expect(result).toEqual({
        success: false,
        error: "Oddział o tej nazwie już istnieje",
      });
    });
  });

  describe("deleteDepartmentCommand", () => {
    it("should delete a department with no relations", async () => {
      mockPrisma.department.findFirst.mockResolvedValue({
        id: 3,
        _count: { transactions: 0, employees: 0 },
      });
      mockPrisma.department.delete.mockResolvedValue({});

      const result = await deleteDepartmentCommand("dept-uuid");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.department.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });

    it("should return error if department not found", async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null);

      const result = await deleteDepartmentCommand("nonexistent");

      expect(result).toEqual({
        success: false,
        error: "Oddział nie został znaleziony",
      });
    });

    it("should return error if department has transactions", async () => {
      mockPrisma.department.findFirst.mockResolvedValue({
        id: 3,
        _count: { transactions: 5, employees: 0 },
      });

      const result = await deleteDepartmentCommand("dept-uuid");

      expect(result).toEqual({
        success: false,
        error: "Nie można usunąć oddziału z przypisanymi transakcjami",
      });
    });

    it("should return error if department has employees", async () => {
      mockPrisma.department.findFirst.mockResolvedValue({
        id: 3,
        _count: { transactions: 0, employees: 2 },
      });

      const result = await deleteDepartmentCommand("dept-uuid");

      expect(result).toEqual({
        success: false,
        error: "Nie można usunąć oddziału z przypisanymi pracownikami",
      });
    });
  });
});
