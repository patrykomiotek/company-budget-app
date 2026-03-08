import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/shared/lib/auth/helpers';
import { AppSidebar } from '@/components/app-sidebar';
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

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6">{children}</main>
      <Toaster />
    </div>
  );
}
