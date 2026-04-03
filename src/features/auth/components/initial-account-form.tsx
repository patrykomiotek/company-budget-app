"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/shared/lib/auth/client";
import { setupInitialAdminCommand } from "../services/commands/initial-account-commands";

export function InitialAccountForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Hasła nie są identyczne");
      return;
    }

    if (password.length < 8) {
      toast.error("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    setLoading(true);

    try {
      const signUpResult = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (signUpResult.error) {
        toast.error(
          signUpResult.error.message ?? "Nie udało się utworzyć konta",
        );
        return;
      }

      const userId = signUpResult.data?.user?.id;
      if (!userId) {
        toast.error("Nie udało się utworzyć konta");
        return;
      }

      const setupResult = await setupInitialAdminCommand(userId);

      if (setupResult.success) {
        toast.success("Konto administratora utworzone");
        // Sign in after setup
        await authClient.signIn.email({ email, password });
        router.push("/dashboard");
      } else {
        toast.error(setupResult.error);
      }
    } catch {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">
          Utwórz konto administratora
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię i nazwisko</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jan Kowalski"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@firma.pl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 znaków"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Powtórz hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Powtórz hasło"
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Tworzenie konta..." : "Utwórz konto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
