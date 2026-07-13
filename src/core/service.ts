import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/core/db";
import { analyzeTrack } from "@/core/analyzer";
import { BAND_DEFS, type AnalysisMetrics } from "@/core/types";
import { computeDeviations, distanceToRange } from "@/core/references/deviations";
import { getProfile } from "@/core/references/profiles";
import { generateSteps } from "@/core/advisor/advise";
import { anthropicComplete, type LlmComplete } from "@/core/advisor/llm";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
const ALLOWED_FORMATS = ["wav", "mp3"] as const;

export class UploadError extends Error {
  constructor(
    public reason: "too_large" | "bad_format" | "no_project",
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export async function createProject(
  name: string,
  referenceProfile: string,
  notes = "",
) {
  getProfile(referenceProfile); // throws on unknown id
  return prisma.project.create({
    data: { name, referenceProfile, notes },
  });
}

export function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { tracks: true } } },
  });
}

export function getProjectDetail(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { version: "asc" },
        include: { analysis: true },
      },
    },
  });
}

export async function saveUpload(
  projectId: string,
  originalName: string,
  bytes: Buffer,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new UploadError("no_project", "Project not found");

  const format = path.extname(originalName).slice(1).toLowerCase();
  if (!(ALLOWED_FORMATS as readonly string[]).includes(format)) {
    throw new UploadError(
      "bad_format",
      `Unsupported format ".${format}" — upload a WAV or MP3 render.`,
    );
  }
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new UploadError(
      "too_large",
      "File exceeds the 500 MB upload limit.",
    );
  }

  const last = await prisma.track.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  const version = (last?.version ?? 0) + 1;

  const dir = path.join(UPLOAD_DIR, projectId);
  mkdirSync(dir, { recursive: true });
  const finalPath = path.join(dir, `v${version}-${randomUUID()}.${format}`);
  const tmpPath = `${finalPath}.part`;
  writeFileSync(tmpPath, bytes);
  renameSync(tmpPath, finalPath); // atomic within the same directory

  return prisma.track.create({
    data: {
      projectId,
      version,
      originalName,
      filePath: finalPath,
      format,
      sizeBytes: bytes.length,
      analysis: { create: { status: "running" } },
    },
  });
}

export async function runAnalysis(trackId: string): Promise<void> {
  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) return;
  const imageDir = path.join(UPLOAD_DIR, track.projectId, "derived");
  try {
    const result = await analyzeTrack(track.filePath, imageDir);
    await prisma.$transaction([
      prisma.analysis.update({
        where: { trackId },
        data: {
          status: "completed",
          metrics: JSON.stringify(result.metrics),
          waveformPath: result.waveformPath,
          spectrogramPath: result.spectrogramPath,
          completedAt: new Date(),
          error: null,
        },
      }),
      prisma.track.update({
        where: { id: trackId },
        data: { durationSec: result.metrics.durationSec },
      }),
    ]);
  } catch (e) {
    await prisma.analysis.update({
      where: { trackId },
      data: {
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
        completedAt: new Date(),
      },
    });
  }
}

/** Fire-and-forget: API routes return immediately, UI polls status. */
export function startAnalysis(trackId: string): void {
  void runAnalysis(trackId).catch(() => {
    // runAnalysis records its own failures; this guards the void boundary
  });
}

export function getTrackDetail(id: string) {
  return prisma.track.findUnique({
    where: { id },
    include: {
      analysis: true,
      advice: { orderBy: { createdAt: "desc" } },
      project: true,
    },
  });
}

export async function generateAdvice(
  trackId: string,
  notes: string,
  complete: LlmComplete = anthropicComplete,
) {
  const track = await getTrackDetail(trackId);
  if (!track) throw new Error("Track not found");
  if (track.analysis?.status !== "completed" || !track.analysis.metrics) {
    throw new Error("Track analysis has not completed yet");
  }
  const metrics = JSON.parse(track.analysis.metrics) as AnalysisMetrics;
  const profile = getProfile(track.project.referenceProfile);
  const { steps, dropped } = await generateSteps(
    { metrics, deviations: computeDeviations(metrics, profile), profile, notes },
    complete,
  );
  return prisma.advice.create({
    data: {
      trackId,
      notes,
      model: process.env.MUSICPRODUCTIONUP_MODEL || "claude-sonnet-5",
      steps: JSON.stringify(steps),
      dropped,
    },
  });
}

export interface ComparisonRow {
  key: string;
  label: string;
  from: number;
  to: number;
  verdict: "improved" | "regressed" | "unchanged";
}

export async function compareTracks(
  fromTrackId: string,
  toTrackId: string,
): Promise<ComparisonRow[]> {
  const [from, to] = await Promise.all([
    getTrackDetail(fromTrackId),
    getTrackDetail(toTrackId),
  ]);
  if (!from?.analysis?.metrics || !to?.analysis?.metrics) {
    throw new Error("Both versions need a completed analysis to compare");
  }
  if (from.projectId !== to.projectId) {
    throw new Error("Versions belong to different projects");
  }
  const mf = JSON.parse(from.analysis.metrics) as AnalysisMetrics;
  const mt = JSON.parse(to.analysis.metrics) as AnalysisMetrics;
  const profile = getProfile(from.project.referenceProfile);

  const rows: ComparisonRow[] = [];
  const push = (
    key: string,
    label: string,
    a: number,
    b: number,
    range: { min: number; max: number },
  ) => {
    const da = distanceToRange(a, range);
    const db = distanceToRange(b, range);
    const verdict =
      Math.abs(da - db) < 1e-9
        ? "unchanged"
        : db < da
          ? "improved"
          : "regressed";
    rows.push({ key, label, from: a, to: b, verdict });
  };

  push("integratedLufs", "Integrated loudness (LUFS)",
    mf.integratedLufs, mt.integratedLufs, profile.integratedLufs);
  push("truePeakDb", "True peak (dBTP)", mf.truePeakDb, mt.truePeakDb,
    { min: -120, max: profile.truePeakDbMax });
  push("loudnessRange", "Loudness range (LU)",
    mf.loudnessRange, mt.loudnessRange, profile.loudnessRange);
  for (const band of BAND_DEFS) {
    push(`band:${band.id}`, `${band.label} share`,
      mf.bandShares[band.id], mt.bandShares[band.id],
      profile.bandShares[band.id]);
  }
  if (mf.stereoCorrelation !== null && mt.stereoCorrelation !== null) {
    push("stereoCorrelation", "Stereo correlation",
      mf.stereoCorrelation, mt.stereoCorrelation, { min: 0.2, max: 1 });
  }
  return rows;
}
