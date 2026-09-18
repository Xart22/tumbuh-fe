import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/aida/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/aida-public/**',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Sourcemap upload stays off until SENTRY_ORG/PROJECT/AUTH_TOKEN exist;
  // error reporting via DSN works without them.
  sourcemaps: { disable: true },
  silent: true,
  telemetry: false,
});
