import { describe, expect, test } from "vitest";
import type { AnalysisMetrics } from "@/core/types";
import { getProfile } from "@/core/references/profiles";
import { computeDeviations } from "@/core/references/deviations";
import { generateSteps } from "@/core/advisor/advise";

const metrics: AnalysisMetrics = {
  durationSec: 200, sampleRate: 44100, channels: 2,
  integratedLufs: -19.5, loudnessRange: 6, truePeakDb: 0.1,
  rmsDb: -22, peakDb: -1, crestDb: 21,
  bandShares: {
    sub: 0.02, bass: 0.2, lowMid: 0.2, mid: 0.3,
    highMid: 0.14, high: 0.11, air: 0.03,
  },
  stereoCorrelation: 0.5,
};
const profile = getProfile("streaming-master");
const input = {
  metrics,
  deviations: computeDeviations(metrics, profile),
  profile,
  notes: "vocals feel buried",
};

const validStep = {
  area: "mastering",
  issue: "Master is 5 LU quieter than streaming target",
  why: "Platforms normalize to -14 LUFS; quieter masters sound weak next to references",
  how: "Add a limiter on the master bus and raise gain until integrated loudness reads about -14 LUFS",
  severity: "high",
};

describe("generateSteps", () => {
  test("parses a clean JSON array response", async () => {
    const r = await generateSteps(input, async () =>
      JSON.stringify([validStep]),
    );
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0].area).toBe("mastering");
    expect(r.dropped).toBe(0);
  });

  test("parses JSON wrapped in a code fence and prose", async () => {
    const r = await generateSteps(
      input,
      async () =>
        "Here you go:\n```json\n" + JSON.stringify([validStep]) + "\n```",
    );
    expect(r.steps).toHaveLength(1);
  });

  test("drops schema-invalid items but keeps valid ones", async () => {
    const r = await generateSteps(input, async () =>
      JSON.stringify([
        validStep,
        { area: "guessing", issue: "x", why: "y", how: "z", severity: "high" },
        { area: "mixing", issue: "", why: "y", how: "z", severity: "low" },
      ]),
    );
    expect(r.steps).toHaveLength(1);
    expect(r.dropped).toBe(2);
  });

  test("rejects when no JSON array is present", async () => {
    await expect(
      generateSteps(input, async () => "I cannot help with that."),
    ).rejects.toThrow(/no JSON array/i);
  });

  test("prompt contains measurements and notes, and forbids raw audio expectations", async () => {
    let seen = "";
    await generateSteps(input, async (p) => {
      seen = p;
      return JSON.stringify([validStep]);
    });
    expect(seen).toContain("-19.5");
    expect(seen).toContain("vocals feel buried");
    expect(seen).toContain("Streaming master");
  });
});
