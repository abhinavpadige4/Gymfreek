# 100XU Data Flow

## Request paths

- Pages: middleware verifies JWT (edge, signature only) -> server components
  query Postgres via Prisma -> render. Login/signup/terms/privacy/refunds/
  support are public; everything else redirects or 401s without a session.
- API: `requireApiUserId()` (or `requireAdminUserId()`) -> Zod body parse with
  byte cap -> rate limit -> ownership-scoped Prisma query -> safe JSON error
  on failure.
- Offline: sets queue in IndexedDB, `SyncBootstrap` flushes on mount,
  `pruneSyncedSets` removes confirmed rows.
- Payments: client creates order (server prices it) -> Razorpay hosted
  checkout -> client calls verify (signature + live amount check) AND/OR
  Razorpay calls webhook (HMAC, idempotent activate). Either path activates;
  duplicates are safe.
- AI coaching: browser posts numeric summary -> Next validates + rate-limits
  -> FastAPI over HTTPS+bearer -> Zod-validate response -> render with
  disclaimer. Video never leaves the device.

## Third parties

Neon Postgres (all data), Razorpay (payments), Vercel (hosting), YouTube/Vimeo
nocookie embeds (demo videos, admin-linked), Google Fonts. No analytics, no
ads, no trackers.

## Retention and deletion

Training data lives with the account; `DELETE /api/account` erases profile,
training, AI records, badges, uploads, enrollments, and local payment rows in
one transaction. Razorpay keeps authoritative transaction records. Camera data
is never persisted anywhere. See `docs/privacy.md` for the full inventory.
