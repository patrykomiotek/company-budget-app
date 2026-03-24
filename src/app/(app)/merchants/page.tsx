import { Card, CardContent } from '@/components/ui/card';
import { getMerchantsListQuery } from '@/features/merchants/services/queries/merchant-queries';
import { MerchantsList } from '@/features/merchants/components/merchants-list';
import { CreateMerchantButton } from '@/features/merchants/components/create-merchant-dialog';

export default async function MerchantsPage() {
  const merchants = await getMerchantsListQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sprzedawcy</h1>
        <CreateMerchantButton />
      </div>

      <Card>
        <CardContent className="p-0">
          <MerchantsList merchants={merchants} />
        </CardContent>
      </Card>
    </div>
  );
}
