import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockGetActiveDepartmentId } = vi.hoisted(() => ({
  mockPrisma: {
    category: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
  mockGetActiveDepartmentId: vi.fn(),
}));

vi.mock("@/shared/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/shared/lib/department/helpers", () => ({
  getActiveDepartmentId: () => mockGetActiveDepartmentId(),
}));

import { getCategoriesQuery, getCategoryByIdQuery } from "../category-queries";

describe("category-queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategoryByIdQuery", () => {
    it("should return category with department info and subcategories", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        publicId: "cat-uuid-1",
        name: "Marketing",
        type: "EXPENSE",
        sortOrder: 0,
        department: { publicId: "dept-uuid-1", name: "Warszawa" },
        subcategories: [
          { publicId: "sub-uuid-1", name: "Reklamy", sortOrder: 0 },
          { publicId: "sub-uuid-2", name: "SEO", sortOrder: 1 },
        ],
      });

      const result = await getCategoryByIdQuery("cat-uuid-1");

      expect(result).toEqual({
        id: "cat-uuid-1",
        name: "Marketing",
        type: "EXPENSE",
        sortOrder: 0,
        departmentId: "dept-uuid-1",
        departmentName: "Warszawa",
        subcategories: [
          {
            id: "sub-uuid-1",
            name: "Reklamy",
            sortOrder: 0,
            categoryId: "cat-uuid-1",
          },
          {
            id: "sub-uuid-2",
            name: "SEO",
            sortOrder: 1,
            categoryId: "cat-uuid-1",
          },
        ],
      });
      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { publicId: "cat-uuid-1" },
        include: {
          department: { select: { publicId: true, name: true } },
          subcategories: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    });

    it("should return category without department", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        publicId: "cat-uuid-2",
        name: "Przychody",
        type: "INCOME",
        sortOrder: 1,
        department: null,
        subcategories: [],
      });

      const result = await getCategoryByIdQuery("cat-uuid-2");

      expect(result).toEqual({
        id: "cat-uuid-2",
        name: "Przychody",
        type: "INCOME",
        sortOrder: 1,
        departmentId: null,
        departmentName: null,
        subcategories: [],
      });
    });

    it("should return null when category not found", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const result = await getCategoryByIdQuery("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getCategoriesQuery", () => {
    const mockCategories = [
      {
        publicId: "cat-uuid-1",
        name: "Marketing",
        type: "EXPENSE",
        sortOrder: 0,
        department: { publicId: "dept-uuid-1", name: "Warszawa" },
        subcategories: [
          { publicId: "sub-uuid-1", name: "Reklamy", sortOrder: 0 },
        ],
      },
      {
        publicId: "cat-uuid-2",
        name: "Sprzedaz",
        type: "INCOME",
        sortOrder: 1,
        department: null,
        subcategories: [],
      },
    ];

    it("should return all categories when no department active", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(null);
      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await getCategoriesQuery();

      expect(result).toEqual([
        {
          id: "cat-uuid-1",
          name: "Marketing",
          type: "EXPENSE",
          sortOrder: 0,
          departmentId: "dept-uuid-1",
          departmentName: "Warszawa",
          subcategories: [
            {
              id: "sub-uuid-1",
              name: "Reklamy",
              sortOrder: 0,
              categoryId: "cat-uuid-1",
            },
          ],
        },
        {
          id: "cat-uuid-2",
          name: "Sprzedaz",
          type: "INCOME",
          sortOrder: 1,
          departmentId: null,
          departmentName: null,
          subcategories: [],
        },
      ]);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          department: { select: { publicId: true, name: true } },
          subcategories: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    });

    it("should filter by department when department active (global + department)", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(5);
      mockPrisma.category.findMany.mockResolvedValue([mockCategories[0]]);

      const result = await getCategoriesQuery();

      expect(result).toHaveLength(1);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ departmentId: null }, { departmentId: 5 }],
        },
        include: {
          department: { select: { publicId: true, name: true } },
          subcategories: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    });

    it("should filter by type when type provided", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(null);
      mockPrisma.category.findMany.mockResolvedValue([mockCategories[0]]);

      const result = await getCategoriesQuery("EXPENSE");

      expect(result).toHaveLength(1);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: { type: "EXPENSE" },
        include: {
          department: { select: { publicId: true, name: true } },
          subcategories: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    });

    it("should filter by both type and department", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(3);
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await getCategoriesQuery("INCOME");

      expect(result).toEqual([]);
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
        where: {
          type: "INCOME",
          OR: [{ departmentId: null }, { departmentId: 3 }],
        },
        include: {
          department: { select: { publicId: true, name: true } },
          subcategories: {
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    });

    it("should return empty array when no categories", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(null);
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await getCategoriesQuery();

      expect(result).toEqual([]);
    });
  });
});
