export type Role =
  | 'owner'
  | 'manager'
  | 'supervisor'
  | 'cashier'
  | 'chef'
  | 'staff';

export type OrderType = 'dine_in' | 'take_away' | 'delivery';

/** Optional tenant modules (`public.tenants.enabled_modules`). Core areas are
 * never listed here. Empty list on the BE = all enabled. */
export const TENANT_MODULE_KEYS = [
  'pos',
  'kds',
  'inventory',
  'loyalty',
  'shifts',
  'online_store',
  'accounting',
  'multi_outlet',
  'public_api',
  'efaktur',
] as const;
export type TenantModuleKey = (typeof TENANT_MODULE_KEYS)[number];

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
  city?: string | null;
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
  /** Barcode / UPC for POS scan lookup; null when not set. */
  barcode?: string | null;
  description?: string | null;
  /** Relative path under the BE `/uploads` mount (e.g. `/uploads/products/…`). */
  photoUrl?: string | null;
  /** Availability window `HH:MM` (UTC); null when the product is all-day. */
  availabilityStart?: string | null;
  availabilityEnd?: string | null;
};

export type ProductBundleItem = {
  productId: string;
  productName: string | null;
  qty: number;
};

export type ProductBundle = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  items: ProductBundleItem[];
};

export type ProductOutletOverride = {
  outletId: string;
  outletName: string;
  priceOverride: number | null;
  isAvailable: boolean;
  hasOverride: boolean;
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
  /** Relative BE upload path or absolute object-storage URL; null when unset. */
  imageUrl?: string | null;
  categoryName?: string | null;
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
  /** Relative BE upload path or absolute object-storage URL; null when unset. */
  imageUrl?: string | null;
  categoryName?: string | null;
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

// --- Reports (extended) ---------------------------------------------------

export type ProfitLossReport = {
  outletId: string;
  dateFrom: string;
  dateTo: string;
  grossSales: number;
  cogs: number;
  grossProfit: number;
  operationalExpenses: number;
  salaryExpenses: number;
  rentExpense: number;
  utilityExpense: number;
  otherExpenses: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
};

export type CashFlowReport = {
  date: string;
  outletId: string;
  cashIn: { sales: number; total: number };
  cashOut: { expenses: number; purchases: number; total: number };
  openingBalance: number;
  closingBalance: number;
};

export type OutletComparisonRow = {
  outletId: string;
  outletName: string;
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
};

export type OutletComparison = { items: OutletComparisonRow[] };

export type BreakEvenReport = {
  outletId: string;
  month: string;
  revenue: number;
  fixedCost: number;
  variableCost: number;
  contributionMarginRatio: number;
  breakEvenRevenue: number;
  achievementPct: number;
  profit: number;
};

export type TaxSummaryReport = {
  outletId: string;
  month: string;
  paidOrderCount: number;
  grossRevenue: number;
  vatCollected: number;
  pphFinalRate: number;
  pphFinal: number;
  taxInvoices: Array<{
    id: string;
    invoiceNumber: string;
    taxAmount: number;
    status: string;
  }>;
};

export type WasteReport = {
  outletId: string;
  dateFrom: string | null;
  dateTo: string | null;
  recordCount: number;
  totalCost: number;
  byMaterial: Array<{
    rawMaterialId: string;
    rawMaterialName: string;
    unit: string;
    qty: number;
    cost: number;
  }>;
  byReason: Array<{ reason: string; qty: number; cost: number }>;
};

export type PayrollRow = {
  employeeId: string;
  employeeName: string;
  payType: PayType;
  hours: number;
  shiftCount: number;
  baseSalary: number;
  shiftRate: number;
  timePay: number;
  salesTotal: number;
  commission: number;
  grossPay: number;
};

export type MenuEngineeringClass = 'star' | 'plow_horse' | 'puzzle' | 'dog';

export type MenuEngineeringItem = {
  productId: string;
  productName: string;
  soldQty: number;
  revenue: number;
  cogs: number;
  margin: number;
  classification: MenuEngineeringClass;
};

export type MenuEngineeringReport = {
  items: MenuEngineeringItem[];
  /** Absent on the BE's empty-result branch. */
  thresholds?: { avgRevenue: number; avgMargin: number };
};

export type ByTableReport = {
  outletId: string;
  dateFrom: string;
  dateTo: string;
  items: Array<{
    tableId: string;
    tableName: string;
    orderCount: number;
    revenue: number;
    averageSpend: number;
  }>;
};

export type ByOrderTypeReport = {
  outletId: string;
  dateFrom: string;
  dateTo: string;
  totalOrders: number;
  items: Array<{
    orderType: string | null;
    orderCount: number;
    revenue: number;
    sharePct: number;
  }>;
};

export type DiscountsVoidsReport = {
  outletId: string;
  dateFrom: string;
  dateTo: string;
  totalDiscount: number;
  discountedOrders: number;
  bySource: Array<{ source: string; amount: number }>;
  voidedOrderCount: number;
  voidedOrderValue: number;
  voidedItemCount: number;
  voidedItemValue: number;
  voidedItems: Array<{
    orderItemId: string;
    productName: string | null;
    qty: number;
    total: number;
  }>;
};

export type ProductTrendReport = {
  outletId: string;
  productId: string;
  days: number;
  points: Array<{ date: string; qty: number; revenue: number }>;
};

export type CategorySalesRow = {
  category: string;
  soldQty: number;
  revenue: number;
};

export type CashierSalesRow = {
  cashier: string;
  orderCount: number;
  revenue: number;
};

export type EmployeeSalesReport = {
  outletId: string;
  dateFrom: string;
  dateTo: string;
  employees: Array<{
    cashierId: string | null;
    cashierName: string;
    orderCount: number;
    paidOrders: number;
    grossSales: number;
    discountAmount: number;
    netSales: number;
    shifts: Array<{
      shiftId: string | null;
      shiftName: string | null;
      orderCount: number;
      grossSales: number;
    }>;
  }>;
};

// --- Karyawan & Shift -----------------------------------------------------

export const EMPLOYEE_ROLES = [
  'cashier',
  'supervisor',
  'manager',
  'chef',
  'staff',
] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  cashier: 'Kasir',
  supervisor: 'Supervisor',
  manager: 'Manajer',
  chef: 'Chef',
  staff: 'Staf (absen saja)',
};

