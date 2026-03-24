'use client';

import { createContext, useContext, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveCompany } from '@/shared/lib/company/helpers';

export interface CompanyItem {
  id: string;
  name: string;
}

interface CompanyContextType {
  companies: CompanyItem[];
  activeCompanyId: string | null;
  switchCompany: (publicId: string | null) => void;
  isSwitching: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  activeCompanyId: null,
  switchCompany: () => {},
  isSwitching: false,
});

export function useCompany() {
  return useContext(CompanyContext);
}

interface CompanyProviderProps {
  children: React.ReactNode;
  companies: CompanyItem[];
  initialCompanyId: string | null;
}

export function CompanyProvider({
  children,
  companies,
  initialCompanyId,
}: CompanyProviderProps) {
  const router = useRouter();
  const [isSwitching, startTransition] = useTransition();

  function switchCompany(publicId: string | null) {
    startTransition(async () => {
      try {
        await setActiveCompany(publicId);
        router.refresh();
      } catch (error) {
        console.error('Failed to switch company:', error);
      }
    });
  }

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompanyId: initialCompanyId,
        switchCompany,
        isSwitching,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
