import { Card, CardContent } from "@/components/ui/card";
import { getCustomersListQuery } from "@/features/customers/services/queries/customer-queries";
import { CustomersList } from "@/features/customers/components/customers-list";
import { CreateCustomerButton } from "@/features/customers/components/create-customer-dialog";

export default async function CustomersPage() {
  const customers = await getCustomersListQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Klienci</h1>
        <CreateCustomerButton />
      </div>

      <Card className="py-0">
        <CardContent className="p-0">
          <CustomersList customers={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
