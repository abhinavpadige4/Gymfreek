import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { BarChart3, Flame, Users } from 'lucide-react';

// Marketing half of the auth split layout: eyebrow, big Track/Train/
// Transform headline, supporting copy, three feature rows and the hero
// photo. Dark volt theme to match the app. Shown full on desktop, compact
// (headline only) on phones.
export async function AuthPromo({ variant }: { variant: 'signup' | 'login' }) {
  const t = await getTranslations('auth');
  const features = [
    { icon: BarChart3, title: t('promo.f1t'), desc: t('promo.f1d') },
    { icon: Flame, title: t('promo.f2t'), desc: t('promo.f2d') },
    { icon: Users, title: t('promo.f3t'), desc: t('promo.f3d') },
  ];
  return (
    <>
      {/* Compact mobile headline */}
      <div className="mx-auto w-full max-w-xl text-center lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {variant === 'signup' ? t('promo.eyebrowSignup') : t('promo.eyebrowLogin')}
        </p>
        <p className="mt-2 font-display text-4xl tracking-tight">
          {t('promo.titleA')}{' '}
          <span className="text-volt">{t('promo.titleB')}</span>
        </p>
      </div>
      {/* Full desktop panel */}
      <div className="relative hidden min-w-0 flex-col justify-center gap-6 overflow-hidden lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-volt/15 blur-3xl"
        />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {variant === 'signup' ? t('promo.eyebrowSignup') : t('promo.eyebrowLogin')}
          </p>
          <p className="mt-3 font-display text-5xl tracking-tight xl:text-6xl">
            {t('promo.titleA')}
            <br />
            <span className="text-volt">{t('promo.titleB')}</span>
          </p>
          <p className="mt-4 max-w-md text-muted-foreground">
            {variant === 'signup' ? t('promo.descSignup') : t('promo.descLogin')}
          </p>
        </div>
        <ul className="relative flex flex-col gap-4">
          {features.map((f) => (
            <li key={f.title} className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-volt/15 text-volt">
                <f.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold">{f.title}</span>
                <span className="block text-sm text-muted-foreground">{f.desc}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="relative overflow-hidden rounded-3xl border border-volt/20 shadow-[0_0_80px_-30px_hsl(22_92%_49%/0.6)]">
          <Image
            src="/landing/hero-girl.png"
            alt="Athlete training at sunrise"
            width={1145}
            height={1374}
            sizes="(max-width: 1024px) 0px, 480px"
            className="aspect-[5/6] max-h-[520px] w-full object-cover object-top"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          <p className="absolute bottom-4 left-5 right-5 font-display text-xl tracking-wide text-white">
            {t('promo.titleA')}{' '}
            <span className="text-volt">{t('promo.titleB')}</span>
          </p>
        </div>
      </div>
    </>
  );
}
