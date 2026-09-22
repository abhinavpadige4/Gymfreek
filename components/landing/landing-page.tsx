import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart3, Dumbbell, Play, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stat, TiltCard } from '@/components/landing/hero-visual';
import { LandingFooter } from '@/components/landing/landing-footer';

const MOVEMENTS = [  'Kettlebell Swings',
  'Box Jumps',
  'Thrusters',
  'Burpees',
  "Farmer's Carries",
  'Devil Press',
  'Snatches',
  'Lunges',
  'Push-Ups',
  'Deadlifts',
  'Mountain Climbers',
  'Wall Balls',
];

const BLOCKS = [
  'Foundational Swings & Box Power',
  'Thruster Engine & Overhead Force',
  "Farmer's Grip & Sled Simulator",
  "Density, Core & Devil's Press",
  'Century Simulation Matrix',
  'Unilateral Power & Asymmetry',
  'Explosive Capacity & Clusters',
  'Lactic Threshold & Heavy Load',
  'Speed Turnover & Rapid Cycles',
  'Grandmaster Century Summit',
];

const FEATURES = [
  {
    icon: Dumbbell,
    title: 'AI Workout Tracking',
    body: 'Accurate rep counting and form analysis.',
  },
  {
    icon: BarChart3,
    title: 'Track Your Progress',
    body: 'See real improvements over time.',
  },
  {
    icon: Zap,
    title: 'Stay Consistent',
    body: 'Daily workouts, streaks and milestones.',
  },
  {
    icon: Users,
    title: 'Be Part of a Community',
    body: 'Challenge yourself with thousands of others.',
  },
];

const BRAINS = [
  {
    title: 'Eyes',
    body: 'Your camera reads every rep in the browser with on-device pose detection. No video ever leaves your phone.',
  },
  {
    title: 'Referee',
    body: 'A rule engine scores depth, alignment and control rep by rep. Real time, zero waiting, zero cost.',
  },
  {
    title: 'Coach',
    body: 'After the workout, AI turns your numbers into one clear verdict: what improved, what to fix tomorrow.',
  },
  {
    title: 'Voice',
    body: 'Cues spoken out loud mid-set. Chest up. Knees out. Deeper. Like a coach standing next to you.',
  },
];

