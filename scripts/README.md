# scripts/

One-shot maintenance scripts for the quondam repo.

## `fetch-covers.mjs`

Walks `catalog/catalog.json`, finds every story without a `coverUrl`, and
tries three sources in order per entry:

1. **archive.org item metadata** — reads the item's actual file listing
   via `https://archive.org/metadata/{identifier}` (different from the
   `services/img` thumbnail endpoint, which returns waveforms for
   audio-only items). Picks real uploaded JPEG/PNG cover art, skipping
   derivatives and waveforms.

2. **Wikipedia REST API** — tries the page summary endpoint for the
   story's title and a handful of disambiguation variants (`(book)`,
   `(novel)`, `(radio program)`, etc.). Returns `originalimage.source`
   when the article has a lead image.

3. **Gemini 2.5 Flash Image** (a.k.a. "Nano Banana") — only runs when
   `GEMINI_API_KEY` is set in the environment. Generates a warm
   hand-drawn children's-storybook cover. Skipped entirely if the key
   is missing — the entry just stays without a `coverUrl` and the
   generated SVG fallback in `BookCover.tsx` handles the render.

For every entry where a cover is found, the image is written to
`public/covers/{story-id}.jpg` and the catalog entry's `coverUrl` is set
to `covers/{story-id}.jpg` (a relative path that `BookCover` resolves
against Vite's `BASE_URL` at render time).

### Running it

The pipeline needs real network access to archive.org, Wikipedia, and
(optionally) Google's Generative Language API. Run it locally on your
machine, not inside any sandbox that might block those hosts.

```bash
# Stages 1 + 2 only (no AI, no API key needed)
npm run covers

# All three stages, with Gemini
GEMINI_API_KEY=sk-... npm run covers

# Dry run — don't write any files
npm run covers -- --dry-run

# Process a single entry
npm run covers -- --id librivox-aesop-fables

# Only specific stages
npm run covers -- --only s1,s2

# Re-fetch even if the catalog already has a coverUrl
npm run covers -- --force
```

### Getting a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in and create an API key (free tier is sufficient to start —
   Gemini 2.5 Flash Image has a generous free quota per day)
3. Export it before running the script:
   ```bash
   export GEMINI_API_KEY=your_key_here
   ```

Do **not** commit the key. Do **not** put it in `.env` files that get
committed. The script only reads from the process environment.

### What the script commits

The script only modifies:
- `catalog/catalog.json` — adds `coverUrl` values for entries it
  successfully fetched
- `public/covers/*.jpg` — new image files (one per story)

After running, review the cover images visually, then:

```bash
npm run validate:catalog   # confirm the catalog still validates
npm run typecheck
npm run build
git add catalog/catalog.json public/covers/
git commit -m "Fetch covers for N stories"
git push
```

### Idempotency and re-runs

- Running the script twice is a no-op for entries that already have a
  `coverUrl`. To re-fetch, use `--force`.
- If the script finds an existing file at `public/covers/{id}.jpg`, it
  just wires up the catalog reference without re-downloading.
- Failed lookups are logged but not treated as errors. Re-run later
  (e.g. after adding a Gemini key) to pick up the remaining entries.

### Using it as a GitHub Action (recommended)

The repo ships a `workflow_dispatch` workflow at
`.github/workflows/fetch-covers.yml` that runs the pipeline in GitHub's
infrastructure and opens a PR with the results. This is the easy path
if you can't (or don't want to) run it locally.

**One-time setup:**

1. Get a Gemini API key from
   [Google AI Studio](https://aistudio.google.com/app/apikey).
2. In GitHub, go to **Settings → Secrets and variables → Actions →
   New repository secret**, name it `GEMINI_API_KEY`, paste the key,
   save.

**Running it:**

1. Go to **Actions → fetch-covers → Run workflow**.
2. Optionally tweak the inputs:
   - `force` — re-fetch even entries that already have a `coverUrl`
   - `only` — comma-separated stages, e.g. `s1,s2` to skip Gemini
   - `id` — single story id to process
3. Click **Run workflow**.
4. When the job finishes, it opens a PR titled `Auto-fetch covers (run N)`.
5. Review the images in `public/covers/` on the PR, merge when you're
   happy. If something looks off, delete the bad file from the PR
   branch and re-run the workflow.

The workflow skips stages with no output (e.g. `s3` if you haven't set
`GEMINI_API_KEY`). If a run produces no changes, no PR is opened.

### Visual review

The pipeline can't tell a good archive.org cover from a bad one beyond
the "bigger than 5 KB, not called waveform" heuristic, and Wikipedia
lead images vary in quality. After running, scroll through
`public/covers/` with an image viewer and delete anything that looks
off. Re-run the script — it'll pick up the deletions and try the next
source for those entries.
