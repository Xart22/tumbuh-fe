import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { describe, expect, it, vi } from 'vitest';
import { StepAccount } from './step-account';
import { REGISTER_DEFAULTS, STEP1_FIELDS, registerSchema, type RegisterValues } from './types';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

function Harness({ onNext = () => {} }: { onNext?: () => void }) {
  const methods = useForm<RegisterValues>({
    mode: 'onTouched',
    resolver: zodResolver(registerSchema),
    defaultValues: REGISTER_DEFAULTS,
  });
  // Mirrors RegisterForm.proceedToStep2: only continue when step 1 validates.
  async function handleNext() {
    const valid = await methods.trigger(STEP1_FIELDS, { shouldFocus: true });
    if (valid) onNext();
  }
  return (
    <FormProvider {...methods}>
      <StepAccount onNext={handleNext} />
    </FormProvider>
  );
}

describe('StepAccount', () => {
  it('shows inline errors when continuing with empty fields', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: /langkah 2/i }));
    expect(await screen.findByText('Nama lengkap wajib diisi.')).toBeInTheDocument();
    expect(await screen.findByText('Email bisnis wajib diisi.')).toBeInTheDocument();
  });

  it('calls onNext when step 1 is valid', async () => {
    const onNext = vi.fn();
    render(<Harness onNext={onNext} />);
    fireEvent.change(screen.getByPlaceholderText('Contoh: Dimas Pratama'), {
      target: { value: 'Dimas Pratama' },
    });
    fireEvent.change(screen.getByPlaceholderText('dimas@kopitumbuh.id'), {
      target: { value: 'dimas@kopitumbuh.id' },
    });
    fireEvent.change(screen.getByPlaceholderText('+62 812-xxxx-xxxx'), {
      target: { value: '081289012345' },
    });
    fireEvent.change(screen.getByPlaceholderText('Min. 8 karakter'), {
      target: { value: 'KalaSenja2025!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ulangi kata sandi'), {
      target: { value: 'KalaSenja2025!' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /langkah 2/i }));
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
  });
});
