import Link from "next/link";
import { listProjects } from "@/core/service";
import { PROFILES } from "@/core/references/profiles";
import { CreateProjectForm } from "@/app/components/CreateProjectForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await listProjects();
  return (
    <>
      <h1>Projects</h1>
      {projects.length === 0 && (
        <p className="muted">
          No projects yet — create one and upload your first mix render.
        </p>
      )}
      {projects.map((p) => (
        <div className="panel row" key={p.id} style={{ justifyContent: "space-between" }}>
          <div>
            <Link href={`/projects/${p.id}`} style={{ fontWeight: 600 }}>
              {p.name}
            </Link>
            <div className="muted">
              {p._count.tracks} version{p._count.tracks === 1 ? "" : "s"} ·{" "}
              {PROFILES.find((x) => x.id === p.referenceProfile)?.name ?? p.referenceProfile}
            </div>
          </div>
        </div>
      ))}
      <h2>New project</h2>
      <CreateProjectForm
        profiles={PROFILES.map((p) => ({ id: p.id, name: p.name, description: p.description }))}
      />
    </>
  );
}
