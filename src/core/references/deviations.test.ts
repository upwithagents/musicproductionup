import { describe, expect, test } from "vitest";
import type { AnalysisMetrics } from "@/core/types";
import { getProfile } from "@/core/references/profiles";
import {
  computeDeviations,
  distanceToRange,
} from "@/core/references/deviations";

const inRange: AnalysisMetrics = {
  durationSec: 200,
  sampleRate: 44100,
  channels: 2,
  integratedLufs: -14,
  loudnessRange: 6,
  truePeakDb: -1.5,
  rmsDb: -18,
  peakDb: -2,
  crestDb: 16,
  bandShares: {
    sub: 0.06, bass: 0.26, lowMid: 0.18, mid: 0.26,
    highMid: 0.12, high: 0.09, air: 0.03,
  },
  stereoCorrelation: 0.6,
};

describe("distanceToRange", () => {
  test("inside range is 0", () => {
    expect(distanceToRange(5, { min: 4, max: 9 })).toBe(0);
  });
  test("below range is positive distance", () => {
    expect(distanceToRange(2, { min: 4, max: 9 })).toBe(2);
  });
  test("above range is positive distance", () => {
    expect(distanceToRange(12, { min: 4, max: 9 })).toBe(3);
  });
});

describe("computeDeviations", () => {
  const profile = getProfile("streaming-master");

  test("in-range metrics produce no deviations", () => {
    expect(computeDeviations(inRange, profile)).toEqual([]);
  });

  test("quiet master flags loudness below target, severity high", () => {
    const d = computeDeviations(
      { ...inRange, integratedLufs: -20 },
      profile,
    );
    const lufs = d.find((x) => x.metric === "integratedLufs");
    expect(lufs?.direction).toBe("below");
    expect(lufs?.severity).toBe("high");
  });

  test("hot true peak flags above target, severity high", () => {
    const d = computeDeviations({ ...inRange, truePeakDb: 0.2 }, profile);
    const tp = d.find((x) => x.metric === "truePeakDb");
    expect(tp?.direction).toBe("above");
    expect(tp?.severity).toBe("high");
  });

  test("band share outside range is flagged with band metric name", () => {
    const d = computeDeviations(
      {
        ...inRange,
        bandShares: { ...inRange.bandShares, air: 0.12, high: 0.0 },
      },
      profile,
    );
    expect(d.some((x) => x.metric === "band:air" && x.direction === "above")).toBe(true);
    expect(d.some((x) => x.metric === "band:high" && x.direction === "below")).toBe(true);
  });

  test("negative correlation flags phase problem", () => {
    const d = computeDeviations(
      { ...inRange, stereoCorrelation: -0.5 },
      profile,
    );
    expect(d.some((x) => x.metric === "stereoCorrelation" && x.severity === "high")).toBe(true);
  });

  test("mono (null correlation) is not flagged", () => {
    const d = computeDeviations(
      { ...inRange, stereoCorrelation: null },
      profile,
    );
    expect(d.some((x) => x.metric === "stereoCorrelation")).toBe(false);
  });
});
