import { z } from 'zod';

export const BUSINESS_TYPES = ['cafe', 'restaurant', 'qsr', 'bakery'] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const registerSchema = z
  .object({
    ownerName: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email bisnis wajib diisi.')
      .email('Email bisnis yang valid wajib diisi.'),
    phone: z.string().trim().min(1, 'Nomor WhatsApp wajib diisi.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    confirmPassword: z.string().min(1, 'Konfirmasi sandi wajib diisi.'),
    agreed: z.boolean().refine((v) => v, 'Centang persetujuan Syarat & Ketentuan dulu.'),
    brandName: z.string().trim().min(1, 'Nama brand / usaha wajib diisi.'),
    businessType: z.enum(BUSINESS_TYPES),
    outletName: z.string().trim().min(1, 'Nama outlet pertama wajib diisi.'),
    city: z.string().trim().min(1, 'Kota / kabupaten wajib dipilih.'),
    address: z.string().trim().min(1, 'Alamat lengkap outlet wajib diisi.'),
    modulePos: z.boolean(),
    moduleInventory: z.boolean(),
    moduleShifts: z.boolean(),
  })
  .refine((v) => v.confirmPassword === v.password, {
    message: 'Konfirmasi sandi tidak sama.',
    path: ['confirmPassword'],
  });

/** Single RHF form spanning both wizard steps. */
export type RegisterValues = z.infer<typeof registerSchema>;

export const REGISTER_DEFAULTS: RegisterValues = {
  ownerName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreed: false,
  brandName: '',
  businessType: 'cafe',
  outletName: '',
  city: 'Jakarta Selatan, DKI Jakarta',
  address: '',
  modulePos: true,
  moduleInventory: true,
  moduleShifts: true,
};

export const STEP1_FIELDS: Array<keyof RegisterValues> = [
  'ownerName',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'agreed',
];

export const STEP2_FIELDS: Array<keyof RegisterValues> = [
  'brandName',
  'outletName',
  'city',
  'address',
];

export const CITIES = [
  'Jakarta Selatan, DKI Jakarta',
  'Bandung, Jawa Barat',
  'Surabaya, Jawa Timur',
  'Yogyakarta, DIY',
  'Denpasar, Bali',
  'Semarang, Jawa Tengah',
  'Medan, Sumatera Utara',
];
