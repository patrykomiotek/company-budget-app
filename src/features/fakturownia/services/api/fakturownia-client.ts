import type {
  FakturowniaInvoice,
  FakturowniaClient,
  FakturowniaProduct,
} from "../../contracts/fakturownia.types";

function getConfig() {
  const apiToken = process.env.FAKTUROWNIA_API_TOKEN;
  const accountName = process.env.FAKTUROWNIA_ACCOUNT_NAME;

  if (!apiToken || !accountName) {
    throw new Error("Integracja z Fakturownia nie jest skonfigurowana");
  }

  return { apiToken, accountName };
}

function buildUrl(
  accountName: string,
  path: string,
  params: Record<string, string>,
): string {
  const url = new URL(`https://${accountName}.fakturownia.pl${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function fakturowniaGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const { apiToken, accountName } = getConfig();

  const url = buildUrl(accountName, path, {
    ...params,
    api_token: apiToken,
  });

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("Nieprawidłowy token API Fakturowni");
  }

  if (response.status === 429) {
    throw new Error("Zbyt wiele zapytań do Fakturowni. Spróbuj za chwilę.");
  }

  if (!response.ok) {
    throw new Error(`Błąd API Fakturowni: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getInvoices(params?: {
  page?: number;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
  kind?: string;
  perPage?: number;
}): Promise<FakturowniaInvoice[]> {
  const queryParams: Record<string, string> = {
    include_positions: "true",
    per_page: String(params?.perPage ?? 25),
    order: "issue_date.desc",
  };

  if (params?.page) {
    queryParams.page = String(params.page);
  }
  if (params?.period) {
    queryParams.period = params.period;
  }
  if (params?.dateFrom) {
    queryParams.date_from = params.dateFrom;
    queryParams.period = "more";
  }
  if (params?.dateTo) {
    queryParams.date_to = params.dateTo;
    queryParams.period = "more";
  }
  if (params?.kind) {
    queryParams.kind = params.kind;
  }

  return fakturowniaGet<FakturowniaInvoice[]>("/invoices.json", queryParams);
}

export async function getInvoice(id: number): Promise<FakturowniaInvoice> {
  return fakturowniaGet<FakturowniaInvoice>(`/invoices/${id}.json`);
}

export async function getClients(params?: {
  page?: number;
}): Promise<FakturowniaClient[]> {
  const queryParams: Record<string, string> = {
    per_page: "100",
  };

  if (params?.page) {
    queryParams.page = String(params.page);
  }

  return fakturowniaGet<FakturowniaClient[]>("/clients.json", queryParams);
}

export async function getProducts(params?: {
  page?: number;
}): Promise<FakturowniaProduct[]> {
  const queryParams: Record<string, string> = {
    per_page: "100",
  };

  if (params?.page) {
    queryParams.page = String(params.page);
  }

  return fakturowniaGet<FakturowniaProduct[]>("/products.json", queryParams);
}
