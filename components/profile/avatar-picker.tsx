'use client';

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
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {AVATAR_SEEDS.map((seed) => (
        <button
          key={seed}
          type="button"
          onClick={() => onChange(seed)}
          aria-label={`Pick ${seed}`}
          aria-pressed={value === seed}
          className={cn(
            'flex aspect-square items-center justify-center rounded-xl border p-1 transition-colors',
            value === seed ? 'border-volt ring-2 ring-volt/40' : 'border-border hover:border-volt/60',
          )}
        >
          {/* Plain img: local PNG bitmoji, object-contain so heads never crop on phones. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl(seed)} alt={seed} width={96} height={96} loading="lazy" className="h-full w-full rounded-lg object-contain" />
        </button>
      ))}
    </div>
  );
}
