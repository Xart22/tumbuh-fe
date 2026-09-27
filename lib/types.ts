export type Role = 'owner' | 'manager' | 'supervisor' | 'cashier' | 'chef';

export type OrderType = 'dine_in' | 'take_away' | 'delivery';

export const PAYMENT_METHODS = [
  'cash',
  'qris',
  'qris_dynamic',
  'debit',
  'credit',
  'ewallet_gopay',
  'ewallet_ovo',
  'ewallet_dana',
  'ewallet_shopeepay',
  'deposit',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  qris_dynamic: 'QRIS Dinamis',
  debit: 'Kartu Debit',
  credit: 'Kredit / Piutang',
  ewallet_gopay: 'GoPay',
  ewallet_ovo: 'OVO',
  ewallet_dana: 'Dana',
  ewallet_shopeepay: 'ShopeePay',
  deposit: 'Deposit',
};

/** Methods that settle through the gateway webhook, not in cash. */
export const ASYNC_METHODS = new Set<PaymentMethod>([
  'qris_dynamic',
  'ewallet_gopay',
  'ewallet_ovo',
  'ewallet_dana',
  'ewallet_shopeepay',
]);

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Filter badges for the menu page; omitted by older/other list endpoints. */
export type ProductFacets = {
  counts: { all: number; available: number; soldOut: number };
  categoryCounts: Record<string, number>;
};

export type Outlet = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  timezone?: string;
};

export type PublicStore = {
  name: string;
  slug: string;
  branding: Record<string, unknown>;
  outlets: Outlet[];
};

export type Category = {
  id: string;
  outletId: string;
  name: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  outletId: string;
  categoryId: string | null;
  name: string;
  basePrice: number;
  isAvailable: boolean;
  /** POS code (SKU/barcode); null when not set. */
  sku?: string | null;
  description?: string | null;
  /** Relative path under the BE `/uploads` mount (e.g. `/uploads/products/…`). */
  photoUrl?: string | null;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: number;
  isActive: boolean;
  sortOrder?: number;
};

export type Modifier = {
  id: string;
  groupId?: string;
  name: string;
  priceAddition: number;
  isActive: boolean;
};

export type ModifierGroup = {
  id: string;
  productId: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  modifiers: Modifier[];
};

export type LoginKasirResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: { id: string; name: string; role: Role };
};

export type LoginOwnerResult = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: { id: string; email: string; name: string; role: string; tenantId: string };
};

export type WorkspaceOption = { slug: string; name: string };

/** Multi-workspace email: pick one, then retry login with its slug. */
export type WorkspaceChoice = {
  requiresWorkspace: true;
  workspaces: WorkspaceOption[];
};

export type OwnerLoginResult = LoginOwnerResult | WorkspaceChoice;

export function isWorkspaceChoice(
  result: OwnerLoginResult,
): result is WorkspaceChoice {
  return (result as WorkspaceChoice).requiresWorkspace === true;
}

export type CartLine = {
  /** Local id — one line per product+variant+modifier combination. */
  key: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  qty: number;
  unitPrice: number;
  notes?: string;
  modifierGroups: Array<{
    groupId: string;
    groupName: string;
    selected: Array<{ id: string; name: string; priceAddition: number }>;
  }>;
};

export type CreatedOrder = {
  id: string;
  outletId: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  orderType: OrderType;
};

export type CreatedPayment = {
  id: string;
  method: PaymentMethod;
  status: string;
  amount: number;
  changeAmount: number;
};

export type PaymentResult = {
  outletId: string;
  orderId: string;
  totalTendered: number;
  changeAmount: number;
  payments: CreatedPayment[];
  qris?: {
    qrString?: string;
    referenceId?: string;
    provider?: string;
    awaitingWebhook: boolean;
  };
};

