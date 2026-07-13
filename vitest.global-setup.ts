import { execSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

export default function setup() {
  mkdirSync(path.resolve(__dirname, "data"), { recursive: true });
  rmSync(path.resolve(__dirname, "data/test.db"), { force: true });
  execSync("./node_modules/.bin/prisma db push", {
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: "file:./data/test.db" },
    stdio: "pipe",
  });
}
