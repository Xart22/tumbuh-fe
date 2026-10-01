'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@/components/icon';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger',
  icon,
  isLoading = false,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus cancel button on open for safety on destructive actions
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelBtnRef.current?.focus();
      });
    }
  }, [open]);

  if (!open) return null;

  const defaultIcon =
    variant === 'danger'
      ? 'delete'
      : variant === 'warning'
        ? 'warning'
        : 'help';

  const iconBg =
    variant === 'danger'
      ? 'bg-lp-error-container text-lp-error'
      : variant === 'warning'
        ? 'bg-lp-secondary-fixed/50 text-lp-secondary'
        : 'bg-lp-primary-container text-lp-primary';

  const confirmBtnCls =
    variant === 'danger'
      ? 'bg-lp-error text-white hover:opacity-95'
      : variant === 'warning'
        ? 'bg-lp-secondary text-white hover:opacity-95'
        : 'bg-lp-primary text-lp-on-primary hover:opacity-95';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-lp-surface-container-lowest p-6 shadow-2xl border border-lp-surface-container animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
          >
            <Icon name={icon ?? defaultIcon} className="text-[24px]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-base font-bold text-lp-on-surface"
            >
              {title}
            </h3>
            <div
              id="confirm-dialog-desc"
              className="mt-1 text-sm text-lp-on-surface-variant leading-relaxed"
            >
              {description}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="h-11 rounded-xl bg-lp-surface-low px-4 text-xs font-bold text-lp-on-surface transition hover:bg-lp-surface-container disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`h-11 rounded-xl px-5 text-xs font-bold shadow-sm transition disabled:opacity-50 ${confirmBtnCls}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Icon name="progress_activity" className="animate-spin text-[16px]" />
                Memproses…
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  buttonText?: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: string;
}

export function AlertDialog({
  open,
  onClose,
  title,
  description,
  buttonText = 'Mengerti',
  variant = 'info',
  icon,
}: AlertDialogProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        btnRef.current?.focus();
      });
    }
  }, [open]);

  if (!open) return null;

  const defaultIcon =
    variant === 'success'
      ? 'check_circle'
      : variant === 'danger'
        ? 'error'
        : variant === 'warning'
          ? 'warning'
          : 'info';

  const iconBg =
    variant === 'success'
      ? 'bg-lp-primary-container text-lp-primary'
      : variant === 'danger'
        ? 'bg-lp-error-container text-lp-error'
        : variant === 'warning'
          ? 'bg-lp-secondary-fixed/50 text-lp-secondary'
          : 'bg-lp-surface-container text-lp-on-surface';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-lp-surface-container-lowest p-6 shadow-2xl border border-lp-surface-container animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
          >
            <Icon name={icon ?? defaultIcon} className="text-[24px]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="alert-dialog-title"
              className="text-base font-bold text-lp-on-surface"
            >
              {title}
            </h3>
            <div
              id="alert-dialog-desc"
              className="mt-1 text-sm text-lp-on-surface-variant leading-relaxed"
            >
              {description}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button
            ref={btnRef}
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl bg-lp-primary px-6 text-xs font-bold text-lp-on-primary shadow-sm transition hover:opacity-95"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
