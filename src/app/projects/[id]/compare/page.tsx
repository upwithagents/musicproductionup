import Link from "next/link";
import { notFound } from "next/navigation";
import { compareTracks, getProjectDetail } from "@/core/service";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const project = await getProjectDetail(id);
  if (!project) notFound();

  if (!from || !to) {
    return (
      <>
        <h1>Compare versions — {project.name}</h1>
        <p className="muted">
          Pick two analyzed versions from the{" "}
          <Link href={`/projects/${id}`}>project page</Link>.
        </p>
      </>
    );
  }

  let rows;
  try {
    rows = await compareTracks(from, to);
  } catch (e) {
    return (
      <>
        <h1>Compare versions — {project.name}</h1>
        <p style={{ color: "var(--bad)" }}>
          {e instanceof Error ? e.message : "Comparison failed"}
        </p>
      </>
    );
  }

  const fromTrack = project.tracks.find((t) => t.id === from);
  const toTrack = project.tracks.find((t) => t.id === to);
  const improved = rows.filter((r) => r.verdict === "improved").length;
  const regressed = rows.filter((r) => r.verdict === "regressed").length;

  return (
    <>
      <p className="muted">
        <Link href={`/projects/${id}`}>← {project.name}</Link>
      </p>
      <h1>
        v{fromTrack?.version} → v{toTrack?.version}
      </h1>
      <p className="muted">
        {improved} improved · {regressed} regressed ·{" "}
        {rows.length - improved - regressed} unchanged (judged by distance to
        the reference targets)
      </p>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>v{fromTrack?.version}</th>
              <th>v{toTrack?.version}</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>{r.from.toFixed(2)}</td>
                <td>{r.to.toFixed(2)}</td>
                <td>
                  <span
                    className={`chip ${r.verdict === "improved" ? "good" : r.verdict === "regressed" ? "bad" : "neutral"}`}
                  >
                    {r.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
