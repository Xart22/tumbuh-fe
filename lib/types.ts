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
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: number;
  isActive: boolean;
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
