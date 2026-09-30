// PWA via @ducanh2912/next-pwa (the maintained successor to next-pwa, which
// did not support Next 15). Same NetworkFirst/CacheFirst strategy as before;
// the workbox-level options (runtimeCaching, buildExcludes, skipWaiting) now
// live under workboxOptions.
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  // Disabled in dev to avoid aggressive caching during hot-reload.
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Do not pre-cache API routes: too volatile and auth-dependent.
    exclude: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
    runtimeCaching: [
      {
        // App pages: NetworkFirst, fall back to cache when offline.
        urlPattern: ({ request, url }) =>
          request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages',
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      {
        // GET API: NetworkFirst (programs, sessions, exercises change over time).
        urlPattern: ({ url, request }) =>
          url.pathname.startsWith('/api/') && request.method === 'GET',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-get',
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        // Static assets: CacheFirst (long-lived).
        urlPattern: ({ url }) =>
          url.pathname.startsWith('/_next/static/') ||
          /\.(?:png|svg|webp|ico|woff2?)$/.test(url.pathname),
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
});
const withNextIntl = require('next-intl/plugin')('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Baseline hardening headers. No full-enforce CSP: Razorpay checkout,
  // YouTube/Vimeo embeds and the PWA worker need scripts from allowlisted
  // third parties, so CSP ships report-only until those sources are pinned.
  async headers() {
    // HSTS only in production: sending it from localhost/dev would pin
    // HTTPS on a loopback origin in the browser.
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(self), geolocation=()',
      },
      {
        key: 'Content-Security-Policy-Report-Only',
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' checkout.razorpay.com api.razorpay.com; frame-src checkout.razorpay.com www.youtube-nocookie.com player.vimeo.com; object-src 'none'; base-uri 'self'; form-action 'self'",
      },
    ];
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains',
      });
    }
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = withPWA(withNextIntl(nextConfig));
