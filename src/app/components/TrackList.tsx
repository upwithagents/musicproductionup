"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface TrackRow {
  id: string;
  version: number;
  originalName: string;
  durationSec: number;
  analysis: { status: string; error: string | null } | null;
}

export function TrackList({
  projectId,
  refreshKey,
}: {
  projectId: string;
  refreshKey: number;
}) {
  const [tracks, setTracks] = useState<TrackRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    async function load() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (stopped) return;
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const { project } = await res.json();
      setLoadError(false);
      setTracks(project.tracks);
      if (
        project.tracks.some(
          (t: TrackRow) => t.analysis?.status === "running",
        )
      ) {
        timer = setTimeout(load, 2000);
      }
    }
    load();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, refreshKey]);

  if (!tracks) {
    if (loadError) return <p className="muted">Couldn&apos;t load versions.</p>;
    return <p className="muted">Loading…</p>;
  }
  if (tracks.length === 0) {
    return <p className="muted">No versions uploaded yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Version</th><th>File</th><th>Status</th><th></th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((t) => (
          <tr key={t.id}>
            <td>v{t.version}</td>
            <td>{t.originalName}</td>
            <td>
              {t.analysis?.status === "completed" && (
                <span className="chip good">analyzed</span>
              )}
              {t.analysis?.status === "running" && (
                <span className="chip warn">analyzing…</span>
              )}
              {t.analysis?.status === "failed" && (
                <span className="chip bad" title={t.analysis.error ?? ""}>
                  failed
                </span>
              )}
            </td>
            <td>
              <Link href={`/tracks/${t.id}`}>open</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
