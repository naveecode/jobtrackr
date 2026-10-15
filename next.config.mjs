const demo = process.env.NEXT_PUBLIC_DEMO === "1";
const demoExport = process.env.DEMO_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { dirs: ["src"] },
  // Server routes use the `.server.ts(x)` extension so the static demo export
  // can omit them. Auth.js, Prisma, and server actions cannot ship to GitHub Pages.
  pageExtensions: demo
    ? ["tsx", "ts", "jsx", "js"]
    : ["tsx", "ts", "jsx", "js", "server.tsx", "server.ts"],
  ...(demoExport
    ? {
        output: "export",
        basePath: "/jobtrackr",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
