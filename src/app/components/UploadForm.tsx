"use client";

import { useRef, useState } from "react";
import { withBasePath } from "@/lib/base-path";

export function UploadForm({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(withBasePath(`/api/projects/${projectId}/tracks`), {
      method: "POST",
      body: form,
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { error?: string }));
      setError(body.error ?? "Upload failed");
      return;
    }
    if (fileRef.current) fileRef.current.value = "";
    onUploaded();
  }

  return (
    <form className="panel row" onSubmit={submit}>
      <input ref={fileRef} type="file" accept=".wav,.mp3" required />
      <button disabled={busy}>{busy ? "Uploading…" : "Upload & analyze"}</button>
      {error && <span style={{ color: "var(--bad)" }}>{error}</span>}
    </form>
  );
}
