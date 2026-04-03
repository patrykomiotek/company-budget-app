export interface MerchantItem {
  id: string;
  name: string;
  displayName: string | null;
  nip: string | null;
  logoUrl: string | null;
  transactionCount: number;
}
