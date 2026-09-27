import { apiDownloadBlob, apiFetch, newIdempotencyKey } from './api-client';
import type {
  ActiveShift,
  Announcement,
  CashDrawer,
  Category,
  CreatedOrder,
  DailySummary,
  ExpiringMaterials,
  HourlySalesRow,
  HourlyForecastRow,
  InventoryValuation,
  Modifier,
  ModifierGroup,
  MaterialSummary,
  OrderType,
  Outlet,
  OwnerLoginResult,
  Paginated,
  PaymentMethod,
  PaymentMethodRow,
  PaymentResult,
  Product,
  ProductFacets,
  ProductMargin,
  ProductVariant,
  ProfitSummary,
  PurchaseOrder,
  PurchaseOrderSummary,
  RawMaterial,
  Recipe,
  SalesSummary,
  StockLevel,
  StockMutation,
  StockOpname,
  StockOpnameItem,
  StockOpnameSummary,
  Supplier,
  StockForecast,
  TopProduct,
  Unit,
  UnitFamily,
  WasteReason,
  WasteRecord,
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

// --- Password reset -------------------------------------------------------

/** Request a reset code. Always succeeds (no account enumeration). */
export function requestPasswordReset(email: string): Promise<unknown> {
  return apiFetch('/v1/auth/forgot-password', {
    method: 'POST',
    body: { email },
    outletScoped: false,
  });
}

export function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ slug: string }> {
  return apiFetch<{ slug: string }>('/v1/auth/reset-password', {
    method: 'POST',
    body: input,
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

// --- Menu management ------------------------------------------------------

export type ProductPageQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'available' | 'sold_out';
};

/** Paginated menu list with filters — backoffice table, not the POS grid. */
export function listProductsPage(
  query: ProductPageQuery = {},
): Promise<Paginated<Product> & Partial<ProductFacets>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 20));
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.status) params.set('status', query.status);
  return apiFetch<Paginated<Product>>(`/v1/products?${params.toString()}`);
}

export type ProductInput = {
  name: string;
  categoryId?: string | null;
  basePrice: number;
  sku?: string;
  description?: string;
  isAvailable?: boolean;
};

export function createProduct(input: ProductInput): Promise<Product> {
  return apiFetch<Product>('/v1/products', { method: 'POST', body: input });
}

export function updateProduct(
  productId: string,
  input: Partial<ProductInput>,
): Promise<Product> {
  return apiFetch<Product>(`/v1/products/${productId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteProduct(productId: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/v1/products/${productId}`, {
    method: 'DELETE',
  });
}

export function createCategory(input: {
  name: string;
  sortOrder?: number;
}): Promise<Category> {
  return apiFetch<Category>('/v1/categories', { method: 'POST', body: input });
}

export function updateCategory(
  categoryId: string,
  input: { name?: string; sortOrder?: number },
): Promise<Category> {
  return apiFetch<Category>(`/v1/categories/${categoryId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteCategory(categoryId: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/v1/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

/** Persist a drag-and-drop reorder; ids arrive in their new display order. */
export function reorderCategories(ids: string[]): Promise<{ updated: number }> {
  return apiFetch<{ updated: number }>('/v1/categories/reorder', {
    method: 'PATCH',
    body: { ids },
  });
}

// --- Product photo --------------------------------------------------------

export function uploadProductPhoto(
  productId: string,
  file: File,
): Promise<{ productId: string; photoUrl: string }> {
  const formData = new FormData();
  formData.append('photo', file);
  return apiFetch<{ productId: string; photoUrl: string }>(
    `/v1/products/${productId}/photo`,
    { method: 'POST', formData },
  );
}

// --- Product variants -----------------------------------------------------

export type VariantInput = {
  name: string;
  priceAdjustment?: number;
  sortOrder?: number;
};

export function createVariant(
  productId: string,
  input: VariantInput,
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/v1/product-variants/products/${productId}`, {
    method: 'POST',
    body: input,
  });
}

