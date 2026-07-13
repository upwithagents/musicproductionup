import { runFfprobe } from "@/core/analyzer/ffmpeg";

export class InvalidAudioError extends Error {
  constructor(filePath: string, detail: string) {
    super(`${filePath} is not a valid audio file: ${detail}`);
    this.name = "InvalidAudioError";
  }
}

export interface ProbeInfo {
  durationSec: number;
  sampleRate: number;
  channels: number;
  codec: string;
}

export async function probe(filePath: string): Promise<ProbeInfo> {
  let raw: string;
  try {
    ({ stdout: raw } = await runFfprobe([
      "-v", "error",
      "-print_format", "json",
      "-show_format", "-show_streams",
      filePath,
    ]));
  } catch (e) {
    if (e instanceof Error && e.name === "FfmpegMissingError") throw e;
    throw new InvalidAudioError(filePath, "ffprobe could not read it");
  }

  const data = JSON.parse(raw) as {
    streams?: {
      codec_type?: string;
      codec_name?: string;
      sample_rate?: string;
      channels?: number;
    }[];
    format?: { duration?: string };
  };

  const audio = data.streams?.find((s) => s.codec_type === "audio");
  if (!audio) throw new InvalidAudioError(filePath, "no audio stream");

  const durationSec = Number(data.format?.duration ?? 0);
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new InvalidAudioError(filePath, "zero/unknown duration");
  }

  return {
    durationSec,
    sampleRate: Number(audio.sample_rate ?? 0),
    channels: Number(audio.channels ?? 0),
    codec: audio.codec_name ?? "unknown",
  };
}
