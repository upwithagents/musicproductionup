<img src="docs/icon.svg" width="56" align="left" alt="" />

# MusicProductionUp

Upload a mix render, get real DSP analysis (loudness, dynamics, spectral
balance, stereo image) against a genre reference, and prioritized
mixing/mastering steps generated from the measurements. Part of the **up**
ecosystem; sister project `musicmarketingup` handles marketing.

<br clear="left"/>

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

`uploads/` and `data/` are gitignored — recordings stay on your machine.
