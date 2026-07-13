export const BAND_DEFS = [
  { id: "sub", label: "Sub", lowHz: 20, highHz: 60 },
  { id: "bass", label: "Bass", lowHz: 60, highHz: 250 },
  { id: "lowMid", label: "Low mids", lowHz: 250, highHz: 500 },
  { id: "mid", label: "Mids", lowHz: 500, highHz: 2000 },
  { id: "highMid", label: "High mids", lowHz: 2000, highHz: 4000 },
  { id: "high", label: "Highs", lowHz: 4000, highHz: 10000 },
  { id: "air", label: "Air", lowHz: 10000, highHz: 20000 },
] as const;

export type BandId = (typeof BAND_DEFS)[number]["id"];

export interface AnalysisMetrics {
  durationSec: number;
  sampleRate: number;
  channels: number;
  integratedLufs: number; // EBU R128 I
  loudnessRange: number; // EBU R128 LRA (LU)
  truePeakDb: number; // dBTP
  rmsDb: number; // overall RMS level dB
  peakDb: number; // overall sample peak dB
  crestDb: number; // peakDb - rmsDb
  bandShares: Record<BandId, number>; // share of total band energy, sums to ~1
  stereoCorrelation: number | null; // -1..1, null for mono sources
}

export interface AdviceStep {
  area: "mixing" | "mastering";
  issue: string;
  why: string;
  how: string; // DAW-agnostic, concrete
  severity: "high" | "medium" | "low";
}
