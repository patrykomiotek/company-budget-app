"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCustomerCommand } from "../services/commands/customer-commands";

interface CustomerEditFormProps {
  customer: {
    id: string;
    name: string;
    displayName: string | null;
    nip: string | null;
    street: string | null;
    postalCode: string | null;
    city: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
    isVip: boolean;
  };
}

export function CustomerEditForm({ customer }: CustomerEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(customer.name);
  const [displayName, setDisplayName] = useState(customer.displayName || "");
  const [nip, setNip] = useState(customer.nip || "");
  const [street, setStreet] = useState(customer.street || "");
  const [postalCode, setPostalCode] = useState(customer.postalCode || "");
  const [city, setCity] = useState(customer.city || "");
  const [email, setEmail] = useState(customer.email || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [notes, setNotes] = useState(customer.notes || "");
  const [isVip, setIsVip] = useState(customer.isVip);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateCustomerCommand({
        id: customer.id,
        name,
        displayName: displayName || undefined,
        nip: nip || undefined,
        street: street || undefined,
        postalCode: postalCode || undefined,
        city: city || undefined,
        email: email || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
        isVip,
      });
      if (result.success) {
        toast.success("Klient zaktualizowany");
        router.push("/customers");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Edytuj klienta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nazwa firmy</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="displayName">
                Nazwa wyświetlana (opcjonalnie)
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="np. Diversey"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Ulica</Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal">Kod pocztowy</Label>
              <Input
                id="postal"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => setIsVip(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm font-medium">Klient VIP</span>
              </label>
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notatki</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
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
