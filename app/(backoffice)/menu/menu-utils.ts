/** Pure helpers for the menu page — kept out of the components for testing. */

/** Move an array item, returning a new array (drag-and-drop reorder). */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * Page numbers to render, with `null` standing in for an ellipsis.
 * Mirrors the Stitch design: 1 2 3 … 10 around the current page.
 */
export function pageWindow(page: number, totalPages: number): Array<number | null> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const window: Array<number | null> = [];
  let previous = 0;
  for (const value of sorted) {
    if (previous && value - previous > 1) window.push(null);
    window.push(value);
    previous = value;
  }
  return window;
}

/**
 * Material Symbols glyph name for a category chip, matched by keyword.
 * Render with `<Icon name={...} />` — never emoji (see `AGENTS.md`).
 */
export function getCategoryIcon(name?: string | null): string {
  if (!name) return 'restaurant_menu';
  const lower = name.toLowerCase();
  if (lower.includes('kopi') || lower.includes('coffee') || lower.includes('espresso')) return 'local_cafe';
  if (lower.includes('tea') || lower.includes('teh') || lower.includes('non-coffee')) return 'local_cafe';
  if (lower.includes('bakery') || lower.includes('pastry') || lower.includes('roti') || lower.includes('croissant')) return 'bakery_dining';
  if (lower.includes('makan') || lower.includes('rice') || lower.includes('nasi') || lower.includes('meal')) return 'restaurant';
  if (lower.includes('camilan') || lower.includes('snack') || lower.includes('fries') || lower.includes('kentang')) return 'fastfood';
  return 'restaurant_menu';
}
