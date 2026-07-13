import type { NextConfig } from "next";

// Single source of truth for the basePath: the portal proxies
// /musicproductionup/* to this app, and NEXT_PUBLIC_BASE_PATH lets
// client/server code prefix raw fetch/<a>/<img> URLs that Next does not
// rewrite automatically.
const BASE_PATH = "/musicproductionup";

const nextConfig: NextConfig = {
  // Pin the project root: sibling lockfiles in the multi-repo workspace
  // otherwise make Next infer the wrong root for build artifacts.
  turbopack: { root: __dirname },
  basePath: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
};

export default nextConfig;
