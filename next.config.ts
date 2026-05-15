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
    ].filter((v): v is string => Boolean(v)),
  ),
);

const nextConfig = {
  // Exclude firebase-admin from client-side webpack bundling.
  // It's a Node.js-only package used in API routes only.
  serverExternalPackages: ['firebase-admin'],
  images: {
    remotePatterns: firebaseStorageHosts.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
      pathname: '/**',
    })),
  },
};

module.exports = nextConfig;
