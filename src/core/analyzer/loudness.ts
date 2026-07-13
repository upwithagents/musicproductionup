import { runFfmpeg } from "@/core/analyzer/ffmpeg";

export interface LoudnessMetrics {
  integratedLufs: number;
  loudnessRange: number;
  truePeakDb: number;
}

function grab(stderr: string, re: RegExp, what: string): number {
  const m = stderr.match(re);
  if (!m) throw new Error(`ebur128 output missing ${what}`);
  return Number(m[1]);
}

/**
 * EBU R128 via ffmpeg's ebur128 filter (summary printed to stderr).
 *
 * ffmpeg 7.1's actual Summary block looks like:
 *   Integrated loudness:
 *     I:         -20.8 LUFS
 *     Threshold: -30.8 LUFS
 *   Loudness range:
 *     LRA:        20.0 LU
 *     Threshold: -40.8 LUFS
 *   True peak:
 *     Peak:      -11.6 dBFS
 * The "I:"/"LRA:"/"Peak:" labels are unique within the Summary block (the
 * "Threshold:" lines use a different label), so matching on the label plus
 * unit is sufficient — verified directly against real ffmpeg 7.1 output.
 */
export async function measureLoudness(
  filePath: string,
): Promise<LoudnessMetrics> {
  const { stderr } = await runFfmpeg([
    "-nostats", "-hide_banner",
    "-i", filePath,
    "-filter_complex", "ebur128=peak=true",
    "-f", "null", "-",
  ]);
  const summary = stderr.slice(stderr.lastIndexOf("Summary:"));
  return {
    integratedLufs: grab(summary, /I:\s+(-?\d+(?:\.\d+)?) LUFS/, "I"),
    loudnessRange: grab(summary, /LRA:\s+(-?\d+(?:\.\d+)?) LU/, "LRA"),
    truePeakDb: grab(summary, /Peak:\s+(-?\d+(?:\.\d+)?) dBFS/, "true peak"),
  };
}
