import { notFound } from "next/navigation";
import { getProjectByIdQuery } from "@/features/projects/services/queries/project-queries";
import { getCustomersForSelectQuery } from "@/features/customers/services/queries/customer-queries";
import { ProjectEditForm } from "@/features/projects/components/project-edit-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { id } = await params;
  const [project, customers] = await Promise.all([
    getProjectByIdQuery(id),
    getCustomersForSelectQuery(),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Projekty", href: "/projects" },
          { label: project.name, href: `/projects/${id}` },
          { label: "Edycja" },
        ]}
      />
      <ProjectEditForm project={project} customers={customers} />
    </div>
  );
}
