/**
 * Fixture playground: synthesizes all test WAVs into data/fixtures/ and
 * prints their paths, so you can exercise the app without touching real
 * recordings. Run: npx tsx scripts/make-fixture.ts
 */
import { fixturePath, type FixtureName } from "../src/core/analyzer/fixtures";

const names: FixtureName[] = [
  "sine1k",
  "sine100",
  "pink",
  "clipped",
  "outofphase",
  "dualmono",
  "mono",
];

for (const name of names) {
  console.log(`${name.padEnd(12)} ${fixturePath(name)}`);
}
