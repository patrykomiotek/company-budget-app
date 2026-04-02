"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Store,
  Briefcase,
  Tags,
  Users,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Building2,
  FolderKanban,
  PackageOpen,
  ChevronUp,
  Settings,
  User,
} from "lucide-react";
import { authClient } from "@/shared/lib/auth/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCompany } from "@/shared/context/company-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transakcje", icon: Receipt },
  { href: "/categories", label: "Kategorie", icon: Tags },
  { href: "/customers", label: "Klienci", icon: Briefcase },
  { href: "/projects", label: "Projekty", icon: FolderKanban },
  { href: "/products", label: "Usługi", icon: PackageOpen },
  { href: "/merchants", label: "Dostawcy", icon: Store },
  { href: "/employees", label: "Współpracownicy", icon: Users },
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
  const { companies, activeCompanyId, switchCompany, isSwitching } =
    useCompany();
  const { data: session } = authClient.useSession();

  const userName = session?.user?.name || "Użytkownik";
  const userEmail = session?.user?.email || "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <aside
      className={cn(
        "border-r bg-card min-h-screen p-4 flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold">Budżet</h1>
            <p className="text-xs text-muted-foreground">Dashboard finansowy</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Rozwiń menu" : "Zwiń menu"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {collapsed ? (
        <Button
          variant="outline"
          size="icon"
          className="mb-4"
          title={
            activeCompanyId
              ? (companies.find((c) => c.id === activeCompanyId)?.name ??
                "Wszystko")
              : "Wszystko"
          }
          onClick={() => {
            const currentIndex = activeCompanyId
              ? companies.findIndex((c) => c.id === activeCompanyId)
              : -1;
            const nextIndex = (currentIndex + 1) % (companies.length + 1);
            switchCompany(
              nextIndex < companies.length ? companies[nextIndex].id : null,
            );
          }}
        >
          <Building2 className="h-4 w-4" />
        </Button>
      ) : (
        <Select
          value={activeCompanyId ?? "all"}
          onValueChange={(value) =>
            switchCompany(value === "all" ? null : value)
          }
          disabled={isSwitching}
        >
          <SelectTrigger className="mb-4">
            <span>
              {activeCompanyId
                ? (companies.find((c) => c.id === activeCompanyId)?.name ??
                  "Wybierz firmę")
                : "Wszystko"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystko</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center rounded-md text-sm transition-colors",
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        ))}
      </nav>

      <Popover>
        <PopoverTrigger
          className={cn(
            "flex items-center rounded-md text-sm transition-colors hover:bg-muted w-full",
            collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
          )}
          title={collapsed ? userName : undefined}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
            {initials}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left min-w-0">
                <span className="block text-sm font-medium truncate">
                  {userName}
                </span>
              </span>
              <ChevronUp className="h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-56 p-1">
          {userEmail && (
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              {userEmail}
            </div>
          )}
          <div className="h-px bg-border my-1" />
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            Konto
          </Link>
          <div className="h-px bg-border my-1" />
          <button
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Wyloguj
          </button>
        </PopoverContent>
      </Popover>
    </aside>
  );
}
