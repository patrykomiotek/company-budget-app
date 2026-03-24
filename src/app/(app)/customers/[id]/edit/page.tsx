import { notFound } from 'next/navigation';
import { getCustomerByIdQuery } from '@/features/customers/services/queries/customer-queries';
import { CustomerEditForm } from '@/features/customers/components/customer-edit-form';

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await getCustomerByIdQuery(id);

  if (!customer) {
    notFound();
  }

  return (
    <div>
      <CustomerEditForm customer={customer} />
    </div>
  );
}
