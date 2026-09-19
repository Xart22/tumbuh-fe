import { formatIDR, formatNumber } from '@/lib/format';
import type { HourlyForecastRow, HourlySalesRow } from '@/lib/types';

/**
 * Bars = recorded revenue. Ghost bars = BE forecast (`/v1/reports/forecast`:
 * same-weekday average over the last 4 weeks). No client-side projection —
 * when the forecast is empty the chart simply shows recorded bars only.
 *
 * ponytail: CSS flex bars, not SVG. Widths come from flex-1 so the selected
 * point survives any viewport with no scale math. Upgrade path: swap the inner
 * div for an <svg> when we add a per-hour tooltip axis — not before.
 */
export function HourlyChart({
  rows,
  forecast = [],
}: {
  rows: HourlySalesRow[];
  forecast?: HourlyForecastRow[];
}) {
  const expectedByHour = new Map(
    forecast.map((row) => [row.hour, row.expectedRevenue ?? 0]),
  );
  const peak = Math.max(
    ...rows.map((row) => row.revenue ?? 0),
    ...forecast.map((row) => row.expectedRevenue ?? 0),
    1,
  );
  const nowHour = new Date().getHours();
  const avg = rows.reduce((sum, row) => sum + (row.revenue ?? 0), 0) / (rows.length || 1);
  const avgPct = (avg / peak) * 100;
  const hasForecast = forecast.some((row) => (row.expectedRevenue ?? 0) > 0);

  const top = Math.max(...rows.map((row) => row.revenue ?? 0), 0);
  const busiest = rows.find((row) => (row.revenue ?? 0) === top);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-48">
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
          style={{ bottom: `${avgPct}%` }}
        >
          <div className="w-full border-t border-dashed border-lp-tertiary/40" />
          <span className="ml-2 shrink-0 rounded bg-lp-surface-container px-1.5 py-0.5 text-[10px] font-semibold text-lp-tertiary">
            Rata-rata {formatIDR(Math.round(avg))}
          </span>
        </div>

        <div className="flex h-full items-end gap-1">
          {rows.map((row) => {
            const revenue = row.revenue ?? 0;
            const expected = expectedByHour.get(row.hour) ?? 0;
            const isBusiest = busiest !== undefined && row.hour === busiest.hour;
            const isNow = row.hour === nowHour;
            return (
              <div
                key={row.hour}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                title={`${row.hour}:00 · tercatat ${formatIDR(revenue)} · ${formatNumber(row.orders ?? 0)} struk${
                  expected > 0 ? ` · proyeksi ${formatIDR(expected)}` : ''
                }`}
              >
                <div className="flex w-full flex-1 items-end justify-center gap-px">
                  {expected > 0 && (
                    <div
                      className="w-1/2 rounded-t border border-dashed border-lp-outline-variant bg-lp-surface-container"
                      style={{ height: `${Math.max((expected / peak) * 100, 1.5)}%` }}
                    />
                  )}
                  {/* Zero-revenue hours render no bar: a 2% stub reads as a sale. */}
                  <div
                    className={`${expected > 0 ? 'w-1/2' : 'w-full'} rounded-t ${
                      isNow
                        ? 'bg-lp-primary ring-2 ring-lp-primary-fixed'
                        : isBusiest
                          ? 'bg-lp-secondary-container'
                          : 'bg-lp-primary'
                    }`}
                    style={{
                      height: revenue > 0 ? `${Math.max((revenue / peak) * 100, 1.5)}%` : 0,
                    }}
                  />
                </div>
                <span
                  className={`text-[9px] ${isBusiest ? 'font-bold text-lp-secondary' : 'text-lp-tertiary'}`}
                >
                  {row.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend carries the meaning too — colour alone fails colour-blind readers. */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-lp-tertiary">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-lp-primary" /> Penjualan tercatat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-lp-secondary-container" /> Periode sibuk (peak)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-lp-primary ring-2 ring-lp-primary-fixed" /> Realisasi
          jam ini
        </span>
        {hasForecast && (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-dashed border-lp-outline-variant bg-lp-surface-container" />{' '}
            Proyeksi (rata-rata 4 minggu)
          </span>
        )}
      </div>
    </div>
  );
}
