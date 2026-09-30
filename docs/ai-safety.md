# 100XU AI Safety

## Providers and data flow

1. On-device pose (MediaPipe, `@mediapipe/tasks-vision`): video frames stay in
   browser memory. No network, no storage, no logging. Structured landmarks
   only feed local rep analyzers (`lib/form-engine/*`, static rule phrases).
2. FastAPI coach (separate `Gymfreek-ai` deploy): `POST /ai/workout-summary`
   over HTTPS + bearer token, 60s timeout. Payload is structured numbers only
   (`workoutSummarySchema`: exercise, rep counts, score, issue counts,
   duration). Response validated against `coachOutputSchema` (Zod) - invalid
   shapes rejected with 502, never rendered. No names, emails, profiles,
   video, or payment data ever sent.
3. Local heuristics (`home-insight`, progression, deload): no LLM, no side
   effects, display-only.

There is no in-repo LLM provider. `.env.example` keys for OpenRouter/Groq are
dead config and were pruned. No agentic tools, no shell/filesystem/DB access
for any model, no free-text user input forwarded to a model in this repo.

## Prompt-injection posture

Nothing to inject into here: the only model input is a fixed numeric schema,
and outputs are schema-validated before display. If the FastAPI service later
accepts free text, it must treat user content as untrusted data, keep secrets
out of prompts, and validate outputs the same way. Review that repo separately.

## Health safety

- Coaching UI is labelled "AI coaching" with a "not medical advice" line plus
  stop-on-pain/dizziness/chest-discomfort guidance (`live-workout.tsx`).
- Terms page carries the fitness/health disclaimer; signup health fields are
  optional and user-correctable.
- The model must never present as a doctor, diagnose, or encourage training
  through serious symptoms. Safety copy lives in UI + Terms, not in a prompt,
  so it holds even if the model misbehaves.

## Abuse controls

`/api/ai/summary` 10/min and `/api/ai/results` 30/min per user (LLM cost
lives behind the first). Failures return controlled errors (503 unconfigured,
502 unreachable/invalid shape).
