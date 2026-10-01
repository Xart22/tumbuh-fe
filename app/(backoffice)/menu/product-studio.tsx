'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icon';
import { DropdownSearch } from '@/components/ui/dropdown-search';
import { apiUrl } from '@/lib/api-client';
import {
  createProduct,
  getProductRecipe,
  listRawMaterialsPage,
  replaceProductRecipe,
  updateProduct,
  uploadProductPhoto,
  type ProductInput,
} from '@/lib/api';
import { formatIDR } from '@/lib/format';
import type { Category, Product } from '@/lib/types';
import { ModifierEditor } from './modifier-editor';
import { productSchema } from './product-form';

interface BomRow {
  rawMaterialId: string;
  name: string;
  sku: string;
  qtyUsed: number;
  unit: string;
  unitCost: number;
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProductStudio({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (saved: Product) => void;
}) {
  const queryClient = useQueryClient();
  const editing = product !== null;

  // Form states
  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [barcode, setBarcode] = useState(product?.barcode ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [basePrice, setBasePrice] = useState<number>(product?.basePrice ?? 0);

  // Photo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Availability / Dayparting
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [availabilityStart, setAvailabilityStart] = useState(
    product?.availabilityStart ?? '',
  );
  const [availabilityEnd, setAvailabilityEnd] = useState(
    product?.availabilityEnd ?? '',
  );

  // BOM Recipe Rows - user override or derived from query/defaults
  const [userBomRows, setUserBomRows] = useState<BomRow[] | null>(null);

  // Error feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Raw Materials Catalog Query for BOM selector
  const materialsQ = useQuery({
    queryKey: ['inventory', 'materials', 'catalog'],
    queryFn: () => listRawMaterialsPage({ page: 1, limit: 100 }),
  });
  const rawMaterials = useMemo(
    () => materialsQ.data?.items ?? [],
    [materialsQ.data],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.id,
        label: cat.name,
      })),
    [categories],
  );

  const rawMaterialOptions = useMemo(
    () =>
      rawMaterials.map((mat) => ({
        value: mat.id,
        label: mat.name,
        badge: mat.sku ?? undefined,
        subLabel: `${formatIDR(mat.costPerUnit || 0)} / ${mat.stockUnitCode ?? 'satuan'}`,
      })),
    [rawMaterials],
  );

  // Existing Recipe Query if editing
  const recipeQ = useQuery({
    queryKey: ['inventory', 'recipe', product?.id],
    queryFn: () => getProductRecipe(product!.id),
    enabled: Boolean(product?.id),
  });

  // Derived BOM rows (respecting user edits if present)
  const bomRows = useMemo<BomRow[]>(() => {
    if (userBomRows !== null) return userBomRows;
    if (editing && recipeQ.data?.items && recipeQ.data.items.length > 0) {
      return recipeQ.data.items.map((item) => {
        const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
        return {
          rawMaterialId: item.rawMaterialId,
          name: item.rawMaterialName ?? mat?.name ?? 'Bahan Baku',
          sku: mat?.sku ?? '',
          qtyUsed: item.qtyUsed,
          unit: item.unit ?? mat?.stockUnitCode ?? 'gr',
          unitCost: item.costPerUnit ?? mat?.costPerUnit ?? 0,
        };
      });
    }
    if (!editing) {
      // New product: start with an empty BOM — never fabricate recipe rows.
      return [];
    }
    return [];
  }, [userBomRows, editing, recipeQ.data, rawMaterials]);

  // Clean up photo preview url
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Photo picker
  function handlePhotoPicked(file: File | null) {
    if (!file) return;
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setFormError('Format foto harus JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setFormError('Ukuran foto maksimal 5MB.');
      return;
    }
    setFormError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  // BOM Row Operations
  function addBomRow() {
    if (rawMaterials.length === 0) return;
    const availableMat =
      rawMaterials.find(
        (m) => !bomRows.some((row) => row.rawMaterialId === m.id),
      ) ?? rawMaterials[0];
    setUserBomRows([
      ...bomRows,
      {
        rawMaterialId: availableMat.id,
        name: availableMat.name,
        sku: availableMat.sku ?? '',
        qtyUsed: 1,
        unit: availableMat.stockUnitCode ?? 'gr',
        unitCost: availableMat.costPerUnit || 100,
      },
    ]);
  }

  function updateBomRow(
    index: number,
    field: keyof BomRow,
    value: string | number,
  ) {
    const copy = [...bomRows];
    const row = { ...copy[index] };
    if (field === 'rawMaterialId') {
      const mat = rawMaterials.find((m) => m.id === value);
      if (mat) {
        row.rawMaterialId = mat.id;
        row.name = mat.name;
        row.sku = mat.sku ?? '';
        row.unit = mat.stockUnitCode ?? 'gr';
        row.unitCost = mat.costPerUnit || 0;
      }
    } else if (field === 'qtyUsed') {
      row.qtyUsed = Math.max(0, Number(value) || 0);
    }
    copy[index] = row;
    setUserBomRows(copy);
  }

  function removeBomRow(index: number) {
    setUserBomRows(bomRows.filter((_, i) => i !== index));
  }

  // Financial Calculations
  const totalHpp = useMemo(
    () => bomRows.reduce((sum, row) => sum + row.qtyUsed * row.unitCost, 0),
    [bomRows],
  );
  const dineInPrice = basePrice || 0;
  const grossProfit = Math.max(0, dineInPrice - totalHpp);
  const marginPct = dineInPrice > 0 ? (grossProfit / dineInPrice) * 100 : 0;
  const foodCostPct = dineInPrice > 0 ? (totalHpp / dineInPrice) * 100 : 0;

  // Recipe breakdown proportions
  const costProportions = useMemo(() => {
    if (totalHpp <= 0) return [];
    return bomRows.map((row) => ({
      name: row.name,
      subtotal: row.qtyUsed * row.unitCost,
      pct: ((row.qtyUsed * row.unitCost) / totalHpp) * 100,
    }));
  }, [bomRows, totalHpp]);

  // Color bar array for BOM breakdown
  const barColors = [
    'bg-lp-primary',
    'bg-lp-secondary-container',
    'bg-lp-tertiary',
    'bg-lp-secondary',
  ];

  // Save Mutation
  const saveM = useMutation({
    mutationFn: async (shouldPublish: boolean) => {
      setFormError(null);
      // Validate schema
      const parseResult = productSchema.safeParse({
        name: name.trim(),
        categoryId: categoryId || undefined,
        basePrice: Number(basePrice) || 0,
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        isAvailable: shouldPublish,
        availabilityStart: availabilityStart || undefined,
        availabilityEnd: availabilityEnd || undefined,
      });

      if (!parseResult.success) {
        throw new Error(
          parseResult.error.issues[0]?.message ?? 'Data formulir tidak valid.',
        );
      }

      const input: ProductInput = {
        name: name.trim(),
        categoryId: categoryId || null,
        basePrice: Number(basePrice) || 0,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        description: description.trim() || undefined,
        isAvailable: shouldPublish,
        availabilityStart: availabilityStart || null,
        availabilityEnd: availabilityEnd || null,
      };

      // 1. Save or Update Product
      const saved = editing
        ? await updateProduct(product.id, input)
        : await createProduct(input);

      // 2. Upload Photo if selected
      if (photoFile) {
        try {
          await uploadProductPhoto(saved.id, photoFile);
        } catch (photoErr) {
          setFormError(
            photoErr instanceof Error
              ? `Produk tersimpan, tapi foto gagal diunggah: ${photoErr.message}`
              : 'Produk tersimpan, tapi foto gagal diunggah.',
          );
        }
      }

      // 3. Save BOM Recipe only when the user actually edited the composition.
      if (userBomRows !== null) {
        try {
          await replaceProductRecipe(
            saved.id,
            userBomRows.map((row) => ({
              rawMaterialId: row.rawMaterialId,
              qtyUsed: row.qtyUsed,
              unit: row.unit,
            })),
          );
        } catch (recipeErr) {
          setFormError(
            recipeErr instanceof Error
              ? `Produk tersimpan, tapi resep gagal disimpan: ${recipeErr.message}`
              : 'Produk tersimpan, tapi resep gagal disimpan.',
          );
        }
      }

      return saved;
    },
    onSuccess: (saved) => {
      setSuccessToast(
        editing
          ? `Perubahan produk "${saved.name}" berhasil disimpan!`
          : `Produk "${saved.name}" berhasil ditambahkan ke katalog POS!`,
      );
      void queryClient.invalidateQueries({ queryKey: ['menu', 'products'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory', 'recipe'] });
      void queryClient.invalidateQueries({ queryKey: ['reports', 'margins'] });
      setTimeout(() => {
        onSaved(saved);
      }, 1000);
    },
    onError: (err) => {
      setFormError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan menu.',
      );
    },
  });

  const selectedCategoryName =
    categories.find((c) => c.id === categoryId)?.name ?? 'Kategori Menu';

  // Circular progress stroke calculation
  const strokeDash = Math.min(100, Math.max(0, marginPct));

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Top Breadcrumb & Header Action */}
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-lp-primary transition hover:text-lp-primary-container"
          >
            <Icon
              name="arrow_back"
              className="text-[18px] transition-transform group-hover:-translate-x-1"
            />
            <span>Kembali ke Daftar Menu</span>
          </button>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-lp-sans text-2xl font-bold tracking-tight text-lp-on-surface lg:text-3xl">
              {editing ? `Edit Menu: ${product.name}` : 'Tambah Menu Baru'}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lp-surface-container px-3 py-1 font-lp-mono text-xs font-semibold text-lp-on-surface-variant">
              <span
                className={`h-2 w-2 rounded-full ${
                  isAvailable ? 'bg-lp-primary' : 'bg-lp-secondary-container'
                }`}
              />
              {isAvailable ? 'Aktif di POS' : 'Draft / Belum Tayang'}
            </span>
          </div>
          <p className="text-sm text-lp-on-surface-variant">
            Konfigurasi detail katalog, resep bahan baku (BOM), dan simulasi profitabilitas real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saveM.isPending}
            className="h-11 rounded-xl px-5 text-sm font-semibold text-lp-on-surface-variant transition hover:bg-lp-surface-container hover:text-lp-on-surface"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saveM.isPending}
            onClick={() => {
              setIsAvailable(false);
              saveM.mutate(false);
            }}
            className="h-11 rounded-xl bg-lp-surface-container-lowest px-5 text-sm font-semibold text-lp-on-surface shadow-sm transition hover:bg-lp-surface-low disabled:opacity-50"
          >
            Simpan sebagai Draft
          </button>
          <button
            type="button"
            disabled={saveM.isPending}
            onClick={() => {
              setIsAvailable(true);
              saveM.mutate(true);
            }}
            className="flex h-11 items-center gap-2 rounded-xl bg-lp-primary px-6 text-sm font-bold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container disabled:opacity-50"
          >
            <Icon name="publish" className="text-[18px]" />
            <span>
              {saveM.isPending
                ? 'Menyimpan…'
                : 'Simpan &amp; Publikasikan ke POS'}
            </span>
          </button>
        </div>
      </section>

      {/* Success Banner */}
      {successToast && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-lp-primary/10 p-4 text-sm font-semibold text-lp-primary"
        >
          <Icon name="check_circle" className="text-[20px]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Alert */}
      {formError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl bg-lp-error-container p-4 text-sm font-medium text-lp-on-error-container"
        >
          <div className="flex items-center gap-2">
            <Icon name="warning" className="text-[20px]" />
            <span>{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-lp-on-error-container hover:opacity-80"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        </div>
      )}

      {/* Main 12-Column Grid (7 Cols Left : 5 Cols Sticky Right) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column (7 Cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Section 1: Informasi Dasar Menu */}
          <section className="flex flex-col gap-5 rounded-2xl bg-lp-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-lp-surface-container pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lp-surface-container text-lp-primary">
                  <Icon name="lunch_dining" className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-lp-on-surface">
                    Informasi Dasar Menu
                  </h2>
                  <p className="text-xs text-lp-on-surface-variant">
                    Informasi identitas produk untuk antarmuka kasir dan struk.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-lp-surface-low px-3 py-1 font-lp-mono text-xs font-semibold text-lp-on-surface-variant">
                Bagian 1/4
              </span>
            </div>

            {/* Photo Upload Dropzone & Preview */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant">
                Foto Produk Menu
              </label>
              <div className="flex flex-col items-center gap-4 rounded-xl bg-lp-surface-low p-4 sm:flex-row">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-lp-surface-container shadow-sm">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt="Preview menu"
                      className="h-full w-full object-cover"
                    />
                  ) : product?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={apiUrl(product.photoUrl)}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-lp-tertiary">
                      <Icon name="photo_camera" className="text-[32px]" />
                      <span className="mt-1 text-[10px] font-semibold">1:1</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 rounded-md bg-lp-surface-container-lowest/80 p-1 text-lp-on-surface-variant backdrop-blur-sm">
                    <Icon name="photo_camera" className="text-[16px]" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-center gap-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl bg-lp-surface-container-lowest px-4 py-2 text-xs font-bold text-lp-on-surface shadow-sm transition hover:bg-lp-surface-container"
                    >
                      Unggah Gambar Baru
                    </button>
                    {(photoPreview || product?.photoUrl) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="rounded-xl px-3 py-2 text-xs font-semibold text-lp-error transition hover:bg-lp-error-container/40"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-lp-on-surface-variant">
                    Disarankan format WebP, PNG, atau JPG. Rasio kotak 1:1, maks 5MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      handlePhotoPicked(event.target.files?.[0] ?? null)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Name & Category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="studio-name"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant"
                >
                  Nama Menu F&amp;B <span className="text-lp-error">*</span>
                </label>
                <input
                  id="studio-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cth: Aren Latte Oat Milk"
                  className="h-11 w-full rounded-xl bg-lp-surface-low px-4 text-sm font-semibold text-lp-on-surface outline-none transition focus:bg-lp-surface-container"
                />
              </div>

              <div>
                <label
                  htmlFor="studio-category"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant"
                >
                  Kategori Menu <span className="text-lp-error">*</span>
                </label>
                <DropdownSearch
                  id="studio-category"
                  value={categoryId}
                  onChange={setCategoryId}
                  placeholder="Pilih Kategori Menu"
                  searchPlaceholder="Cari kategori menu…"
                  options={categoryOptions}
                />
              </div>
            </div>

            {/* SKU & Barcode */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="studio-sku"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant"
                >
                  Kode SKU Kasir
                </label>
                <div className="relative">
                  <input
                    id="studio-sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="KOP-SIG-004"
                    className="h-11 w-full rounded-xl bg-lp-surface-low pl-4 pr-10 font-lp-mono text-sm uppercase text-lp-on-surface outline-none transition focus:bg-lp-surface-container"
                  />
                  <Icon
                    name="qr_code_2"
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[20px] text-lp-on-surface-variant"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="studio-barcode"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant"
                >
                  Barcode / UPC (Opsional)
                </label>
                <input
                  id="studio-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="899277500129"
                  className="h-11 w-full rounded-xl bg-lp-surface-low px-4 font-lp-mono text-sm text-lp-on-surface outline-none transition focus:bg-lp-surface-container"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="studio-desc"
                  className="block text-xs font-bold uppercase tracking-wider text-lp-on-surface-variant"
                >
                  Deskripsi Ringkas Menu
                </label>
                <span className="font-lp-mono text-[11px] text-lp-on-surface-variant">
                  {description.length}/200 karakter
                </span>
              </div>
              <textarea
                id="studio-desc"
                rows={3}
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Perpaduan seimbang double shot espresso House Blend Kintamani dengan krimer oat alami dan pemanis gula aren cair organik..."
                className="w-full resize-none rounded-xl bg-lp-surface-low p-3.5 text-sm text-lp-on-surface outline-none transition focus:bg-lp-surface-container"
              />
            </div>
          </section>

          {/* Section 2: Harga Jual */}
          <section className="flex flex-col gap-5 rounded-2xl bg-lp-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-lp-surface-container pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lp-surface-container text-lp-primary">
                  <Icon name="payments" className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-lp-on-surface">
                    Harga Jual
                  </h2>
                  <p className="text-xs text-lp-on-surface-variant">
                    Harga dasar yang tampil di Kasir POS &amp; tablet pelanggan.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-lp-surface-low px-3 py-1 font-lp-mono text-xs font-semibold text-lp-on-surface-variant">
                Bagian 2/4
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-lp-surface-low p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lp-surface-container text-lp-primary">
                  <Icon name="sell" className="text-[18px]" />
                </div>
                <span className="text-xs font-bold text-lp-on-surface">
                  Harga Jual Dasar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-lp-on-surface-variant">
                  Rp
                </span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                  aria-label="Harga jual dasar"
                  className="h-10 w-36 rounded-lg bg-lp-surface-container-lowest px-3 text-right font-lp-mono text-sm font-bold text-lp-on-surface shadow-sm outline-none focus:ring-2 focus:ring-lp-primary"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Grup Modifier */}
          <section className="flex flex-col gap-5 rounded-2xl bg-lp-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-lp-surface-container pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lp-surface-container text-lp-primary">
                  <Icon name="tune" className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-lp-on-surface">
                    Grup Modifier &amp; Opsi
                  </h2>
                  <p className="text-xs text-lp-on-surface-variant">
                    Opsi tambahan (level gula/es, susu, topping) yang muncul di Kasir POS.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-lp-surface-low px-3 py-1 font-lp-mono text-xs font-semibold text-lp-on-surface-variant">
                Bagian 3/4
              </span>
            </div>

            {product ? (
              <ModifierEditor productId={product.id} />
            ) : (
              <p className="text-sm text-lp-on-surface-variant">
                Simpan produk dulu untuk mengatur grup modifier.
              </p>
            )}
          </section>

          {/* Section 4: Formula Resep Bahan Baku (BOM HPP) */}
          <section className="flex flex-col gap-5 rounded-2xl bg-lp-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-lp-surface-container pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lp-surface-container text-lp-primary">
                  <Icon name="science" className="text-[20px]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-lp-on-surface">
                    Formula Resep Bahan Baku (BOM HPP)
                  </h2>
                  <p className="text-xs text-lp-on-surface-variant">
                    Pengurangan otomatis stok gudang saat transaksi kasir terselesaikan.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-lp-surface-low px-3 py-1 font-lp-mono text-xs font-semibold text-lp-on-surface-variant">
                Bagian 4/4
              </span>
            </div>

            {/* BOM Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-lp-surface-low text-xs uppercase tracking-wider text-lp-on-surface-variant">
                    <th className="rounded-l-xl px-4 py-3">Bahan Baku (Dari Gudang)</th>
                    <th className="px-3 py-3">Gramatur</th>
                    <th className="px-3 py-3 text-right">Biaya Satuan</th>
                    <th className="px-3 py-3 text-right">Subtotal Modal</th>
                    <th className="rounded-r-xl px-2 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lp-surface-container">
                  {bomRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-6 text-center text-xs text-lp-on-surface-variant"
                      >
                        Belum ada komposisi bahan. Klik tombol di bawah untuk menambah bahan baku.
                      </td>
                    </tr>
                  ) : (
                    bomRows.map((row, index) => {
                      const subtotal = row.qtyUsed * row.unitCost;
                      return (
                        <tr
                          key={`${row.rawMaterialId}-${index}`}
                          className="transition hover:bg-lp-surface-low/50"
                        >
                          <td className="px-4 py-3.5">
                            <DropdownSearch
                              size="sm"
                              value={row.rawMaterialId}
                              onChange={(val) =>
                                updateBomRow(index, 'rawMaterialId', val)
                              }
                              placeholder="Pilih Bahan Baku…"
                              searchPlaceholder="Cari bahan baku / SKU…"
                              options={rawMaterialOptions}
                              aria-label={`Bahan baris ${index + 1}`}
                            />
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={row.qtyUsed}
                                onChange={(e) =>
                                  updateBomRow(index, 'qtyUsed', e.target.value)
                                }
                                className="w-16 rounded bg-lp-surface-container-low px-2 py-1 text-right font-lp-mono text-xs font-bold text-lp-on-surface outline-none"
                              />
                              <span className="text-xs text-lp-on-surface-variant">
                                {row.unit}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 text-right font-lp-mono text-xs text-lp-on-surface-variant">
                            {formatIDR(row.unitCost)} / {row.unit}
                          </td>
                          <td className="px-3 py-3.5 text-right font-lp-mono text-sm font-bold text-lp-on-surface">
                            {formatIDR(subtotal)}
                          </td>
                          <td className="px-2 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeBomRow(index)}
                              aria-label={`Hapus ${row.name}`}
                              className="rounded p-1 text-lp-on-surface-variant transition hover:bg-lp-error-container hover:text-lp-error"
                            >
                              <Icon name="delete" className="text-[18px]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Proportion Breakdown Progress Bar */}
            {costProportions.length > 0 && (
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-lp-on-surface">
                    Komposisi Biaya Bahan Terbesar:
                  </span>
                  <span className="font-lp-mono text-xs text-lp-on-surface-variant">
                    {costProportions
                      .slice(0, 4)
                      .map((p) => `${p.name} (${p.pct.toFixed(1)}%)`)
                      .join(' • ')}
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-lp-surface-container">
                  {costProportions.map((p, i) => (
                    <div
                      key={p.name}
                      style={{ width: `${p.pct}%` }}
                      className={`h-full ${barColors[i % barColors.length]}`}
                      title={`${p.name}: ${p.pct.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Add & Subtotal Bar */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-lp-surface-low p-4 sm:flex-row">
              <button
                type="button"
                onClick={addBomRow}
                disabled={rawMaterials.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-lp-surface-container-lowest px-4 py-2.5 text-xs font-bold text-lp-primary shadow-sm transition hover:bg-lp-surface-container disabled:opacity-50 sm:w-auto"
              >
                <Icon name="post_add" className="text-[18px]" />
                <span>+ Tambah Bahan Baku dari Gudang</span>
              </button>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-lp-on-surface-variant">
                  Total HPP Modal Resep:
                </span>
                <span className="font-lp-mono text-base font-extrabold text-lp-on-surface">
                  {formatIDR(totalHpp)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (5 Cols, Sticky) */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:col-span-5">
          {/* Sub-Card A: POS Cashier Screen Card Live Preview */}
          <div className="flex flex-col gap-4 rounded-2xl bg-lp-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="tablet_mac" className="text-[20px] text-lp-primary" />
                <h3 className="text-sm font-bold text-lp-on-surface">
                  Pratinjau POS Kasir (Tablet)
                </h3>
              </div>
              <span className="rounded-full bg-lp-surface-low px-2.5 py-0.5 font-lp-mono text-[10px] font-bold uppercase text-lp-on-surface-variant">
                Pratinjau
              </span>
            </div>

            {/* Simulated POS Card */}
            <div className="group flex flex-col gap-3 rounded-2xl bg-lp-surface-low p-4 shadow-inner transition hover:shadow-md">
              <div className="relative h-44 w-full overflow-hidden rounded-xl bg-lp-surface-container">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt={name || 'Menu preview'}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : product?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={apiUrl(product.photoUrl)}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lp-tertiary">
                    <Icon name="restaurant_menu" className="text-[48px]" />
                  </div>
                )}
                <div className="absolute left-2.5 top-2.5 rounded-full bg-lp-inverse-surface/80 px-2.5 py-1 font-lp-sans text-[10px] font-bold uppercase tracking-wider text-lp-inverse-on-surface backdrop-blur-md">
                  {selectedCategoryName}
                </div>
                <div className="absolute bottom-2.5 right-2.5 rounded-xl bg-lp-surface-container-lowest/90 px-3 py-1 font-lp-mono text-sm font-extrabold text-lp-primary shadow-sm backdrop-blur-md">
                  {formatIDR(dineInPrice)}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-base font-bold text-lp-on-surface">
                    {name.trim() || 'Nama Menu Baru'}
                  </span>
                  <span className="font-lp-mono text-xs text-lp-on-surface-variant">
                    {sku || '#POS'}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-lp-on-surface-variant">
                  {description.trim() ||
                    'Deskripsi menu akan muncul di struk kasir dan pemesanan tablet pelanggan.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Card B: Real-Time Gross Margin & Financial Profitability Engine */}
          <div className="flex flex-col gap-5 rounded-2xl bg-lp-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
                  <Icon name="monitoring" className="text-[18px]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-lp-on-surface">
                    Kalkulator Margin &amp; Laba
                  </h3>
                  <span className="text-[11px] text-lp-on-surface-variant">
                    Unit economics per porsi
                  </span>
                </div>
              </div>
            </div>

            {/* Profit KPI Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="flex flex-col rounded-xl bg-lp-surface-low p-3">
                <span className="text-[11px] text-lp-on-surface-variant">
                  Harga Jual
                </span>
                <span className="mt-1 font-lp-mono text-xs font-bold text-lp-on-surface sm:text-sm">
                  {formatIDR(dineInPrice)}
                </span>
              </div>
              <div className="flex flex-col rounded-xl bg-lp-surface-low p-3">
                <span className="text-[11px] text-lp-on-surface-variant">
                  Total HPP (BOM)
                </span>
                <span className="mt-1 font-lp-mono text-xs font-bold text-lp-error sm:text-sm">
                  {formatIDR(totalHpp)}
                </span>
              </div>
              <div className="flex flex-col rounded-xl bg-lp-surface-low p-3">
                <span className="text-[11px] text-lp-on-surface-variant">
                  Food Cost Ratio
                </span>
                <span className="mt-1 font-lp-mono text-xs font-bold text-lp-primary sm:text-sm">
                  {foodCostPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Big Highlight Gross Margin */}
            <div className="flex items-center justify-between rounded-xl bg-lp-surface-container-low p-5">
              <div className="flex flex-col">
                <span className="font-lp-mono text-[11px] uppercase tracking-wider text-lp-on-surface-variant">
                  Estimasi Laba Kotor per Cup
                </span>
                <span className="mt-0.5 font-lp-mono text-2xl font-extrabold text-lp-primary">
                  {formatIDR(grossProfit)}
                </span>
                <span className="mt-0.5 text-[11px] text-lp-on-surface-variant">
                  Sebelum biaya overhead &amp; operasional
                </span>
              </div>

              {/* Circular Radial Graph Mini (SVG) */}
              <div className="relative flex h-16 w-16 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-lp-surface-container"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-lp-primary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${strokeDash}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-lp-mono text-[11px] font-bold text-lp-on-surface">
                  {marginPct.toFixed(1)}%
                </span>
              </div>
            </div>

          </div>

          {/* Sub-Card C: Dayparting & Schedule Availability */}
          <div className="flex flex-col gap-4 rounded-2xl bg-lp-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  name="calendar_clock"
                  className="text-[20px] text-lp-secondary"
                />
                <h3 className="text-sm font-bold text-lp-on-surface">
                  Jam Ketersediaan Menu
                </h3>
              </div>
              <span className="font-lp-mono text-[11px] font-bold text-lp-secondary">
                {availabilityStart || availabilityEnd ? 'TERJADWAL' : 'ALL-DAY'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="studio-avail-start"
                  className="mb-1 block text-[11px] font-bold uppercase text-lp-on-surface-variant"
                >
                  Mulai Jam
                </label>
                <input
                  id="studio-avail-start"
                  type="time"
                  value={availabilityStart}
                  onChange={(e) => setAvailabilityStart(e.target.value)}
                  className="h-10 w-full rounded-lg bg-lp-surface-low px-3 font-lp-mono text-xs text-lp-on-surface outline-none focus:bg-lp-surface-container"
                />
              </div>
              <div>
                <label
                  htmlFor="studio-avail-end"
                  className="mb-1 block text-[11px] font-bold uppercase text-lp-on-surface-variant"
                >
                  Selesai Jam
                </label>
                <input
                  id="studio-avail-end"
                  type="time"
                  value={availabilityEnd}
                  onChange={(e) => setAvailabilityEnd(e.target.value)}
                  className="h-10 w-full rounded-lg bg-lp-surface-low px-3 font-lp-mono text-xs text-lp-on-surface outline-none focus:bg-lp-surface-container"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl bg-lp-surface-container-lowest p-4 shadow-sm sm:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-lp-on-surface-variant">
            {editing
              ? 'Mengubah menu yang sudah ada di katalog'
              : 'Menambah menu baru ke katalog'}
          </span>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-lp-surface-low px-5 text-sm font-semibold text-lp-on-surface transition hover:bg-lp-surface-container sm:flex-initial"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={saveM.isPending}
            onClick={() => {
              setIsAvailable(true);
              saveM.mutate(true);
            }}
            className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-lp-primary px-6 text-sm font-bold text-lp-on-primary shadow-sm transition hover:bg-lp-primary-container disabled:opacity-50 sm:flex-initial"
          >
            <Icon name="check" className="text-[18px]" />
            <span>
              {saveM.isPending ? 'Menyimpan…' : 'Simpan &amp; Publikasikan ke POS'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
