# quondam

A calm bedtime-story web app for parents — hand-picked classic stories with
serious loudness normalization, optional tape-hiss reduction, sleep timer with
fade, position resume, and a deliberately quiet bedside UX.

> _quondam_ — Latin for "former, once-upon-a-time."

> Brought to you by [**CROS Schola**](https://myschola.app).

## What it does

- **Browse** stories by age band, length, and mood.
- **Tonight shortlist** — build a small playlist for the week.
- **Player** with sleep timer + gentle fade-out, position resume per story,
  and a vintage VU meter.
- **Loudness normalization** — every track has a pre-measured EBU R128
  integrated LUFS value in the catalog; the player applies per-track gain at
  playback so volume is consistent night to night, no matter how mismatched
  the source recordings are.
- **Two-tier audio cleanup**:
  1. _Tier 1_ — always-on gentle EQ chain (high-pass, low-shelf, high-shelf
     attenuation) to take the edge off older recordings.
  2. _Tier 2_ — opt-in "Reduce hiss" toggle, a high-band downward expander
     that targets tape hiss in quiet moments while preserving speech
     transients. Auto-engaged for tracks the curator marks as hissy.
- **Brick-wall limiter** at -1 dBFS as a safety net so nothing ever spikes.

## How content gets in

Curation happens upstream and writes `catalog/catalog.json` via PRs. The
contract — sourcing rules, content filter, loudness measurement recipe,
categorization vocabulary, ID scheme — is documented in detail in
[`catalog/CURATION.md`](catalog/CURATION.md) and enforced in CI by
[`catalog/schema.json`](catalog/schema.json).

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS · Fraunces variable serif
- Zustand (with `persist` middleware) for app state
- Web Audio API for the audio graph (no audio libraries — just the
  primitives, used precisely)
- Vitest + React Testing Library
- ajv-cli for catalog schema validation in CI

## Run it

```bash
npm install
npm run dev          # Vite dev server
npm test             # Vitest
npm run typecheck
npm run lint
npm run build
npm run validate:catalog   # JSON Schema check
```

## Repo layout

```
/catalog/
  catalog.json              The curated library
  schema.json               JSON Schema for catalog.json
  CURATION.md               Curator brief (sourcing, content filter, LUFS, IDs)
  examples/                 Reference entries
/src/
  catalog/
    types.ts                Story, Catalog, AgeBand, Mood, Restoration
    source.ts               *** SWAP POINT for the eventual hosted DB ***
    useCatalog.ts           React hook over source.ts
    filter.ts               Pure filter/search functions
  audio/
    engine.ts               AudioContext, audio graph, gain math, EQ, denoise
    useAudioEngine.ts       React hook binding the engine to component lifecycle
    sleepTimer.ts           Fade-out + pause logic
  state/
    store.ts                Zustand store: favorites, tonight, resumeMap, denoiseOverrides
  screens/
    Library.tsx             Filter chips + grid of StoryCards
    Tonight.tsx             Reorderable shortlist
    Player.tsx              Playback, scrubber, sleep timer, denoise toggle, VU meter
  components/
  lib/
```

## The swap point

Quondam will eventually be backed by a hosted database for the catalog. Only
**one file** has to change for that: [`src/catalog/source.ts`](src/catalog/source.ts).
Today it does a static import of `catalog/catalog.json`. Tomorrow it does a
`fetch()` against the database. Every other file consumes `useCatalog()` and
never knows the difference.

## License

Code: TBD. Content: public domain.
