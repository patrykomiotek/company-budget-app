"use server";

import { cookies } from "next/headers";
import { prisma } from "@/shared/lib/prisma";

const COMPANY_COOKIE = "active-company";

export async function setActiveCompany(publicId: string | null): Promise<void> {
  const cookieStore = await cookies();
  if (publicId) {
    cookieStore.set(COMPANY_COOKIE, publicId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete(COMPANY_COOKIE);
  }
}

export async function getActiveCompanyPublicId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COMPANY_COOKIE)?.value ?? null;
}

export async function getActiveCompanyId(): Promise<number | null> {
  const publicId = await getActiveCompanyPublicId();
  if (!publicId) {
    return null;
  }

  const company = await prisma.company.findUnique({
    where: { publicId },
    select: { id: true },
  });

  return company?.id ?? null;
}

export async function getActiveCompanyFilter(): Promise<{
  companyId?: number;
}> {
  const companyId = await getActiveCompanyId();
  if (companyId === null) {
    return {};
  }
  return { companyId };
}
