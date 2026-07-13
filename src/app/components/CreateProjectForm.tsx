"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateProjectForm({
  profiles,
}: {
  profiles: { id: string; name: string; description: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [profile, setProfile] = useState(profiles[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, referenceProfile: profile }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Failed to create project");
      return;
    }
    const { project } = await res.json();
    router.push(`/projects/${project.id}`);
  }

  const selected = profiles.find((p) => p.id === profile);

  return (
    <form className="panel" onSubmit={submit}>
      <div className="row">
        <input
          placeholder="Song name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select value={profile} onChange={(e) => setProfile(e.target.value)}>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button disabled={busy || !name.trim()}>Create</button>
      </div>
      {selected && <p className="muted">{selected.description}</p>}
      {error && <p style={{ color: "var(--bad)" }}>{error}</p>}
    </form>
  );
}
