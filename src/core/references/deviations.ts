import { BAND_DEFS, type AnalysisMetrics } from "@/core/types";
import type { Range, ReferenceProfile } from "@/core/references/profiles";

export interface Deviation {
  metric: string; // "integratedLufs" | "truePeakDb" | "loudnessRange" | "band:<id>" | "stereoCorrelation"
  label: string;
  actual: number;
  targetMin?: number;
  targetMax?: number;
  direction: "above" | "below";
  severity: "high" | "medium" | "low";
  summary: string; // plain-language, used in UI and advisor prompt
}

export function distanceToRange(value: number, r: Range): number {
  if (value < r.min) return r.min - value;
  if (value > r.max) return value - r.max;
  return 0;
}

function severityByDistance(
  distance: number,
  medium: number,
  high: number,
): "high" | "medium" | "low" {
  if (distance >= high) return "high";
  if (distance >= medium) return "medium";
  return "low";
}

function rangeDeviation(
  metric: string,
  label: string,
  actual: number,
  r: Range,
  unit: string,
  medium: number,
  high: number,
): Deviation | null {
  const distance = distanceToRange(actual, r);
  if (distance === 0) return null;
  const direction = actual > r.max ? "above" : "below";
  return {
    metric,
    label,
    actual,
    targetMin: r.min,
    targetMax: r.max,
    direction,
    severity: severityByDistance(distance, medium, high),
    summary: `${label} is ${actual.toFixed(2)}${unit}, ${direction} the target ${r.min}${unit} to ${r.max}${unit}.`,
  };
}

export function computeDeviations(
  metrics: AnalysisMetrics,
  profile: ReferenceProfile,
): Deviation[] {
  const out: Deviation[] = [];

  const lufs = rangeDeviation(
    "integratedLufs", "Integrated loudness", metrics.integratedLufs,
    profile.integratedLufs, " LUFS", 1.5, 3,
  );
  if (lufs) out.push(lufs);

  if (metrics.truePeakDb > profile.truePeakDbMax) {
    const over = metrics.truePeakDb - profile.truePeakDbMax;
    out.push({
      metric: "truePeakDb",
      label: "True peak",
      actual: metrics.truePeakDb,
      targetMax: profile.truePeakDbMax,
      direction: "above",
      severity: over >= 0.5 ? "high" : "medium",
      summary: `True peak is ${metrics.truePeakDb.toFixed(2)} dBTP, above the ${profile.truePeakDbMax} dBTP ceiling — risk of clipping/distortion after encoding.`,
    });
  }

  const lra = rangeDeviation(
    "loudnessRange", "Loudness range", metrics.loudnessRange,
    profile.loudnessRange, " LU", 2, 4,
  );
  if (lra) out.push(lra);

  for (const band of BAND_DEFS) {
    const dev = rangeDeviation(
      `band:${band.id}`,
      `${band.label} (${band.lowHz}–${band.highHz} Hz)`,
      metrics.bandShares[band.id],
      profile.bandShares[band.id],
      "", 0.04, 0.09,
    );
    if (dev) out.push(dev);
  }

  if (metrics.stereoCorrelation !== null && metrics.stereoCorrelation < 0.2) {
    const c = metrics.stereoCorrelation;
    out.push({
      metric: "stereoCorrelation",
      label: "Stereo correlation",
      actual: c,
      targetMin: 0.2,
      direction: "below",
      severity: c < 0 ? "high" : "medium",
      summary: `Stereo correlation is ${c.toFixed(2)} — ${c < 0 ? "out-of-phase content will cancel in mono" : "very wide/loose stereo image, check mono compatibility"}.`,
    });
  }

  return out;
}
