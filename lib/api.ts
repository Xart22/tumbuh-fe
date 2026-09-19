import { apiDownloadBlob, apiFetch, newIdempotencyKey } from './api-client';
import type {
  ActiveShift,
  Announcement,
  CashDrawer,
  Category,
  CreatedOrder,
  DailySummary,
  HourlySalesRow,
  HourlyForecastRow,
  Modifier,
  ModifierGroup,
  OrderType,
  Outlet,
  OwnerLoginResult,
  Paginated,
  PaymentMethod,
  PaymentMethodRow,
  PaymentResult,
  Product,
  ProductVariant,
  SalesSummary,
  StockLevel,
  TopProduct,
  WorkspaceOption,
} from './types';

export type { OwnerLoginResult, WorkspaceOption };
export { isWorkspaceChoice } from './types';

// --- Email verification ---------------------------------------------------

export type VerifyEmailResult = { slug: string };

export function verifyEmail(input: { email: string; code: string }): Promise<VerifyEmailResult> {
  return apiFetch<VerifyEmailResult>('/v1/auth/verify-email', {
    method: 'POST',
    body: input,
    outletScoped: false,
  });
}

export function resendVerification(email: string): Promise<unknown> {
  return apiFetch('/v1/auth/resend-verification', {
    method: 'POST',
    body: { email },
    outletScoped: false,
  });
}

type PageQuery = { page?: number; limit?: number };

function pageQuery({ page = 1, limit = 100 }: PageQuery): string {
  return `?page=${page}&limit=${limit}`;
}

/** Fan out over pages so the POS grid gets the full menu, not one page. */
async function fetchAllPages<T>(path: string): Promise<T[]> {
  const firstPath = `${path}${path.includes('?') ? '&' : '?'}page=1&limit=100`;
  const first = await apiFetch<Paginated<T>>(firstPath);
  if (!first.totalPages || first.totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) =>
      apiFetch<Paginated<T>>(
        `${path}${path.includes('?') ? '&' : '?'}page=${i + 2}&limit=100`,
      ),
    ),
  );
  return [first, ...rest].flatMap((p) => p.items);
}

// --- Onboarding -----------------------------------------------------------

export type RegisterMerchantInput = {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone?: string;
  businessType?: 'cafe' | 'restaurant' | 'qsr' | 'bakery';
  outletName?: string;
  city?: string;
  address?: string;
  modulePos?: boolean;
  moduleInventory?: boolean;
  moduleShifts?: boolean;
};

export type RegisterMerchantResult = {
  tenantId: string;
  slug: string;
  plan: string;
  trialEndsAt: string;
  ownerEmail: string;
  emailVerified: boolean;
  businessType: string | null;
  enabledModules: string[];
  outlet: { id: string; name: string };
};

/** Public route — creates tenant + owner, no auth header. */
export function registerMerchant(
  input: RegisterMerchantInput,
  opts?: { idempotencyKey?: string },
): Promise<RegisterMerchantResult> {
  return apiFetch<RegisterMerchantResult>('/v1/onboarding/register', {
    method: 'POST',
    body: input,
    outletScoped: false,
    headers: opts?.idempotencyKey
      ? { 'Idempotency-Key': opts.idempotencyKey }
      : undefined,
  });
}

export type OwnerLoginInput = {
  email: string;
  password: string;
  tenantSlug?: string;
};

/** Thrown when one email lives in several workspaces — caller shows a picker. */
export class WorkspaceChoiceRequired extends Error {
  constructor(readonly workspaces: WorkspaceOption[]) {
    super('Pilih workspace untuk masuk.');
    this.name = 'WorkspaceChoiceRequired';
  }
}

/** Owner/manager password login. Backend resolves the workspace from email. */
export async function loginOwner(
  input: OwnerLoginInput,
): Promise<OwnerLoginResult> {
  const result = await apiFetch<OwnerLoginResult>('/v1/auth/login', {
    method: 'POST',
    body: input,
    outletScoped: false,
  });
  return result;
}

// --- Menu -----------------------------------------------------------------

export function listCategories(): Promise<Category[]> {
  return fetchAllPages<Category>('/v1/categories');
}

export function listProducts(): Promise<Product[]> {
  return fetchAllPages<Product>('/v1/products');
}

export function listVariants(productId: string): Promise<ProductVariant[]> {
  return apiFetch<ProductVariant[]>(
    `/v1/product-variants/products/${productId}`,
  );
}

