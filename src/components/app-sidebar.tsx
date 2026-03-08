'use client';

import { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Receipt, PlusCircle, Store, Tags, User, LogOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import { authClient } from '@/shared/lib/auth/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transakcje', icon: Receipt },
  { href: '/transactions/new', label: 'Dodaj', icon: PlusCircle },
  { href: '/categories', label: 'Kategorie', icon: Tags },
  { href: '/merchants', label: 'Sprzedawcy', icon: Store },
  { href: '/account', label: 'Konto', icon: User },
];

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();

  async function handleLogout() {
    try {
      await authClient.signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <aside
      className={cn(
        'border-r bg-card min-h-screen p-4 flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('mb-8 flex items-center', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold">Budżet</h1>
            <p className="text-xs text-muted-foreground">Kontrola wydatków</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center rounded-md text-sm transition-colors',
              collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      <Button
        variant="ghost"
        className={cn(
          collapsed ? 'justify-center px-2' : 'justify-start gap-3'
        )}
        title={collapsed ? 'Wyloguj' : undefined}
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && 'Wyloguj'}
      </Button>
    </aside>
  );
}
