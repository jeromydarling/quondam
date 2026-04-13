# PerplexityAI Computer — Quondam Curator Brief

You are the content curator for **quondam**, a calm bedtime-story web app for parents at `github.com/jeromydarling/quondam` (live at https://jeromydarling.github.io/quondam/). Your job is to find public-domain children's audio and produce JSON entries that drop straight into `catalog/catalog.json`.

**The binding contract is `catalog/CURATION.md` in the repo.** Read it first. It documents the sourcing rules, the loudness recipe, the controlled vocabularies, the ID rules, and the PR workflow in full. This brief is the operational batch task; CURATION.md is the rulebook.

---

## Output format (binding)

Each entry is a JSON object inside `catalog.json`'s `stories` array. The exact shape is enforced by `catalog/schema.json` and validated in CI by `npm run validate:catalog`. Here is one valid entry, copy-able:

```json
{
  "id": "librivox-aesop-the-fox-and-the-grapes",
  "title": "The Fox and the Grapes",
  "author": "Aesop",
  "summary": "A short fable about a fox who decides the grapes he cannot reach must be sour anyway.",
  "description": "One of Aesop's shortest and most enduring fables. A hungry fox spies a bunch of ripe grapes hanging from a vine, leaps for them again and again, and finally walks away muttering that they were probably sour to begin with. From this little story we get the everyday phrase 'sour grapes' — the way we dismiss the things we cannot have.",
  "authorBio": "Aesop is the legendary author of the world's most famous collection of fables. Whether he was a real person — possibly a Greek storyteller and slave living in the 6th century BCE — or a name later attached to a tradition of folk wisdom, the fables themselves have shaped storytelling for more than two thousand years.",
  "relevance": "Aesop's fables are usually a child's first taste of stories that come with a quiet lesson tucked inside. They're short enough for a tired parent and a tireder child, and they leave room to talk afterward.",
  "coverUrl": "https://raw.githubusercontent.com/standardebooks/aesop_fables_v-s-vernon-jones/master/images/cover.jpg",
  "source": {
    "provider": "librivox",
    "pageUrl": "https://librivox.org/aesops-fables-volume-1-by-aesop/",
    "audioUrl": "https://archive.org/download/aesops_fables_v1_librivox/aesopsfables_001_aesop.mp3",
    "license": "public-domain",
    "attribution": "Public domain"
  },
  "durationSec": 184,
  "lengthBucket": "short",
  "ageBand": "3-6",
  "mood": ["calming", "fairy-tale", "classic"],
  "loudness": {
    "integratedLufs": -22.4,
    "truePeakDbtp": -1.2,
    "targetLufs": -18.0
  },
  "safety": {
    "reviewed": true,
    "reviewer": "perplexity-curator-v1",
    "flags": []
  }
}
```

Series chapters and within-track chapter markers are optional fields (`series`, `chapters`) — see CURATION.md §4a for the shapes.

---

## Batch task

Add **20 new entries** to `catalog/catalog.json`. The catalog currently has 6; you'll be appending. Distribution:

- **8 short fables / picture-book length** (under 10 minutes), age band `3-6`. Looking for: Aesop's Fables individual tales, Beatrix Potter (note: Standard Ebooks may not carry her — fall back to a different cover source if needed), Hans Christian Andersen short tales, Mother Goose nursery rhymes, fables from world traditions.
- **8 first-chapter openings** of classic children's novels (10-30 minutes), age band `6-9`. Looking for: Just So Stories (more chapters beyond "How the Whale Got His Throat"), Alice's Adventures in Wonderland (chapters 2+), The Wind in the Willows (chapters 2+), The Jungle Book (chapters 2+), The Secret Garden (chapters 2+), E. Nesbit (Five Children and It, The Railway Children), J.M. Barrie's Peter and Wendy.
- **4 longer chapter readings** (30+ minutes), age band `9-12`. Looking for: The Wind in the Willows later chapters, A Little Princess, Little Women, Anne of Green Gables, Treasure Island.

**Mix the moods.** Don't tag everything `calming` — reserve that for genuinely soothing material. The full vocabulary in CURATION.md §4: `calming`, `adventurous`, `funny`, `fairy-tale`, `nature`, `classic`. Use 1–3 moods per story.

Avoid duplicates with the existing 6 entries: Aesop's Fox and the Grapes, How the Whale Got His Throat (chapter 1), The Wind in the Willows chapter 1, Alice in Wonderland chapter 1, The Jungle Book Mowgli's Brothers, The Secret Garden chapter 1.

---

## Sources (allow-list, exclusive)

### Audio
- **librivox.org** and **archive.org** only.
- **Public domain only.** Reject CC-BY etc.
- Both URLs are required:
  - `pageUrl` — the human-readable LibriVox or Archive page
  - `audioUrl` — a direct streamable mp3, almost always under `https://archive.org/download/...`

### Cover art
- **github.com/standardebooks** repos via `raw.githubusercontent.com` URL. Standard Ebooks publishes high-quality CC0 cover art for many classics. Search the org by author/title; the convention is `/{slug}/master/images/cover.jpg`. **Verify each URL returns HTTP 200 before adding it.**
- If Standard Ebooks doesn't carry a title, leave `coverUrl` unset — the player generates a beautiful SVG fallback from the title.

### CORS check (mandatory for every audio URL)

Before adding a track, verify the audio URL serves CORS headers:

```
curl -sI "https://archive.org/download/.../track.mp3" | grep -i access-control
```

Archive.org does this by default but check anyway. **Skip any track that fails** — the Web Audio engine cannot process tainted streams.

---

## Loudness measurement (mandatory, per-entry)

For each track, run on the actual mp3:

```
ffmpeg -hide_banner -nostats -i input.mp3 -af ebur128=peak=true -f null -
```

The summary at the end of stderr looks like:

```
[Parsed_ebur128_0 @ 0x...] Summary:
  Integrated loudness:
    I:         -22.4 LUFS
    Threshold: -32.6 LUFS
  ...
  True peak:
    Peak:       -1.2 dBFS
```

Record:
- `loudness.integratedLufs` ← the `I:` value (negative number, typically -26 to -12)
- `loudness.truePeakDbtp` ← the `Peak:` value (also negative, typically -3 to -0.1)
- `loudness.targetLufs` ← always `-18.0` (the bedtime target — quieter than broadcast -23 and well below streaming -14)

**Do not invent these numbers.** Measure each file. The player applies real per-track gain based on these values.

---

## Content filter (strict — be conservative)

Reject anything with:

- Graphic violence, on-page death described in detail, body horror
- Sexual content of any kind
- Adult language
- Religious or political proselytizing (folk tales mentioning gods or rituals are fine; sermons are not)
- Racial caricature or slurs (a surprising amount of early-20th-century public-domain material has these — read carefully)
- Long classroom-style introductions, ads, or broken/test recordings

Borderline content goes in `safety.flags`, not silently in. Acceptable flag values:

- `mild-peril` — chase scenes, near-misses, age-appropriate suspense
- `sad-opening` — orphaning, loss in the first chapter
- `older-language` — archaic words a young child won't understand without help

If a track needs more than two flags **or any flag involving violence/fear**, do not include it.

Each entry must set:

```json
"safety": {
  "reviewed": true,
  "reviewer": "perplexity-curator-v1",
  "flags": []
}
```

---

## Required fields per entry (recap)

| Field | Required? | Notes |
|---|---|---|
| `id` | ✅ | `{provider}-{author-slug}-{title-slug}`, lowercase ASCII, hyphenated. **Stable forever** (resume/favorites depend on it). For chapters: append `-ch{N}`. |
| `title` | ✅ | |
| `author` | ✅ | Canonical author name, drop honorifics |
| `summary` | ⭐ | 1 sentence, verb-first, no spoilers. Shown on library cards. |
| `description` | ⭐ | 1–3 paragraphs in a warm, parental voice. Set the mood, don't recap the plot. |
| `authorBio` | ⭐ | 2–4 factual sentences |
| `relevance` | ⭐ | 1–2 sentences on why this story for *bedtime*, *for this child*. Not a general review. |
| `coverUrl` | ⭐ | Standard Ebooks raw URL, verified 200. Omit if no cover available. |
| `source.provider` | ✅ | `librivox` or `archive` |
| `source.pageUrl` | ✅ | Human-readable LibriVox/Archive page |
| `source.audioUrl` | ✅ | Direct mp3 URL, CORS-checked |
| `source.license` | ✅ | Always `"public-domain"` |
| `source.attribution` | ✅ | Always `"Public domain"` (the player does not display source/narrator promotions) |
| `durationSec` | ✅ | Integer seconds, from the actual track |
| `lengthBucket` | ✅ | `short` (<10m) / `medium` (10-30m) / `long` (30m+). Must agree with `durationSec`. |
| `ageBand` | ✅ | `0-3` / `3-6` / `6-9` / `9-12` |
| `mood` | ✅ | Array of 1+ from controlled vocab |
| `loudness.*` | ✅ | Measured EBU R128 values |
| `safety.*` | ✅ | reviewed: true, reviewer: "perplexity-curator-v1", flags: [...] |
| `narrator` | optional | Real human name only — generic group credits like "LibriVox Volunteers" should be omitted |
| `series` | optional | For chapter readings — see CURATION.md §4a. Has `id`, `name`, `order`, `totalParts`, `nextTeaser`. |
| `chapters` | optional | For multi-chapter audio files (rare). |
| `restoration` | optional | For tracks with audible tape hiss — `{ hissLevel: "low"|"high", suggestDenoise: true }`. The player auto-engages the hiss reducer for these. |

⭐ = strongly encouraged, not enforced by schema. Empty entries look bare in the UI; the player is built around rich metadata.

---

## Per-entry verification checklist

- [ ] `coverUrl` returns 200 from Standard Ebooks (or omitted)
- [ ] `audioUrl` returns 200 AND serves CORS headers
- [ ] LUFS measurements taken from the **actual file**, not invented
- [ ] `description` / `authorBio` / `relevance` are written, not boilerplate
- [ ] `mood` matches the actual content
- [ ] `safety.flags` lists every concern (or is empty)
- [ ] `id` is unique within the catalog and follows the slug pattern
- [ ] `lengthBucket` matches `durationSec`

## Per-batch checklist

- [ ] `npm run validate:catalog` passes locally before submitting
- [ ] `generatedAt` bumped to current ISO 8601 UTC timestamp
- [ ] No duplicate IDs across the whole catalog
- [ ] Stories appended (not replacing existing entries)

## Submission

Open one PR to `main` with all 20 entries in a single commit. CI runs typecheck, lint, tests, schema validation, and build. If anything is red, fix and re-push to the same branch — do not open a new PR per fix.

The reviewer will spot-check 2–3 random entries: click `pageUrl`, verify the cover, sanity-check the loudness numbers, listen to 30 seconds of audio. Then squash-merge.
