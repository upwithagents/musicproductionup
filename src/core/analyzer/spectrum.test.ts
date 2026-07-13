import { describe, expect, test } from "vitest";
import { fixturePath } from "@/core/analyzer/fixtures";
import { analyzeSpectrum } from "@/core/analyzer/spectrum";

describe("analyzeSpectrum", () => {
  test("1 kHz sine concentrates energy in the mid band", async () => {
    const s = await analyzeSpectrum(fixturePath("sine1k"), 2);
    expect(s.bandShares.mid).toBeGreaterThan(0.8);
  });

  test("100 Hz sine concentrates energy in the bass band", async () => {
    const s = await analyzeSpectrum(fixturePath("sine100"), 2);
    expect(s.bandShares.bass).toBeGreaterThan(0.8);
  });

  test("band shares sum to ~1", async () => {
    const s = await analyzeSpectrum(fixturePath("pink"), 2);
    const sum = Object.values(s.bandShares).reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0.99);
    expect(sum).toBeLessThan(1.01);
  });

  test("dual-mono correlates near +1", async () => {
    const s = await analyzeSpectrum(fixturePath("dualmono"), 2);
    expect(s.stereoCorrelation).toBeGreaterThan(0.95);
  });

  test("polarity-inverted right channel correlates near -1", async () => {
    const s = await analyzeSpectrum(fixturePath("outofphase"), 2);
    expect(s.stereoCorrelation).toBeLessThan(-0.95);
  });

  test("mono source reports null correlation", async () => {
    const s = await analyzeSpectrum(fixturePath("mono"), 1);
    expect(s.stereoCorrelation).toBeNull();
  });
});
