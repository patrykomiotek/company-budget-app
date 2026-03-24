'use server';

import { prisma } from '@/shared/lib/prisma';

export interface CompanyOption {
  id: string;
  name: string;
}

export async function getCompaniesQuery(): Promise<CompanyOption[]> {
  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
  });

  return companies.map((c) => ({
    id: c.publicId,
    name: c.name,
  }));
}
