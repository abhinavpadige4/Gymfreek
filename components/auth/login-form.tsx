'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

type FormValues = { email: string; password: string };

// Public demo flag and credentials, inlined at build time. When the flag is on
// (e.g. on a public demo instance) the login page surfaces a one-click sign in.
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? '';
const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? '';
const showDemo = demoMode && demoEmail !== '' && demoPassword !== '';

export function LoginForm() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')),
        password: z.string().min(1, t('validation.passwordRequired')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function loginAsDemo() {
    // Prefill the fields for visible feedback, then submit the demo credentials.
    setValue('email', demoEmail);
    setValue('password', demoPassword);
    await onSubmit({ email: demoEmail, password: demoPassword });
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      router.replace('/');
      router.refresh();
      return;
    }

    setServerError(t('login.error'));
  }

  return (
    <Card className="w-full max-w-sm animate-auth-in rounded-2xl shadow-[0_0_60px_-20px_hsl(22_92%_49%/0.4)]">
      <CardContent className="flex flex-col gap-5 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-4xl tracking-wide">
            100<span className="text-volt">X</span>U
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{t('login.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('login.description')}</p>
        </div>
        {showDemo && (
          <div className="space-y-2 rounded-md border border-dashed bg-muted/50 p-3">
            <p className="text-sm font-medium">{t('login.demoTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {demoEmail} / {demoPassword}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="min-h-tap w-full"
              onClick={loginAsDemo}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('login.submitting') : t('login.demoSubmit')}
            </Button>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">{common('fields.email')}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder={t('login.emailPlaceholder')}
                aria-invalid={errors.email ? 'true' : 'false'}
                className="min-h-tap pl-10"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{common('fields.password')}</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                aria-invalid={errors.password ? 'true' : 'false'}
                className="min-h-tap pl-10 pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            className="min-h-tap w-full text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('login.submitting') : t('login.submit')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link
              href="/signup"
              className="font-medium text-volt underline-offset-4 hover:underline"
            >
              {t('login.createAccount')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
