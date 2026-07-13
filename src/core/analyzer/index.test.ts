import { mkdtempSync } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { fixturePath } from "@/core/analyzer/fixtures";
import { analyzeTrack } from "@/core/analyzer";

describe("analyzeTrack", () => {
  test("produces full metrics and both images for a fixture", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mpu-img-"));
    const r = await analyzeTrack(fixturePath("pink"), dir);
    expect(r.metrics.durationSec).toBeGreaterThan(2);
    expect(r.metrics.sampleRate).toBe(44100);
    expect(Number.isFinite(r.metrics.integratedLufs)).toBe(true);
    expect(r.metrics.crestDb).toBeGreaterThan(0);
    const shareSum = Object.values(r.metrics.bandShares).reduce(
      (a, b) => a + b, 0,
    );
    expect(shareSum).toBeGreaterThan(0.99);
    expect(existsSync(r.waveformPath)).toBe(true);
    expect(existsSync(r.spectrogramPath)).toBe(true);
  });

  test("rejects a non-audio file with InvalidAudioError", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mpu-img-"));
    await expect(
      analyzeTrack(fixturePath("notaudio"), dir),
    ).rejects.toMatchObject({ name: "InvalidAudioError" });
  });
});
