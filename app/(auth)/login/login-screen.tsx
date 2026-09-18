'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from './login-form';
import { OwnerPanel } from './owner/owner-panel';

type Mode = 'kasir' | 'owner';

export function LoginScreen() {
  const params = useSearchParams();
  const initial: Mode = params.get('mode') === 'owner' ? 'owner' : 'kasir';
  const [mode, setMode] = useState<Mode>(initial);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div
        role="tablist"
        aria-label="Pilih metode masuk"
        className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl border border-line bg-panel-2 p-1"
      >
        {(
          [
            { value: 'kasir', label: 'Kasir (PIN)' },
            { value: 'owner', label: 'Owner' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => setMode(tab.value)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              mode === tab.value
                ? 'bg-teal-600 text-white'
                : 'text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === 'kasir' ? <LoginForm /> : <OwnerPanel />}
    </div>
  );
}
