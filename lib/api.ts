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
  ProductBundle,
  ProductOutletOverride,
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
  ProfitLossReport,
  CashFlowReport,
  OutletComparison,
  BreakEvenReport,
  TaxSummaryReport,
  WasteReport,
  PayrollRow,
  MenuEngineeringReport,
  ByTableReport,
  ByOrderTypeReport,
  DiscountsVoidsReport,
  ProductTrendReport,
  CategorySalesRow,
  CashierSalesRow,
  EmployeeSalesReport,
  Employee,
  EmployeeOutlet,
  EmployeeInvite,
  PayType,
  Shift,
  CurrentShift,
  ShiftCloseResult,
  ShiftSchedule,
  Attendance,
  ClockInResult,
  ClockOutResult,
  Customer,
  CustomerDetail,
  CustomerAnalytics,
  CustomerSegments,
  BirthdayCustomer,
  StampCard,
  Voucher,
  VoucherValidation,
  OrderSummary,
  OrderDetail,
  KitchenItemStatus,
  KitchenQueueItem,
  KitchenSummary,
  KitchenUpdateResult,
  KitchenOrderResult,
  ReceiptData,
  Expense,
  SupplierInvoice,
  AccountingProvider,
  JournalEntry,
  JournalSyncResult,
  OutletDetail,
  OutletSettings,
  Printer,
  AuditLog,
  StockTransfer,
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
  barcode?: string;
  description?: string;
  isAvailable?: boolean;
  /** `HH:MM` or null to clear the window (all-day). */
  availabilityStart?: string | null;
  availabilityEnd?: string | null;
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

export function listProductBundles(): Promise<ProductBundle[]> {
  return apiFetch<ProductBundle[]>('/v1/product-bundles');
}

export function createProductBundle(input: {
  name: string;
  price: number;
  items: Array<{ productId: string; qty: number }>;
  isActive?: boolean;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/v1/product-bundles', {
    method: 'POST',
    body: input,
  });
}

export function deleteProductBundle(
  id: string,
): Promise<{ id: string; deleted: true }> {
  return apiFetch(`/v1/product-bundles/${id}`, { method: 'DELETE' });
}

export function listOutletOverrides(
  productId: string,
): Promise<ProductOutletOverride[]> {
  return apiFetch<ProductOutletOverride[]>(
    `/v1/products/${productId}/outlet-overrides`,
  );
}

