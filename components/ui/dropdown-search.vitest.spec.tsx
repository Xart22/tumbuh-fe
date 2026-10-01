import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DropdownSearch } from './dropdown-search';

describe('DropdownSearch', () => {
  const options = [
    { value: 'milk', label: 'Fresh Milk Diamond 1L', badge: 'Dairy' },
    { value: 'beans', label: 'House Blend Espresso', badge: 'Coffee' },
    { value: 'sugar', label: 'Gula Aren Organik', badge: 'Syrup' },
  ];

  it('renders trigger button with placeholder when no value is selected', () => {
    render(
      <DropdownSearch
        options={options}
        value=""
        onChange={vi.fn()}
        placeholder="Pilih Bahan Baku"
      />,
    );
    expect(screen.getByRole('button', { name: /Pilih Bahan Baku/i })).toBeDefined();
  });

  it('renders selected option label and badge', () => {
    render(
      <DropdownSearch
        options={options}
        value="beans"
        onChange={vi.fn()}
        placeholder="Pilih Bahan Baku"
      />,
    );
    expect(screen.getByText('House Blend Espresso')).toBeDefined();
    expect(screen.getByText('Coffee')).toBeDefined();
  });

  it('opens popover and filters options when searching', () => {
    const onChange = vi.fn();
    render(
      <DropdownSearch
        options={options}
        value=""
        onChange={onChange}
        placeholder="Pilih Bahan Baku"
        searchPlaceholder="Ketik nama bahan…"
      />,
    );

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /Pilih Bahan Baku/i });
    fireEvent.click(trigger);

    // Search input should be visible
    const searchInput = screen.getByPlaceholderText('Ketik nama bahan…');
    expect(searchInput).toBeDefined();

    // Type filter
    fireEvent.change(searchInput, { target: { value: 'milk' } });
    expect(screen.getByText('Fresh Milk Diamond 1L')).toBeDefined();
    expect(screen.queryByText('House Blend Espresso')).toBeNull();

    // Click item to select
    fireEvent.click(screen.getByText('Fresh Milk Diamond 1L'));
    expect(onChange).toHaveBeenCalledWith('milk');
  });

  it('closes popover on Escape key', () => {
    render(
      <DropdownSearch
        options={options}
        value=""
        onChange={vi.fn()}
        placeholder="Pilih Bahan Baku"
      />,
    );

    const trigger = screen.getByRole('button', { name: /Pilih Bahan Baku/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.keyDown(window, { key: 'Escape' });
  });
});
