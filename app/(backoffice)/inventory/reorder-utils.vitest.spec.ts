import { describe, expect, it } from 'vitest';
import type { RawMaterial, StockForecast } from '@/lib/types';
import { buildReorderItems } from './reorder-utils';

const material = (over: Partial<RawMaterial>): RawMaterial => ({
  id: 'm1',
  name: 'Fresh Milk',
  unit: 'liter',
  stockUnitCode: 'liter',
  purchaseUnitCode: 'karton',
  packSize: 12,
  stockQty: 4.2,
  minStockQty: 15,
  costPerUnit: 19500,
  status: 'low',
  ...over,
});

const forecast = (over: Partial<StockForecast>): StockForecast => ({
  rawMaterialId: 'm1',
  rawMaterialName: 'Fresh Milk',
  unit: 'liter',
  stockQty: 4.2,
  avgDailyUsage: 1.5,
  forecastNeed: 4.5,
  daysOfStockLeft: 2.8,
  shortage: true,
  ...over,
});

describe('buildReorderItems', () => {
  it('covers the usage window and expresses the qty in purchase units', () => {
    const [item] = buildReorderItems(
      [material({ minStockQty: 0.5 })],
      [forecast({})],
      7,
    );

    // 1.5/day × 7 days = 10.5 needed vs 4.2 on hand → 6.3 more.
    expect(item.recommendedQty).toBe(6.3);
    expect(item.daysLeft).toBe(2.8);
    expect(item.purchaseQty).toEqual({ qty: 0.53, unit: 'karton' });
    expect(item.estCost).toBe(122850);
    expect(item.supplierName).toBeNull();
  });

  it('falls back to twice the minimum when there is no sales history', () => {
    const [item] = buildReorderItems([material({})], [], 7);

    expect(item.avgDailyUsage).toBe(0);
    expect(item.daysLeft).toBeNull();
    expect(item.recommendedQty).toBe(25.8);
  });

  it('skips healthy materials that have enough stock', () => {
    const items = buildReorderItems(
      [
        material({
          stockQty: 80,
          minStockQty: 10,
          status: 'ok',
        }),
      ],
      [forecast({ avgDailyUsage: 1 })],
      7,
    );

    expect(items).toEqual([]);
  });

  it('keeps an under-minimum material with no usage, without a fake velocity', () => {
    const [item] = buildReorderItems(
      [material({ stockQty: 0, status: 'critical' })],
      [],
      7,
    );

    expect(item.status).toBe('critical');
    expect(item.daysLeft).toBeNull();
    expect(item.recommendedQty).toBe(30);
  });
});