export function listModifierGroups(productId: string): Promise<ModifierGroup[]> {
  return apiFetch<ModifierGroup[]>(
    `/v1/modifiers/products/${productId}/groups`,
  );
}

export function listModifiers(groupId: string): Promise<Modifier[]> {
  return apiFetch<Modifier[]>('/v1/modifiers/groups/' + groupId + '/modifiers');
}

/** Grid data: only what the tiles need. Options load on tap, per product. */
export async function loadMenu(): Promise<{
  categories: Category[];
  products: Product[];
}> {
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);
  return { categories, products };
}

/**
 * Product options, fetched when the cashier taps a tile. Doing it up-front
 * would be two requests per product — 200 calls for a 100-item menu.
 */
export async function loadProductOptions(productId: string): Promise<{
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
}> {
  const [variants, modifierGroups] = await Promise.all([
    listVariants(productId).catch(() => [] as ProductVariant[]),
    listModifierGroups(productId).catch(() => [] as ModifierGroup[]),
  ]);
  return { variants, modifierGroups };
}

export function lookupProductByCode(code: string): Promise<Product> {
  return apiFetch<Product>(`/v1/products/lookup?code=${encodeURIComponent(code)}`);
}

// --- Orders ---------------------------------------------------------------

export type CreateOrderLine = {
  productId: string;
  variantId?: string;
  qty: number;
  unitPrice: number;
  modifierGroups?: Array<{
    groupId: string;
    selectedModifiers: Array<{ modifierId: string; modifierName?: string }>;
  }>;
  notes?: string;
};

export type CreateOrderInput = {
  orderType: OrderType;
  items: CreateOrderLine[];
  discountAmount?: number;
  discountName?: string;
  customerId?: string;
  tableId?: string;
  notes?: string;
};

export function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  return apiFetch<CreatedOrder>('/v1/orders', {
    method: 'POST',
    body: input,
    idempotencyKey: newIdempotencyKey(),
  });
}

export function listOrders(): Promise<
  Array<{ id: string; orderNumber: string; status: string; total: number }>
> {
  return apiFetch('/v1/orders');
}

// --- Payments -------------------------------------------------------------

export type PayInput = {
  orderId: string;
  /** Single method. Omit when using `payments`. */
  method?: PaymentMethod;
  amount?: number;
  /** Split payment. Cannot mix async (QRIS/e-wallet) with anything else. */
  payments?: Array<{ method: PaymentMethod; amount: number }>;
};

export function createPayment(input: PayInput): Promise<PaymentResult> {
  return apiFetch<PaymentResult>('/v1/payments', {
    method: 'POST',
    body: input,
    idempotencyKey: newIdempotencyKey(),
  });
}

// --- Shifts ---------------------------------------------------------------

/** Currently clocked-in staff. Empty array = no terminal active. */
export function activeShifts(): Promise<ActiveShift[]> {
  return apiFetch<ActiveShift[]>('/v1/shifts/active');
}

// --- Notifications ---------------------------------------------------------

/** Active platform announcements. Public route — no outlet scope needed. */
export function announcements(): Promise<Announcement[]> {
  return apiFetch<Announcement[]>('/v1/notifications/announcements', {
    outletScoped: false,
  });
}

// --- Inventory ------------------------------------------------------------

/** Raw materials at/below safety stock. Empty array = all healthy. */
export function lowStockLevels(): Promise<StockLevel[]> {
  return apiFetch<StockLevel[]>(
    '/v1/inventory/stock-levels?belowSafetyStock=true',
  );
}

// --- Outlets --------------------------------------------------------------

/** Owner/manager session has no outlet scope; the backoffice picks one. */
export function listOutlets(): Promise<Outlet[]> {
  return apiFetch<Outlet[]>('/v1/outlets');
}

/** Set the outlet's daily revenue goal (0 clears it). */
export function setOutletDailyTarget(
  outletId: string,
  dailyRevenue: number,
): Promise<{ outletId: string; dailyRevenueTarget: number }> {
  return apiFetch<{ outletId: string; dailyRevenueTarget: number }>(
    `/v1/outlets/${outletId}/targets`,
    { method: 'PATCH', body: { dailyRevenue } },
  );
}

// --- Reports --------------------------------------------------------------
// BE field names differ per endpoint (`orderCount`/`productName`/`soldQty`/
// `buckets`), so each report is normalised here — pages consume one shape.