export type DailySummary = {
  outletId: string;
  date?: string;
  grossSales?: number;
  netSales?: number;
  taxAmount?: number;
  discountAmount?: number;
  serviceCharge?: number;
  /** BE names this `orderCount`; adapters normalise it to `totalOrders`. */
  orderCount?: number;
  totalOrders?: number;
  paidOrders?: number;
  averageOrderValue?: number;
  /** Outlet daily revenue goal from `/v1/outlets/:id/targets`; 0 = unset. */
  dailyRevenueTarget?: number;
  [key: string]: unknown;
};

export type SalesSummary = DailySummary & {
  dateFrom: string;
  dateTo: string;
};

/** Normalised in `lib/api.ts` from the BE's `{productName, soldQty}` shape. */
export type TopProduct = {
  productId?: string;
  name?: string;
  qty?: number;
  revenue?: number;
  [key: string]: unknown;
};

/** Normalised in `lib/api.ts` from the BE's `{buckets: [...]}` shape. */
export type HourlySalesRow = {
  hour: number;
  orders?: number;
  revenue?: number;
  [key: string]: unknown;
};

export type PaymentMethodRow = {
  method: string;
  amount?: number;
  percentage?: number;
  transactionCount?: number;
};

/** Latest closed shift's cash reconciliation (`/v1/reports/payment-methods`). */
export type CashDrawer = {
  expectedCash: number;
  countedCash: number;
  variance: number;
};

/** One row per clocked-in employee; `terminalName` is the shift/outlet label. */
export type ActiveShift = {
  terminalName: string;
  cashierName: string | null;
  role: string | null;
  startedAt: string;
  status: string;
};

/** Normalised in `lib/api.ts` from the BE's `{buckets: [...]}` shape. */
export type HourlyForecastRow = {
  hour: number;
  expectedRevenue?: number;
};

/** Platform announcement (`severity` is free-form; style maps it defensively). */
export type Announcement = {
  id: string;
  title: string;
  body: string;
  severity?: string;
  startsAt?: string;
  endsAt?: string | null;
};

/** Raw material with a safety-stock verdict (`/v1/inventory/stock-levels`). */
export type StockLevel = {
  ingredientId: string;
  name: string;
  unit: string;
  currentQty: number;
  minQty: number;
  usageNote?: string | null;
  /** Projected empty date from 7-day usage; null when usage can't be estimated. */
  depletedAt?: string | null;
  status: 'critical' | 'low' | 'ok' | string;
};

export type RawMaterialStatus = 'critical' | 'low' | 'ok';

export const UNIT_FAMILIES = ['volume', 'mass', 'count', 'length'] as const;
export type UnitFamily = (typeof UNIT_FAMILIES)[number];

export const UNIT_FAMILY_LABELS: Record<UnitFamily, string> = {
  volume: 'Volume',
  mass: 'Massa',
  count: 'Jumlah',
  length: 'Panjang',
};

/** Master unit (`/v1/units`). `factorToBase` normalises inside a family. */
export type Unit = {
  id: string;
  code: string;
  name: string;
  family: UnitFamily;
  factorToBase: number;
  baseUnit: string;
  isCustom: boolean;
};

export type RawMaterial = {
  id: string;
  name: string;
  unit: string;
  sku?: string | null;
  category?: string | null;
  stockUnitId?: string | null;
  stockUnitCode?: string | null;
  purchaseUnitId?: string | null;
  purchaseUnitCode?: string | null;
  /** Stock units per purchase unit (1 karton = 12 -> 12). */
  packSize?: number;
  stockQty: number;
  minStockQty: number;
  costPerUnit: number;
  expiresAt?: string | null;
  status?: RawMaterialStatus;
  /** Unit price of the latest PO line for this material (traceability only). */
  lastUnitPrice?: number | null;
  lastSupplierName?: string | null;
};

/** `/v1/reports/stock-forecast` — usage velocity per material. */
export type StockForecast = {
  rawMaterialId: string;
  rawMaterialName: string;
  unit: string;
  stockQty: number;
  avgDailyUsage: number;
  forecastNeed: number;
  daysOfStockLeft: number | null;
  shortage: boolean;
};

