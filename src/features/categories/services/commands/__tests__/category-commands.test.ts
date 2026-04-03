import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireUser, mockGetActiveDepartmentId } = vi.hoisted(
  () => ({
    mockPrisma: {
      category: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      department: {
        findUnique: vi.fn(),
      },
      subcategory: {
        deleteMany: vi.fn(),
        delete: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      transaction: {
        count: vi.fn(),
      },
      $transaction: vi.fn(),
    },
    mockRequireUser: vi.fn(),
    mockGetActiveDepartmentId: vi.fn(),
  }),
);

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

import {
  createCategoryCommand,
  updateCategoryCommand,
  deleteCategoryCommand,
  reorderCategoriesCommand,
  quickCreateCategoryCommand,
} from "../category-commands";

describe("category-commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
    mockGetActiveDepartmentId.mockResolvedValue(null);
  });

  describe("createCategoryCommand", () => {
    it("should create a category with valid input", async () => {
      mockPrisma.category.create.mockResolvedValue({ id: 1 });

      const result = await createCategoryCommand({
        name: "Marketing",
        type: "EXPENSE",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Marketing",
          type: "EXPENSE",
          sortOrder: 0,
          departmentId: null,
          subcategories: undefined,
        },
      });
    });

    it("should create a category with departmentId", async () => {
      mockPrisma.department.findUnique.mockResolvedValue({ id: 5 });
      mockPrisma.category.create.mockResolvedValue({ id: 2 });

      const result = await createCategoryCommand({
        name: "Sprzedaz",
        type: "INCOME",
        departmentId: "dept-uuid",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.department.findUnique).toHaveBeenCalledWith({
        where: { publicId: "dept-uuid" },
        select: { id: true },
      });
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Sprzedaz",
          type: "INCOME",
          sortOrder: 0,
          departmentId: 5,
          subcategories: undefined,
        },
      });
    });

    it("should create a category with subcategories", async () => {
      mockPrisma.category.create.mockResolvedValue({ id: 3 });

      const result = await createCategoryCommand({
        name: "IT",
        type: "EXPENSE",
        subcategories: [
          { name: "Serwery", sortOrder: 0 },
          { name: "Licencje", sortOrder: 1 },
        ],
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "IT",
          type: "EXPENSE",
          sortOrder: 0,
          departmentId: null,
          subcategories: {
            create: [
              { name: "Serwery", sortOrder: 0 },
              { name: "Licencje", sortOrder: 1 },
            ],
          },
        },
      });
    });

    it("should return error for empty name", async () => {
      const result = await createCategoryCommand({
        name: "",
        type: "EXPENSE",
      });

      expect(result).toEqual({
        success: false,
        error: "Nie udało się utworzyć kategorii",
      });
    });

    it("should fail with Zod validation for empty name (via handleCommandError)", async () => {
      const result = await createCategoryCommand({
        name: "",
        type: "EXPENSE",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateCategoryCommand", () => {
    it("should update name and type", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 5,
        publicId: "cat-uuid",
        departmentId: null,
        sortOrder: 0,
        subcategories: [],
      });
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<void>) => {
          await fn({
            category: mockPrisma.category,
            subcategory: mockPrisma.subcategory,
            transaction: mockPrisma.transaction,
          });
        },
      );
      mockPrisma.category.update.mockResolvedValue({});

      const result = await updateCategoryCommand({
        id: "cat-uuid",
        name: "Marketing Updated",
        type: "INCOME",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          name: "Marketing Updated",
          type: "INCOME",
          sortOrder: 0,
          departmentId: null,
        },
      });
    });

    it("should update departmentId", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 5,
        publicId: "cat-uuid",
        departmentId: null,
        sortOrder: 0,
        subcategories: [],
      });
      mockPrisma.department.findUnique.mockResolvedValue({ id: 10 });
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<void>) => {
          await fn({
            category: mockPrisma.category,
            subcategory: mockPrisma.subcategory,
            transaction: mockPrisma.transaction,
          });
        },
      );
      mockPrisma.category.update.mockResolvedValue({});

      const result = await updateCategoryCommand({
        id: "cat-uuid",
        name: "Marketing",
        type: "EXPENSE",
        departmentId: "dept-uuid",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          name: "Marketing",
          type: "EXPENSE",
          sortOrder: 0,
          departmentId: 10,
        },
      });
    });

    it("should return error if category not found", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const result = await updateCategoryCommand({
        id: "nonexistent",
        name: "Test",
        type: "EXPENSE",
      });

      expect(result).toEqual({
        success: false,
        error: "Kategoria nie została znaleziona",
      });
    });

    it("should handle subcategory upsert and deletion", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 5,
        publicId: "cat-uuid",
        departmentId: null,
        sortOrder: 0,
        subcategories: [
          { id: 100, publicId: "sub-uuid-1", name: "Old Sub", sortOrder: 0 },
          {
            id: 101,
            publicId: "sub-uuid-2",
            name: "To Remove",
            sortOrder: 1,
          },
        ],
      });
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<void>) => {
          await fn({
            category: mockPrisma.category,
            subcategory: mockPrisma.subcategory,
            transaction: mockPrisma.transaction,
          });
        },
      );
      mockPrisma.category.update.mockResolvedValue({});
      mockPrisma.transaction.count.mockResolvedValue(0);
      mockPrisma.subcategory.delete.mockResolvedValue({});
      mockPrisma.subcategory.update.mockResolvedValue({});
      mockPrisma.subcategory.create.mockResolvedValue({});

      const result = await updateCategoryCommand({
        id: "cat-uuid",
        name: "Marketing",
        type: "EXPENSE",
        subcategories: [
          { id: "sub-uuid-1", name: "Updated Sub", sortOrder: 0 },
          { name: "New Sub", sortOrder: 1 },
        ],
      });

      expect(result).toEqual({ success: true });
      // sub-uuid-2 should be deleted (no transactions)
      expect(mockPrisma.subcategory.delete).toHaveBeenCalledWith({
        where: { id: 101 },
      });
      // sub-uuid-1 should be updated
      expect(mockPrisma.subcategory.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { name: "Updated Sub", sortOrder: 0 },
      });
      // New sub should be created
      expect(mockPrisma.subcategory.create).toHaveBeenCalledWith({
        data: { name: "New Sub", sortOrder: 1, categoryId: 5 },
      });
    });

    it("should skip deletion of subcategories with transactions", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 5,
        publicId: "cat-uuid",
        departmentId: null,
        sortOrder: 0,
        subcategories: [
          {
            id: 100,
            publicId: "sub-uuid-1",
            name: "Has Transactions",
            sortOrder: 0,
          },
        ],
      });
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<void>) => {
          await fn({
            category: mockPrisma.category,
            subcategory: mockPrisma.subcategory,
            transaction: mockPrisma.transaction,
          });
        },
      );
      mockPrisma.category.update.mockResolvedValue({});
      mockPrisma.transaction.count.mockResolvedValue(3);

      const result = await updateCategoryCommand({
        id: "cat-uuid",
        name: "Marketing",
        type: "EXPENSE",
        subcategories: [],
      });

      expect(result).toEqual({
        success: true,
        error: "Nie usunięto podkategorii z transakcjami: Has Transactions",
      });
      expect(mockPrisma.subcategory.delete).not.toHaveBeenCalled();
    });
  });

  describe("deleteCategoryCommand", () => {
    it("should delete category with no transactions in subcategories", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 3,
        publicId: "cat-uuid",
        subcategories: [
          {
            id: 10,
            publicId: "sub-1",
            _count: { transactions: 0 },
          },
        ],
      });
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<void>) => {
          await fn({
            subcategory: mockPrisma.subcategory,
            category: mockPrisma.category,
          });
        },
      );
      mockPrisma.subcategory.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.category.delete.mockResolvedValue({});

      const result = await deleteCategoryCommand("cat-uuid");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.subcategory.deleteMany).toHaveBeenCalledWith({
        where: { categoryId: 3 },
      });
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });

    it("should return error if category not found", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      const result = await deleteCategoryCommand("nonexistent");

      expect(result).toEqual({
        success: false,
        error: "Kategoria nie została znaleziona",
      });
    });

    it("should return error if subcategories have transactions", async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 3,
        publicId: "cat-uuid",
        subcategories: [
          {
            id: 10,
            publicId: "sub-1",
            _count: { transactions: 5 },
          },
        ],
      });

      const result = await deleteCategoryCommand("cat-uuid");

      expect(result).toEqual({
        success: false,
        error:
          "Nie można usunąć kategorii, ponieważ posiada podkategorie z przypisanymi transakcjami",
      });
    });
  });

  describe("reorderCategoriesCommand", () => {
    it("should update sort order for categories", async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<void>) => {
          await fn({
            category: mockPrisma.category,
            subcategory: mockPrisma.subcategory,
          });
        },
      );
      mockPrisma.category.update.mockResolvedValue({});

      const result = await reorderCategoriesCommand({
        categories: [
          { id: "cat-1", sortOrder: 0 },
          { id: "cat-2", sortOrder: 1 },
        ],
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.category.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { publicId: "cat-1" },
        data: { sortOrder: 0 },
      });
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { publicId: "cat-2" },
        data: { sortOrder: 1 },
      });
    });

    it("should update sort order for subcategories too", async () => {
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: unknown) => Promise<void>) => {
          await fn({
            category: mockPrisma.category,
            subcategory: mockPrisma.subcategory,
          });
        },
      );
      mockPrisma.category.update.mockResolvedValue({});
      mockPrisma.subcategory.update.mockResolvedValue({});

      const result = await reorderCategoriesCommand({
        categories: [{ id: "cat-1", sortOrder: 0 }],
        subcategories: [
          { id: "sub-1", sortOrder: 0 },
          { id: "sub-2", sortOrder: 1 },
        ],
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.subcategory.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.subcategory.update).toHaveBeenCalledWith({
        where: { publicId: "sub-1" },
        data: { sortOrder: 0 },
      });
      expect(mockPrisma.subcategory.update).toHaveBeenCalledWith({
        where: { publicId: "sub-2" },
        data: { sortOrder: 1 },
      });
    });
  });

  describe("quickCreateCategoryCommand", () => {
    it("should create category with auto department from active department", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(7);
      mockPrisma.category.create.mockResolvedValue({
        publicId: "new-cat-uuid",
        name: "Nowa kategoria",
        type: "EXPENSE",
        sortOrder: 0,
        department: { publicId: "dept-uuid", name: "Warszawa" },
        subcategories: [
          { publicId: "sub-uuid", name: "Nowa kategoria", sortOrder: 0 },
        ],
      });

      const result = await quickCreateCategoryCommand({
        name: "Nowa kategoria",
        type: "EXPENSE",
      });

      expect(result).toEqual({
        success: true,
        data: {
          id: "new-cat-uuid",
          name: "Nowa kategoria",
          type: "EXPENSE",
          sortOrder: 0,
          departmentId: "dept-uuid",
          departmentName: "Warszawa",
          subcategories: [
            {
              id: "sub-uuid",
              name: "Nowa kategoria",
              sortOrder: 0,
              categoryId: "new-cat-uuid",
            },
          ],
        },
      });
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Nowa kategoria",
          type: "EXPENSE",
          departmentId: 7,
          subcategories: {
            create: [{ name: "Nowa kategoria", sortOrder: 0 }],
          },
        },
        include: {
          department: { select: { publicId: true, name: true } },
          subcategories: true,
        },
      });
    });

    it("should use category name as default subcategory when no subcategoryNames", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        publicId: "cat-uuid",
        name: "Przychody",
        type: "INCOME",
        sortOrder: 0,
        department: null,
        subcategories: [
          { publicId: "sub-uuid", name: "Przychody", sortOrder: 0 },
        ],
      });

      await quickCreateCategoryCommand({
        name: "Przychody",
        type: "INCOME",
      });

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subcategories: {
              create: [{ name: "Przychody", sortOrder: 0 }],
            },
          }),
        }),
      );
    });

    it("should create with custom subcategory names", async () => {
      mockGetActiveDepartmentId.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        publicId: "cat-uuid",
        name: "IT",
        type: "EXPENSE",
        sortOrder: 0,
        department: null,
        subcategories: [
          { publicId: "sub-1", name: "Serwery", sortOrder: 0 },
          { publicId: "sub-2", name: "Licencje", sortOrder: 1 },
        ],
      });

      await quickCreateCategoryCommand({
        name: "IT",
        type: "EXPENSE",
        subcategoryNames: ["Serwery", "Licencje"],
      });

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subcategories: {
              create: [
                { name: "Serwery", sortOrder: 0 },
                { name: "Licencje", sortOrder: 1 },
              ],
            },
          }),
        }),
      );
    });

    it("should return error for empty name", async () => {
      const result = await quickCreateCategoryCommand({
        name: "",
        type: "EXPENSE",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
