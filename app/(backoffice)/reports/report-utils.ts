/** Shared types + period helpers for the reports page. */

export type Range = { dateFrom: string; dateTo: string };

export type ReportTabId =
  | 'penjualan'
  | 'menu'
  | 'laba'
  | 'operasional'
  | 'pajak';

export const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'Dine-in',
  takeaway: 'Take away',
  delivery: 'Delivery',
};

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthStartISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Same-length window immediately before `range` (for period comparison). */
export function prevRange(range: Range): Range {
  const from = new Date(`${range.dateFrom}T00:00:00`);
  const to = new Date(`${range.dateTo}T00:00:00`);
  const lengthDays =
    Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (lengthDays - 1));
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { dateFrom: iso(prevFrom), dateTo: iso(prevTo) };
}
