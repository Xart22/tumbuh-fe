import assert from 'node:assert/strict';
import test from 'node:test';
import {
  delta,
  isoDate,
  pad2,
  sameHoursTotals,
  yesterdayISO,
  topHourlyWindows,
} from './dashboard-math.ts';

test('pad2 and isoDate build zero-padded local dates', () => {
  assert.equal(pad2(5), '05');
  assert.equal(pad2(11), '11');
  assert.equal(isoDate(new Date(2026, 0, 9)), '2026-01-09');
});

test('yesterdayISO crosses month and year boundaries', () => {
  assert.equal(yesterdayISO(new Date(2026, 0, 1)), '2025-12-31');
  assert.equal(yesterdayISO(new Date(2026, 2, 1)), '2026-02-28');
});

test('delta returns null without a baseline instead of a fake percentage', () => {
  assert.equal(delta(100, undefined), null);
  assert.equal(delta(undefined, 100), null);
  assert.equal(delta(100, 0), null);
  assert.equal(delta(150, 100), 50);
  assert.equal(delta(50, 100), -50);
});

test('sameHoursTotals only counts rows up to the current hour', () => {
  const rows = [
    { hour: 8, revenue: 100, orders: 1 },
    { hour: 9, revenue: 200, orders: 2 },
    { hour: 14, revenue: 900, orders: 9 },
  ];
  assert.deepEqual(sameHoursTotals(rows, 9), {
    revenue: 300,
    orders: 3,
    hasData: true,
  });
  assert.deepEqual(sameHoursTotals(rows, 23), {
    revenue: 1200,
    orders: 12,
    hasData: true,
  });
  assert.deepEqual(sameHoursTotals([], 9), {
    revenue: 0,
    orders: 0,
    hasData: false,
  });
});

test('topHourlyWindows picks non-adjacent peaks and ignores empty hours', () => {
  const rows = [
    { hour: 8, revenue: 100, orders: 1 },
    { hour: 9, revenue: 900, orders: 9 },
    { hour: 10, revenue: 0, orders: 0 },
    { hour: 12, revenue: 950, orders: 9 },
  ];
  assert.deepEqual(
    topHourlyWindows(rows, 2).map((w) => w.label),
    ['09:00–10:00', '12:00–13:00'],
  );
  // Adjacent runner-up collapses: 12:00 is the next peak, 09:00 is skipped.
  assert.deepEqual(
    topHourlyWindows(
      [
        { hour: 9, revenue: 900, orders: 9 },
        { hour: 10, revenue: 880, orders: 8 },
        { hour: 18, revenue: 500, orders: 5 },
      ],
      2,
    ).map((w) => w.from),
    [9, 18],
  );
  assert.deepEqual(topHourlyWindows([{ hour: 9, revenue: 0, orders: 0 }]), []);
  assert.deepEqual(topHourlyWindows([]), []);
});
