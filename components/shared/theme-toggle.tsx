'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Light/dark toggle button. Avoids the hydration mismatch by only showing
// the real icon after mount (next-themes recommends this pattern).
export function ThemeToggle() {
  const t = useTranslations('common.theme');
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = theme === 'system' ? resolvedTheme : theme;
  const next = current === 'dark' ? 'light' : 'dark';
  // The label must also wait for mount: next-themes resolves the real theme
  // client-side, so an SSR-computed label mismatches on hydration (the icon
  // above already follows this pattern).
  const label = !mounted ? t('toggle') : next === 'dark' ? t('switchToDark') : t('switchToLight');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={label}
    >
      {!mounted ? (
        <Sun className="size-4" />
      ) : current === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
