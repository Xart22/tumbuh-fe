import type { Unit } from '@/lib/types';

/**
 * Convert a recipe quantity into a material's stock unit so it can be priced
 * with `costPerUnit` (which is per stock unit). Falls back to the raw quantity
 * when either unit is unknown or from a different family — same tolerance as
 * the BE's `toStockUnitQty`.
 */
export function recipeQtyInStockUnit(
  qty: number,
  fromUnit: string | undefined,
  toUnit: string | undefined,
  units: Unit[],
): number {
  if (!fromUnit || !toUnit || fromUnit === toUnit) return qty;
  const from = units.find((u) => u.code === fromUnit);
  const to = units.find((u) => u.code === toUnit);
  if (!from || !to || from.family !== to.family) return qty;
  return (qty * from.factorToBase) / to.factorToBase;
}
