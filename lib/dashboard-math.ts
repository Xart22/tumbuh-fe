// Pure helpers for the owner dashboard. No imports: this module is also
// loaded by `node --test` (same constraint as order-math.ts).
import type { HourlySalesRow } from './types.ts';

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Yesterday relative to `now` — the dashboard's like-for-like baseline. */
export function yesterdayISO(now: Date): string {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

/** Percent change. Null when there is no usable baseline (avoids a fake 0%). */
export function delta(current: number | undefined, prev: number | undefined): number | null {
  if (current === undefined || !prev) return null;
  return ((current - prev) / prev) * 100;
}

export type PeakWindow = { label: string; from: number; to: number; revenue: number };

/**
 * Top revenue windows for the hourly chart's quick-metrics strip. Two slots
 * max, so a slow day does not render three empty ribbons. Hours with zero
 * revenue are dropped — the BE still returns open hours with no sales.
 */
export function topHourlyWindows(rows: HourlySalesRow[], count = 2): PeakWindow[] {
  const paid = rows.filter((row) => (row.revenue ?? 0) > 0);
  if (paid.length === 0) return [];
  const ranked = [...paid].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
  const picked: PeakWindow[] = [];
  for (const row of ranked) {
    if (picked.length >= count) break;
    if (picked.some((w) => Math.abs(w.from - row.hour) <= 1)) continue;
    picked.push({
      label: `${pad2(row.hour)}:00–${pad2(row.hour + 1)}:00`,
      from: row.hour,
      to: row.hour + 1,
      revenue: row.revenue ?? 0,
    });
  }
  return picked.sort((a, b) => a.from - b.from);
}

/**
 * Sums yesterday's rows only up to `hourSoFar`, so a mid-afternoon comparison
 * is not measured against a full day — same clock window, not same day.
 */
export function sameHoursTotals(
  rows: HourlySalesRow[],
  hourSoFar: number,
): { revenue: number; orders: number; hasData: boolean } {
  const window = rows.filter((row) => row.hour <= hourSoFar);
  return {
    revenue: window.reduce((sum, row) => sum + (row.revenue ?? 0), 0),
    orders: window.reduce((sum, row) => sum + (row.orders ?? 0), 0),
    hasData: window.length > 0,
  };
}
