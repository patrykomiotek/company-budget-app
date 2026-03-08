import { requireUser } from '@/shared/lib/auth/helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Konto</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dane użytkownika</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Imię</p>
            <p className="font-medium">{user.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
