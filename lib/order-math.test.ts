import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cartSubtotal,
  lineKey,
  lineUnitPrice,
  validateSplit,
} from './order-math.ts';
import type { CartLine } from './types.ts';

test('lineKey merges identical choices and splits on any difference', () => {
  const base = {
    productId: 'p1',
    basePrice: 20_000,
    modifierGroups: [
      {
        groupId: 'g1',
        selected: [{ id: 'm1', name: 'Ice', priceAddition: 0 }],
      },
    ],
    notes: 'less sugar',
  };

  assert.equal(lineKey(base), lineKey({ ...base }));
  // Same items, different modifier → different line.
  assert.notEqual(
    lineKey(base),
    lineKey({
      ...base,
      modifierGroups: [
        { groupId: 'g1', selected: [{ id: 'm2', name: 'Hot', priceAddition: 0 }] },
      ],
    }),
  );
  // Modifier selection order must not create a new line.
  assert.equal(
    lineKey({
      ...base,
      modifierGroups: [
        {
          groupId: 'g1',
          selected: [
            { id: 'm1', name: 'Ice', priceAddition: 0 },
            { id: 'm2', name: 'Extra', priceAddition: 3_000 },
          ],
        },
      ],
    }),
    lineKey({
      ...base,
      modifierGroups: [
        {
          groupId: 'g1',
          selected: [
            { id: 'm2', name: 'Extra', priceAddition: 3_000 },
            { id: 'm1', name: 'Ice', priceAddition: 0 },
          ],
        },
      ],
    }),
  );
});

test('lineUnitPrice adds variant base and modifier additions', () => {
  assert.equal(
    lineUnitPrice({
      productId: 'p1',
      basePrice: 25_000,
      modifierGroups: [
        {
          groupId: 'g1',
          selected: [{ id: 'm1', name: 'Extra shot', priceAddition: 5_000 }],
        },
        {
          groupId: 'g2',
          selected: [{ id: 'm2', name: 'Oat milk', priceAddition: 8_000 }],
        },
      ],
    }),
    38_000,
  );
});

test('cartSubtotal multiplies qty', () => {
  const lines: CartLine[] = [
    {
      key: 'a',
      productId: 'p1',
      productName: 'Kopi',
      qty: 2,
      unitPrice: 20_000,
      modifierGroups: [],
    },
    {
      key: 'b',
      productId: 'p2',
      productName: 'Teh',
      qty: 1,
      unitPrice: 15_000,
      modifierGroups: [],
    },
  ];
  assert.equal(cartSubtotal(lines), 55_000);
});

test('validateSplit rejects async mixes and bad amounts', () => {
  assert.equal(
    validateSplit({ methods: ['cash', 'debit'], firstAmount: 20_000, total: 50_000 })
      .ok,
    true,
  );
  // Static QRIS settles immediately server-side, so it may be combined.
  assert.equal(
    validateSplit({ methods: ['cash', 'qris'], firstAmount: 20_000, total: 50_000 })
      .ok,
    true,
  );
  // Dynamic QRIS waits on the gateway webhook — one QR per order.
  assert.equal(
    validateSplit({
      methods: ['cash', 'qris_dynamic'],
      firstAmount: 20_000,
      total: 50_000,
    }).ok,
    false,
  );
  assert.equal(
    validateSplit({
      methods: ['ewallet_gopay', 'debit'],
      firstAmount: 20_000,
      total: 50_000,
    }).ok,
    false,
  );
  assert.equal(
    validateSplit({ methods: ['cash', 'debit'], firstAmount: 0, total: 50_000 }).ok,
    false,
  );
  assert.equal(
    validateSplit({ methods: ['cash', 'debit'], firstAmount: 50_000, total: 50_000 })
      .ok,
    false,
  );
});
