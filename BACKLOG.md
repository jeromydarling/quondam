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
- **Cover audit for the imported 183 entries.** Spot-check representative
  entries for correct, high-resolution covers. (Partly addressed in the
  PR that added this file — but every freshly-curated batch should be
  re-audited.)

## Content / curation

- **Verify audio URLs for the 183 imported entries.** The curator PR
  added these without us running a round-trip CORS/200 check. The ones
  that fail gracefully (since `BookCover` falls through to the SVG) but
  some audio URLs may 404 at playback time.
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
