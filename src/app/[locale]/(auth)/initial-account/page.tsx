import { redirect } from "next/navigation";
import { InitialAccountForm } from "@/features/auth/components/initial-account-form";
import { checkInitialSetupNeeded } from "@/features/auth/services/commands/initial-account-commands";

export const dynamic = "force-dynamic";

export default async function InitialAccountPage() {
  const setupNeeded = await checkInitialSetupNeeded();

  if (!setupNeeded) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Dashboard finansowy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfiguracja początkowa
          </p>
        </div>
        <InitialAccountForm />
      </div>
    </div>
  );
}
