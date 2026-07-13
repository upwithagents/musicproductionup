import path from "node:path";
import type { AnalysisMetrics } from "@/core/types";
import { probe } from "@/core/analyzer/probe";
import { measureLoudness } from "@/core/analyzer/loudness";
import { measureStats } from "@/core/analyzer/stats";
import { analyzeSpectrum } from "@/core/analyzer/spectrum";
import { renderImages } from "@/core/analyzer/images";

export { InvalidAudioError } from "@/core/analyzer/probe";
export { FfmpegMissingError, FfmpegFailedError } from "@/core/analyzer/ffmpeg";

export interface TrackAnalysis {
  metrics: AnalysisMetrics;
  waveformPath: string;
  spectrogramPath: string;
}

export async function analyzeTrack(
  filePath: string,
  imageDir: string,
): Promise<TrackAnalysis> {
  const info = await probe(filePath); // validates it's real audio first
  const [loudness, stats, spectrum, images] = await Promise.all([
    measureLoudness(filePath),
    measureStats(filePath),
    analyzeSpectrum(filePath, info.channels),
    renderImages(filePath, imageDir, path.parse(filePath).name),
  ]);
  return {
    metrics: {
      durationSec: info.durationSec,
      sampleRate: info.sampleRate,
      channels: info.channels,
      ...loudness,
      ...stats,
      ...spectrum,
    },
    waveformPath: images.waveformPath,
    spectrogramPath: images.spectrogramPath,
  };
}
