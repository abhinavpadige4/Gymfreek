# 100XU Security

Architecture: Next.js 15 App Router + Prisma + Postgres (Neon). JWT session in
an httpOnly + SameSite=Lax cookie (Secure in production). No WebSockets, no
custom CORS, no server-side fetch of user URLs, no `dangerouslySetInnerHTML`.

## Trust boundaries

Browser (untrusted) -> middleware (JWT verify, edge) -> API routes (auth +
Zod + rate limit + ownership checks) -> Postgres. Razorpay calls
`/api/payments/webhook` with no cookie; it authenticates by HMAC signature.
The FastAPI AI service is a separate deploy reached over HTTPS + bearer token.

## Controls

- Auth: bcrypt cost 10, 8-char minimum, generic login errors (no enumeration),
  login 10/min and register 5/min per IP with Retry-After.
- Rate limits per user: AI summary 10/min, AI results 30/min, payment
  order/verify 10/min, imports 10/min, backup export 10/min, backup import
  5/min, photo upload 10/min, account deletion 3/min. Webhook 120/min per IP.
  In-memory fixed window (single process; use Redis for multi-instance).
- Input: every API body parsed through Zod (`lib/schemas/*`) with streamed
  byte caps (`readBodyBytesWithCap`) - no uncapped `req.json()` on upload paths.
- Ownership: every protected route scopes by session userId; admin routes use
  `requireAdminUserId()` (role or `ADMIN_EMAILS` fallback). Cross-user photo
  view is admin-only.
- Payments: price comes from the Challenge row, never the client. Verify checks
  signature AND live amount/currency/status from Razorpay. Webhook verifies
  HMAC, is idempotent, logs order/payment/event.
- Uploads: JPEG/PNG/WebP only, size caps, magic-byte signature match (profile
  photo + gym equipment). Media served with `nosniff`, `private` cache.
- Headers: nosniff, strict Referrer-Policy, SAMEORIGIN framing,
  Permissions-Policy (camera/mic self only), CSP report-only, HSTS in prod.
- Errors: `handleApiError` returns safe messages; details stay server-side.
- Consent: unchecked Terms checkbox at signup, versions + timestamp stored
  (`termsVersion`, `privacyVersion`, `consentedAt`).
- Deletion: `DELETE /api/account` (email confirmation, ordered erase,
  session cookie cleared). Payment records survive only at Razorpay.

## Checklist (internal posture, not an endpoint)

Authentication PASS | Authorization PASS | Rate limiting PASS |
Input validation PASS | XSS PASS (no raw HTML) | SQL injection PASS (ORM only) |
CSRF PASS (SameSite=Lax, no cross-site flows) | CORS PASS (same-origin) |
Security headers PASS | Secrets PASS (none in code) |
AI prompt injection N/A (structured numeric payloads only) |
AI output validation PASS (Zod) | File uploads PASS | WebSocket N/A (none) |
Payment security PASS | Webhook security PASS | Privacy controls PASS |
Data deletion PASS | Logging INFO (console, no PII) |
Dependencies PASS (`npm audit` in gate) | Production config MANUAL (see below)

## Remaining manual steps

`JWT_SECRET` (32+ chars), `DATABASE_URL`, Razorpay keys + webhook secret,
`ADMIN_EMAILS`, `AI_SERVICE_URL/TOKEN`, legal placeholders (`NEXT_PUBLIC_LEGAL_*`),
`ALLOW_DEMO_PAYMENTS` unset in prod, HTTPS + `SESSION_COOKIE_SECURE` default.
Needs human review: Terms/Privacy wording (placeholders), pen test, backups.
