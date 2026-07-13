import { describe, expect, test } from "vitest";
import { fixturePath } from "@/core/analyzer/fixtures";
import { measureLoudness } from "@/core/analyzer/loudness";

describe("measureLoudness", () => {
  test("returns finite EBU R128 numbers for pink noise", async () => {
    const m = await measureLoudness(fixturePath("pink"));
    expect(Number.isFinite(m.integratedLufs)).toBe(true);
    expect(m.integratedLufs).toBeLessThan(0);
    expect(m.integratedLufs).toBeGreaterThan(-40);
    expect(m.loudnessRange).toBeGreaterThanOrEqual(0);
    expect(m.truePeakDb).toBeLessThanOrEqual(1);
  });

  test("clipped audio true-peaks at/above 0 dBTP", async () => {
    const m = await measureLoudness(fixturePath("clipped"));
    expect(m.truePeakDb).toBeGreaterThanOrEqual(-0.3);
  });
});
