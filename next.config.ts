const withSerwistInit = require('@serwist/next').default;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

// Firebase Storage host varies by bucket. Allow both default and configured
// bucket so next/image is happy with `getDownloadURL` outputs whether the
// bucket is `<project>.appspot.com` or a custom one.
const firebaseStorageHosts = Array.from(
  new Set(
    [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      projectId ? `${projectId}.firebasestorage.app` : null,
      storageBucket ? storageBucket : null,
    ].filter((v) => Boolean(v)),
  ),
);

const nextConfig = {
  // Exclude firebase-admin from client-side webpack bundling.
  // It's a Node.js-only package used in API routes only.
  serverExternalPackages: ['firebase-admin'],
  images: {
    remotePatterns: firebaseStorageHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
      pathname: '/**',
    })),
  },
  async headers() {
    return [
      {
        // Belt-and-braces: keep /sw.js uncacheable at the edge so a new
        // deploy is picked up on the next page visit. Audit note S7.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

// Phase 3 — Serwist PWA shell. SW is generated from src/app/sw.ts and emitted
// to public/sw.js. Disabled in dev so HMR isn't tripped by a stale SW.
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withSerwist(nextConfig);
