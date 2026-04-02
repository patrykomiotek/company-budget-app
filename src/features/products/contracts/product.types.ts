export interface ProductOption {
  id: string;
  name: string;
  type: string;
}

export interface ProductItem {
  id: string;
  name: string;
  type: string;
  lineItemCount: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface ProductPurchase {
  transactionId: string;
  date: string;
  customerName: string | null;
  quantity: number;
  unitPrice: number;
  netAmount: number;
  projectName: string | null;
}

export interface ProductDetailWithHistory {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  totalRevenue: number;
  totalQuantity: number;
  purchaseCount: number;
  purchases: ProductPurchase[];
}

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  SERVICE: "Usługa",
  PRODUCT: "Produkt",
};
