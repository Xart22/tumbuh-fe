import { describe, expect, it } from 'vitest';
import { moveItem, pageWindow } from './menu-utils';

describe('moveItem', () => {
  const items = ['a', 'b', 'c'];

  it('moves an item down', () => {
    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item up', () => {
    expect(moveItem(items, 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('is a no-op for the same slot and out-of-range indexes', () => {
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, -1, 1)).toBe(items);
    expect(moveItem(items, 0, 9)).toBe(items);
  });
});

describe('pageWindow', () => {
  it('lists every page when they fit', () => {
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it('keeps the ends and neighbours, collapsing the middle', () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, null, 10]);
    expect(pageWindow(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
    expect(pageWindow(10, 10)).toEqual([1, null, 9, 10]);
  });
});
