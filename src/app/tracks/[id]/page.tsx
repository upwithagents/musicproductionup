import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectDetail, getTrackDetail } from "@/core/service";
import { getProfile } from "@/core/references/profiles";
import { computeDeviations } from "@/core/references/deviations";
import type { AnalysisMetrics } from "@/core/types";
import { MetricsDashboard } from "@/app/components/MetricsDashboard";
import { AdvicePanel } from "@/app/components/AdvicePanel";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const track = await getTrackDetail(id);
  if (!track) notFound();
  const profile = getProfile(track.project.referenceProfile);

  const completed = track.analysis?.status === "completed" && track.analysis.metrics;
  const metrics = completed
    ? (JSON.parse(track.analysis!.metrics!) as AnalysisMetrics)
    : null;
  const deviations = metrics ? computeDeviations(metrics, profile) : [];

  const project = await getProjectDetail(track.projectId);
  const prev = project?.tracks
    .filter((t) => t.version < track.version && t.analysis?.status === "completed")
    .at(-1);

  return (
    <>
      <p className="muted">
        <Link href={`/projects/${track.projectId}`}>← {track.project.name}</Link>
      </p>
      <h1>
        v{track.version} — {track.originalName}
      </h1>
      <p className="muted">
        Reference: {profile.name}
        {prev && (
          <>
            {" · "}
            <Link
              href={`/projects/${track.projectId}/compare?from=${prev.id}&to=${track.id}`}
            >
              compare with v{prev.version}
            </Link>
          </>
        )}
      </p>

      {track.analysis?.status === "running" && (
        <div className="panel">Analyzing… refresh in a few seconds.</div>
      )}
      {track.analysis?.status === "failed" && (
        <div className="panel" style={{ color: "var(--bad)" }}>
          Analysis failed: {track.analysis.error}
        </div>
      )}
      {metrics && (
        <>
          <MetricsDashboard
            metrics={metrics}
            profile={JSON.parse(JSON.stringify(profile))}
            deviations={JSON.parse(JSON.stringify(deviations))}
            waveformPath={track.analysis!.waveformPath}
            spectrogramPath={track.analysis!.spectrogramPath}
          />
          <AdvicePanel
            trackId={track.id}
            initialAdvice={track.advice.map((a) => ({
              id: a.id,
              notes: a.notes,
              createdAt: a.createdAt.toISOString(),
              steps: JSON.parse(a.steps),
              dropped: a.dropped,
            }))}
          />
        </>
      )}
    </>
  );
}
