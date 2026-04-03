"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changePasswordCommand } from "../services/commands/change-password-command";

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Nowe hasła nie są identyczne");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Nowe hasło musi mieć co najmniej 8 znaków");
      return;
    }

    setLoading(true);

    try {
      const result = await changePasswordCommand(currentPassword, newPassword);

      if (result.success) {
        toast.success("Hasło zostało zmienione");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Aktualne hasło</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 znaków"
              required
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">Powtórz nowe hasło</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Zapisywanie..." : "Zmień hasło"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
