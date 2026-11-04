/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
    agentUpgrade: 'security',
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  outputFileTracingIncludes: {
    '/**': ['./prisma/sqlite.db', './sqlite.db'],
  },
  async redirects() {
    return [
      {
        source: '/usuarios',
        destination: '/users',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
