import { notFound } from "next/navigation";
import { getEmployeeByIdQuery } from "@/features/employees/services/queries/employee-queries";
import { EmployeeEditForm } from "@/features/employees/components/employee-edit-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface EditEmployeePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const { id } = await params;
  const employee = await getEmployeeByIdQuery(id);

  if (!employee) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Współpracownicy", href: "/employees" },
          { label: employee.name },
        ]}
      />
      <EmployeeEditForm employee={employee} />
    </div>
  );
}
