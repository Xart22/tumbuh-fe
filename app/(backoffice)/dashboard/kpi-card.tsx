import { Icon } from '@/components/icon';
import type { ActiveShift } from '@/lib/types';

/** Percentage chip. Null/NaN means "no baseline" — render nothing, not 0%. */
export function Delta({ pct }: { pct: number | null }) {
  if (pct === null || !Number.isFinite(pct)) return null;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        // Tokens per DESIGN.md Colors — dark-on-tint, both AA at 11px.
        up
          ? 'bg-lp-primary-fixed/40 text-lp-on-primary-fixed'
          : 'bg-lp-error-container text-lp-on-error-container'
      }`}
    >
      <Icon name={up ? 'trending_up' : 'trending_down'} className="text-[14px]" />
      {up ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  );
}

export function KpiCard({
  eyebrow,
  title,
  value,
  unit,
  delta,
  note,
  icon,
  iconColor = 'text-lp-primary',
  accent,
  action,
}: {
  eyebrow: string;
  title: string;
  value: string;
  unit?: string;
  delta?: number | null;
  note: string;
  icon: string;
  iconColor?: string;
  /** Bottom rule color, e.g. `bg-lp-primary`. */
  accent: string;
  /** Optional footer row (e.g. target editor) under the delta/note line. */
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            {eyebrow}
          </span>
          <span className="text-lg font-semibold text-lp-on-surface">{title}</span>
        </div>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lp-surface-low ${iconColor}`}
        >
          <Icon name={icon} className="text-[22px]" />
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <div className="font-lp-mono text-2xl font-bold tracking-tight text-lp-on-surface">
          {value}
          {unit && (
            <span className="ml-1 font-lp-sans text-sm font-normal text-lp-tertiary">
              {unit}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Delta pct={delta ?? null} />
          <span className="text-xs text-lp-tertiary">{note}</span>
        </div>
        {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      </div>

      <span className={`absolute inset-x-0 bottom-0 h-1 ${accent}`} />
    </div>
  );
}

/**
 * Terminal & Kru live card matching Stitch design.
 * Features a pulsing 'Live' indicator and lists individual active cashiers.
 */
export function TerminalCrewCard({
  shifts,
  loading,
}: {
  shifts: ActiveShift[] | null;
  loading: boolean;
}) {
  const activeCount = shifts?.length ?? 0;
  const isLive = activeCount > 0;

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-lp-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-lp-tertiary">
            Terminal &amp; Kru
          </span>
          <span className="text-lg font-semibold text-lp-on-surface">
            {loading ? 'Memuat kasir…' : `${activeCount} Kasir Aktif`}
          </span>
        </div>
        {isLive ? (
          <div className="flex items-center gap-1.5 rounded-full bg-lp-primary-fixed/40 px-2 py-0.5 text-[11px] font-bold text-lp-on-primary-fixed">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lp-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lp-primary" />
            </span>
            Live
          </div>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lp-surface-low text-lp-tertiary">
            <Icon name="badge" className="text-[22px]" />
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {loading ? (
          <span className="text-xs text-lp-tertiary">Menghubungkan ke terminal…</span>
        ) : !shifts || shifts.length === 0 ? (
          <div className="flex flex-col gap-0.5 text-xs text-lp-tertiary">
            <span>Belum ada kasir yang aktif saat ini.</span>
            <span className="text-[11px] text-lp-on-surface-variant">
              Buka kasir POS untuk memulai shift.
            </span>
          </div>
        ) : (
          shifts.slice(0, 3).map((shift, idx) => (
            <div
              key={shift.terminalName + idx}
              className="flex items-center justify-between text-xs py-0.5"
            >
              <span className="flex items-center gap-1.5 text-lp-tertiary">
                <span className="h-1.5 w-1.5 rounded-full bg-lp-primary" />
                <span className="truncate max-w-[120px]">
                  {shift.terminalName || `Pos ${idx + 1}`}:
                </span>
              </span>
              <span className="font-semibold text-lp-on-surface truncate">
                {shift.cashierName || 'Kasir'}
              </span>
            </div>
          ))
        )}
      </div>

      <span className="absolute inset-x-0 bottom-0 h-1 bg-lp-primary-container" />
    </div>
  );
}
