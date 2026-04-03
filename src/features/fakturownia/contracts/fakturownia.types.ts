export interface FakturowniaInvoice {
  id: number;
  number: string;
  kind: string;
  income: string;
  status: string;
  issue_date: string;
  sell_date: string;
  payment_to: string;
  paid_date: string | null;
  price_net: string;
  price_gross: string;
  price_tax: string;
  currency: string;
  exchange_currency: string | null;
  exchange_currency_rate: string | null;
  buyer_name: string;
  buyer_tax_no: string | null;
  buyer_street: string | null;
  buyer_post_code: string | null;
  buyer_city: string | null;
  buyer_country: string | null;
  buyer_email: string | null;
  client_id: number;
  department_id: number | null;
  description: string | null;
  paid: string;
  remaining: string | null;
  payment_type: string | null;
  positions: FakturowniaPosition[];
}

export interface FakturowniaPosition {
  id: number;
  name: string;
  quantity: string;
  total_price_net: string;
  total_price_gross: string;
  tax: string;
  price_net: string;
  price_gross: string;
  product_id: number | null;
  quantity_unit: string | null;
}

export interface FakturowniaClient {
  id: number;
  name: string;
  tax_no: string | null;
  street: string | null;
  post_code: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
}

export interface FakturowniaProduct {
  id: number;
  name: string;
  price_net: string;
  price_gross: string;
  tax: string;
  quantity_unit: string | null;
  service: string;
}

export interface ImportedInvoiceData {
  invoiceNumber: string;
  date: string;
  invoiceDueDate: string;
  amount: number;
  currency: "PLN" | "EUR" | "USD";
  exchangeRate?: number;
  description: string;
  customerName: string;
  customerNip?: string;
  customerStreet?: string;
  customerPostalCode?: string;
  customerCity?: string;
  customerEmail?: string;
  departmentPublicId?: string;
  lineItems: ImportedLineItem[];
  fakturowniaInvoiceId: number;
}

export interface ImportedLineItem {
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
}

export interface FakturowniaInvoiceListItem {
  id: number;
  number: string;
  kind: string;
  issueDate: string;
  paymentTo: string;
  buyerName: string;
  buyerTaxNo: string | null;
  priceNet: string;
  priceGross: string;
  currency: string;
  status: string;
  alreadyImported: boolean;
}
