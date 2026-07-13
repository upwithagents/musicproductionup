"use client";

import { useState } from "react";
import type { AdviceStep } from "@/core/types";
import { withBasePath } from "@/lib/base-path";

interface AdviceEntry {
  id: string;
  notes: string;
  createdAt: string;
  steps: AdviceStep[];
  dropped: number;
}

export function AdvicePanel({
  trackId,
  initialAdvice,
}: {
  trackId: string;
  initialAdvice: AdviceEntry[];
}) {
  const [advice, setAdvice] = useState(initialAdvice);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(withBasePath(`/api/tracks/${trackId}/advice`), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as { error?: string }));
      setError(body.error ?? "Advice generation failed");
      return;
    }
    const { advice: created } = await res.json();
    setAdvice((prev) => [
      { ...created, steps: JSON.parse(created.steps) },
      ...prev,
    ]);
    setNotes("");
  }

  return (
    <>
      <h2>Production advice</h2>
      <form className="panel row" onSubmit={generate}>
        <input
          style={{ flex: 1, minWidth: "16rem" }}
          placeholder="Optional: what are you going for? e.g. vocals feel buried, aiming for streaming release"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button disabled={busy}>
          {busy ? "Thinking…" : "Generate advice"}
        </button>
        {error && <span style={{ color: "var(--bad)" }}>{error}</span>}
      </form>

      {advice.map((a) => (
        <div className="panel" key={a.id}>
          <div className="muted">
            {new Date(a.createdAt).toLocaleString()}
            {a.notes && <> · “{a.notes}”</>}
            {a.dropped > 0 && <> · {a.dropped} invalid step(s) dropped</>}
          </div>
          <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
            {a.steps.map((s, i) => (
              <li key={i} style={{ margin: "0.6rem 0" }}>
                <span className={`chip ${s.severity === "high" ? "bad" : s.severity === "medium" ? "warn" : "neutral"}`}>
                  {s.severity}
                </span>{" "}
                <strong>[{s.area}] {s.issue}</strong>
                <div className="muted">{s.why}</div>
                <div>{s.how}</div>
              </li>
            ))}
          </ol>
          {a.steps.length === 0 && (
            <p className="muted">No steps — the mix is on target. 🎉</p>
          )}
        </div>
      ))}
    </>
  );
}
