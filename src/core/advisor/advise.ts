import { BAND_DEFS, type AdviceStep, type AnalysisMetrics } from "@/core/types";
import type { Deviation } from "@/core/references/deviations";
import type { ReferenceProfile } from "@/core/references/profiles";
import type { LlmComplete } from "@/core/advisor/llm";

export interface AdviceInput {
  metrics: AnalysisMetrics;
  deviations: Deviation[];
  profile: ReferenceProfile;
  notes: string;
}

export function buildPrompt(input: AdviceInput): string {
  const { metrics, deviations, profile, notes } = input;
  const bands = BAND_DEFS.map(
    (b) =>
      `- ${b.label} (${b.lowHz}-${b.highHz} Hz): ${(metrics.bandShares[b.id] * 100).toFixed(1)}% (target ${(profile.bandShares[b.id].min * 100).toFixed(0)}-${(profile.bandShares[b.id].max * 100).toFixed(0)}%)`,
  ).join("\n");
  const devs =
    deviations.length === 0
      ? "None — the mix is within all profile targets."
      : deviations.map((d) => `- [${d.severity}] ${d.summary}`).join("\n");

  return `You are an experienced mixing and mastering engineer advising a band/singer who is overwhelmed by the number of production steps and options. You are given objective measurements of their current mix render — you never hear the audio itself, so ground every recommendation in the numbers and the artist's notes.

Reference profile: ${profile.name} — ${profile.description}

Measurements:
- Integrated loudness: ${metrics.integratedLufs.toFixed(1)} LUFS (target ${profile.integratedLufs.min} to ${profile.integratedLufs.max})
- Loudness range: ${metrics.loudnessRange.toFixed(1)} LU (target ${profile.loudnessRange.min} to ${profile.loudnessRange.max})
- True peak: ${metrics.truePeakDb.toFixed(2)} dBTP (ceiling ${profile.truePeakDbMax})
- RMS: ${metrics.rmsDb.toFixed(1)} dB, sample peak: ${metrics.peakDb.toFixed(1)} dB, crest: ${metrics.crestDb.toFixed(1)} dB
- Stereo correlation: ${metrics.stereoCorrelation === null ? "n/a (mono)" : metrics.stereoCorrelation.toFixed(2)}
- Spectral balance (share of energy):
${bands}

Detected deviations from the profile:
${devs}

Artist's notes: ${notes || "(none)"}

Respond with ONLY a JSON array (no prose, no code fence) of at most 8 step objects, ordered most-impactful first. Each object has exactly these keys:
- "area": "mixing" or "mastering"
- "issue": one-line statement of the problem
- "why": why it matters, tied to the measurements or notes
- "how": concrete, DAW-agnostic instructions the artist can follow today
- "severity": "high", "medium" or "low"

Only include steps justified by the measurements or the artist's notes. If everything is on target, return fewer steps or an encouraging single low-severity polish step.`;
}

function extractJsonArray(raw: string): unknown[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) {
    throw new Error("Advisor response contained no JSON array");
  }
  const parsed = JSON.parse(raw.slice(start, end + 1));
  if (!Array.isArray(parsed)) {
    throw new Error("Advisor response contained no JSON array");
  }
  return parsed;
}

function validateStep(item: unknown): AdviceStep | null {
  if (typeof item !== "object" || item === null) return null;
  const o = item as Record<string, unknown>;
  const area = o.area;
  const severity = o.severity;
  if (area !== "mixing" && area !== "mastering") return null;
  if (severity !== "high" && severity !== "medium" && severity !== "low") {
    return null;
  }
  for (const key of ["issue", "why", "how"] as const) {
    if (typeof o[key] !== "string" || (o[key] as string).trim() === "") {
      return null;
    }
  }
  return {
    area,
    issue: o.issue as string,
    why: o.why as string,
    how: o.how as string,
    severity,
  };
}

export async function generateSteps(
  input: AdviceInput,
  complete: LlmComplete,
): Promise<{ steps: AdviceStep[]; dropped: number }> {
  const raw = await complete(buildPrompt(input));
  const items = extractJsonArray(raw).slice(0, 8);
  const steps: AdviceStep[] = [];
  let dropped = 0;
  for (const item of items) {
    const step = validateStep(item);
    if (step) steps.push(step);
    else dropped += 1;
  }
  return { steps, dropped };
}
