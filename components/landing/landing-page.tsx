import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stat, TiltCard } from '@/components/landing/hero-visual';
import { TextHoverEffect } from '@/components/ui/text-hover-effect';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { LandingFooter } from '@/components/landing/landing-footer';

const MOVEMENTS = [
  'Kettlebell Swings',
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

const DAY_PREVIEW = [
  ['V1', 'Russian Kettlebell Swings', '16-24 kg'],
  ['V2', 'Plyo Box Jumps', '24 in box'],
  ['V3', 'Dual DB Front Squats', '2 x 12.5 kg'],
  ['V4', 'Hand-Release Push-Ups', 'bodyweight'],
  ['V5', "Farmer's Carry Paces", '2 x 24 kg'],
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-14 sm:pt-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <Badge className="animate-rise-in bg-volt text-volt-ink hover:bg-volt">
              100XU Century Challenge - entries open
            </Badge>
            <div className="animate-rise-in w-full" style={{ animationDelay: '80ms' }}>
              <TextHoverEffect text="100XU" />
            </div>
            <p
              className="animate-rise-in max-w-xl text-base text-muted-foreground sm:text-lg"
              style={{ animationDelay: '160ms' }}
            >
              100 days. 1,000 reps a day. Live AI form checks on every rep, voice cues
              mid-set, and a coach debrief when you finish.
            </p>
            <div
              className="animate-rise-in flex flex-wrap justify-center gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Button asChild size="lg" className="min-h-tap text-base">
                <Link href="/signup">Start Day 1</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-tap text-base">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-6 pt-2 sm:grid-cols-4">
              <Stat value={100} suffix="" label="days" />
              <Stat value={100000} suffix="" label="total reps" />
              <Stat value={1000} suffix="" label="reps daily" />
              <Stat value={10} suffix="" label="blocks" />
            </div>
          </div>

          <ContainerScroll
            title={
              <p className="text-sm uppercase tracking-widest text-muted-foreground">
                Scroll - your workout, live
              </p>
            }
          >
            <TiltCard>
              <div className="relative mx-auto w-full max-w-sm">
                <div className="animate-floaty rounded-2xl border border-volt/30 bg-card/90 p-5 shadow-[0_0_80px_-20px_hsl(22_100%_60%/0.5)] backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="font-display text-2xl tracking-wide">DAY 17</p>
                  <Badge className="bg-volt text-volt-ink hover:bg-volt">LIVE</Badge>
                </div>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  Thruster engine - round 6 of 10
                </p>
                <ul className="mt-4 flex flex-col gap-2">
                  {DAY_PREVIEW.map(([v, name, load]) => (
                    <li
                      key={v}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="mr-2 font-display text-volt">{v}</span>
                        {name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{load}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-volt/30 bg-volt/10 px-3 py-2 text-sm">
                  <span>Rep 7 - form score 84</span>
                  <span className="animate-pulse-glow font-semibold text-volt">
                    Keep your chest up
                  </span>
                </div>
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
                voice cue on
              </div>
            </div>
          </TiltCard>
          </ContainerScroll>
          <div className="flex flex-wrap justify-center gap-3 pb-14">
            <Button asChild size="lg" className="min-h-tap text-base">
              <Link href="/signup">Start Day 1 - Rs 2,999</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-tap text-base">
              <Link href="/login">Log in to train</Link>
            </Button>
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

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
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
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
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
        <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
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

      {/* PRICING */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
            ONE PRICE. <span className="text-volt">100 DAYS.</span>
          </h2>
          <Card className="mt-8 border-volt/40 shadow-[0_0_80px_-30px_hsl(22_100%_60%/0.6)]">
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

      <LandingFooter />
    </main>
  );
}
