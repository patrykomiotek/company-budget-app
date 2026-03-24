'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateEmployeeCommand } from '../services/commands/employee-commands';

interface EmployeeEditFormProps {
  employee: {
    id: string;
    name: string;
    companyName: string;
  };
}

export function EmployeeEditForm({ employee }: EmployeeEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(employee.name);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Podaj imię i nazwisko');
      return;
    }

    setLoading(true);
    try {
      const result = await updateEmployeeCommand({ id: employee.id, name: name.trim() });
      if (result.success) {
        toast.success('Osoba zaktualizowana');
        router.push('/employees');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Edytuj osobę</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię i nazwisko</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Firma</Label>
            <p className="text-sm text-muted-foreground">{employee.companyName}</p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Anuluj
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
