import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: "./vitest.global-setup.ts",
    // db-backed test files share data/test.db — run files serially
    fileParallelism: false,
    env: { DATABASE_URL: "file:./data/test.db" },
    testTimeout: 30000, // analyzer tests shell out to ffmpeg
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
