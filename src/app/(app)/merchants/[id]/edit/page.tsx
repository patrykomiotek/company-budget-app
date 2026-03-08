import { notFound } from 'next/navigation';
import { getMerchantByIdQuery } from '@/features/merchants/services/queries/merchant-queries';
import { MerchantEditForm } from '@/features/merchants/components/merchant-edit-form';

interface MerchantEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function MerchantEditPage({ params }: MerchantEditPageProps) {
  const { id } = await params;
  const merchant = await getMerchantByIdQuery(id);

  if (!merchant) {
    notFound();
  }

  return (
    <div className="max-w-xl">
      <MerchantEditForm merchant={merchant} />
    </div>
  );
}
