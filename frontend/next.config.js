/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/minigame/Management',
        destination: '/minigame/management',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
