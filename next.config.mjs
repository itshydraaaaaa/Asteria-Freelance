/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:5000',
        process.env.REPLIT_DEV_DOMAIN ?? '',
      ].filter(Boolean),
    },
  },
}

export default config
