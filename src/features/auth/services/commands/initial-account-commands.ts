"use server";

import { prisma } from "@/shared/lib/prisma";
import { handleCommandError } from "@/shared/utils/error-handling";
import type { OperationResult } from "@/shared/types/common";

export async function checkInitialSetupNeeded(): Promise<boolean> {
  const adminCount = await prisma.user.count({
    where: { role: "admin" },
  });
  return adminCount === 0;
}

export async function setupInitialAdminCommand(
  userId: string,
): Promise<OperationResult> {
  try {
    const existingAdmins = await prisma.user.count({
      where: { role: "admin" },
    });

    if (existingAdmins > 0) {
      return {
        success: false,
        error: "Konto administratora już istnieje",
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: "Użytkownik nie został znaleziony",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import("@/shared/lib/mailer");
      const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
        loginUrl: `${baseUrl}/dashboard`,
      });
    } catch {
      // Don't fail if email sending fails
      console.error("[SETUP] Failed to send welcome email");
    }

    return { success: true };
  } catch (error) {
    return handleCommandError(
      error,
      "Nie udało się skonfigurować konta administratora",
    );
  }
}
