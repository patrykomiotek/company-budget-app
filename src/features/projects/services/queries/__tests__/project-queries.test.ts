import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireUser, mockGetActiveCompanyFilter, mockPrisma } = vi.hoisted(
  () => ({
    mockRequireUser: vi.fn(),
    mockGetActiveCompanyFilter: vi.fn(),
    mockPrisma: {
      project: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      transaction: {
        findMany: vi.fn(),
      },
      transactionLineItem: {
        findMany: vi.fn(),
      },
    },
  }),
);

vi.mock("@/shared/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/shared/lib/auth/helpers", () => ({
  requireUser: () => mockRequireUser(),
}));

vi.mock("@/shared/lib/department/helpers", () => ({
  getActiveDepartmentFilter: () => mockGetActiveCompanyFilter(),
}));

import {
  getProjectsForSelectQuery,
  getProjectsListQuery,
  getProjectByIdQuery,
  getProjectStatsQuery,
} from "../project-queries";

describe("project-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
    mockGetActiveCompanyFilter.mockResolvedValue({});
    mockPrisma.transactionLineItem.findMany.mockResolvedValue([]);
  });

  describe("getProjectsForSelectQuery", () => {
    it("should return projects mapped with publicId as id", async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { publicId: "uuid-1", name: "Projekt A", status: "ACTIVE" },
        { publicId: "uuid-2", name: "Projekt B", status: "COMPLETED" },
      ]);

      const result = await getProjectsForSelectQuery();

      expect(result).toEqual([
        { id: "uuid-1", name: "Projekt A", status: "ACTIVE" },
        { id: "uuid-2", name: "Projekt B", status: "COMPLETED" },
      ]);
    });
  });

  describe("getProjectsListQuery", () => {
    it("should aggregate income and costs from transactions", async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          publicId: "uuid-1",
          name: "Warsztaty",
          status: "ACTIVE",
          customer: { name: "Klient X" },
          transactions: [
            { type: "INCOME", amount: "5000", exchangeRate: null },
            { type: "EXPENSE", amount: "2000", exchangeRate: null },
            { type: "INCOME", amount: "1000", exchangeRate: "4.50" },
          ],
        },
      ]);

      const result = await getProjectsListQuery();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Warsztaty");
      expect(result[0].totalIncome).toBe(9500); // 5000 + 1000*4.5
      expect(result[0].totalCosts).toBe(2000);
      expect(result[0].profit).toBe(7500);
      expect(result[0].transactionCount).toBe(3);
      expect(result[0].customerName).toBe("Klient X");
    });

    it("should filter by status", async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);

      await getProjectsListQuery("COMPLETED");

      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "COMPLETED" }),
        }),
      );
    });
  });

  describe("getProjectByIdQuery", () => {
    it("should return project detail with customer info", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        publicId: "uuid-1",
        name: "Warsztaty",
        status: "ACTIVE",
        customer: { publicId: "cust-uuid", name: "Klient X" },
        createdAt: new Date("2026-01-01"),
      });

      const result = await getProjectByIdQuery("uuid-1");

      expect(result).toEqual({
        id: "uuid-1",
        name: "Warsztaty",
        status: "ACTIVE",
        customerId: "cust-uuid",
        customerName: "Klient X",
        createdAt: "2026-01-01T00:00:00.000Z",
      });
    });

    it("should return null if not found", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const result = await getProjectByIdQuery("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getProjectStatsQuery", () => {
    it("should calculate stats with income, costs, profit, and margin", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 1,
        customerId: null,
      });

      mockPrisma.transaction.findMany.mockResolvedValue([
        { type: "INCOME", amount: "10000", exchangeRate: null },
        { type: "EXPENSE", amount: "3000", exchangeRate: null },
        { type: "EXPENSE", amount: "2000", exchangeRate: null },
      ]);

      const result = await getProjectStatsQuery("uuid-1", "current_month");

      expect(result.totalIncome).toBe(10000);
      expect(result.totalCosts).toBe(5000);
      expect(result.profit).toBe(5000);
      expect(result.margin).toBe(50);
      expect(result.transactionCount).toBe(3);
      expect(result.averageTransactionValue).toBe(5000); // 15000/3
      expect(result.customerLtv).toBeNull();
      expect(result.customerAcquisitionCost).toBeNull();
    });

    it("should return empty stats if project not found", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const result = await getProjectStatsQuery("nonexistent", "current_month");

      expect(result.totalIncome).toBe(0);
      expect(result.totalCosts).toBe(0);
      expect(result.transactionCount).toBe(0);
    });

    it("should calculate customer LTV and acquisition cost when customer is linked", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 1,
        customerId: 10,
      });

      // First call: project transactions (for interval stats)
      // Second call: customer transactions across all projects (for LTV)
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([
          { type: "INCOME", amount: "5000", exchangeRate: null },
        ])
        .mockResolvedValueOnce([
          { type: "INCOME", amount: "5000", exchangeRate: null },
          { type: "INCOME", amount: "8000", exchangeRate: null },
          { type: "EXPENSE", amount: "1500", exchangeRate: null },
        ]);

      const result = await getProjectStatsQuery("uuid-1", "current_year");

      expect(result.customerLtv).toBe(13000); // 5000 + 8000
      expect(result.customerAcquisitionCost).toBe(1500);
    });

    it("should handle currency conversion in stats", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({
        id: 1,
        customerId: null,
      });

      mockPrisma.transaction.findMany.mockResolvedValue([
        { type: "INCOME", amount: "1000", exchangeRate: "4.50" },
      ]);

      const result = await getProjectStatsQuery("uuid-1", "current_month");

      expect(result.totalIncome).toBe(4500); // 1000 * 4.5
    });
  });
});
