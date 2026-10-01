/** @type {import('next').NextConfig} */
// Static export: the Capacitor Android/iOS shells load the generated ./out directory.
// All dynamic data is fetched client-side from the FastAPI backend (NEXT_PUBLIC_API_URL).
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
}

module.exports = nextConfig
