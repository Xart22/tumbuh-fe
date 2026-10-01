'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  createCategory,
  deleteCategory,
  reorderCategories,
  updateCategory,
} from '@/lib/api';
import type { Category } from '@/lib/types';
import { moveItem } from './menu-utils';

const inputCls =
  'w-full rounded-lg bg-lp-surface-low px-3 py-2 text-sm font-medium text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant focus:bg-lp-surface-container';

/**
 * Category manager: create, rename, delete and reorder (drag and drop, or
 * arrow keys) the outlet's menu categories.
 */
export function CategoryManager({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<string[]>(() =>
    categories.map((category) => category.id),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
    void queryClient.invalidateQueries({ queryKey: ['menu', 'products'] });
  };
  const fail = (fallback: string) => (err: unknown) =>
    setError(err instanceof Error ? err.message : fallback);

  const createM = useMutation({
    mutationFn: (name: string) =>
      createCategory({ name, sortOrder: order.length }),
    onSuccess: (created) => {
      setNewName('');
      setOrder((ids) => [...ids, created.id]);
      invalidate();
    },
    onError: fail('Gagal menambah kategori.'),
  });

  const renameM = useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      updateCategory(input.id, { name: input.name }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: fail('Gagal menyimpan kategori.'),
  });

  const deleteM = useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: (_result, categoryId) => {
      setOrder((ids) => ids.filter((id) => id !== categoryId));
      invalidate();
    },
    onError: fail('Gagal menghapus kategori.'),
  });

  const reorderM = useMutation({
    mutationFn: (ids: string[]) => reorderCategories(ids),
    onSuccess: () => invalidate(),
    onError: fail('Gagal menyimpan urutan kategori.'),
  });

  const byId = new Map(categories.map((category) => [category.id, category]));
  const rows = [
    ...order
      .map((id) => byId.get(id))
      .filter((category): category is Category => Boolean(category)),
    ...categories.filter((category) => !order.includes(category.id)),
  ];

  function move(from: number, to: number) {
    setOrder((ids) => moveItem(ids, from, to));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-lp-inverse-surface/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-lp-surface-container-lowest shadow-xl">
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-lp-on-surface">
              <Icon name="category" className="text-[20px] text-lp-primary" />
              Urutkan &amp; Kelola Kategori
            </h2>
            <p className="text-xs text-lp-tertiary">
              Geser baris (atau pakai tombol panah) untuk mengubah urutan tampil
              di POS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-5 pt-0">
          {rows.length === 0 ? (
            <p className="text-sm text-lp-on-surface-variant">
              Belum ada kategori. Tambahkan satu di bawah.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rows.map((category, index) => (
                <li
                  key={category.id}
                  draggable={editingId !== category.id}
                  onDragStart={() => setDragId(category.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (!dragId) return;
                    const from = rows.findIndex((row) => row.id === dragId);
                    if (from >= 0) move(from, index);
                    setDragId(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl bg-lp-surface-low p-2.5 ${
                    dragId === category.id ? 'opacity-50' : ''
                  }`}
                >
                  <Icon
                    name="drag_indicator"
                    className="text-[18px] text-lp-tertiary"
                  />

                  {editingId === category.id ? (
                    <>
                      <input
                        value={draftName}
                        autoFocus
                        aria-label={`Nama kategori ${category.name}`}
                        onChange={(event) => setDraftName(event.target.value)}
                        className={inputCls}
                      />
                      <button
                        type="button"
                        disabled={renameM.isPending}
                        onClick={() =>
                          renameM.mutate({
                            id: category.id,
                            name: draftName.trim(),
                          })
                        }
                        className="shrink-0 rounded-lg bg-lp-primary px-3 py-2 text-xs font-bold text-lp-on-primary disabled:opacity-60"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="shrink-0 rounded-lg px-2 py-2 text-xs text-lp-on-surface-variant hover:bg-lp-surface-container"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm font-semibold text-lp-on-surface">
                        {category.name}
                      </span>
                      <span className="shrink-0 font-lp-mono text-[11px] text-lp-tertiary">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        aria-label={`Geser ${category.name} ke atas`}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                        className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container disabled:opacity-30"
                      >
                        <Icon name="arrow_upward" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Geser ${category.name} ke bawah`}
                        disabled={index === rows.length - 1}
                        onClick={() => move(index, index + 1)}
                        className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container disabled:opacity-30"
                      >
                        <Icon name="arrow_downward" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Ubah nama ${category.name}`}
                        onClick={() => {
                          setError(null);
                          setEditingId(category.id);
                          setDraftName(category.name);
                        }}
                        className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-surface-container hover:text-lp-on-surface"
                      >
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus ${category.name}`}
                        disabled={deleteM.isPending}
                        onClick={() => setCategoryToDelete(category)}
                        className="rounded-lg p-1.5 text-lp-on-surface-variant hover:bg-lp-error-container hover:text-lp-on-error-container disabled:opacity-50"
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-end gap-2 border-t border-lp-surface-container pt-3">
            <div className="flex-1">
              <label
                htmlFor="new-category"
                className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-lp-on-surface-variant"
              >
                Kategori Baru
              </label>
              <input
                id="new-category"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && newName.trim()) {
                    event.preventDefault();
                    createM.mutate(newName.trim());
                  }
                }}
                placeholder="Camilan"
                className={inputCls}
              />
            </div>
            <button
              type="button"
              disabled={!newName.trim() || createM.isPending}
              onClick={() => createM.mutate(newName.trim())}
              className="flex h-11 shrink-0 items-center gap-1 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary disabled:opacity-50"
            >
              <Icon name="add" className="text-[18px]" />
              Tambah
            </button>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-lp-error">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg px-4 text-sm font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={reorderM.isPending}
              onClick={() => reorderM.mutate(order)}
              className="flex h-11 items-center gap-1.5 rounded-lg bg-lp-primary px-4 text-sm font-bold text-lp-on-primary disabled:opacity-60"
            >
              <Icon name="check_circle" className="text-[18px]" />
              {reorderM.isPending ? 'Menyimpan…' : 'Simpan Urutan'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={categoryToDelete !== null}
        title={`Hapus Kategori "${categoryToDelete?.name}"?`}
        description="Kategori akan dihapus. Produk yang menggunakan kategori ini akan diubah statusnya menjadi 'Tanpa kategori'."
        confirmText="Ya, Hapus Kategori"
        cancelText="Batal"
        variant="danger"
        isLoading={deleteM.isPending}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteM.mutate(categoryToDelete.id, {
              onSettled: () => setCategoryToDelete(null),
            });
          }
        }}
      />
    </div>
  );
}