export function setOutletOverride(
  productId: string,
  input: { outletId: string; priceOverride: number | null; isAvailable?: boolean },
): Promise<{
  productId: string;
  outletId: string;
  priceOverride: number | null;
  isAvailable: boolean | null;
}> {
  return apiFetch(`/v1/products/${productId}/outlet-overrides`, {
    method: 'POST',
    body: input,
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

// --- Kitchen Display (KDS) ------------------------------------------------

export function kitchenSummary(): Promise<KitchenSummary> {
  return apiFetch<KitchenSummary>('/v1/kitchen/summary');
}

export function kitchenQueue(params?: {
  status?: KitchenItemStatus;
  station?: string;
}): Promise<KitchenQueueItem[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.station) qs.set('station', params.station);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<KitchenQueueItem[]>(`/v1/kitchen/queue${suffix}`);
}

export function setKitchenItemStatus(
  orderItemId: string,
  status: KitchenItemStatus,
): Promise<KitchenUpdateResult> {
  return apiFetch<KitchenUpdateResult>(
    `/v1/kitchen/items/${orderItemId}/status`,
    { method: 'PATCH', body: { status } },
  );
}

export function bumpKitchenItem(
  orderItemId: string,
): Promise<KitchenUpdateResult> {
  return apiFetch<KitchenUpdateResult>(
    `/v1/kitchen/items/${orderItemId}/bump`,
    { method: 'PATCH' },
  );
}

export function recallKitchenItem(
  orderItemId: string,
): Promise<KitchenUpdateResult> {
  return apiFetch<KitchenUpdateResult>(
    `/v1/kitchen/items/${orderItemId}/recall`,
    { method: 'PATCH' },
  );
}

export function bumpKitchenOrder(orderId: string): Promise<KitchenOrderResult> {
  return apiFetch<KitchenOrderResult>(`/v1/kitchen/orders/${orderId}/bump`, {
    method: 'PATCH',
  });
}

/** Finish the whole ticket: mark every active item served. */
export function serveKitchenOrder(orderId: string): Promise<KitchenOrderResult> {
  return apiFetch<KitchenOrderResult>(`/v1/kitchen/orders/${orderId}/serve`, {
    method: 'PATCH',
  });
}

export function recallKitchenOrder(
  orderId: string,
): Promise<KitchenOrderResult> {
  return apiFetch<KitchenOrderResult>(`/v1/kitchen/orders/${orderId}/recall`, {
    method: 'PATCH',
  });
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
  /** Bill Parkir: create with status "held" instead of "confirmed". */
  park?: boolean;
};

export function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  return apiFetch<CreatedOrder>('/v1/orders', {
    method: 'POST',
    body: input,
    idempotencyKey: newIdempotencyKey(),
  });
}

export function listOrders(params?: {
  paymentStatus?: string;
  status?: string;
}): Promise<OrderSummary[]> {
  const qs = new URLSearchParams();
  if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  if (params?.status) qs.set('status', params.status);
  const suffix = qs.toString() ? `?${qs}` : '';
  return apiFetch<OrderSummary[]>(`/v1/orders${suffix}`);
}

/** Order detail including items and table/customer names. */
export function getOrder(orderId: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/v1/orders/${orderId}`);
}

/** A dining table for the POS / table map. */
export type PosTable = {
  id: string;
  outletId: string;
  areaId: string | null;
  name: string;
  capacity: number;
  status: string;
  isActive: boolean;
  occupiedSince: string | null;
  occupiedMinutes: number;
};

export function listTables(params?: {
  page?: number;
  limit?: number;
}): Promise<Paginated<PosTable>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<Paginated<PosTable>>(`/v1/tables${qs ? `?${qs}` : ''}`);
}

/** Move an open order to another table (dine-in). */
export function moveOrderTable(
  orderId: string,
  tableId: string,
): Promise<{ id: string; tableId: string; tableName: string }> {
  return apiFetch(`/v1/orders/${orderId}/move-table`, {
    method: 'POST',
    body: { tableId },
  });
}

/** Park an unpaid order (Bill Parkir) — moves it to status "held". */
export function holdOrder(orderId: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/v1/orders/${orderId}/hold`, { method: 'POST' });
}

