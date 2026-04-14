# Backlog

Things we've flagged during the session and want to come back to. Not
urgent — just tracked here so nothing falls off.

## Design / UX

- **Open Library navigation for 183 stories.** Filter chips + search are
  the only discovery surface right now. With 183 entries, consider more
  axes: by author, by series, "new this week", "longest sleep timer
  candidates", etc.
- **Category / mood filter copy tuning.** The new vocabulary
  (`brave`, `faithful`, `heartwarming`) may want friendlier labels in the
  UI than the raw slugs. Quick pass on `FilterChips`.
- **Cover audit for every curator batch.** After running
  `npm run covers` (or the curator setting `coverUrl` by hand), scroll
  through `public/covers/` in an image viewer, delete anything that
  looks off, and re-run the pipeline to pick up the gaps. Every fresh
  curator batch should be audited this way.

## Content / curation

- **Run the cover-fetch pipeline**: `npm run covers` (see
  `scripts/README.md`). Three-stage resolver — archive.org item
  metadata → Wikipedia REST → Gemini 2.5 Flash Image (needs
  `GEMINI_API_KEY`). Outputs `public/covers/*.jpg` and rewrites
  `catalog.json` coverUrl values in place. Idempotent; safe to re-run.
  **Run this locally, not in any sandbox that blocks archive.org /
  Wikipedia hosts.**
- **Verify audio URLs for the 183 imported entries.** The curator PR
  added these without us running a round-trip CORS/200 check. The ones
  that fail fall through to an error in the player at playback time —
  we should batch-verify.
- **Mood re-tagging.** Any entry whose `mood` was force-mapped from
  `adventurous` → `brave` or `classic` → `heartwarming` in the import
  should get a human eyeball pass.

## Infrastructure

- **Delete the superseded `feat/seed-catalog-150` branch.** The catalog
  and schema from it are on main; the rest is incompatible with the
  current state. Delete whenever.
- **Bundle weight.** Main JS bundle is ~515 KB / 127 KB gzip after the
  183-entry catalog was inlined via static import. Not urgent — the
  Lovable DB swap will move the catalog out of the bundle entirely by
  fetching it at runtime. If that swap slips, add a simple dynamic
  `import()` of `catalog/catalog.json` as a stopgap.

## Hand-off

- Lovable backend wiring — use `prompts/lovable-handoff.md`
- Further curator batches — use `prompts/perplexity-curator.md`