export const PAY_TYPES = ['monthly', 'hourly', 'per_shift'] as const;

export type PayType = (typeof PAY_TYPES)[number];

export const PAY_TYPE_LABELS: Record<PayType, string> = {
  monthly: 'Bulanan',
  hourly: 'Per Jam',
  per_shift: 'Per Shift',
};

export type Employee = {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  joinedAt?: string | null;
  jobTitle: string | null;
  /** Email login (null = belum diundang). */
  loginEmail: string | null;
  /** Status undangan login: none | pending | active. */
  inviteStatus: 'none' | 'pending' | 'active';
  payType: PayType;
  baseSalary: number | null;
  shiftRate: number | null;
  commissionRate: number | null;
};

export type EmployeeInviteStatus = 'pending' | 'accepted' | 'expired';

export type EmployeeInvite = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  role: string | null;
  email: string;
  status: EmployeeInviteStatus;
  expiresAt: string;
  createdAt: string;
};

export type EmployeeOutlet = {
  outletId: string;
  outletName: string | null;
  roleOverride: string | null;
};

export type ShiftRecap = {
  orderCount: number;
  grossSales: number;
  totalPayments: number;
  cashSales: number;
  cashChange: number;
  totalExpenses: number;
  expectedCash: number;
};

export type Shift = {
  id: string;
  outletId: string;
  employeeId: string;
  employeeName: string | null;
  shiftName: string | null;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  status: string;
};

export type CurrentShift =
  | { currentShift: null; stale?: boolean }
  | { currentShift: Shift; recap: ShiftRecap; stale?: boolean };

export type ShiftCloseResult = {
  shift: Shift;
  recap: ShiftRecap & { difference: number };
};

export type ScheduleStatus = 'scheduled' | 'swap_pending' | 'approved';

export type ShiftSchedule = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  swapWithId: string | null;
};

export type Attendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number | null;
  status: string;
  gps: { lat: number; lng: number } | null;
  distanceMeters: number | null;
  photoUrl: string | null;
};

export type ClockInResult = {
  id: string;
  employeeId: string;
  employeeName: string;
  clockIn: string;
  status: string;
  gps: { lat: number; lng: number } | null;
  distanceMeters: number;
  photoUrl: string | null;
};

