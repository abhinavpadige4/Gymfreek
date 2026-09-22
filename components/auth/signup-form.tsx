'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

type FormValues = { displayName: string; email: string; password: string };

export function SignupForm() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const schema = useMemo(
    () =>
      z.object({
        displayName: z.string().trim().min(1, t('validation.nameRequired')).max(80),
        email: z.string().email(t('validation.invalidEmail')),
        password: z.string().min(8, t('validation.passwordMin')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      router.replace('/');
      router.refresh();
      return;
    }

    setServerError(t('signup.error'));
  }

  return (
    <Card className="w-full max-w-sm animate-auth-in rounded-2xl shadow-[0_0_60px_-20px_hsl(22_92%_49%/0.4)]">
      <CardContent className="flex flex-col gap-5 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-4xl tracking-wide">
            100<span className="text-volt">X</span>U
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{t('signup.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('signup.description')}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="displayName">{common('fields.name')}</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="displayName"
                autoComplete="name"
                placeholder={t('signup.namePlaceholder')}
                aria-invalid={errors.displayName ? 'true' : 'false'}
                className="min-h-tap pl-10"
                {...register('displayName')}
              />
            </div>
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

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
                placeholder={t('signup.emailPlaceholder')}
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
                autoComplete="new-password"
                placeholder={t('signup.passwordPlaceholder')}
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
            {isSubmitting ? t('signup.submitting') : t('signup.submit')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t('signup.hasAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-volt underline-offset-4 hover:underline"
            >
              {t('signup.signIn')}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
