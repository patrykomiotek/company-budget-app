'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Receipt, PlusCircle, Store, User, LogOut } from 'lucide-react';
import { authClient } from '@/shared/lib/auth/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transakcje', icon: Receipt },
  { href: '/transactions/new', label: 'Dodaj', icon: PlusCircle },
  { href: '/merchants', label: 'Sprzedawcy', icon: Store },
  { href: '/account', label: 'Konto', icon: User },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await authClient.signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <aside className="w-64 border-r bg-card min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Budżet</h1>
        <p className="text-xs text-muted-foreground">Kontrola wydatków</p>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <Button
        variant="ghost"
        className="justify-start gap-3"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Wyloguj
      </Button>
    </aside>
  );
}
