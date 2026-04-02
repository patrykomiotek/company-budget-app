import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockRequireUser } = vi.hoisted(() => ({
  mockPrisma: {
    project: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
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
  findOrCreateProject,
  createProjectCommand,
  updateProjectCommand,
  deleteProjectCommand,
} from "../project-commands";

describe("project-commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireUser.mockResolvedValue({ id: "user-1" });
  });

  describe("findOrCreateProject", () => {
    it("should upsert and return the project id", async () => {
      mockPrisma.project.upsert.mockResolvedValue({ id: 42 });

      const result = await findOrCreateProject("Warsztaty React", "user-1");

      expect(result).toBe(42);
      expect(mockPrisma.project.upsert).toHaveBeenCalledWith({
        where: { name_userId: { name: "Warsztaty React", userId: "user-1" } },
        update: {},
        create: { name: "Warsztaty React", userId: "user-1" },
        select: { id: true },
      });
    });
  });

  describe("createProjectCommand", () => {
    it("should create a project successfully", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.project.create.mockResolvedValue({ id: 1 });

      const result = await createProjectCommand({
        name: "Nowy projekt",
        status: "ACTIVE",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: "Nowy projekt",
          status: "ACTIVE",
          customerId: null,
          userId: "user-1",
        },
      });
    });

    it("should return error if project name already exists", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 1 });

      const result = await createProjectCommand({
        name: "Istniejący",
        status: "ACTIVE",
      });

      expect(result).toEqual({
        success: false,
        error: "Projekt o tej nazwie już istnieje",
      });
    });

    it("should resolve customer by publicId", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 10 });
      mockPrisma.project.create.mockResolvedValue({ id: 1 });

      const result = await createProjectCommand({
        name: "Z klientem",
        status: "ACTIVE",
        customerPublicId: "cust-uuid",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ customerId: 10 }),
        }),
      );
    });

    it("should return error if customer not found", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      const result = await createProjectCommand({
        name: "Z klientem",
        status: "ACTIVE",
        customerPublicId: "nonexistent",
      });

      expect(result).toEqual({
        success: false,
        error: "Klient nie został znaleziony",
      });
    });
  });

  describe("updateProjectCommand", () => {
    it("should update a project successfully", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 5 });
      mockPrisma.project.update.mockResolvedValue({});

      const result = await updateProjectCommand({
        id: "proj-uuid",
        name: "Zaktualizowany",
        status: "COMPLETED",
      });

      expect(result).toEqual({ success: true });
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {
          name: "Zaktualizowany",
          status: "COMPLETED",
          customerId: null,
        },
      });
    });

    it("should return error if project not found", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const result = await updateProjectCommand({
        id: "nonexistent",
        name: "Test",
        status: "ACTIVE",
      });

      expect(result).toEqual({
        success: false,
        error: "Projekt nie został znaleziony",
      });
    });
  });

  describe("deleteProjectCommand", () => {
    it("should nullify transactions and delete project", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: 3 });
      mockPrisma.transaction.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.project.delete.mockResolvedValue({});

      const result = await deleteProjectCommand("proj-uuid");

      expect(result).toEqual({ success: true });
      expect(mockPrisma.transaction.updateMany).toHaveBeenCalledWith({
        where: { projectId: 3, userId: "user-1" },
        data: { projectId: null },
      });
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 3 },
      });
    });

    it("should return error if project not found", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      const result = await deleteProjectCommand("nonexistent");

      expect(result).toEqual({
        success: false,
        error: "Projekt nie został znaleziony",
      });
    });
  });
});
