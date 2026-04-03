"use client";

import { createContext, useContext, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveDepartment } from "@/shared/lib/department/helpers";

export interface DepartmentItem {
  id: string;
  name: string;
}

interface CompanyContextType {
  companies: DepartmentItem[];
  activeDepartmentId: string | null;
  switchDepartment: (publicId: string | null) => void;
  isSwitching: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  activeDepartmentId: null,
  switchDepartment: () => {},
  isSwitching: false,
});

export function useDepartment() {
  return useContext(CompanyContext);
}

interface DepartmentProviderProps {
  children: React.ReactNode;
  companies: DepartmentItem[];
  initialCompanyId: string | null;
}

export function DepartmentProvider({
  children,
  companies,
  initialCompanyId,
}: DepartmentProviderProps) {
  const router = useRouter();
  const [isSwitching, startTransition] = useTransition();

  function switchDepartment(publicId: string | null) {
    startTransition(async () => {
      try {
        await setActiveDepartment(publicId);
        router.refresh();
      } catch (error) {
        console.error("Failed to switch company:", error);
      }
    });
  }

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeDepartmentId: initialCompanyId,
        switchDepartment,
        isSwitching,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}
