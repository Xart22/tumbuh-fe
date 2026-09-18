import { Icon } from '@/components/icon';

/**
 * Leading glyph inside a text input. The outer span owns the absolute
 * positioning + vertical centering; the glyph itself is a plain inline
 * element so font line-height can't push it off-center.
 */
export function FieldIcon({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"
    >
      <Icon name={name} className="text-[20px] leading-none text-slate-400" />
    </span>
  );
}
