export interface CustomerOption {
  id: string;
  name: string;
  nip: string | null;
}

export interface CustomerItem {
  id: string;
  name: string;
  nip: string | null;
  city: string | null;
  email: string | null;
  transactionCount: number;
}
