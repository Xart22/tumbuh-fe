'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-lp-primary text-white hover:bg-lp-primary-container disabled:opacity-50 shadow-xs font-semibold',
  ghost: 'border border-lp-outline-variant/40 text-lp-on-surface hover:bg-lp-surface-container bg-lp-surface-container-lowest font-medium',
  subtle: 'bg-lp-surface-low text-lp-on-surface hover:bg-lp-surface-container font-medium',
  danger: 'bg-lp-error text-white hover:bg-red-700 font-semibold shadow-xs',
};

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
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
      className={`w-full rounded-xl border border-lp-outline-variant/40 bg-lp-surface-container-lowest px-3 py-2.5 text-sm text-lp-on-surface outline-none placeholder:text-lp-on-surface-variant/50 focus:border-lp-primary focus:ring-1 focus:ring-lp-primary transition-all ${className}`}
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
      <span className="text-xs font-semibold tracking-wide text-lp-on-surface-variant">
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
      className={`rounded-2xl border border-lp-outline-variant/30 bg-lp-surface-container-lowest p-4 shadow-xs ${className}`}
    >
      {children}
    </div>
  );
}

export function Alert({ kind, children }: { kind: 'error' | 'info'; children: React.ReactNode }) {
  const tone =
    kind === 'error'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-blue-200 bg-blue-50 text-blue-800';
  return (
    <div className={`rounded-xl border px-3.5 py-2 text-sm ${tone}`}>{children}</div>
  );
}

export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return <p className="text-sm text-lp-on-surface-variant animate-pulse">{label}</p>;
}
