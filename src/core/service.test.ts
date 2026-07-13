import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { prisma } from "@/core/db";
import { fixturePath } from "@/core/analyzer/fixtures";
import type { AnalysisMetrics } from "@/core/types";
import {
  compareTracks,
  createProject,
  generateAdvice,
  getProjectDetail,
  getTrackDetail,
  runAnalysis,
  saveUpload,
} from "@/core/service";

const wavBytes = () => readFileSync(fixturePath("sine1k"));

async function makeProject() {
  return createProject("Test Song", "streaming-master");
}

describe("projects and uploads", () => {
  test("createProject rejects unknown profile", async () => {
    await expect(createProject("X", "nope")).rejects.toThrow(/profile/i);
  });

  test("saveUpload stores file, assigns version 1 then 2", async () => {
    const p = await makeProject();
    const t1 = await saveUpload(p.id, "mix v1.wav", wavBytes());
    const t2 = await saveUpload(p.id, "mix v2.wav", wavBytes());
    expect(t1.version).toBe(1);
    expect(t2.version).toBe(2);
    expect(t1.format).toBe("wav");
    const detail = await getProjectDetail(p.id);
    expect(detail?.tracks).toHaveLength(2);
    expect(detail?.tracks[0].analysis?.status).toBe("running");
  });

  test("saveUpload rejects unsupported extension", async () => {
    const p = await makeProject();
    await expect(
      saveUpload(p.id, "song.ogg", wavBytes()),
    ).rejects.toMatchObject({ reason: "bad_format" });
  });

  test("saveUpload rejects oversized payloads", async () => {
    const p = await makeProject();
    const big = { length: 501 * 1024 * 1024 } as Buffer; // size check only reads .length
    await expect(
      saveUpload(p.id, "big.wav", big),
    ).rejects.toMatchObject({ reason: "too_large" });
  });
});

describe("analysis lifecycle", () => {
  test("runAnalysis completes with metrics for a real fixture", async () => {
    const p = await makeProject();
    const t = await saveUpload(p.id, "mix.wav", wavBytes());
    await runAnalysis(t.id);
    const detail = await getTrackDetail(t.id);
    expect(detail?.analysis?.status).toBe("completed");
    const metrics = JSON.parse(detail!.analysis!.metrics!) as AnalysisMetrics;
    expect(metrics.bandShares.mid).toBeGreaterThan(0.8);
    expect(detail?.durationSec).toBeGreaterThan(2);
  });

  test("runAnalysis records failure for a corrupt file", async () => {
    const p = await makeProject();
    const t = await saveUpload(p.id, "bad.wav", Buffer.from("not audio"));
    await runAnalysis(t.id);
    const detail = await getTrackDetail(t.id);
    expect(detail?.analysis?.status).toBe("failed");
    expect(detail?.analysis?.error).toMatch(/not a valid audio/i);
  });
});

describe("advice", () => {
  test("generateAdvice stores validated steps from the LLM", async () => {
    const p = await makeProject();
    const t = await saveUpload(p.id, "mix.wav", wavBytes());
    await runAnalysis(t.id);
    const advice = await generateAdvice(t.id, "louder please", async () =>
      JSON.stringify([
        {
          area: "mastering", issue: "i", why: "w", how: "h", severity: "high",
        },
      ]),
    );
    expect(JSON.parse(advice.steps)).toHaveLength(1);
    expect(advice.notes).toBe("louder please");
  });

  test("generateAdvice refuses when analysis is not completed", async () => {
    const p = await makeProject();
    const t = await saveUpload(p.id, "mix.wav", wavBytes());
    await expect(
      generateAdvice(t.id, "", async () => "[]"),
    ).rejects.toThrow(/analysis/i);
  });
});

describe("compareTracks", () => {
  test("marks a metric moving into range as improved", async () => {
    const p = await makeProject();
    const t1 = await saveUpload(p.id, "v1.wav", wavBytes());
    const t2 = await saveUpload(p.id, "v2.wav", wavBytes());
    await runAnalysis(t1.id);
    await runAnalysis(t2.id);
    // overwrite metrics for a deterministic scenario: v1 too quiet, v2 on target
    const detail1 = await getTrackDetail(t1.id);
    const m = JSON.parse(detail1!.analysis!.metrics!) as AnalysisMetrics;
    await prisma.analysis.update({
      where: { trackId: t1.id },
      data: { metrics: JSON.stringify({ ...m, integratedLufs: -20 }) },
    });
    await prisma.analysis.update({
      where: { trackId: t2.id },
      data: { metrics: JSON.stringify({ ...m, integratedLufs: -14 }) },
    });
    const rows = await compareTracks(t1.id, t2.id);
    const lufs = rows.find((r) => r.key === "integratedLufs");
    expect(lufs?.verdict).toBe("improved");
    expect(rows.some((r) => r.key.startsWith("band:"))).toBe(true);
  });
});
