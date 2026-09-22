# Security Policy

## Reporting a vulnerability

Please do not open a public issue for security problems. Instead, use GitHub's
private vulnerability reporting ("Report a vulnerability" in the Security tab),
or contact the maintainers privately. We will acknowledge the report and work
on a fix as quickly as we reasonably can.

## Scope and notes

100XU is self-hosted. Operators are responsible for:

- Setting a strong, unique `JWT_SECRET` (at least 32 characters).
- Keeping their LLM provider API key (`OPENROUTER_API_KEY`, with `GROQ_API_KEY`
  as fallback) secret. Note that the AI coach sends the user's
  training data to the configured provider.
- Running the app behind HTTPS (a reverse proxy such as Nginx, Caddy or
  Traefik) in production.
- Keeping dependencies up to date (`npm audit`).
