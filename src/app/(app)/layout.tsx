import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/shared/lib/auth/helpers';
import { AppSidebar, SidebarProvider } from '@/components/app-sidebar';
import { CompanyProvider } from '@/shared/context/company-context';
import { getCompaniesQuery } from '@/shared/lib/company/queries';
import { getActiveCompanyPublicId } from '@/shared/lib/company/helpers';
import { Toaster } from '@/components/ui/sonner';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const [companies, activeCompanyId] = await Promise.all([
    getCompaniesQuery(),
    getActiveCompanyPublicId(),
  ]);

  return (
    <CompanyProvider companies={companies} initialCompanyId={activeCompanyId}>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 p-6">{children}</main>
          <Toaster />
        </div>
      </SidebarProvider>
    </CompanyProvider>
  );
}