export function LandingPage() {
  return (
    <main className="flex-1 overflow-x-clip">
      {/* HERO */}
      <section className="bg-grid-volt relative">
        <div className="bg-stripes h-2.5 w-full" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-6 text-left">
              <p
                className="animate-rise-in font-display text-sm tracking-[0.3em] text-muted-foreground"
              >
                100 DAYS. A STRONGER YOU.
              </p>
              <h1
                className="animate-rise-in font-display text-6xl leading-[0.95] tracking-tight sm:text-7xl"
                style={{ animationDelay: '80ms' }}
              >
                TRAIN.
                <br />
                TRACK.
                <br />
                IMPROVE.
                <br />
                <span className="text-volt">TRANSFORM.</span>
              </h1>
              <p
                className="animate-rise-in max-w-md text-base text-muted-foreground sm:text-lg"
                style={{ animationDelay: '160ms' }}
              >
                Join the 100XU challenge and build a stronger, healthier, more
                confident you - one day at a time.
              </p>
              <div
                className="animate-rise-in flex flex-wrap gap-3"
                style={{ animationDelay: '240ms' }}
              >
                <Button asChild size="lg" className="min-h-tap text-base">
                  <Link href="/signup">
                    Start the 100-Day Challenge
                    <ArrowRight className="size-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="min-h-tap text-base">
                  <Link href="/#how">
                    <Play className="size-5" />
                    See how it works
                  </Link>
                </Button>
              </div>
              <div className="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-6 pt-2 sm:grid-cols-4">
                <Stat value={100} suffix="" label="days" />
                <Stat value={100000} suffix="" label="total reps" />
                <Stat value={1000} suffix="" label="reps daily" />
                <Stat value={10} suffix="" label="blocks" />
              </div>
            </div>

            <TiltCard>
              <div className="relative mx-auto w-full max-w-md">
                <div className="animate-floaty overflow-hidden rounded-2xl border border-volt/30 shadow-[0_0_80px_-20px_hsl(22_92%_49%/0.5)]">
                  <Image
                    src="/landing/hero-girl.png"
                    alt="Athlete ready to train for the 100XU challenge"
                    width={1024}
                    height={1365}
                    priority
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div
                  className="absolute -right-3 -top-4 rounded-full border border-volt/40 bg-background px-3 py-1 text-xs font-semibold text-volt"
                  style={{ transform: 'translateZ(60px)' }}
                >
                  1,000 reps today
                </div>
                <div
                  className="absolute -left-4 bottom-10 rounded-full border border-volt/40 bg-background px-3 py-1 text-xs font-semibold text-volt"
                  style={{ transform: 'translateZ(40px)' }}
                >
                  form score 84
                </div>
                <p
                  className="absolute -right-2 top-1/3 rotate-6 font-display text-2xl leading-tight text-volt sm:text-3xl"
                  style={{ transform: 'translateZ(50px) rotate(6deg)' }}
                >
                  BETTER
                  <br />
                  THAN
                  <br />
                  YESTERDAY
                </p>
              </div>
            </TiltCard>
          </div>
        </div>

        {/* marquee */}
        <div className="marquee-mask relative overflow-hidden border-y border-border bg-card/50 py-3">
          <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
            {[...MOVEMENTS, ...MOVEMENTS].map((m, i) => (
              <span key={i} className="font-display text-lg tracking-wider text-muted-foreground">
                {m.toUpperCase()} <span className="ml-6 text-volt">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-2 text-center">
              <f.icon className="size-8 text-volt" strokeWidth={1.5} />
              <p className="font-semibold">{f.title}</p>
              <p className="max-w-[16rem] text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-display text-sm tracking-[0.3em] text-volt">FIELD MANUAL - 01</p>
        <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          HOW IT <span className="text-volt">WORKS</span>
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Join the challenge',
              b: 'One payment of Rs 2,999 unlocks all 100 days. Fill your training profile so the coach knows your level, limits and injuries.',
            },
            {
              n: '02',
              t: 'Train the daily circuit',
              b: 'Every day runs variations V1 to V10, 10 reps each, 10 rounds. About 1,000 reps in 45 minutes. Your camera counts and scores.',
            },
            {
              n: '03',
              t: 'Get coached',
              b: 'Live voice cues fix your form mid-set. After the workout, AI tells you exactly what to improve tomorrow.',
            },
          ].map((s) => (
            <Card key={s.n} className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-5xl text-volt">{s.n}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{s.t}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CHALLENGE */}
      <section id="challenge" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <TiltCard>
              <div className="relative mx-auto w-full max-w-md">
                <div className="animate-floaty overflow-hidden rounded-2xl border border-volt/30 shadow-[0_0_80px_-20px_hsl(22_92%_49%/0.5)]">
                  <Image
                    src="/landing/challenge-boy.png"
                    alt="Athlete wearing the 100XU vest"
                    width={1024}
                    height={1365}
                    loading="lazy"
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div
                  className="absolute -right-3 top-8 rounded-full border border-volt/40 bg-background px-3 py-1 text-xs font-semibold text-volt"
                  style={{ transform: 'translateZ(60px)' }}
                >
                  DAY 47 / 100
                </div>
                <div
                  className="absolute -left-4 bottom-10 rounded-full border border-volt/40 bg-background px-3 py-1 text-xs font-semibold text-volt"
                  style={{ transform: 'translateZ(40px)' }}
                >
                  streak 12 days
                </div>
              </div>
            </TiltCard>
            <div className="flex flex-col items-start gap-4">
              <p className="font-display text-sm tracking-[0.3em] text-muted-foreground">
                THE 100-DAY CHALLENGE
              </p>
              <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
                DISCIPLINE
                <br />
                BUILDS <span className="text-volt">FREEDOM.</span>
              </h2>
              <p className="max-w-md text-muted-foreground">
                Structured workouts, intelligent tracking and real coaching to
                help you show up, stay consistent and see real results in 100 days.
              </p>
              <div className="grid w-full max-w-md grid-cols-2 gap-6 pt-2 sm:grid-cols-4">
                {[
                  ['100', 'Days'],
                  ['30+', 'Exercises'],
                  ['AI', 'Form Analysis'],
                  ['Stronger', 'You'],
                ].map(([v, label]) => (
                  <div key={label} className="flex flex-col border-l border-border pl-3">
                    <span className="font-display text-2xl">{v}</span>
                    <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="min-h-tap mt-2 text-base">
                <Link href="/signup">
                  Start the 100-Day Challenge
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
          <p className="mt-16 font-display text-sm tracking-[0.3em] text-volt">THE PROGRAM - 02</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            10 BLOCKS. <span className="text-volt">100 DAYS.</span>
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Each 10-day wave has its own theme. Same circuit all 10 days - mastery
            through repetition, with lighter recovery days on day 5 and 10.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {BLOCKS.map((b, i) => (
              <Card key={b} className="group border-border transition-colors hover:border-volt/60">
                <CardContent className="p-4">
                  <p className="font-display text-volt">BLOCK {String(i + 1).padStart(2, '0')}</p>
                  <p className="mt-1 text-sm font-medium leading-snug">
                    Days {i * 10 + 1}-{i * 10 + 10}: {b}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI ENGINE */}
      <section id="ai" className="mx-auto max-w-6xl px-4 py-16">
        <p className="font-display text-sm tracking-[0.3em] text-volt">THE MACHINE - 03</p>
        <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
          FOUR BRAINS. <span className="text-volt">ONE COACH.</span>
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRAINS.map((b) => (
            <Card key={b.title} className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-2xl tracking-wide">{b.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{b.body}</CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 rounded-lg border border-volt/30 bg-volt/5 p-4 text-sm">
          The golden rule: your camera loop never touches an LLM. Real-time coaching
          is instant and free. AI reads your numbers after the workout - never your
          video.
        </p>
      </section>

      {/* CTA BANNER */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(22_92%_49%/0.22),transparent_65%)]" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center">
          <p className="font-display text-sm tracking-[0.3em] text-muted-foreground">
            READY TO TRANSFORM?
          </p>
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            YOUR STRONGER SELF STARTS <span className="text-volt">TODAY.</span>
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Join the 100XU challenge and take the first step towards a
            healthier, stronger you.
          </p>
          <Button asChild size="lg" className="min-h-tap mt-2 text-base">
            <Link href="/signup">
              Get Started Now
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <p className="font-display text-sm tracking-[0.3em] text-volt">ENLIST - 04</p>
          <h2 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            ONE PRICE. <span className="text-volt">100 DAYS.</span>
          </h2>
          <Card className="mt-8 border-volt/40 shadow-[0_0_80px_-30px_hsl(22_92%_49%/0.6)]">
            <CardContent className="flex flex-col items-center gap-4 p-8">
              <p className="font-display text-6xl">
                Rs 2,999 <span className="text-lg text-muted-foreground">one-time</span>
              </p>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li>All 100 days with loads, reps and execution cues</li>
                <li>Live AI form checks and voice coaching</li>
                <li>Progress tracking across all 10 blocks</li>
                <li>Free workouts included forever</li>
              </ul>
              <Button asChild size="lg" className="min-h-tap w-full text-base">
                <Link href="/signup">Claim your spot</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/login">Already in? Log in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="bg-stripes h-2.5 w-full" aria-hidden="true" />
      <LandingFooter />
    </main>
  );
}
