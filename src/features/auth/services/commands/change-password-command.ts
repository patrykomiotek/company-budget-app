"use server";

import { headers } from "next/headers";
import { auth } from "@/shared/lib/auth";

export async function changePasswordCommand(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { success: false, error: "Sesja wygasła. Zaloguj się ponownie." };
    }

    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Nie udało się zmienić hasła. Sprawdź aktualne hasło.",
    };
  }
}
