import { describe, expect, test } from "vitest";
import { fixturePath } from "@/core/analyzer/fixtures";
import { measureStats } from "@/core/analyzer/stats";

describe("measureStats", () => {
  test("sine has ~3 dB crest (peak/rms) and sane levels", async () => {
    const m = await measureStats(fixturePath("sine1k"));
    expect(m.peakDb).toBeLessThanOrEqual(0.1);
    expect(m.rmsDb).toBeLessThan(m.peakDb);
    expect(m.crestDb).toBeGreaterThan(1);
    expect(m.crestDb).toBeLessThan(6);
  });

  test("pink noise has higher crest than a sine", async () => {
    const sine = await measureStats(fixturePath("sine1k"));
    const pink = await measureStats(fixturePath("pink"));
    expect(pink.crestDb).toBeGreaterThan(sine.crestDb);
  });
});
