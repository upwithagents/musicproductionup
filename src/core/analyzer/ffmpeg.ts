import { execFile } from "node:child_process";

export class FfmpegMissingError extends Error {
  constructor(binary: string) {
    super(
      `${binary} not found on PATH. Install ffmpeg (macOS: brew install ffmpeg).`,
    );
    this.name = "FfmpegMissingError";
  }
}

export class FfmpegFailedError extends Error {
  constructor(binary: string, code: number | null, stderr: string) {
    super(`${binary} exited with ${code}: ${stderr.slice(-500)}`);
    this.name = "FfmpegFailedError";
  }
}

function run(
  binary: "ffmpeg" | "ffprobe",
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      binary,
      args,
      { maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const code = (error as NodeJS.ErrnoException).code;
          if (code === "ENOENT") return reject(new FfmpegMissingError(binary));
          // Non-ENOENT execFile errors carry the numeric exit code in `code`.
          const exitCode = typeof error.code === "number" ? error.code : null;
          return reject(
            new FfmpegFailedError(binary, exitCode, String(stderr)),
          );
        }
        resolve({ stdout: String(stdout), stderr: String(stderr) });
      },
    );
  });
}

export const runFfmpeg = (args: string[]) => run("ffmpeg", args);
export const runFfprobe = (args: string[]) => run("ffprobe", args);
