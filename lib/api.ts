import { apiFetch, newIdempotencyKey } from './api-client';
import type {
  Category,
  CreatedOrder,
  DailySummary,
  HourlySalesRow,
  Modifier,
  ModifierGroup,
  OrderType,
  OwnerLoginResult,
  Paginated,
  PaymentMethod,
  PaymentResult,
  Product,
  ProductVariant,
  SalesSummary,
  TopProduct,
  WorkspaceOption,
} from './types';

export type { OwnerLoginResult, WorkspaceOption };
export { isWorkspaceChoice } from './types';

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
): Promise<RegisterMerchantResult> {
  return apiFetch<RegisterMerchantResult>('/v1/onboarding/register', {
    method: 'POST',
    body: input,
    outletScoped: false,
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

// --- Reports --------------------------------------------------------------

export function dailySummary(date: string): Promise<DailySummary> {
  return apiFetch<DailySummary>(`/v1/reports/daily-summary?date=${date}`);
}

export function salesSummary(
  dateFrom: string,
  dateTo: string,
): Promise<SalesSummary> {
  return apiFetch<SalesSummary>(
    `/v1/reports/sales-summary?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

export function topProducts(
  dateFrom: string,
  dateTo: string,
  top = 10,
): Promise<TopProduct[]> {
  return apiFetch<TopProduct[]>(
    `/v1/reports/top-products?dateFrom=${dateFrom}&dateTo=${dateTo}&top=${top}`,
  );
}

export function hourlySales(date: string): Promise<HourlySalesRow[]> {
  return apiFetch<HourlySalesRow[]>(`/v1/reports/hourly-sales?date=${date}`);
}

export function paymentMethodsBreakdown(
  dateFrom: string,
  dateTo: string,
): Promise<Array<{ method: string; total?: number; count?: number }>> {
  return apiFetch(
    `/v1/reports/payment-methods?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

export type { Paginated };
export { pageQuery };
