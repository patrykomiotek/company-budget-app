import { notFound } from "next/navigation";
import { getDepartmentByIdQuery } from "@/features/departments/services/queries/department-queries";
import { DepartmentForm } from "@/features/departments/components/department-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface DepartmentEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function DepartmentEditPage({
  params,
}: DepartmentEditPageProps) {
  const { id } = await params;
  const department = await getDepartmentByIdQuery(id);

  if (!department) {
    notFound();
  }

  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: "Oddziały", href: "/departments" },
          { label: department.name },
        ]}
      />
      <DepartmentForm department={department} />
    </div>
  );
}
