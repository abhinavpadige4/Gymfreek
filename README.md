# 100XU

AI fitness coach with live form checks and the century challenge. Train 100 days, 1,000 reps a day, with your camera as the referee and AI as the coach.

[![CI](https://github.com/abhinavpadige4/Gymfreek/actions/workflows/ci.yml/badge.svg)](https://github.com/abhinavpadige4/Gymfreek/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org)

> Four brains: **camera eyes** (on-device pose detection), **rule-engine referee**
> (instant rep counting and form scoring, no LLM), **LLM coach** (post-workout
> debriefs on structured numbers, never video), **voice** (spoken cues mid-set).
> The golden rule: the real-time loop never touches an LLM, and raw video is
> never uploaded or stored.

## The 100XU Century Challenge

10 blocks x 10 days. Every day runs variations V1-V10, 10 reps each, 10 rounds:
1,000 reps a day, 100,000 total. One payment unlocks all 100 days.

- Block 01: Foundational Swings and Box Power ... Block 10: Grandmaster Century Summit
- Day 5 and 10 of each block allow reduced recovery volume
- Each task carries its prescribed load and execution cue; demo-video slots included

## Quick start

```bash
npm install
cp .env.example .env   # fill DATABASE_URL (Neon pooled URL works), JWT_SECRET, keys
npx prisma migrate deploy
npm run db:seed           # demo user + catalog
npm run db:seed:challenge # 100XU days + tasks
npm run dev               # http://localhost:3030
```

## What lives here

- `/` - public landing page for visitors, dashboard for members
- `/onboarding` - full training profile (DOB, health, injuries, experience)
- `/challenges` - challenge catalog, day detail with loads/cues/demo videos, Razorpay join flow
- `/admin` - challenge management, enrollments, users (role `ADMIN` or `ADMIN_EMAILS`)
- `/workout/live` - camera workout: MediaPipe pose, rep counting, voice cues
- `/api/payments/create-order|verify|webhook` - Razorpay, server-verified only
- `/api/ai/results|summary` - structured workout results in, LLM coaching out (via Gymfreek-ai)
- `lib/form-engine` - angles, squat FSM, feedback throttle, browser voice
- Companion AI service: [Gymfreek-ai](https://github.com/abhinavpadige4/Gymfreek-ai) (FastAPI, structured JSON only)

## Environment

Secrets stay server-side. Only `NEXT_PUBLIC_*` reaches the browser.

```
DATABASE_URL=            # Neon pooled URL (dev, test, and prod)
JWT_SECRET=              # 32+ chars, openssl rand -base64 48
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
GROQ_API_KEY=            # fallback provider (LLM_PROVIDER=groq, or auto when OpenRouter key missing)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
ALLOW_DEMO_PAYMENTS=true # dev only: join flow without live keys
ADMIN_EMAILS=
```

## Checks

```bash
npm run lint
npm run typecheck
npm run test                 # unit + component
npm run test:integration     # needs test Postgres on :5434 (see CONTRIBUTING)
npm run build
```

CI runs lint, typecheck, unit, integration, build and E2E on every PR.

## Deploy

- Frontend: Vercel (`DATABASE_URL` + `JWT_SECRET` in project env vars)
- AI service: Railway/Render (see Gymfreek-ai README)
- Database: Neon Postgres (pooled URL)
- Payments: Razorpay Test Mode first, Live keys only after the full payment checklist passes
