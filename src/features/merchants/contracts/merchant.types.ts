export interface MerchantItem {
  id: string;
  name: string;
  nip: string | null;
  logoUrl: string | null;
  transactionCount: number;
}
