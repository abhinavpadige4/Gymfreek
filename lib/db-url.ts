export function normalizeDatabaseUrl(
  url: string | undefined,
): string | undefined {
  if (!url) return url;
  // ponytail: plain replace, use URL parsing if query handling gets complex
  return url.replace(/sslmode=(prefer|require|verify-ca)/g, "sslmode=verify-full");
}
