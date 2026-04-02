"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createCustomerCommand } from "../services/commands/customer-commands";

export function CreateCustomerButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nip, setNip] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setName("");
    setDisplayName("");
    setNip("");
    setStreet("");
    setPostalCode("");
    setCity("");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      const result = await createCustomerCommand({
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        nip: nip.trim() || undefined,
        street: street.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        city: city.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (result.success) {
        toast.success("Klient dodany");
        reset();
        setOpen(false);
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
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Dodaj
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowy klient</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="cust-name">Nazwa firmy</Label>
                <Input
                  id="cust-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Altkom Akademia"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="cust-display">
                  Nazwa wyświetlana (opcjonalnie)
                </Label>
                <Input
                  id="cust-display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="np. Altkom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-nip">NIP</Label>
                <Input
                  id="cust-nip"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="np. 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-phone">Telefon</Label>
                <Input
                  id="cust-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-city">Miasto</Label>
                <Input
                  id="cust-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-street">Ulica</Label>
                <Input
                  id="cust-street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-postal">Kod pocztowy</Label>
                <Input
                  id="cust-postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="00-000"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="cust-notes">Notatki</Label>
                <Textarea
                  id="cust-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Dodawanie..." : "Dodaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