export function updateVariant(
  variantId: string,
  input: VariantInput,
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/v1/product-variants/${variantId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteVariant(variantId: string): Promise<unknown> {
  return apiFetch(`/v1/product-variants/${variantId}`, { method: 'DELETE' });
}

export function toggleVariant(
  variantId: string,
  isActive: boolean,
): Promise<{ id: string; isActive: boolean }> {
  return apiFetch<{ id: string; isActive: boolean }>(
    `/v1/product-variants/${variantId}/toggle`,
    { method: 'PATCH', body: { isActive } },
  );
}

// --- Modifier groups & modifiers ------------------------------------------

export type ModifierGroupInput = {
  name: string;
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
};

export function createModifierGroup(
  productId: string,
  input: ModifierGroupInput,
): Promise<ModifierGroup> {
  return apiFetch<ModifierGroup>(`/v1/modifiers/products/${productId}/groups`, {
    method: 'POST',
    body: input,
  });
}

export function updateModifierGroup(
  groupId: string,
  input: ModifierGroupInput,
): Promise<ModifierGroup> {
  return apiFetch<ModifierGroup>(`/v1/modifiers/groups/${groupId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteModifierGroup(groupId: string): Promise<unknown> {
  return apiFetch(`/v1/modifiers/groups/${groupId}`, { method: 'DELETE' });
}

export type ModifierInput = {
  name: string;
  priceAddition?: number;
  sortOrder?: number;
};

export function createModifier(
  groupId: string,
  input: ModifierInput,
): Promise<Modifier> {
  return apiFetch<Modifier>(`/v1/modifiers/groups/${groupId}/modifiers`, {
    method: 'POST',
    body: input,
  });
}

export function updateModifier(
  modifierId: string,
  input: ModifierInput,
): Promise<Modifier> {
  return apiFetch<Modifier>(`/v1/modifiers/${modifierId}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteModifier(modifierId: string): Promise<unknown> {
  return apiFetch(`/v1/modifiers/${modifierId}`, { method: 'DELETE' });
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

export type RawMaterialPageQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'critical' | 'low' | 'ok';
};

export function listRawMaterialsPage(
  query: RawMaterialPageQuery = {},
): Promise<Paginated<RawMaterial>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 20));
  if (query.search) params.set('search', query.search);
  if (query.category) params.set('category', query.category);
  if (query.status) params.set('status', query.status);
  return apiFetch<Paginated<RawMaterial>>(
    `/v1/raw-materials?${params.toString()}`,
  );
}

export type RawMaterialInput = {
  name: string;
  unit?: string;
  stockUnitId?: string;
  purchaseUnitId?: string | null;
  packSize?: number;
  sku?: string;
  category?: string;
  expiresAt?: string | null;
  stockQty?: number;
  minStockQty?: number;
  costPerUnit?: number;
};

// --- Units ----------------------------------------------------------------

export function listUnits(): Promise<Unit[]> {
  return apiFetch<Unit[]>('/v1/units');
}

export function createUnit(input: {
  name: string;
  family: UnitFamily;
  factorToBase?: number;
}): Promise<Unit> {
  return apiFetch<Unit>('/v1/units', { method: 'POST', body: input });
}

export function createRawMaterial(input: RawMaterialInput): Promise<RawMaterial> {
  return apiFetch<RawMaterial>('/v1/raw-materials', {
    method: 'POST',
    body: input,
  });
}

export function updateRawMaterial(
  id: string,
  input: Partial<RawMaterialInput> & { isActive?: boolean },
): Promise<RawMaterial> {
  return apiFetch<RawMaterial>(`/v1/raw-materials/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function adjustRawMaterialStock(
  id: string,
  input: { qty: number; notes?: string },
): Promise<{
  id: string;
  stockQtyBefore: number;
  stockQtyAfter: number;
  delta: number;
}> {
  return apiFetch(`/v1/raw-materials/${id}/stock`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteRawMaterial(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/v1/raw-materials/${id}`, {
    method: 'DELETE',
  });
}

/** KPI roll-up over every active material (total asset value + counts). */
export function rawMaterialSummary(): Promise<MaterialSummary> {
  return apiFetch<MaterialSummary>('/v1/raw-materials/summary');
}

// --- Recipes (BOM) --------------------------------------------------------

export function getProductRecipe(productId: string): Promise<Recipe> {
  return apiFetch<Recipe>(`/v1/inventory/recipes/products/${productId}`);
}

export function replaceProductRecipe(
  productId: string,
  items: Array<{ rawMaterialId: string; qtyUsed: number; unit: string }>,
): Promise<Recipe> {
  return apiFetch<Recipe>(`/v1/inventory/recipes/products/${productId}`, {
    method: 'PUT',
    body: { items },
  });
}

/** HPP per product from recipes (`/v1/reports/product-margins`). */
export function productMargins(): Promise<ProductMargin[]> {
  return apiFetch<ProductMargin[]>('/v1/reports/product-margins');
}

/** Current inventory valuation (stock × moving-average cost), per outlet. */
export function inventoryValuation(): Promise<InventoryValuation> {
  return apiFetch<InventoryValuation>('/v1/reports/inventory-valuation');
}

/** Usage velocity per material (`avgDailyUsage`, `daysOfStockLeft`). */
export function stockForecast(
  windowDays = 7,
  leadTimeDays = 3,
): Promise<StockForecast[]> {
  return apiFetch<StockForecast[]>(
    `/v1/reports/stock-forecast?windowDays=${windowDays}&leadTimeDays=${leadTimeDays}`,
  );
}

/** Revenue, COGS and gross profit for a period. */
export function profitSummary(
  dateFrom: string,
  dateTo: string,
): Promise<ProfitSummary> {
  return apiFetch<ProfitSummary>(
    `/v1/reports/profit?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

/** Materials/batches expiring within `days` (default 7). */
export function expiringMaterials(days = 7): Promise<ExpiringMaterials> {
  return apiFetch<ExpiringMaterials>(
    `/v1/reports/expiring-materials?days=${days}`,
  );
}

/** Stock ledger (kartu stok) for one material. */
export function listStockMutations(query: {  rawMaterialId?: string;
  mutationType?: string;
  limit?: number;
} = {}): Promise<StockMutation[]> {
  const params = new URLSearchParams();
  if (query.rawMaterialId) params.set('rawMaterialId', query.rawMaterialId);
  if (query.mutationType) params.set('mutationType', query.mutationType);
  params.set('limit', String(query.limit ?? 100));
  return apiFetch<StockMutation[]>(
    `/v1/inventory/stock-mutations?${params.toString()}`,
  );
}

// --- Suppliers & purchase orders -----------------------------------------

export function listSuppliersPage(
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<Supplier>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 50));
  return apiFetch<Paginated<Supplier>>(`/v1/suppliers?${params.toString()}`);
}

export function createSupplier(input: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}): Promise<Supplier> {
  return apiFetch<Supplier>('/v1/suppliers', { method: 'POST', body: input });
}

export function listPurchaseOrdersPage(
  query: { page?: number; limit?: number } = {},
): Promise<Paginated<PurchaseOrderSummary>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page ?? 1));
  params.set('limit', String(query.limit ?? 20));
  return apiFetch<Paginated<PurchaseOrderSummary>>(
    `/v1/purchase-orders?${params.toString()}`,
  );
}

export function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  return apiFetch<PurchaseOrder>(`/v1/purchase-orders/${id}`);
}

export function createPurchaseOrder(input: {
  supplierId: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{ rawMaterialId: string; qtyOrdered: number; unitPrice: number }>;
}): Promise<{ id: string; poNumber: string }> {
  return apiFetch('/v1/purchase-orders', { method: 'POST', body: input });
}

/** Receives all remaining quantities and posts the stock mutations. */
export function receivePurchaseOrder(id: string): Promise<unknown> {
  return apiFetch(`/v1/purchase-orders/${id}/receive`, { method: 'POST' });
}

/** Sends received PO stock to another outlet (creates a stock transfer). */
export function distributePurchaseOrder(
  id: string,
  targets: Array<{
    outletId: string;
    items: Array<{ rawMaterialId: string; qty: number }>;
  }>,
): Promise<{ id: string; status: string }> {
  return apiFetch<{ id: string; status: string }>(
    `/v1/purchase-orders/${id}/distribute`,
    { method: 'POST', body: { targets } },
  );
}

// --- Stock opname ---------------------------------------------------------

export function listStockOpnames(
  status?: string,
): Promise<StockOpnameSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<StockOpnameSummary[]>(`/v1/inventory/stock-opnames${query}`);
}

export function getStockOpname(opnameId: string): Promise<StockOpname> {
  return apiFetch<StockOpname>(
    `/v1/inventory/stock-opnames/${opnameId}`,
  );
}

export function createStockOpname(input: {
  conductedBy?: string;
  notes?: string;
}): Promise<StockOpname> {
  return apiFetch<StockOpname>('/v1/inventory/stock-opnames', {
    method: 'POST',
    body: input,
  });
}

export function updateStockOpnameItem(
  opnameId: string,
  itemId: string,
  input: { physicalQty: number; notes?: string },
): Promise<StockOpnameItem> {
  return apiFetch<StockOpnameItem>(
    `/v1/inventory/stock-opnames/${opnameId}/items/${itemId}`,
    { method: 'PATCH', body: input },
  );
}

/** Applies stock adjustments for every counted line and closes the opname. */
export function confirmStockOpname(
  opnameId: string,
  input: { notes?: string } = {},
): Promise<StockOpname> {
  return apiFetch<StockOpname>(
    `/v1/inventory/stock-opnames/${opnameId}/confirm`,
    { method: 'POST', body: input },
  );
}

// --- Waste ----------------------------------------------------------------

export function listWasteRecords(
  filters: { dateFrom?: string; dateTo?: string; reason?: string } = {},
): Promise<WasteRecord[]> {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.reason) params.set('reason', filters.reason);
  const query = params.toString();
  return apiFetch<WasteRecord[]>(`/v1/waste-records${query ? `?${query}` : ''}`);
}

export function createWasteRecord(input: {
  rawMaterialId: string;
  qty: number;
  reason: WasteReason;
  notes?: string;
}): Promise<WasteRecord> {
  return apiFetch<WasteRecord>('/v1/waste-records', {
    method: 'POST',
    body: input,
  });
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
