import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDepartmentsListQuery } from "@/features/departments/services/queries/department-queries";
import { DepartmentsList } from "@/features/departments/components/departments-list";

export default async function DepartmentsPage() {
  const departments = await getDepartmentsListQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oddziały</h1>
        <Link href="/departments/new">
          <Button>Dodaj oddział</Button>
        </Link>
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <DepartmentsList departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
