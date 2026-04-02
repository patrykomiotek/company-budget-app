import { Card, CardContent } from "@/components/ui/card";
import { getProjectsListQuery } from "@/features/projects/services/queries/project-queries";
import { getCustomersForSelectQuery } from "@/features/customers/services/queries/customer-queries";
import { ProjectsList } from "@/features/projects/components/projects-list";
import { CreateProjectButton } from "@/features/projects/components/create-project-dialog";

export default async function ProjectsPage() {
  const [projects, customers] = await Promise.all([
    getProjectsListQuery(),
    getCustomersForSelectQuery(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projekty</h1>
        <CreateProjectButton customers={customers} />
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <ProjectsList projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
