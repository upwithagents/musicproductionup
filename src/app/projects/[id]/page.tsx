import { notFound } from "next/navigation";
import { getProjectDetail } from "@/core/service";
import { getProfile } from "@/core/references/profiles";
import { UploadForm } from "@/app/components/UploadForm";
import { TrackList } from "@/app/components/TrackList";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) notFound();
  const profile = getProfile(project.referenceProfile);

  return (
    <>
      <h1>{project.name}</h1>
      <p className="muted">
        Reference: {profile.name} — {profile.description}
      </p>
      <h2>Upload a new version</h2>
      <UploadForm projectId={project.id} />
      <h2>Versions</h2>
      <TrackList projectId={project.id} />
    </>
  );
}
