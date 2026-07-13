"use client";

import { useState } from "react";
import { UploadForm } from "@/app/components/UploadForm";
import { TrackList } from "@/app/components/TrackList";

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      <h2>Upload a new version</h2>
      <UploadForm
        projectId={projectId}
        onUploaded={() => setRefreshKey((k) => k + 1)}
      />
      <h2>Versions</h2>
      <TrackList projectId={projectId} refreshKey={refreshKey} />
    </>
  );
}
