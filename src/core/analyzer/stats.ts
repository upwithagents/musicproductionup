import { runFfmpeg } from "@/core/analyzer/ffmpeg";

export interface StatsMetrics {
  rmsDb: number;
  peakDb: number;
  crestDb: number;
}

function grabDb(section: string, label: string): number {
  const re = new RegExp(`${label}:\\s+(-?\\d+(?:\\.\\d+)?|-inf)`);
  const m = section.match(re);
  if (!m) throw new Error(`astats output missing "${label}"`);
  return m[1] === "-inf" ? -120 : Number(m[1]);
}

/**
 * Overall RMS/peak via ffmpeg astats; crest derived as peak - rms (dB).
 *
 * ffmpeg 7.1 prints one per-channel block per channel plus a final "Overall"
 * block, e.g.:
 *   [Parsed_astats_0 @ ...] Overall
 *   [Parsed_astats_0 @ ...] Peak level dB: -21.072762
 *   [Parsed_astats_0 @ ...] RMS level dB: -24.084165
 * "Overall" appears exactly once (the per-channel headers are "Channel: N"),
 * so lastIndexOf("Overall") reliably isolates the final block — verified
 * directly against real ffmpeg 7.1 output.
 */
export async function measureStats(filePath: string): Promise<StatsMetrics> {
  const { stderr } = await runFfmpeg([
    "-nostats", "-hide_banner",
    "-i", filePath,
    "-af", "astats=metadata=0",
    "-f", "null", "-",
  ]);
  const overall = stderr.slice(stderr.lastIndexOf("Overall"));
  const rmsDb = grabDb(overall, "RMS level dB");
  const peakDb = grabDb(overall, "Peak level dB");
  return { rmsDb, peakDb, crestDb: peakDb - rmsDb };
}
