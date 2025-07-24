const nextConfig = {
  // Remove mock Firebase env variables - they should only be in Jest setup
  // Real Firebase config should come from .env.local file
  
  webpack(config: { module: { rules: unknown[] } }) {
    // Add SVGR support for importing SVG as React components
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

module.exports = nextConfig;
