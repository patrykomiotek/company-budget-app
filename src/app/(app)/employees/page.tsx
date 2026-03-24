import { Card, CardContent } from '@/components/ui/card';
import { getEmployeesListQuery } from '@/features/employees/services/queries/employee-queries';
import { getCompaniesQuery } from '@/shared/lib/company/queries';
import { EmployeesList } from '@/features/employees/components/employees-list';
import { CreateEmployeeButton } from '@/features/employees/components/create-employee-dialog';

export default async function EmployeesPage() {
  const [employees, companies] = await Promise.all([
    getEmployeesListQuery(),
    getCompaniesQuery(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Współpracownicy</h1>
        <CreateEmployeeButton companies={companies} />
      </div>

      <Card>
        <CardContent className="p-0">
          <EmployeesList employees={employees} />
        </CardContent>
      </Card>
    </div>
  );
}
