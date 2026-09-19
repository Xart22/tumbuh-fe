'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { apiUrl } from '@/lib/api-client';
import { uploadProductPhoto } from '@/lib/api';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // matches the BE FileInterceptor limit

/** Product photo upload + preview. Requires a saved product (needs its id). */
export function PhotoEditor({
  productId,
  photoUrl,
}: {
  productId: string;
  photoUrl?: string | null;
}) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Revoke the last object URL when it is replaced or the editor unmounts.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const upload = useMutation({
    mutationFn: (chosen: File) => uploadProductPhoto(productId, chosen),
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['menu', 'products'] });
    },
  });

  function pick(selected: File | null) {
    setLocalError(null);
    upload.reset();
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ALLOWED.includes(selected.type)) {
      setLocalError('Format harus JPG, PNG, atau WebP.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      setLocalError('Ukuran maksimal 5MB.');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  const current = preview ?? (photoUrl ? apiUrl(photoUrl) : null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-lp-outline-variant bg-lp-surface-low">
          {current ? (
            // Plain <img>: the BE serves an arbitrary upload path, so next/image
            // remote patterns + optimisation aren't worth it here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt="Foto produk"
              className="h-full w-full object-cover"
            />
          ) : (
            <Icon
              name="restaurant"
              className="text-[32px] text-lp-on-surface-variant"
            />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant">
            Foto Menu POS
          </span>
          <p className="text-[11px] text-lp-tertiary">
            Format JPG, PNG, WebP max 5MB. Dimensi 1:1 direkomendasikan.
          </p>
          <label className="mt-1 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg bg-lp-surface-low px-3 py-1.5 text-xs font-semibold text-lp-on-surface hover:bg-lp-surface-container">
            <Icon name="photo_camera" className="text-[16px]" />
            Pilih Foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => pick(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {(localError || upload.isError) && (
        <p role="alert" className="text-xs font-medium text-lp-error">
          {localError ??
            (upload.error instanceof Error
              ? upload.error.message
              : 'Gagal mengunggah foto.')}
        </p>
      )}
      {upload.isSuccess && !file && (
        <p className="text-xs font-medium text-lp-primary">
          Foto berhasil diperbarui.
        </p>
      )}

      {file && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-lp-surface-low p-2">
          <span className="truncate text-xs text-lp-on-surface">
            {file.name}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setFile(null)}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-lp-on-surface-variant hover:bg-lp-surface-container"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={upload.isPending}
              onClick={() => upload.mutate(file)}
              className="rounded-lg bg-lp-primary px-3 py-1 text-xs font-bold text-lp-on-primary disabled:opacity-60"
            >
              {upload.isPending ? 'Mengunggah…' : 'Unggah'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
