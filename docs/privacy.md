# 100XU Privacy - Data Inventory

## Categories

| Data | Why | Where | Who | Retention | Delete | Third party |
|------|-----|-------|-----|-----------|--------|-------------|
| Email, password hash, name | Account | Postgres `User` | Owner, admin view | Account life | Account delete | No |
| Body metrics, goal, experience, health notes | Tailor coaching/rest | Postgres `User` | Owner | Account life | Account delete / edit | No |
| Programs, sessions, sets, measurements | Training history | Postgres | Owner | Account life | Account delete / per-row | No |
| Challenge enrollments, badges | Century challenge | Postgres | Owner | Account life | Account delete | No |
| Profile photo, equipment images | Profile, gym inventory | Postgres bytes | Owner (+ admin photo view) | Account life | Account delete / per-row | No |
| Payment IDs, amount, status | Enrollment activation | Postgres + Razorpay | Owner, admin | Razorpay retains per financial law | Local rows on account delete | Razorpay |
| Workout summaries (reps, scores) | AI coaching | Postgres + FastAPI request | Owner | Account life | Account delete | FastAPI AI service |
| Session cookie, locale, theme, voice pref | Login, prefs | Cookie / localStorage | Device only | Session / until cleared | Logout / clear | No |
| Offline sets queue | Offline training | IndexedDB (device) | Device only | Until synced | Pruned after sync | No |
| Camera frames, replays | Live form checks | Device memory/blob only | Device only | Never stored | Discard button | No |

## Never collected

Card numbers, CVV, bank credentials (Razorpay hosted checkout). Microphone
audio (voice coaching is synthesis output only). Analytics/advertising
identifiers (no tracking SDKs installed).

## User rights

Export: Settings -> Backup (JSON). Delete: per-row controls, photo removal,
or full erase via Settings -> Delete account (`DELETE /api/account`, email
confirmation). Privacy questions: `[CONTACT EMAIL]`.
