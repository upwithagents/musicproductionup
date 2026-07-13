import { spawn } from "node:child_process";
import FFT from "fft.js";
import { BAND_DEFS, type BandId } from "@/core/types";
import { FfmpegFailedError, FfmpegMissingError } from "@/core/analyzer/ffmpeg";

const SAMPLE_RATE = 44100;
const WINDOW = 4096;

export interface SpectrumResult {
  bandShares: Record<BandId, number>;
  stereoCorrelation: number | null;
}

/**
 * Streams ffmpeg's raw stereo f32 PCM output and, in constant memory,
 * computes (a) 7-band spectral energy shares via a Hann-windowed 4096-point
 * FFT applied to the mono downmix and (b) Pearson stereo correlation over
 * all L/R sample pairs.
 */
export function analyzeSpectrum(
  filePath: string,
  channels: number,
): Promise<SpectrumResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-v", "error",
      "-i", filePath,
      "-ac", "2", "-ar", String(SAMPLE_RATE),
      "-f", "f32le", "pipe:1",
    ]);

    const fft = new FFT(WINDOW);
    const spectrum = fft.createComplexArray();
    const hann = new Float64Array(WINDOW);
    for (let i = 0; i < WINDOW; i++) {
      hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (WINDOW - 1)));
    }

    const bandEnergy = new Float64Array(BAND_DEFS.length);
    const windowBuf = new Float64Array(WINDOW);
    let windowFill = 0;

    // Pearson accumulators over all samples
    let n = 0, sumL = 0, sumR = 0, sumLL = 0, sumRR = 0, sumLR = 0;

    let pending: Buffer = Buffer.alloc(0);
    let stderrTail = "";

    const flushWindow = () => {
      const windowed = new Array<number>(WINDOW);
      for (let i = 0; i < WINDOW; i++) windowed[i] = windowBuf[i] * hann[i];
      fft.realTransform(spectrum, windowed);
      const binHz = SAMPLE_RATE / WINDOW;
      for (let bin = 1; bin < WINDOW / 2; bin++) {
        const freq = bin * binHz;
        const idx = BAND_DEFS.findIndex(
          (b) => freq >= b.lowHz && freq < b.highHz,
        );
        if (idx === -1) continue;
        const re = spectrum[2 * bin];
        const im = spectrum[2 * bin + 1];
        bandEnergy[idx] += re * re + im * im;
      }
      windowFill = 0;
    };

    proc.stdout.on("data", (chunk: Buffer) => {
      pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
      const frameBytes = 8; // 2 channels x 4 bytes
      const frames = Math.floor(pending.length / frameBytes);
      for (let f = 0; f < frames; f++) {
        const l = pending.readFloatLE(f * frameBytes);
        const r = pending.readFloatLE(f * frameBytes + 4);
        n += 1;
        sumL += l; sumR += r;
        sumLL += l * l; sumRR += r * r; sumLR += l * r;
        windowBuf[windowFill++] = (l + r) / 2;
        if (windowFill === WINDOW) flushWindow();
      }
      pending = pending.subarray(frames * frameBytes);
    });

    proc.stderr.on("data", (d: Buffer) => {
      stderrTail = (stderrTail + d.toString()).slice(-2000);
    });

    proc.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") reject(new FfmpegMissingError("ffmpeg"));
      else reject(err);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new FfmpegFailedError("ffmpeg", code, stderrTail));
      }
      if (n === 0) {
        return reject(new FfmpegFailedError("ffmpeg", 0, "no audio decoded"));
      }
      const total = bandEnergy.reduce((a, b) => a + b, 0);
      const bandShares = Object.fromEntries(
        BAND_DEFS.map((b, i) => [
          b.id,
          total > 0 ? bandEnergy[i] / total : 0,
        ]),
      ) as Record<BandId, number>;

      let stereoCorrelation: number | null = null;
      if (channels >= 2) {
        const num = n * sumLR - sumL * sumR;
        const den = Math.sqrt(
          (n * sumLL - sumL * sumL) * (n * sumRR - sumR * sumR),
        );
        stereoCorrelation = den > 0 ? num / den : 1;
      }
      resolve({ bandShares, stereoCorrelation });
    });
  });
}
