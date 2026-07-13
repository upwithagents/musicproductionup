# MusicProductionUp — Music Production Assistant

Working name **MusicProductionUp**: music-production expertise app + agent
pack for bands and singers. The pain: too many steps, too many options,
too many apps, too many skills across production (creation, arranging,
mixing, mastering). MVP flow: upload a mix render → real DSP analysis
(ffmpeg) vs a genre reference profile → LLM turns numbers into
prioritized, concrete mixing/mastering steps → upload the next revision
and see the delta. Standalone app that can also serve as an extension to
the `upagent` core. Marketing is the sister project `musicmarketingup`.

## Ground rules

- **Independence from any employer.** Fully separate from any employer's
  accounts, infra, or tooling.
- **PRIVACY (strict):** the owner's real band/singer recordings are the
  first tryout target. `uploads/`, `data/`, and anything derived from real
  tracks (waveforms, spectrograms, metrics DB) are gitignored. Only code,
  schema, docs, reference profiles, and synthesized fixtures get
  committed.
- **GitHub:** `github.com/upwithagents/musicproductionup`. Contributions
  push under the repo-local `upwithagents` identity (repo-local git config
  + SSH alias `github-upwithagents`), never a personal or employer
  identity.

## Conventions

- Branches: `up/<max-3-word-kebab>`.
- Stack: Next.js 16 + TypeScript + Prisma 7/SQLite + vitest (pnpm).
  Layering is strict: `src/core` is pure TS (analyzer, references,
  advisor, service) and must not import from `next`/`react`; `src/app`
  holds UI and thin API routes. The localhost HTTP API is the future
  updiscord/upagent integration contract — keep it stable.
- External dependency: `ffmpeg`/`ffprobe` on PATH (Homebrew). The advisor
  needs `ANTHROPIC_API_KEY`; analysis works without it.
- Run: `pnpm install && pnpm run db:push && pnpm run dev`. Tests:
  `pnpm test`. Fixture playground: `npx tsx scripts/make-fixture.ts`. The
  app is served under `basePath` `/musicproductionup` (see
  `next.config.ts`) so it can be mounted as a zone in
  `upwithagents-portal`; standalone dev is at
  `http://localhost:3000/musicproductionup`. Client/server code must reach
  `/api/*` and image URLs through `withBasePath()` from `@/lib/base-path`
  — raw `fetch`/`<img src>` are not basePath-rewritten by Next.
- Plans live in the workspace-level
  `1_CLAUDE_WORKFLOW/plans/musicproductionup/`, not in this repo.
