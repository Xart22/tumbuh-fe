import { expect, test } from '@playwright/test';

test('landing renders hero + pricing anchors', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /kelola kafe/i }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /coba gratis 14 hari/i }).first()).toBeVisible();
});

test('register wizard validates step 1 inline then advances', async ({ page }) => {
  await page.goto('/register');
  await expect(
    page.getByRole('heading', { name: /buat akun pengelola/i }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Lanjut ke Langkah 2: Profil Usaha' }).click();
  await expect(page.getByText('Nama lengkap wajib diisi.')).toBeVisible();

  await page.getByPlaceholder('Contoh: Dimas Pratama').fill('Dimas Pratama');
  await page.getByPlaceholder('dimas@kopitumbuh.id').fill('dimas@kopitumbuh.id');
  await page.getByPlaceholder('+62 812-xxxx-xxxx').fill('081289012345');
  await page.getByPlaceholder('Min. 8 karakter').fill('KalaSenja2025!');
  await page.getByPlaceholder('Ulangi kata sandi').fill('KalaSenja2025!');
  // Custom Radix checkbox: click + retrying assertion instead of check(),
  // which doesn't wait for React state to flush.
  await page.getByRole('checkbox').click();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await page.getByRole('button', { name: 'Lanjut ke Langkah 2: Profil Usaha' }).click();

  await expect(
    page.getByRole('heading', { name: /atur profil usaha/i }),
  ).toBeVisible();
});

test('login validates PIN length client-side', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('PIN Kasir', { exact: true })).toBeVisible();
  await page.getByPlaceholder('••••').fill('12');
  await page.getByRole('button', { name: /^masuk$/i }).click();
  await expect(page.getByText('PIN minimal 4 digit.')).toBeVisible();
});

test('login owner tab validates email client-side', async ({ page }) => {
  await page.goto('/backoffice');
  await expect(page.getByRole('heading', { name: /selamat datang kembali/i })).toBeVisible();
  await expect(page.getByPlaceholder('kopikita')).toBeVisible();
  await page.getByPlaceholder('nama@restoran.com').fill('bukan-email');
  await page.getByPlaceholder('Masukkan kata sandi').fill('rahasia123');
  await page.getByRole('button', { name: /masuk ke dashboard/i }).click();
  await expect(page.getByText('Email yang valid wajib diisi.')).toBeVisible();
});