export type RecipeItem = {
  id?: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  qtyUsed: number;
  unit: string;
  rawMaterialUnit?: string;
  /** Moving-average cost per stock unit (`/v1/inventory/recipes/...`). */
  costPerUnit?: number;
};

export type Recipe = {
  productId: string;
  variantId: string | null;
  itemCount: number;
  items: RecipeItem[];
};

/** `/v1/reports/product-margins` — HPP from recipes vs sell price. */
export type ProductMargin = {
  productId: string;
  productName: string;
  price: number;
  cogs: number;
  margin: number;
  marginPct: number;
  /** COGS ÷ price × 100; null when price is 0. */
  foodCostPct?: number | null;
  /** Price that would hit the outlet's food-cost ceiling. */
  idealPrice?: number | null;
  foodCostTargetPct?: number;
};

export type InventoryValuationItem = {
  rawMaterialId: string;
  name: string;
  unit: string;
  stockQty: number;
  minStockQty: number;
  costPerUnit: number;
  value: number;
  status: RawMaterialStatus;
};

export type InventoryValuation = {
  outletId: string;
  itemCount: number;
  totalAssetValue: number;
  criticalCount: number;
  lowCount: number;
  items: InventoryValuationItem[];
};

export type ProfitSummary = {
  outletId: string;
  dateFrom: string;
  dateTo: string;
  revenue: number;
  cogs: number;
  extraCost: number;
  totalCost: number;
  grossProfit: number;
  grossMarginPct: number;
  uncostedItems: number;
  costedItems: number;
  costCoveragePct: number;
  itemCount: number;
  wasteCost: number;
};

export type StockMutation = {  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  unit: string;
  referenceType: string;
  mutationType: string;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  unitCost: number | null;
  notes?: string | null;
  createdByName?: string | null;
  createdAt: string;
};

export type ExpiringMaterialItem = {
  /** `material` = coarse expiry on the material; `batch` = per receipt lot. */
  source: 'material' | 'batch';
  rawMaterialId: string;
  name: string;
  unit: string;
  qty: number;
  unitCost: number;
  lot: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  status: 'expired' | 'soon' | 'ok';
};

export type ExpiringMaterials = {
  outletId: string;
  days: number;
  expiredCount: number;
  soonCount: number;
  items: ExpiringMaterialItem[];
};

export type Supplier = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export type PurchaseOrderSummary = {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  expectedDate: string | null;
  supplierName: string;
  createdAt: string;
};

export type PurchaseOrderItem = {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  unit: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
  totalPrice: number;
};

export type PurchaseOrder = PurchaseOrderSummary & {
  notes?: string | null;
  supplier: { id: string; name: string };
  items: PurchaseOrderItem[];
};

export type StockOpnameSummary = {
  id: string;
  status: string;
  conductedByName?: string | null;
  conductedAt?: string | null;
  confirmedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  itemCount: number;
};

export type StockOpnameItem = {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  unit: string;
  systemQty: number;
  physicalQty: number | null;
  variance: number | null;
  minStockQty: number;
  notes?: string | null;
};

export type StockOpname = StockOpnameSummary & {
  summary: {
    itemCount: number;
    countedItems: number;
    discrepancyCount: number;
    totalVarianceQty: number;
  };
  items: StockOpnameItem[];
};

export const WASTE_REASONS = [
  'expired',
  'damaged',
  'spoiled',
  'other',
] as const;

export type WasteReason = (typeof WASTE_REASONS)[number];

export const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  expired: 'Kedaluwarsa',
  damaged: 'Rusak',
  spoiled: 'Basi',
  other: 'Lainnya',
};

export type WasteRecord = {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  unit: string;
  qty: number;
  reason: string;
  unitCost: number;
  totalCost: number;
  notes?: string | null;
  createdAt: string;
};

/** `/v1/raw-materials/summary` KPI roll-up. */
export type MaterialSummary = {
  itemCount: number;
  totalAssetValue: number;
  criticalCount: number;
  lowCount: number;
};
