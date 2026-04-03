import { redirect } from "next/navigation";
import { getCurrentUser } from "@/shared/lib/auth/helpers";
import { AppSidebar, SidebarProvider } from "@/components/app-sidebar";
import { DepartmentProvider } from "@/shared/context/department-context";
import { getDepartmentsQuery } from "@/shared/lib/department/queries";
import { getActiveDepartmentPublicId } from "@/shared/lib/department/helpers";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [companies, activeDepartmentId] = await Promise.all([
    getDepartmentsQuery(),
    getActiveDepartmentPublicId(),
  ]);

  return (
    <DepartmentProvider
      companies={companies}
      initialCompanyId={activeDepartmentId}
    >
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 min-w-0 p-6">{children}</main>
          <Toaster />
        </div>
      </SidebarProvider>
    </DepartmentProvider>
  );
}
