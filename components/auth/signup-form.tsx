'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SEXES = ['MALE', 'FEMALE', 'OTHER'] as const;
const GOALS = ['HYPERTROPHY', 'STRENGTH', 'FAT_LOSS', 'RECOMP', 'GENERAL_FITNESS'] as const;
const EXPERIENCE = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ATHLETE'] as const;

type FormValues = {
  displayName: string;
  email: string;
  password: string;
  sex: string;
  dateOfBirth: string;
  heightCm: number | undefined;
  bodyweight: number | undefined;
  weeklyFrequency: number | undefined;
  goal: string;
  experienceLevel: string;
  medicalConditions: string;
  injuries: string;
  acceptTerms: boolean;
};

// Two-step signup: account first, full training profile second (body metrics,
// goal, experience, health context). The profile step is what marks onboarding
// complete, so a new account never lands on an empty profile.
export function SignupForm() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        displayName: z.string().trim().min(1, t('validation.nameRequired')).max(80),
        email: z.string().email(t('validation.invalidEmail')),
        password: z.string().min(8, t('validation.passwordMin')),
        sex: z
          .string()
          .refine((v) => (SEXES as readonly string[]).includes(v), t('validation.required')),
        dateOfBirth: z
          .string()
          .refine(
            (v) => v === '' || (!Number.isNaN(Date.parse(v)) && new Date(v) <= new Date()),
            t('validation.datePast'),
          ),
        heightCm: z.coerce.number().int().min(100, t('validation.required')).max(250),
        bodyweight: z.coerce.number().min(20, t('validation.required')).max(300),
        weeklyFrequency: z.coerce.number().int().min(1, t('validation.required')).max(14),
        goal: z
          .string()
          .refine((v) => (GOALS as readonly string[]).includes(v), t('validation.required')),
        experienceLevel: z
          .string()
          .refine((v) => (EXPERIENCE as readonly string[]).includes(v), t('validation.required')),
        medicalConditions: z.string().trim().max(1000),
        injuries: z.string().trim().max(1000),
        acceptTerms: z.boolean().refine((v) => v === true, t('validation.consentRequired')),
      }),
    [t],
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      sex: '',
      dateOfBirth: '',
      heightCm: undefined,
      bodyweight: undefined,
      weeklyFrequency: undefined,
      goal: '',
      experienceLevel: '',
      medicalConditions: '',
      injuries: '',
      acceptTerms: false,
    },
  });

  async function next() {
    const ok = await trigger(['displayName', 'email', 'password']);
    if (ok) {
      setServerError(null);
      setStep(2);
      window.scrollTo({ top: 0 });
    }
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
        sex: values.sex,
        dateOfBirth: values.dateOfBirth || null,
        heightCm: values.heightCm,
        bodyweight: values.bodyweight,
        weeklyFrequency: values.weeklyFrequency,
        goal: values.goal,
        experienceLevel: values.experienceLevel,
        medicalConditions: values.medicalConditions.trim() || null,
        injuries: values.injuries.trim() || null,
        termsAccepted: values.acceptTerms,
      }),
    });

    if (res.ok) {
      router.replace('/');
      router.refresh();
      return;
    }

    setServerError(t('signup.error'));
  }

  const goalLabels: Record<string, string> = {
    HYPERTROPHY: t('signup.goalHypertrophy'),
    STRENGTH: t('signup.goalStrength'),
    FAT_LOSS: t('signup.goalFatLoss'),
    RECOMP: t('signup.goalRecomp'),
    GENERAL_FITNESS: t('signup.goalGeneral'),
  };
  const expLabels: Record<string, string> = {
    BEGINNER: t('signup.expBeginner'),
    INTERMEDIATE: t('signup.expIntermediate'),
    ADVANCED: t('signup.expAdvanced'),
    ATHLETE: t('signup.expAthlete'),
  };

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-[0_0_60px_-20px_hsl(22_92%_49%/0.4)]">
      <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-display text-4xl tracking-wide">
            100<span className="text-volt">X</span>U
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{t('signup.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('signup.description')}</p>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {step === 1 ? t('signup.stepAccount') : t('signup.stepProfile')}
          </p>
          <div className="flex items-center gap-1.5" aria-hidden>
            {[1, 2].map((n) => (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all duration-200 ${step >= n ? 'w-8 bg-volt' : 'w-4 bg-muted'}`}
              />
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div key={step} className="animate-auth-step-in flex flex-col gap-4">
          {step === 1 ? (
            <>
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

              <Button type="button" onClick={next} className="min-h-tap w-full text-base">
                {t('signup.continue')}
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('signup.sex')}</Label>
                  <Controller
                    control={control}
                    name="sex"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="min-h-tap">
                          <SelectValue placeholder={t('signup.sex')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">{t('signup.sexMale')}</SelectItem>
                          <SelectItem value="FEMALE">{t('signup.sexFemale')}</SelectItem>
                          <SelectItem value="OTHER">{t('signup.sexOther')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.sex && <p className="text-sm text-destructive">{errors.sex.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">{t('signup.dateOfBirth')}</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    className="min-h-tap"
                    {...register('dateOfBirth')}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="heightCm">{t('signup.height')}</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    className="min-h-tap"
                    {...register('heightCm', { valueAsNumber: true })}
                  />
                  {errors.heightCm && (
                    <p className="text-sm text-destructive">{errors.heightCm.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyweight">{t('signup.weight')}</Label>
                  <Input
                    id="bodyweight"
                    type="number"
                    className="min-h-tap"
                    {...register('bodyweight', { valueAsNumber: true })}
                  />
                  {errors.bodyweight && (
                    <p className="text-sm text-destructive">{errors.bodyweight.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('signup.frequency')}</Label>
                  <Controller
                    control={control}
                    name="weeklyFrequency"
                    render={({ field }) => {
                      const value = typeof field.value === 'number' ? field.value : 3;
                      const clamp = (n: number) => field.onChange(Math.min(14, Math.max(1, n)));
                      return (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label={t('signup.frequency')}>
                            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                              <button
                                key={n}
                                type="button"
                                aria-pressed={value === n}
                                onClick={() => field.onChange(n)}
                                className={`min-h-tap rounded-lg text-sm font-bold tabular-nums transition-all duration-150 active:scale-95 ${value === n ? 'scale-105 bg-volt text-black shadow' : 'border border-border text-muted-foreground hover:border-volt/60 hover:text-foreground'}`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => clamp(value - 1)}
                              disabled={value <= 1}
                              aria-label="Fewer days"
                              className="flex min-h-tap min-w-tap items-center justify-center rounded-lg border border-border text-lg font-bold transition-all active:scale-95 disabled:opacity-40"
                            >
                              -
                            </button>
                            <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                              {value} / week{value > 7 ? ' (double sessions)' : ''}
                            </p>
                            <button
                              type="button"
                              onClick={() => clamp(value + 1)}
                              disabled={value >= 14}
                              aria-label="More days"
                              className="flex min-h-tap min-w-tap items-center justify-center rounded-lg border border-border text-lg font-bold transition-all active:scale-95 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {errors.weeklyFrequency && (
                    <p className="text-sm text-destructive">{errors.weeklyFrequency.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('signup.goal')}</Label>
                <Controller
                  control={control}
                  name="goal"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="min-h-tap">
                        <SelectValue placeholder={t('signup.goal')} />
                      </SelectTrigger>
                      <SelectContent>
                        {GOALS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {goalLabels[g]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.goal && <p className="text-sm text-destructive">{errors.goal.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>{t('signup.experience')}</Label>
                <Controller
                  control={control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="min-h-tap">
                        <SelectValue placeholder={t('signup.experience')} />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE.map((e) => (
                          <SelectItem key={e} value={e}>
                            {expLabels[e]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.experienceLevel && (
                  <p className="text-sm text-destructive">{errors.experienceLevel.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalConditions">{t('signup.medical')}</Label>
                <Input
                  id="medicalConditions"
                  placeholder={t('signup.medicalPlaceholder')}
                  className="min-h-tap"
                  {...register('medicalConditions')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="injuries">{t('signup.injuries')}</Label>
                <Input
                  id="injuries"
                  placeholder={t('signup.injuriesPlaceholder')}
                  className="min-h-tap"
                  {...register('injuries')}
                />
              </div>

              {serverError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}

              <div className="flex items-start gap-2">
                <Controller
                  control={control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 size-5 shrink-0 accent-[#D94A05]"
                    />
                  )}
                />
                <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug">
                  {t('signup.consentBefore')}
                  <Link href="/terms" target="_blank" className="font-medium text-volt underline-offset-4 hover:underline">
                    {t('signup.consentTerms')}
                  </Link>
                  {t('signup.consentAnd')}
                  <Link href="/privacy" target="_blank" className="font-medium text-volt underline-offset-4 hover:underline">
                    {t('signup.consentPrivacy')}
                  </Link>
                  .
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="min-h-tap"
                >
                  {t('signup.back')}
                </Button>
                <Button type="submit" className="min-h-tap flex-1 text-base" disabled={isSubmitting}>
                  {isSubmitting ? t('signup.submitting') : t('signup.submit')}
                </Button>
              </div>
            </>
          )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
