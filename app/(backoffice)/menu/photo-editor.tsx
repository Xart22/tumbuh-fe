'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { apiUrl } from '@/lib/api-client';
import { uploadProductPhoto } from '@/lib/api';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // matches the BE FileInterceptor limit

/** Product photo upload + preview. Matches Stitch photo card design. */
export function PhotoEditor({
  productId,
  photoUrl,
  fallbackImage,
}: {
  productId: string;
  photoUrl?: string | null;
  fallbackImage?: string;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Revoke object URL when replaced or unmounted
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const upload = useMutation({
    mutationFn: (chosen: File) => uploadProductPhoto(productId, chosen),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'products'] });
    },
  });

  function pick(selected: File | null) {
    setLocalError(null);
    upload.reset();
    if (!selected) {
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
    setPreview(URL.createObjectURL(selected));
    upload.mutate(selected);
  }

  const current = preview ?? (photoUrl ? apiUrl(photoUrl) : fallbackImage ?? null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 rounded-xl bg-lp-surface-low p-3">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-lp-surface-container-highest shadow-sm"
        >
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current}
              alt="Foto produk"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon name="photo_camera" className="text-[24px] text-lp-tertiary" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-lp-inverse-surface/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name="photo_camera" className="text-[20px] text-lp-on-primary" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs font-bold text-lp-on-surface">Foto Menu POS</span>
          <span className="text-[11px] text-lp-tertiary">
            Format JPG, PNG max 5MB. Dimensi 1:1 direkomendasikan.
          </span>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded bg-lp-surface-container-lowest px-2.5 py-1 text-[11px] font-semibold text-lp-primary shadow-sm transition hover:bg-lp-primary hover:text-lp-on-primary"
            >
              {current ? 'Ganti Foto' : 'Unggah Foto'}
            </button>
            {preview && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                }}
                className="rounded px-2 py-1 text-[11px] font-semibold text-lp-error transition hover:bg-lp-error-container/40"
              >
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => pick(event.target.files?.[0] ?? null)}
      />

      {upload.isPending && (
        <span className="text-xs text-lp-primary">Mengunggah foto…</span>
      )}
      {(localError || upload.isError) && (
        <span className="text-xs text-lp-error">
          {localError ??
            (upload.error instanceof Error
              ? upload.error.message
              : 'Gagal mengunggah foto.')}
        </span>
      )}
    </div>
  );
}
