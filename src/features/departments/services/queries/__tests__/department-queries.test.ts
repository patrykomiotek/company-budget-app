import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireUser } = vi.hoisted(() => ({
  mockPrisma: {
    department: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
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

import {
  getDepartmentsListQuery,
  getDepartmentByIdQuery,
} from "../department-queries";

describe("department-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
  });

  describe("getDepartmentsListQuery", () => {
    it("should return mapped department list items", async () => {
      mockPrisma.department.findMany.mockResolvedValue([
        {
          publicId: "uuid-1",
          name: "Warszawa",
          _count: { transactions: 10, employees: 3, categories: 5 },
        },
        {
          publicId: "uuid-2",
          name: "Kraków",
          _count: { transactions: 2, employees: 1, categories: 3 },
        },
      ]);

      const result = await getDepartmentsListQuery();

      expect(result).toEqual([
        {
          id: "uuid-1",
          name: "Warszawa",
          categoryCount: 5,
          employeeCount: 3,
          transactionCount: 10,
        },
        {
          id: "uuid-2",
          name: "Kraków",
          categoryCount: 3,
          employeeCount: 1,
          transactionCount: 2,
        },
      ]);
      expect(mockPrisma.department.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { transactions: true, employees: true, categories: true },
          },
        },
        orderBy: { name: "asc" },
      });
    });

    it("should return empty array when no departments", async () => {
      mockPrisma.department.findMany.mockResolvedValue([]);

      const result = await getDepartmentsListQuery();

      expect(result).toEqual([]);
    });
  });

  describe("getDepartmentByIdQuery", () => {
    it("should return department by publicId", async () => {
      mockPrisma.department.findFirst.mockResolvedValue({
        publicId: "uuid-1",
        name: "Warszawa",
      });

      const result = await getDepartmentByIdQuery("uuid-1");

      expect(result).toEqual({ id: "uuid-1", name: "Warszawa" });
      expect(mockPrisma.department.findFirst).toHaveBeenCalledWith({
        where: { publicId: "uuid-1" },
      });
    });

    it("should return null when department not found", async () => {
      mockPrisma.department.findFirst.mockResolvedValue(null);

      const result = await getDepartmentByIdQuery("nonexistent");

      expect(result).toBeNull();
    });
  });
});
