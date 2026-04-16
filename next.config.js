/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

/**
 * NextAuth uses NEXTAUTH_URL for CSRF and callbacks. When developers keep a
 * production URL in `.env` but run `next dev` on localhost, sign-in and
 * `/api/*` session cookies break (401 / "failed to load" on dashboards).
 * In development, force an origin that matches the dev server (see `npm run dev` port).
 */
if (process.env.NODE_ENV === "development") {
  const devOrigin =
    process.env.NEXTAUTH_URL_DEV || "http://localhost:3000";
  process.env.NEXTAUTH_URL = devOrigin;
}

module.exports = nextConfig;

