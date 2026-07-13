import { mkdirSync } from "node:fs";
import path from "node:path";
import { runFfmpeg } from "@/core/analyzer/ffmpeg";

export async function renderImages(
  filePath: string,
  imageDir: string,
  baseName: string,
): Promise<{ waveformPath: string; spectrogramPath: string }> {
  mkdirSync(imageDir, { recursive: true });
  const waveformPath = path.join(imageDir, `${baseName}-waveform.png`);
  const spectrogramPath = path.join(imageDir, `${baseName}-spectrogram.png`);

  await runFfmpeg([
    "-y", "-i", filePath,
    "-filter_complex", "showwavespic=s=1200x240:colors=#6366f1",
    "-frames:v", "1", waveformPath,
  ]);
  await runFfmpeg([
    "-y", "-i", filePath,
    "-lavfi", "showspectrumpic=s=1200x360:legend=1",
    spectrogramPath,
  ]);
  return { waveformPath, spectrogramPath };
}
