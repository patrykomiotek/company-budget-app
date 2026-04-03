import { notFound } from "next/navigation";
import { getCustomerByIdQuery } from "@/features/customers/services/queries/customer-queries";
import { getDepartmentsQuery } from "@/shared/lib/department/queries";
import { CustomerEditForm } from "@/features/customers/components/customer-edit-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const [customer, departments] = await Promise.all([
    getCustomerByIdQuery(id),
    getDepartmentsQuery(),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Klienci", href: "/customers" },
          {
            label: customer.displayName || customer.name,
            href: `/customers/${id}`,
          },
          { label: "Edycja" },
        ]}
      />
      <CustomerEditForm customer={customer} departments={departments} />
    </div>
  );
}