export type ClockOutResult = {
  id: string;
  employeeId: string;
  clockOut: string;
  hoursWorked: number;
};

// --- CRM & Voucher --------------------------------------------------------

export const CUSTOMER_TIERS = ['bronze', 'silver', 'gold', 'platinum'] as const;
export type CustomerTier = (typeof CUSTOMER_TIERS)[number];

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  totalPoints: number;
  tier: string;
  createdAt: string;
};

export type CustomerVisit = {
  id: string;
  outletId: string;
  orderId: string | null;
  pointsEarned: number;
  pointsRedeemed: number;
  visitedAt: string;
};

export type CustomerDetail = Customer & {
  birthDate: string | null;
  notes: string | null;
  visits: CustomerVisit[];
};

export type CustomerAnalytics = {
  customerId: string;
  name: string;
  tier: string;
  totalPoints: number;
  days: number;
  visitCount: number;
  totalSpending: number;
  averageOrderValue: number;
  lastVisitAt: string | null;
  favoriteProducts: Array<{
    productId: string;
    productName: string;
    qty: number;
    revenue: number;
  }>;
};

export type CustomerSegmentRow = {
  customerId: string;
  name: string;
  visitCount: number;
  spending: number;
  totalPoints: number;
};

export type CustomerSegments = {
  outletId: string;
  days: number;
  counts: { new: number; regular: number; vip: number };
  segments: {
    new: CustomerSegmentRow[];
    regular: CustomerSegmentRow[];
    vip: CustomerSegmentRow[];
  };
};

export type BirthdayCustomer = {
  customerId: string;
  name: string;
  phone: string | null;
  birthDate: string;
};

export type StampCard = {
  id: string | null;
  stamps: number;
  threshold: number;
  rewardsEarned: number;
  mode: string;
};

export const VOUCHER_TYPES = ['percent', 'fixed'] as const;
export type VoucherType = (typeof VOUCHER_TYPES)[number];

export type Voucher = {
  id: string;
  code: string;
  name: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
};

export type VoucherValidation = {
  valid: true;
  voucherId: string;
  code: string;
  voucherName: string;
  type: string;
  value: number;
  discountAmount: number;
  finalTotal: number;
};

// --- Keuangan -------------------------------------------------------------

export type OrderItemModifier = {
  modifierId: string;
  modifierName: string;
  priceAddition: number;
  groupId?: string | null;
  groupName?: string | null;
};

export type OrderItem = {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string | null;
  variantName: string | null;
  qty: number;
  unitPrice: number;
  total: number;
  status?: string;
  notes?: string | null;
  modifiers: OrderItemModifier[];
};

export type OrderSummary = {
  id: string;
  outletId?: string;
  orderNumber: string;
  orderType?: OrderType;
  status: string;
  paymentStatus?: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  total: number;
  notes?: string | null;
  /** Table name (dine-in); null when the order has no table. */
  tableNumber?: string | null;
  /** Linked customer name; null for walk-in orders. */
  customerName?: string | null;
  createdAt?: string;
  items?: OrderItem[];
};

export type OrderDetail = OrderSummary & {
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
};

// --- Kitchen Display (KDS) -------------------------------------------------

export type KitchenItemStatus =
  | 'pending'
  | 'cooking'
  | 'ready'
  | 'served'
  | 'voided';

export type KitchenQueueItem = {
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  tableId: string | null;
  tableName: string | null;
  orderType: OrderType;
  orderCreatedAt?: string;
  productId: string;
  productName: string;
  qty: number;
  status: KitchenItemStatus;
  station: string | null;
  notes: string | null;
  sentToKitchenAt: string | null;
  queuedAt: string;
  waitingMinutes: number | null;
  overdue: boolean;
  modifiers: Array<{ modifierName: string; priceAddition: number }>;
};

export type KitchenSummary = {
  pending: number;
  cooking: number;
  ready: number;
  active: number;
};

export type KitchenUpdateResult = {
  orderItemId: string;
  orderId: string;
  status: KitchenItemStatus;
};

export type KitchenOrderResult = {
  orderId: string;
  totalItems: number;
  items: KitchenUpdateResult[];
};

