import { Breadcrumbs } from "@/components/breadcrumbs";
import { DepartmentForm } from "@/features/departments/components/department-form";

export default function NewDepartmentPage() {
  return (
    <div className="max-w-xl">
      <Breadcrumbs
        items={[
          { label: "Oddziały", href: "/departments" },
          { label: "Nowy oddział" },
        ]}
      />
      <DepartmentForm />
    </div>
  );
}
