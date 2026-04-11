const nextConfig = {
  // Exclude firebase-admin from client-side webpack bundling.
  // It's a Node.js-only package used in API routes only.
  serverExternalPackages: ['firebase-admin'],
};

module.exports = nextConfig;
