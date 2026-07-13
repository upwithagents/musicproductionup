import { notFound } from "next/navigation";
import { getProjectDetail } from "@/core/service";
import { getProfile } from "@/core/references/profiles";
import { ProjectWorkspace } from "@/app/components/ProjectWorkspace";

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
      <ProjectWorkspace projectId={project.id} />
    </>
  );
}
