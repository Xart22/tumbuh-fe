const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export function formatIDR(value: number): string {
  return idr.format(value ?? 0);
}

export function formatNumber(value: number): string {
  return plain.format(value ?? 0);
}

export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function monthISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}
