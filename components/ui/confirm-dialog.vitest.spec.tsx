import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog, AlertDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  it('does not render when open is false', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Hapus Data"
        description="Apakah Anda yakin?"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title, description and triggers onConfirm and onClose', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Hapus Menu Kopi"
        description="Data menu akan dihapus secara permanen."
        confirmText="Hapus Sekarang"
        cancelText="Batal"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText('Hapus Menu Kopi')).toBeInTheDocument();
    expect(
      screen.getByText('Data menu akan dihapus secara permanen.'),
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Hapus Sekarang' });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: 'Batal' });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open={true}
        title="Konfirmasi"
        description="Tes escape"
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('AlertDialog', () => {
  it('renders and closes when button clicked', () => {
    const onClose = vi.fn();
    render(
      <AlertDialog
        open={true}
        title="Info Penting"
        description="Sesi kasir telah dibuka."
        buttonText="Mengerti"
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Info Penting')).toBeInTheDocument();
    expect(screen.getByText('Sesi kasir telah dibuka.')).toBeInTheDocument();

    const okBtn = screen.getByRole('button', { name: 'Mengerti' });
    fireEvent.click(okBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
