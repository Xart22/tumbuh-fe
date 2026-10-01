'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/icon';

export interface DropdownSearchOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface DropdownSearchProps {
  options: DropdownSearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: 'sm' | 'default';
  align?: 'left' | 'right';
  id?: string;
  'aria-label'?: string;
}

export function DropdownSearch({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi…',
  searchPlaceholder = 'Cari opsi…',
  emptyMessage = 'Tidak ada hasil ditemukan',
  disabled = false,
  className = '',
  triggerClassName = '',
  size = 'default',
  align = 'left',
  id,
  'aria-label': ariaLabel,
}: DropdownSearchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Selected Option
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.subLabel?.toLowerCase().includes(q) ||
        opt.badge?.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  function openDropdown() {
    setSearch('');
    setHighlightedIndex(0);
    setIsOpen(true);
  }

  function toggleDropdown() {
    if (isOpen) {
      setIsOpen(false);
    } else {
      openDropdown();
    }
  }

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  function handleSelect(val: string) {
    onChange(val);
    setIsOpen(false);
  }

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block w-full text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel ?? placeholder}
        onClick={toggleDropdown}
        className={`flex w-full items-center justify-between gap-2 rounded-xl transition outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          isSmall
            ? 'h-9 px-2.5 text-xs font-semibold'
            : 'h-11 px-3.5 text-sm font-medium'
        } ${
          isOpen
            ? 'bg-lp-surface-container ring-2 ring-lp-primary text-lp-on-surface'
            : 'bg-lp-surface-low text-lp-on-surface hover:bg-lp-surface-container'
        } ${triggerClassName}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-left">
          {selectedOption ? (
            <>
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="shrink-0 rounded bg-lp-surface-container-highest px-1.5 py-0.5 font-lp-mono text-[10px] text-lp-on-surface-variant">
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-lp-on-surface-variant">{placeholder}</span>
          )}
        </span>
        <Icon
          name="expand_more"
          className={`shrink-0 text-[18px] text-lp-on-surface-variant transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-lp-primary' : ''
          }`}
        />
      </button>

      {/* Floating Search & Options Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute top-full z-50 mt-1.5 min-w-full w-max max-w-[360px] sm:max-w-[420px] overflow-hidden rounded-2xl border border-lp-surface-container bg-lp-surface-container-lowest shadow-xl animate-in fade-in-0 zoom-in-95 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Search Box Header */}
          <div className="border-b border-lp-surface-container p-2.5 bg-lp-surface-container-lowest">
            <div className="relative flex items-center">
              <Icon
                name="search"
                className="pointer-events-none absolute left-2.5 text-[16px] text-lp-tertiary"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="h-8.5 w-full rounded-lg bg-lp-surface-low pl-8 pr-7 text-xs font-medium text-lp-on-surface placeholder:text-lp-on-surface-variant outline-none focus:bg-lp-surface-container"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 text-lp-on-surface-variant hover:text-lp-on-surface"
                >
                  <Icon name="close" className="text-[14px]" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto p-1.5 focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-lp-on-surface-variant">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs transition ${
                      isSelected
                        ? 'bg-lp-primary/10 font-bold text-lp-primary'
                        : isHighlighted
                          ? 'bg-lp-surface-container text-lp-on-surface'
                          : 'text-lp-on-surface hover:bg-lp-surface-low'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-left">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="truncate font-lp-mono text-[10px] text-lp-on-surface-variant">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {opt.badge && (
                        <span className="rounded bg-lp-surface-container-highest px-1.5 py-0.5 font-lp-mono text-[10px] text-lp-on-surface-variant">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Icon
                          name="check"
                          className="text-[16px] text-lp-primary"
                        />
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
