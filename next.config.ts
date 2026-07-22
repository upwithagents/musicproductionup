import type { NextConfig } from "next";

// Single source of truth for the basePath: the portal proxies
// /musicproductionup/* to this app, and NEXT_PUBLIC_BASE_PATH lets
// client/server code prefix raw fetch/<a>/<img> URLs that Next does not
// rewrite automatically.
const BASE_PATH = "/musicproductionup";

const nextConfig: NextConfig = {
  // better-sqlite3's native addon locates itself via V8 stack traces,
  // which breaks under `next dev --webpack`'s rewritten require calls -
  // externalizing it (and the Prisma driver adapter that loads it) skips
  // webpack bundling entirely so the normal Node require path is used.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Pin the project root: sibling lockfiles in the multi-repo workspace
  // otherwise make Next infer the wrong root for build artifacts.
  turbopack: { root: __dirname },
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
};

export default nextConfig;
