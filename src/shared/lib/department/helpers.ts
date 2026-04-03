"use server";

import { cookies } from "next/headers";
import { prisma } from "@/shared/lib/prisma";

const DEPARTMENT_COOKIE = "active-department";

export async function setActiveDepartment(
  publicId: string | null,
): Promise<void> {
  const cookieStore = await cookies();
  if (publicId) {
    cookieStore.set(DEPARTMENT_COOKIE, publicId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    cookieStore.delete(DEPARTMENT_COOKIE);
  }
}

export async function getActiveDepartmentPublicId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(DEPARTMENT_COOKIE)?.value ?? null;
}

export async function getActiveDepartmentId(): Promise<number | null> {
  const publicId = await getActiveDepartmentPublicId();
  if (!publicId) {
    return null;
  }

  const dept = await prisma.department.findUnique({
    where: { publicId },
    select: { id: true },
  });

  return dept?.id ?? null;
}

export async function getActiveDepartmentFilter(): Promise<{
  departmentId?: number;
}> {
  const departmentId = await getActiveDepartmentId();
  if (departmentId === null) {
    return {};
  }
  return { departmentId };
}
