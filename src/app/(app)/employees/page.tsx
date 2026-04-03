import { Card, CardContent } from "@/components/ui/card";
import { getEmployeesListQuery } from "@/features/employees/services/queries/employee-queries";
import { getDepartmentsQuery } from "@/shared/lib/department/queries";
import { EmployeesList } from "@/features/employees/components/employees-list";
import { CreateEmployeeButton } from "@/features/employees/components/create-employee-dialog";

export default async function EmployeesPage() {
  const [employees, companies] = await Promise.all([
    getEmployeesListQuery(),
    getDepartmentsQuery(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Współpracownicy</h1>
        <CreateEmployeeButton companies={companies} />
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <EmployeesList employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
