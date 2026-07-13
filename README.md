# MusicProductionUp

Music-production assistant for bands and singers: upload a mix render,
get real DSP analysis (loudness, dynamics, spectral balance, stereo
image) compared against a genre reference profile, and prioritized
mixing/mastering steps generated from the measurements — never from the
raw audio. Upload the next revision to see what improved.

Part of the up ecosystem (upagent, updiscord, upwithagents-portal).
Sister project: musicmarketingup (marketing/promotion).

## Requirements

- Node 20+, pnpm, `ffmpeg`/`ffprobe` on PATH (`brew install ffmpeg`)
- `ANTHROPIC_API_KEY` in `.env` for advice (analysis works without it)

## Run

    pnpm install
    pnpm run db:push
    pnpm run dev      # http://localhost:3000

## Test

    pnpm test

## Privacy

`uploads/` and `data/` are gitignored — your recordings and everything
derived from them stay on your machine.
