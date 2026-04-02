"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateMerchantCommand } from "../services/commands/merchant-commands";

interface MerchantEditFormProps {
  merchant: {
    id: string;
    name: string;
    nip: string | null;
    logoUrl: string | null;
  };
}

export function MerchantEditForm({ merchant }: MerchantEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(merchant.name);
  const [nip, setNip] = useState(merchant.nip || "");
  const [logoUrl, setLogoUrl] = useState(merchant.logoUrl || "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateMerchantCommand({
        id: merchant.id,
        name,
        nip: nip || undefined,
        logoUrl: logoUrl || undefined,
      });

      if (result.success) {
        toast.success("Dostawca zaktualizowany");
        router.push("/merchants");
        router.refresh();
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
        <CardTitle>Edytuj dostawcę</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
              <AvatarFallback className="text-lg">
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">Podgląd logo</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nazwa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nip">NIP (opcjonalnie)</Label>
            <Input
              id="nip"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              placeholder="np. 1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL logo (opcjonalnie)</Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Zapisywanie..." : "Zapisz"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
