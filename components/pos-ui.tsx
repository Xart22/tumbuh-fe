'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-teal-600 text-white hover:bg-teal-500 disabled:bg-teal-900',
  ghost: 'border border-[var(--line)] text-ink hover:bg-[var(--panel-2)]',
  subtle: 'bg-[var(--panel-2)] text-ink hover:bg-[var(--line)]',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
    />
  );
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-teal-600 ${className}`}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[var(--line)] bg-panel p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  const tone =
    kind === 'error'
      ? 'border-red-900 bg-red-950/40 text-red-300'
      : 'border-[var(--line)] bg-[var(--panel-2)] text-muted';
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>{children}</div>
  );
}

export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return <p className="text-sm text-muted">{label}</p>;
}