export function dailySummary(date: string): Promise<DailySummary> {
  return apiFetch<DailySummary>(`/v1/reports/daily-summary?date=${date}`).then(
    (raw) => ({ ...raw, totalOrders: raw.totalOrders ?? raw.orderCount ?? 0 }),
  );
}

/** Daily summary as a CSV blob (`@SkipEnvelope` route — raw text/csv). */
export function downloadDailySummary(date: string): Promise<Blob> {
  return apiDownloadBlob(`/v1/reports/export/daily?date=${date}`);
}

export function salesSummary(
  dateFrom: string,
  dateTo: string,
): Promise<SalesSummary> {
  return apiFetch<SalesSummary>(
    `/v1/reports/sales-summary?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  ).then((raw) => ({
    ...raw,
    totalOrders: raw.totalOrders ?? raw.orderCount ?? 0,
  }));
}

export function topProducts(
  dateFrom: string,
  dateTo: string,
  top = 10,
): Promise<TopProduct[]> {
  type Raw = { productId?: string; productName?: string; soldQty?: number; revenue?: number };
  return apiFetch<Raw[]>(
    `/v1/reports/top-products?dateFrom=${dateFrom}&dateTo=${dateTo}&top=${top}`,
  ).then((rows) =>
    rows.map((row) => ({
      productId: row.productId,
      name: row.productName,
      qty: row.soldQty ?? 0,
      revenue: row.revenue ?? 0,
    })),
  );
}

export function hourlySales(date: string): Promise<HourlySalesRow[]> {
  type Raw = {
    buckets?: Array<{ hour: number; orderCount?: number; grossSales?: number }>;
  };
  return apiFetch<Raw>(`/v1/reports/hourly-sales?date=${date}`).then((raw) =>
    (raw.buckets ?? []).map((bucket) => ({
      hour: bucket.hour,
      orders: bucket.orderCount ?? 0,
      revenue: bucket.grossSales ?? 0,
    })),
  );
}

/** Expected revenue per hour — same-weekday average over the last 4 weeks. */
export function hourlyForecast(date: string): Promise<HourlyForecastRow[]> {
  type Raw = { buckets?: Array<{ hour: number; expectedRevenue?: number }> };
  return apiFetch<Raw>(`/v1/reports/forecast?date=${date}`).then((raw) =>
    (raw.buckets ?? []).map((bucket) => ({
      hour: bucket.hour,
      expectedRevenue: bucket.expectedRevenue ?? 0,
    })),
  );
}

export function paymentMethodsBreakdown(
  dateFrom: string,
  dateTo: string,
): Promise<PaymentMethodRow[]> {
  return paymentMethodsReport(dateFrom, dateTo).then((report) => report.methods);
}

export type PaymentMethodsReport = {
  methods: PaymentMethodRow[];
  /** Latest closed shift's expected/counted cash; null when none closed. */
  cashDrawer: CashDrawer | null;
  totalTransactions: number;
  totalAmount: number;
};

export function paymentMethodsReport(
  dateFrom: string,
  dateTo: string,
): Promise<PaymentMethodsReport> {
  type Raw = {
    methods?: Array<{
      method: string;
      amount?: number;
      percentage?: number;
      transactionCount?: number;
    }>;
    cashDrawer?: CashDrawer | null;
    transactionCount?: number;
    totalAmount?: number;
  };
  return apiFetch<Raw>(
    `/v1/reports/payment-methods?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  ).then((raw) => ({
    methods: raw.methods ?? [],
    cashDrawer: raw.cashDrawer ?? null,
    totalTransactions: raw.transactionCount ?? 0,
    totalAmount: raw.totalAmount ?? 0,
  }));
}

// --- Search ---------------------------------------------------------------

export type SearchOrderHit = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

export type SearchProductHit = {
  id: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
};

export type SearchCustomerHit = {
  id: string;
  name: string;
  phone: string | null;
  tier: string;
};

export type SearchResults = {
  query: string;
  orders: SearchOrderHit[];
  products: SearchProductHit[];
  customers: SearchCustomerHit[];
};

/** Backoffice global search (`/v1/search`). Min 2 chars; BE short-circuits. */
export function globalSearch(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResults> {
  return apiFetch<SearchResults>(
    `/v1/search?q=${encodeURIComponent(query)}&limit=5`,
    { signal },
  );
}

export type { Paginated };
export { pageQuery };