/** Resume a parked order — moves it back to status "confirmed". */
export function unholdOrder(orderId: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/v1/orders/${orderId}/unhold`, { method: 'POST' });
}

/** Replace every item of an unpaid order (Bill Parkir edit before payment). */
export function replaceOrderItems(
  orderId: string,
  input: { items: CreateOrderLine[]; notes?: string },
): Promise<unknown> {
  return apiFetch(`/v1/orders/${orderId}/items/replace`, {
    method: 'POST',
    body: input,
  });
}

/** Void a single item of an unpaid order (soft-void, keeps an audit note). */
export function voidOrderItem(
  orderId: string,
  itemId: string,
  reason: string,
): Promise<{ itemId: string; status: string; reason: string }> {
  return apiFetch(`/v1/orders/${orderId}/items/${itemId}/void`, {
    method: 'POST',
    body: { reason },
  });
}

/** Void an unpaid order with a reason. */
export function voidOrder(
  orderId: string,
  reason: string,
): Promise<{ id: string; status: string; reason: string }> {
  return apiFetch(`/v1/orders/${orderId}/void`, {
    method: 'POST',
    body: { reason },
  });
}

/** Totals recomputed server-side after a discount/voucher change. */
export type OrderAdjustmentResult = {
  id: string;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
};

/** Apply a voucher code to an unpaid order (server validates + recomputes). */
export function applyVoucherToOrder(
  orderId: string,
  code: string,
): Promise<OrderAdjustmentResult & { code: string; voucherId: string }> {
  return apiFetch(`/v1/orders/${orderId}/voucher`, {
    method: 'POST',
    body: { code },
  });
}

/** Remove an applied voucher, restoring the order's original totals. */
export function removeVoucherFromOrder(
  orderId: string,
): Promise<OrderAdjustmentResult> {
  return apiFetch(`/v1/orders/${orderId}/voucher`, { method: 'DELETE' });
}

/** Apply a manual discount to an unpaid order (server recomputes totals). */
export function setOrderDiscount(
  orderId: string,
  amount: number,
  name?: string,
): Promise<OrderAdjustmentResult> {
  return apiFetch(`/v1/orders/${orderId}/discount`, {
    method: 'POST',
    body: { amount, name },
  });
}

/** Settle a `credit` (piutang) order — marks it paid and completes it. */
export function settleCreditOrder(
  orderId: string,
): Promise<{ id: string; paymentStatus: string; status: string }> {
  return apiFetch(`/v1/orders/${orderId}/credit-settle`, { method: 'POST' });
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

export function getOutlet(outletId: string): Promise<OutletDetail> {
  return apiFetch<OutletDetail>(`/v1/outlets/${outletId}`);
}

export function updateOutletProfile(
  outletId: string,
  input: {
    name?: string;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    picName?: string | null;
    operatingHours?: Record<string, unknown> | null;
    timezone?: string;
  },
): Promise<OutletDetail> {
  return apiFetch<OutletDetail>(`/v1/outlets/${outletId}`, {
    method: 'PATCH',
    body: input,
  });
}

/** Set the outlet's daily revenue goal and/or food-cost target (0 clears). */
export function setOutletTargets(
  outletId: string,
  input: { dailyRevenue?: number; foodCostPct?: number },
): Promise<{ outletId: string; settings: OutletSettings }> {
  return apiFetch(`/v1/outlets/${outletId}/targets`, {
    method: 'PATCH',
    body: input,
  });
}

export function updateOutletLocation(
  outletId: string,
  location: { lat: number | null; lng: number | null },
): Promise<{ outletId: string; gps: { lat: number; lng: number } | null }> {
  return apiFetch(`/v1/outlets/${outletId}/location`, {
    method: 'PATCH',
    body: location,
  });
}

export function updateOutletSettings(
  outletId: string,
  patch: Record<string, unknown>,
): Promise<{ outletId: string; settings: OutletSettings }> {
  return apiFetch(`/v1/outlets/${outletId}/settings`, {
    method: 'PATCH',
    body: patch,
  });
}

export type TenantBranding = {
  logoUrl?: string | null;
  primaryColor?: string | null;
  tagline?: string | null;
  customDomain?: string | null;
};

/** Storefront branding of the current tenant (owner/manager scope). */
export function getTenantBranding(): Promise<{
  id: string;
  name: string;
  branding: TenantBranding;
}> {
  return apiFetch('/v1/tenant/branding');
}

export function updateTenantBranding(
  input: TenantBranding,
): Promise<{ id: string; branding: TenantBranding }> {
  return apiFetch('/v1/tenant/branding', { method: 'PATCH', body: input });
}

// --- Printer --------------------------------------------------------------

export function listPrinters(): Promise<{
  outletId: string;
  printers: Printer[];
}> {
  return apiFetch('/v1/printers');
}

export type PrinterInput = {
  name: string;
  type: string;
  connection: string;
  address?: string;
  paperWidth?: number;
  station?: string;
};

export function createPrinter(input: PrinterInput): Promise<Printer> {
  return apiFetch<Printer>('/v1/printers', { method: 'POST', body: input });
}

export function updatePrinter(
  id: string,
  input: {
    name?: string;
    address?: string;
    isActive?: boolean;
    paperWidth?: number;
    station?: string;
  },
): Promise<Printer> {
  return apiFetch<Printer>(`/v1/printers/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deletePrinter(
  id: string,
): Promise<{ id: string; outletId: string; removed: true }> {
  return apiFetch(`/v1/printers/${id}`, { method: 'DELETE' });
}

export function testPrinter(id: string): Promise<{
  success: true;
  message: string;
  printer: Pick<Printer, 'id' | 'name' | 'connection' | 'address' | 'paperWidth'>;
}> {
  return apiFetch(`/v1/printers/${id}/test`, { method: 'POST' });
}

/** Server-generated receipt JSON for an order (FE renders/prints it). */
export function generateReceipt(orderId: string): Promise<ReceiptData> {
  return apiFetch<ReceiptData>(`/v1/printers/receipt/${orderId}`);
}

// --- Audit log ------------------------------------------------------------

export function listAuditLogs(params?: {
  entity?: string;
  action?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}): Promise<AuditLog[]> {
  const query = new URLSearchParams();
  if (params?.entity) query.set('entity', params.entity);
  if (params?.action) query.set('action', params.action);
  if (params?.entityId) query.set('entityId', params.entityId);
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<AuditLog[]>(`/v1/audit-logs${qs ? `?${qs}` : ''}`);
}

// --- Multi-outlet ---------------------------------------------------------

export function createOutlet(input: {
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  picName?: string;
  timezone?: string;
}): Promise<{ id: string; name: string; timezone: string; isActive: boolean }> {
  return apiFetch('/v1/outlets', { method: 'POST', body: input });
}

export function listStockTransfers(status?: string): Promise<StockTransfer[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<StockTransfer[]>(`/v1/stock-transfers${qs}`);
}

export function createStockTransfer(input: {
  toOutletId: string;
  notes?: string;
  items: Array<{ rawMaterialId: string; qty: number }>;
}): Promise<{ id: string; status: string }> {
  return apiFetch('/v1/stock-transfers', { method: 'POST', body: input });
}

export function acceptStockTransfer(
  transferId: string,
): Promise<{ id: string; status: string }> {
  return apiFetch(`/v1/stock-transfers/${transferId}/accept`, {
    method: 'POST',
  });
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
  type Raw = {
    productId?: string;
    productName?: string;
    soldQty?: number;
    revenue?: number;
    imageUrl?: string | null;
    categoryName?: string | null;
  };
  return apiFetch<Raw[]>(
    `/v1/reports/top-products?dateFrom=${dateFrom}&dateTo=${dateTo}&top=${top}`,
  ).then((rows) =>
    rows.map((row) => ({
      productId: row.productId,
      name: row.productName,
      qty: row.soldQty ?? 0,
      revenue: row.revenue ?? 0,
      imageUrl: row.imageUrl ?? null,
      categoryName: row.categoryName ?? null,
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

/** Omzet − COGS − waste. `extraCost` mirrors `wasteCost`. */
export function profitLoss(
  dateFrom: string,
  dateTo: string,
): Promise<ProfitLossReport> {
  return apiFetch<ProfitLossReport>(
    `/v1/reports/profit-loss?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

/** Cash in/out for one day (defaults to today server-side). */
export function cashFlow(date?: string): Promise<CashFlowReport> {
  const query = date ? `?date=${date}` : '';
  return apiFetch<CashFlowReport>(`/v1/reports/cash-flow${query}`);
}

export function outletComparison(
  dateFrom: string,
  dateTo: string,
): Promise<OutletComparison> {
  return apiFetch<OutletComparison>(
    `/v1/reports/outlet-comparison?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

/** `month` is `YYYY-MM`. */
export function breakEven(month: string): Promise<BreakEvenReport> {
  return apiFetch<BreakEvenReport>(`/v1/reports/break-even?month=${month}`);
}

/** `month` is `YYYY-MM`. */
export function taxSummary(month: string): Promise<TaxSummaryReport> {
  return apiFetch<TaxSummaryReport>(`/v1/reports/tax-summary?month=${month}`);
}

export function wasteReport(
  dateFrom?: string,
  dateTo?: string,
): Promise<WasteReport> {
  const params = new URLSearchParams();
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const query = params.toString();
  return apiFetch<WasteReport>(
    `/v1/reports/waste${query ? `?${query}` : ''}`,
  );
}

/** `month` is `YYYY-MM`. Returns a bare array. */
export function payroll(month: string): Promise<PayrollRow[]> {
  return apiFetch<PayrollRow[]>(`/v1/reports/payroll?month=${month}`);
}

export function menuEngineering(
  dateFrom: string,
  dateTo: string,
): Promise<MenuEngineeringReport> {
  return apiFetch<MenuEngineeringReport>(
    `/v1/reports/menu-engineering?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

export function byTable(
  dateFrom: string,
  dateTo: string,
): Promise<ByTableReport> {
  return apiFetch<ByTableReport>(
    `/v1/reports/by-table?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

export function byOrderType(
  dateFrom: string,
  dateTo: string,
): Promise<ByOrderTypeReport> {
  return apiFetch<ByOrderTypeReport>(
    `/v1/reports/by-order-type?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

export function discountsVoids(
  dateFrom: string,
  dateTo: string,
): Promise<DiscountsVoidsReport> {
  return apiFetch<DiscountsVoidsReport>(
    `/v1/reports/discounts-voids?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

export function productTrend(
  productId: string,
  days = 30,
): Promise<ProductTrendReport> {
  return apiFetch<ProductTrendReport>(
    `/v1/reports/product-trend?productId=${productId}&days=${days}`,
  );
}

/** Per-category sales. Returns a bare array. */
export function categorySales(
  dateFrom: string,
  dateTo: string,
): Promise<CategorySalesRow[]> {
  return apiFetch<CategorySalesRow[]>(
    `/v1/reports/by-category?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

/** Per-cashier sales. Returns a bare array. */
export function cashierSales(
  dateFrom: string,
  dateTo: string,
): Promise<CashierSalesRow[]> {
  return apiFetch<CashierSalesRow[]>(
    `/v1/reports/by-cashier?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

export function employeeSales(
  dateFrom: string,
  dateTo: string,
): Promise<EmployeeSalesReport> {
  return apiFetch<EmployeeSalesReport>(
    `/v1/reports/employee-sales?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

/** CSV export of the sales summary (`@SkipEnvelope` route). */
export function downloadSalesSummary(
  dateFrom: string,
  dateTo: string,
): Promise<Blob> {
  return apiDownloadBlob(
    `/v1/reports/sales-summary/export?dateFrom=${dateFrom}&dateTo=${dateTo}`,
  );
}

/** CSV export of top products (`@SkipEnvelope` route). */
export function downloadTopProducts(
  dateFrom: string,
  dateTo: string,
  top = 10,
): Promise<Blob> {
  return apiDownloadBlob(
    `/v1/reports/top-products/export?dateFrom=${dateFrom}&dateTo=${dateTo}&top=${top}`,
  );
}

// --- Karyawan & Shift -----------------------------------------------------

export function listEmployees(): Promise<Employee[]> {
  return apiFetch<Employee[]>('/v1/employees');
}

export type EmployeeInput = {
  name: string;
  phone?: string;
  role: string;
  pin: string;
  jobTitle?: string;
  payType?: PayType;
  baseSalary?: number;
  shiftRate?: number;
  commissionRate?: number;
};

export function createEmployee(input: EmployeeInput): Promise<Employee> {
  return apiFetch<Employee>('/v1/employees', {
    method: 'POST',
    body: input,
  });
}

export type EmployeeUpdate = {
  name?: string;
  phone?: string;
  role?: string;
  pin?: string;
  isActive?: boolean;
  jobTitle?: string | null;
  payType?: PayType;
  baseSalary?: number | null;
  shiftRate?: number | null;
  commissionRate?: number | null;
};

export function updateEmployee(
  id: string,
  input: EmployeeUpdate,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/v1/employees/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteEmployee(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/v1/employees/${id}`, {
    method: 'DELETE',
  });
}

export type EmployeeInviteInput = {
  email: string;
  employeeId?: string;
  name?: string;
  role?: string;
  jobTitle?: string;
  outletIds?: string[];
  payType?: PayType;
  baseSalary?: number;
  shiftRate?: number;
  commissionRate?: number;
};

export function inviteEmployee(
  input: EmployeeInviteInput,
): Promise<{ id: string; employeeId: string; email: string; expiresAt: string }> {
  return apiFetch(`/v1/employees/invites`, { method: 'POST', body: input });
}

export function listEmployeeInvites(): Promise<EmployeeInvite[]> {
  return apiFetch<EmployeeInvite[]>(`/v1/employees/invites`);
}

export function resendEmployeeInvite(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/v1/employees/invites/${id}/resend`, {
    method: 'POST',
  });
}

export function revokeEmployeeInvite(id: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/v1/employees/invites/${id}`, {
    method: 'DELETE',
  });
}

export function acceptEmployeeInvite(input: {
  tenantSlug: string;
  token: string;
  password: string;
  name?: string;
}): Promise<OwnerLoginResult> {
  return apiFetch<OwnerLoginResult>('/v1/auth/accept-invite', {
    method: 'POST',
    body: input,
    outletScoped: false,
  });
}

export function getEmployeeOutlets(id: string): Promise<EmployeeOutlet[]> {
  return apiFetch<EmployeeOutlet[]>(`/v1/employees/${id}/outlets`);
}

export function setEmployeeOutlets(
  id: string,
  outletIds: string[],
): Promise<EmployeeOutlet[]> {
  return apiFetch<EmployeeOutlet[]>(`/v1/employees/${id}/outlets`, {
    method: 'POST',
    body: { outletIds },
  });
}

export function listShifts(params?: {
  status?: string;
  limit?: number;
}): Promise<Shift[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<Shift[]>(`/v1/shifts${qs ? `?${qs}` : ''}`);
}

export function currentShift(): Promise<CurrentShift> {
  return apiFetch<CurrentShift>('/v1/shifts/current');
}

export function openShift(input: {
  employeeId: string;
  shiftName?: string;
  openingCash?: number;
}): Promise<Shift> {
  return apiFetch<Shift>('/v1/shifts/open', {
    method: 'POST',
    body: input,
  });
}

export function closeShift(
  shiftId: string,
  closingCash: number,
): Promise<ShiftCloseResult> {
  return apiFetch<ShiftCloseResult>(`/v1/shifts/${shiftId}/close`, {
    method: 'PATCH',
    body: { closingCash },
  });
}

export function listSchedules(
  dateFrom?: string,
  dateTo?: string,
): Promise<ShiftSchedule[]> {
  const query = new URLSearchParams();
  if (dateFrom) query.set('dateFrom', dateFrom);
  if (dateTo) query.set('dateTo', dateTo);
  const qs = query.toString();
  return apiFetch<ShiftSchedule[]>(
    `/v1/shift-schedules${qs ? `?${qs}` : ''}`,
  );
}

/** Schedules for the week starting on `date` (YYYY-MM-DD). */
export function scheduleWeek(date: string): Promise<ShiftSchedule[]> {
  return apiFetch<ShiftSchedule[]>(
    `/v1/shift-schedules/week?date=${date}`,
  );
}

export function createSchedule(input: {
  employeeId: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/v1/shift-schedules', {
    method: 'POST',
    body: input,
  });
}

export function copyScheduleWeek(date: string): Promise<{ copied: number }> {
  return apiFetch<{ copied: number }>('/v1/shift-schedules/copy-week', {
    method: 'POST',
    body: { date },
  });
}

export function requestScheduleSwap(
  id: string,
  targetScheduleId: string,
): Promise<{ id: string; status: string; swapWithId: string }> {
  return apiFetch(`/v1/shift-schedules/${id}/swap`, {
    method: 'POST',
    body: { targetScheduleId },
  });
}

export function approveScheduleSwap(
  id: string,
): Promise<{ id: string; swappedWith: string; status: string }> {
  return apiFetch(`/v1/shift-schedules/${id}/swap-approve`, {
    method: 'POST',
  });
}

export function deleteSchedule(
  id: string,
): Promise<{ id: string; deleted: true }> {
  return apiFetch(`/v1/shift-schedules/${id}`, { method: 'DELETE' });
}

export function listAttendances(params?: {
  dateFrom?: string;
  dateTo?: string;
  employeeId?: string;
}): Promise<Attendance[]> {
  const query = new URLSearchParams();
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.employeeId) query.set('employeeId', params.employeeId);
  const qs = query.toString();
  return apiFetch<Attendance[]>(`/v1/attendances${qs ? `?${qs}` : ''}`);
}

export function clockIn(input: {
  employeeId: string;
  gpsLat?: number;
  gpsLng?: number;
  photoUrl?: string;
}): Promise<ClockInResult> {
  return apiFetch<ClockInResult>('/v1/attendances/clock-in', {
    method: 'POST',
    body: input,
  });
}

export function clockOut(employeeId: string): Promise<ClockOutResult> {
  return apiFetch<ClockOutResult>('/v1/attendances/clock-out', {
    method: 'POST',
    body: { employeeId },
  });
}

/** Upload a selfie (or any file) and get back its public URL. */
export function uploadFile(file: File): Promise<{ publicUrl: string }> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<{ publicUrl: string }>('/v1/storage/local', {
    method: 'POST',
    formData: form,
  });
}

/** Self clock-in — identity is taken from the session on the server. */
export function clockInMe(input: {
  gpsLat?: number;
  gpsLng?: number;
  photoUrl?: string;
}): Promise<ClockInResult> {
  return apiFetch<ClockInResult>('/v1/attendances/me/clock-in', {
    method: 'POST',
    body: input,
  });
}

export function clockOutMe(): Promise<ClockOutResult> {
  return apiFetch<ClockOutResult>('/v1/attendances/me/clock-out', {
    method: 'POST',
  });
}

export function listMyAttendances(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<Attendance[]> {
  const query = new URLSearchParams();
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  const qs = query.toString();
  return apiFetch<Attendance[]>(`/v1/attendances/me${qs ? `?${qs}` : ''}`);
}

// --- CRM & Voucher --------------------------------------------------------

export function listCustomers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Customer>> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<Paginated<Customer>>(`/v1/customers${qs ? `?${qs}` : ''}`);
}

export type CustomerInput = {
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  notes?: string;
  referralCode?: string;
};

export function createCustomer(input: CustomerInput): Promise<{
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tier: string;
  referralCode: string;
}> {
  return apiFetch('/v1/customers', { method: 'POST', body: input });
}

export function getCustomer(id: string): Promise<CustomerDetail> {
  return apiFetch<CustomerDetail>(`/v1/customers/${id}`);
}

export function getCustomerAnalytics(
  id: string,
  days = 90,
): Promise<CustomerAnalytics> {
  return apiFetch<CustomerAnalytics>(
    `/v1/customers/${id}/analytics?days=${days}`,
  );
}

export function getCustomerStampCard(id: string): Promise<StampCard> {
  return apiFetch<StampCard>(`/v1/customers/${id}/stamp-card`);
}

export function redeemStampReward(
  id: string,
): Promise<{ customerId: string; rewardsEarned: number }> {
  return apiFetch(`/v1/customers/${id}/stamp-card/redeem`, { method: 'POST' });
}

export function getCustomerSegments(days = 90): Promise<CustomerSegments> {
  return apiFetch<CustomerSegments>(`/v1/customers/segments?days=${days}`);
}

export function getCustomerBirthdays(
  month: number,
): Promise<BirthdayCustomer[]> {
  return apiFetch<BirthdayCustomer[]>(
    `/v1/customers/birthdays?month=${month}`,
  );
}

export function updateCustomerTags(
  id: string,
  tags: string[],
): Promise<{ id: string; tags: string[] }> {
  return apiFetch(`/v1/customers/${id}/tags`, {
    method: 'PATCH',
    body: { tags },
  });
}

export function redeemCustomerPoints(
  id: string,
  points: number,
): Promise<{ id: string; redeemed: number; remainingPoints: number }> {
  return apiFetch(`/v1/customers/${id}/redeem`, {
    method: 'POST',
    body: { points },
  });
}

export function listVouchers(params?: {
  code?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Voucher>> {
  const query = new URLSearchParams();
  if (params?.code) query.set('code', params.code);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<Paginated<Voucher>>(`/v1/vouchers${qs ? `?${qs}` : ''}`);
}

export type VoucherInput = {
  code: string;
  name: string;
  type: string;
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  maxUses?: number;
  expiresAt?: string;
};

export function createVoucher(input: VoucherInput): Promise<{
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
}> {
  return apiFetch('/v1/vouchers', { method: 'POST', body: input });
}

export function validateVoucher(
  code: string,
  orderTotal: number,
): Promise<VoucherValidation> {
  return apiFetch<VoucherValidation>('/v1/vouchers/validate', {
    method: 'POST',
    body: { code, orderTotal },
  });
}

export function updateVoucher(
  id: string,
  input: { isActive?: boolean; maxUses?: number; expiresAt?: string },
): Promise<{ id: string }> {
  return apiFetch(`/v1/vouchers/${id}`, { method: 'PATCH', body: input });
}

// --- Keuangan -------------------------------------------------------------

export function listExpenses(params?: {
  category?: string;
  costType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<Paginated<Expense>> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.costType) query.set('costType', params.costType);
  if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params?.dateTo) query.set('dateTo', params.dateTo);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch<Paginated<Expense>>(`/v1/expenses${qs ? `?${qs}` : ''}`);
}

export type ExpenseInput = {
  category: string;
  costType: string;
  amount: number;
  description?: string;
  expenseDate?: string;
};

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return apiFetch<Expense>('/v1/expenses', { method: 'POST', body: input });
}

export function updateExpense(
  id: string,
  input: { category?: string; amount?: number; description?: string },
): Promise<{ id: string }> {
  return apiFetch(`/v1/expenses/${id}`, { method: 'PATCH', body: input });
}

export function deleteExpense(id: string): Promise<{ id: string }> {
  return apiFetch(`/v1/expenses/${id}`, { method: 'DELETE' });
}

export function listSupplierInvoices(params?: {
  status?: string;
  dueBefore?: string;
}): Promise<SupplierInvoice[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.dueBefore) query.set('dueBefore', params.dueBefore);
  const qs = query.toString();
  return apiFetch<SupplierInvoice[]>(
    `/v1/suppliers/invoices${qs ? `?${qs}` : ''}`,
  );
}

export function createSupplierInvoice(
  supplierId: string,
  input: {
    invoiceNumber?: string;
    totalAmount: number;
    dueDate?: string;
    poId?: string;
  },
): Promise<{
  id: string;
  invoiceNumber: string | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string | null;
}> {
  return apiFetch(`/v1/suppliers/${supplierId}/invoices`, {
    method: 'POST',
    body: input,
  });
}

export function paySupplierInvoice(
  invoiceId: string,
  amount: number,
): Promise<{ id: string; paidAmount: number; status: string }> {
  return apiFetch(`/v1/suppliers/invoices/${invoiceId}/pay`, {
    method: 'POST',
    body: { amount },
  });
}

export function accountingProvider(): Promise<AccountingProvider> {
  return apiFetch<AccountingProvider>('/v1/accounting/provider');
}

export function previewJournals(date: string): Promise<JournalEntry[]> {
  return apiFetch<JournalEntry[]>('/v1/accounting/journals/preview', {
    method: 'POST',
    body: { date },
  });
}

export function syncJournals(date: string): Promise<JournalSyncResult> {
  return apiFetch<JournalSyncResult>('/v1/accounting/journals/sync', {
    method: 'POST',
    body: { date },
  });
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
