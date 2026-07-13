import type { AnalysisMetrics, BandId } from "@/core/types";
import { BAND_DEFS } from "@/core/types";
import type { ReferenceProfile } from "@/core/references/profiles";
import type { Deviation } from "@/core/references/deviations";

function chipFor(metric: string, deviations: Deviation[]) {
  const d = deviations.find((x) => x.metric === metric);
  if (!d) return <span className="chip good">on target</span>;
  const cls = d.severity === "high" ? "bad" : d.severity === "medium" ? "warn" : "neutral";
  return (
    <span className={`chip ${cls}`} title={d.summary}>
      {d.direction} target
    </span>
  );
}

export function MetricsDashboard({
  metrics,
  profile,
  deviations,
  waveformPath,
  spectrogramPath,
}: {
  metrics: AnalysisMetrics;
  profile: ReferenceProfile;
  deviations: Deviation[];
  waveformPath: string | null;
  spectrogramPath: string | null;
}) {
  return (
    <>
      <h2>Measurements vs {profile.name}</h2>
      <div className="panel">
        <table>
          <thead>
            <tr><th>Metric</th><th>Measured</th><th>Target</th><th>Verdict</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Integrated loudness <span className="muted">(how loud it feels overall)</span></td>
              <td>{metrics.integratedLufs.toFixed(1)} LUFS</td>
              <td>{profile.integratedLufs.min} to {profile.integratedLufs.max}</td>
              <td>{chipFor("integratedLufs", deviations)}</td>
            </tr>
            <tr>
              <td>True peak <span className="muted">(clipping headroom)</span></td>
              <td>{metrics.truePeakDb.toFixed(2)} dBTP</td>
              <td>≤ {profile.truePeakDbMax}</td>
              <td>{chipFor("truePeakDb", deviations)}</td>
            </tr>
            <tr>
              <td>Loudness range <span className="muted">(dynamics between sections)</span></td>
              <td>{metrics.loudnessRange.toFixed(1)} LU</td>
              <td>{profile.loudnessRange.min} to {profile.loudnessRange.max}</td>
              <td>{chipFor("loudnessRange", deviations)}</td>
            </tr>
            <tr>
              <td>Crest factor <span className="muted">(punch: peak vs average)</span></td>
              <td>{metrics.crestDb.toFixed(1)} dB</td>
              <td className="muted">context</td>
              <td><span className="chip neutral">info</span></td>
            </tr>
            <tr>
              <td>Stereo correlation <span className="muted">(mono compatibility)</span></td>
              <td>
                {metrics.stereoCorrelation === null
                  ? "mono"
                  : metrics.stereoCorrelation.toFixed(2)}
              </td>
              <td>&gt; 0.2</td>
              <td>{chipFor("stereoCorrelation", deviations)}</td>
            </tr>
            {BAND_DEFS.map((b) => (
              <tr key={b.id}>
                <td>{b.label} <span className="muted">({b.lowHz}–{b.highHz} Hz)</span></td>
                <td>{(metrics.bandShares[b.id as BandId] * 100).toFixed(1)}%</td>
                <td>
                  {(profile.bandShares[b.id as BandId].min * 100).toFixed(0)}–
                  {(profile.bandShares[b.id as BandId].max * 100).toFixed(0)}%
                </td>
                <td>{chipFor(`band:${b.id}`, deviations)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {waveformPath && (
        <div className="panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/images?path=${encodeURIComponent(waveformPath)}`}
            alt="Waveform"
            style={{ width: "100%", borderRadius: 6 }}
          />
        </div>
      )}
      {spectrogramPath && (
        <div className="panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/images?path=${encodeURIComponent(spectrogramPath)}`}
            alt="Spectrogram"
            style={{ width: "100%", borderRadius: 6 }}
          />
        </div>
      )}
    </>
  );
}
