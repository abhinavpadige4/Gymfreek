'use client';

import Image from 'next/image';
import { AVATAR_SEEDS, avatarUrl } from '@/lib/avatar';
import { cn } from '@/lib/utils';

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (seed: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {AVATAR_SEEDS.map((seed) => (
        <button
          key={seed}
          type="button"
          onClick={() => onChange(seed)}
          aria-label={`Pick ${seed}`}
          aria-pressed={value === seed}
          className={cn(
            'rounded-xl border p-1 transition-colors',
            value === seed ? 'border-volt ring-2 ring-volt/40' : 'border-border hover:border-volt/60',
          )}
        >
          <Image src={avatarUrl(seed)} alt={seed} width={64} height={64} className="h-14 w-full" />
        </button>
      ))}
    </div>
  );
}
