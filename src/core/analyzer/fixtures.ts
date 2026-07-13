import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const FIXTURE_DIR = path.resolve(process.cwd(), "data/fixtures");

const RECIPES = {
  // 3s mono-ish stereo test tones at 44.1k
  sine1k: ["-f", "lavfi", "-i", "sine=frequency=1000:duration=3", "-ac", "2", "-ar", "44100"],
  sine100: ["-f", "lavfi", "-i", "sine=frequency=100:duration=3", "-ac", "2", "-ar", "44100"],
  pink: ["-f", "lavfi", "-i", "anoisesrc=colour=pink:duration=3:amplitude=0.5", "-ac", "2", "-ar", "44100"],
  // drive a sine hard into 16-bit clipping.
  // ffmpeg 7.1's lavfi `sine` source has no `amplitude` option and defaults
  // to a peak around -18 dBFS (not full scale), so +12dB alone never clips —
  // measured true peak stayed at -9.1 dBFS. +24dB reliably saturates to
  // ~0.1 dBFS true peak.
  clipped: ["-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-af", "volume=24dB", "-ac", "2", "-ar", "44100"],
  // right channel = polarity-inverted left → correlation ≈ -1.
  // The asplit+aeval+join chain from the original design fails on ffmpeg
  // 7.1 ("Cannot select channel layout for the link between filters
  // auto_aresample_2 and Parsed_join_2" — aeval's output drops channel
  // layout metadata that join requires). `pan` builds the stereo pair
  // directly from the mono source without that intermediate step.
  outofphase: ["-f", "lavfi", "-i", "sine=frequency=440:duration=3",
    "-af", "pan=stereo|c0=c0|c1=-1*c0",
    "-ar", "44100"],
  // identical channels → correlation ≈ +1
  dualmono: ["-f", "lavfi", "-i", "sine=frequency=440:duration=3",
    "-af", "pan=stereo|c0=c0|c1=c0",
    "-ar", "44100"],
  mono: ["-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-ac", "1", "-ar", "44100"],
} satisfies Record<string, string[]>;

export type FixtureName = keyof typeof RECIPES | "notaudio";

export function fixturePath(name: FixtureName): string {
  mkdirSync(FIXTURE_DIR, { recursive: true });
  if (name === "notaudio") {
    const p = path.join(FIXTURE_DIR, "notaudio.wav");
    if (!existsSync(p)) writeFileSync(p, "this is not audio at all");
    return p;
  }
  const p = path.join(FIXTURE_DIR, `${name}.wav`);
  if (!existsSync(p)) {
    execFileSync("ffmpeg", ["-y", ...RECIPES[name], p], { stdio: "pipe" });
  }
  return p;
}
