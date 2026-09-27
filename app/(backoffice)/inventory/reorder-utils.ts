import type { RawMaterial, RawMaterialStatus, StockForecast } from '@/lib/types';

export type ReorderItem = {
  rawMaterialId: string;
  name: string;
  unit: string;
  supplierName: string | null;
  status: RawMaterialStatus;
  stockQty: number;
  minStockQty: number;
  avgDailyUsage: number;
  /** Days of stock left at the measured usage rate; null without sales. */
  daysLeft: number | null;
  recommendedQty: number;
  /** Recommendation in purchase units, when a pack conversion exists. */
  purchaseQty: { qty: number; unit: string } | null;
  estCost: number;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Purchase-unit quantity (min 1) that restocks a material to twice its min. */
export function restockPurchaseQty(material: RawMaterial): number {
  const packSize =
    material.packSize && material.packSize > 0 ? material.packSize : 1;
  const needed = Math.max(0, material.minStockQty * 2 - material.stockQty);
  return Math.max(1, Math.ceil(needed / packSize));
}

/**
 * Reorder point per material: cover `coverDays` of measured usage and never
 * restock below twice the minimum level. Usage comes from paid sales (stock
 * mutations), so a material with no sales only surfaces when it is under its
 * minimum — never with a fabricated velocity.
 */
export function buildReorderItems(
  materials: RawMaterial[],
  forecast: StockForecast[],
  coverDays = 7,
): ReorderItem[] {
  const usage = new Map(forecast.map((row) => [row.rawMaterialId, row]));

  const items: ReorderItem[] = [];
  for (const material of materials) {
    const row = usage.get(material.id);
    const avgDailyUsage = row?.avgDailyUsage ?? 0;
    const minStockQty = material.minStockQty;
    const targetQty = Math.max(minStockQty * 2, avgDailyUsage * coverDays);
    const recommendedQty = round2(
      Math.max(0, Math.ceil((targetQty - material.stockQty) * 100) / 100),
    );
    const status = material.status ?? 'ok';

    if (recommendedQty <= 0 && status === 'ok') continue;

    const packSize = material.packSize ?? 0;
    items.push({
      rawMaterialId: material.id,
      name: material.name,
      unit: material.stockUnitCode ?? material.unit,
      supplierName: material.lastSupplierName ?? null,
      status,
      stockQty: material.stockQty,
      minStockQty,
      avgDailyUsage,
      daysLeft:
        avgDailyUsage > 0
          ? Math.round((material.stockQty / avgDailyUsage) * 10) / 10
          : null,
      recommendedQty,
      purchaseQty:
        packSize > 1 && material.purchaseUnitCode
          ? {
              qty: Math.round((recommendedQty / packSize) * 100) / 100,
              unit: material.purchaseUnitCode,
            }
          : null,
      estCost: round2(recommendedQty * material.costPerUnit),
    });
  }

  return items.sort((a, b) => {
    const left = a.daysLeft ?? Number.POSITIVE_INFINITY;
    const right = b.daysLeft ?? Number.POSITIVE_INFINITY;
    if (left !== right) return left - right;
    return a.name.localeCompare(b.name);
  });
}
