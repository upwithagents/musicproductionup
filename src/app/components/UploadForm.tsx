"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function UploadForm({ projectId }: { projectId: string }) {
  const router = useRouter();
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
    const res = await fetch(`/api/projects/${projectId}/tracks`, {
      method: "POST",
      body: form,
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Upload failed");
      return;
    }
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <form className="panel row" onSubmit={submit}>
      <input ref={fileRef} type="file" accept=".wav,.mp3" required />
      <button disabled={busy}>{busy ? "Uploading…" : "Upload & analyze"}</button>
      {error && <span style={{ color: "var(--bad)" }}>{error}</span>}
    </form>
  );
}
