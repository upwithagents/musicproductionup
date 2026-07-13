import type { BandId } from "@/core/types";

export interface Range {
  min: number;
  max: number;
}

export interface ReferenceProfile {
  id: string;
  name: string;
  description: string;
  integratedLufs: Range;
  truePeakDbMax: number;
  loudnessRange: Range;
  bandShares: Record<BandId, Range>;
}

/**
 * Heuristic starting targets, not gospel — tuned for the first user
 * (live-band/salsa and vocal-centric material) plus common release goals.
 * Band shares are fractions of summed band energy.
 */
export const PROFILES: ReferenceProfile[] = [
  {
    id: "streaming-master",
    name: "Streaming master",
    description:
      "Release-ready master for Spotify/Apple (-14 LUFS normalization).",
    integratedLufs: { min: -15, max: -12.5 },
    truePeakDbMax: -1,
    loudnessRange: { min: 4, max: 9 },
    bandShares: {
      sub: { min: 0.03, max: 0.12 },
      bass: { min: 0.18, max: 0.34 },
      lowMid: { min: 0.12, max: 0.24 },
      mid: { min: 0.18, max: 0.32 },
      highMid: { min: 0.07, max: 0.16 },
      high: { min: 0.05, max: 0.14 },
      air: { min: 0.005, max: 0.05 },
    },
  },
  {
    id: "live-band",
    name: "Live band / salsa",
    description:
      "Full-band acoustic-leaning mix: horns, percussion, piano, bass, vocals.",
    integratedLufs: { min: -16, max: -13 },
    truePeakDbMax: -1,
    loudnessRange: { min: 6, max: 12 },
    bandShares: {
      sub: { min: 0.02, max: 0.08 },
      bass: { min: 0.16, max: 0.3 },
      lowMid: { min: 0.14, max: 0.26 },
      mid: { min: 0.2, max: 0.34 },
      highMid: { min: 0.08, max: 0.18 },
      high: { min: 0.06, max: 0.16 },
      air: { min: 0.005, max: 0.05 },
    },
  },
  {
    id: "vocal-pop",
    name: "Vocal pop",
    description: "Vocal-forward pop/singer-songwriter mix.",
    integratedLufs: { min: -15, max: -12 },
    truePeakDbMax: -1,
    loudnessRange: { min: 4, max: 8 },
    bandShares: {
      sub: { min: 0.02, max: 0.1 },
      bass: { min: 0.16, max: 0.3 },
      lowMid: { min: 0.12, max: 0.24 },
      mid: { min: 0.22, max: 0.36 },
      highMid: { min: 0.08, max: 0.18 },
      high: { min: 0.05, max: 0.14 },
      air: { min: 0.01, max: 0.06 },
    },
  },
  {
    id: "work-in-progress",
    name: "Work in progress",
    description:
      "Loose targets for rough mixes — only flags clear problems.",
    integratedLufs: { min: -24, max: -10 },
    truePeakDbMax: -0.3,
    loudnessRange: { min: 3, max: 15 },
    bandShares: {
      sub: { min: 0.0, max: 0.2 },
      bass: { min: 0.1, max: 0.4 },
      lowMid: { min: 0.08, max: 0.3 },
      mid: { min: 0.12, max: 0.4 },
      highMid: { min: 0.04, max: 0.24 },
      high: { min: 0.02, max: 0.2 },
      air: { min: 0.0, max: 0.1 },
    },
  },
];

export function getProfile(id: string): ReferenceProfile {
  const p = PROFILES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown reference profile: ${id}`);
  return p;
}