/** Server-generated receipt payload (`GET /v1/printers/receipt/:orderId`). */
export type ReceiptData = {
  header: { storeName: string; address: string; phone: string };
  order: { number: string; type: OrderType; date: string };
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
    notes: string | null;
    modifiers: Array<{ name: string; price: number }>;
  }>;
  summary: {
    subtotal: number;
    discount: number;
    tax: number;
    serviceCharge: number;
    total: number;
  };
  payments: Array<{
    method: string;
    amount: number;
    changeAmount: number;
    paidAt: string | null;
  }>;
  footer: { message: string };
};

export const EXPENSE_COST_TYPES = ['variable', 'fixed'] as const;
export type ExpenseCostType = (typeof EXPENSE_COST_TYPES)[number];

/**
 * Canonical expense categories stored on `expenses.category`. The BE P&L buckets
 * by these keys, so the UI stores the key and only shows the Indonesian label.
 */
export const EXPENSE_CATEGORIES = [
  { value: 'raw_material', label: 'Bahan Baku' },
  { value: 'operational', label: 'Operasional' },
  { value: 'salary', label: 'Gaji' },
  { value: 'rent', label: 'Sewa' },
  { value: 'utility', label: 'Utilitas' },
  { value: 'other', label: 'Lain-lain' },
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value'];

export function expenseCategoryLabel(value: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export type Expense = {
  id: string;
  category: string;
  costType: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  createdAt: string;
};

export type SupplierInvoice = {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string | null;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string | null;
};

export type AccountingProvider = {
  provider: 'jurnal' | 'accurate' | 'none';
};

export type JournalLine = {
  accountCode: string;
  debit: number;
  credit: number;
};

export type JournalEntry = {
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
};

export type JournalSyncResult = {
  date: string;
  entries: number;
  provider: string;
  synced: number;
  skipped: number;
  pending?: boolean;
  note?: string;
};

// --- Pengaturan Outlet ----------------------------------------------------

export type TaxSettings = { enabled: boolean; rate: number; name: string };
export type ServiceChargeSettings = { enabled: boolean; rate: number };
export type KdsSettings = {
  alertMinutes: number;
  stationRules: Array<{ station: string; match: string }>;
};
export type AttendanceSettings = {
  maxRadiusM: number;
  requireGps: boolean;
  requirePhoto: boolean;
};
export type ReceiptSettings = { whatsapp: boolean };
export type DeliverySettings = {
  enabled: boolean;
  flatFee: number;
  perKmFee: number;
  freeRadiusKm: number;
  maxRadiusKm: number;
};
export type LoyaltyTiersSettings = {
  silverMinSpend: number;
  goldMinSpend: number;
  platinumMinSpend: number;
};
export type LoyaltySettings = {
  pointsPerRp: number;
  redeemRate: number;
  pointsMultiplier: number;
  referralBonusPoints: number;
  stampThreshold: number;
  stampMode: string;
  stampProductIds: string[];
  tiers: LoyaltyTiersSettings;
  pointsExpireDays: number;
};
export type TargetsSettings = { dailyRevenue: number; foodCostPct: number };

export type OutletSettings = {
  tax: TaxSettings;
  serviceCharge: ServiceChargeSettings;
  roundingBase: number;
  kds: KdsSettings;
  attendance: AttendanceSettings;
  loyalty: LoyaltySettings;
  receipt: ReceiptSettings;
  delivery: DeliverySettings;
  targets: TargetsSettings;
};

export type OutletDetail = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  picName: string | null;
  operatingHours: Record<string, unknown>;
  timezone: string;
  gps: { lat: number; lng: number } | null;
  settings: OutletSettings;
  isActive: boolean;
};

export const PRINTER_TYPES = ['thermal', 'kitchen'] as const;
export const PRINTER_CONNECTIONS = ['usb', 'lan', 'bluetooth'] as const;

export type Printer = {
  id: string;
  outletId: string;
  name: string;
  type: string;
  connection: string;
  address: string | null;
  paperWidth: number;
  station: string | null;
};

export type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  changes: unknown;
  actorUserId: string | null;
  actorRole: string | null;
  actorName: string | null;
  actorEmail: string | null;
  requestId: string | null;
  createdAt: string;
};

// --- Multi-outlet ---------------------------------------------------------

export type StockTransferItem = {
  rawMaterialId: string;
  rawMaterialName: string;
  qty: number;
};

export type StockTransfer = {
  id: string;
  fromOutletId: string;
  toOutletId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  items: StockTransferItem[];
};
