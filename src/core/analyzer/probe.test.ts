import { describe, expect, test } from "vitest";
import { fixturePath } from "@/core/analyzer/fixtures";
import { probe } from "@/core/analyzer/probe";

describe("probe", () => {
  test("reads duration, sample rate, channels from a wav", async () => {
    const info = await probe(fixturePath("sine1k"));
    expect(info.durationSec).toBeGreaterThan(2.5);
    expect(info.durationSec).toBeLessThan(3.5);
    expect(info.sampleRate).toBe(44100);
    expect(info.channels).toBe(2);
    expect(info.codec).toContain("pcm");
  });

  test("rejects a non-audio file", async () => {
    await expect(probe(fixturePath("notaudio"))).rejects.toThrow(
      /not.*valid audio/i,
    );
  });
});
