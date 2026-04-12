# Quondam Curation Brief

This document is the contract for whoever (or whatever) writes
`catalog/catalog.json`. In v1 the curator is **PerplexityAI Computer**. The
goal is a small, trustworthy library of bedtime-appropriate public-domain
audio with consistent loudness and clean metadata.

If you can read this doc and produce a valid catalog entry without asking
follow-up questions, the doc is doing its job. If you can't, file an issue.

---

## 1. Sourcing rules

- **Allowed sources only:** `archive.org` and `librivox.org`. Nothing else.
- **License:** must be public domain. If a recording is CC-BY or similar,
  it does not qualify for v1.
- **Both URLs are required:**
  - `pageUrl` — the human-facing page on librivox.org or archive.org.
  - `audioUrl` — a directly streamable MP3/M4A URL (almost always under
    `https://archive.org/download/...`).
- **CORS check (mandatory):** before adding a track, verify the audio URL
  serves a `Access-Control-Allow-Origin` header. Archive.org does this by
  default, but check anyway:

  ```
  curl -sI "https://archive.org/download/.../track.mp3" | grep -i access-control
  ```

  If it's missing, the Web Audio engine cannot process the stream. **Skip
  the track.** Do not silently include CORS-broken audio.

---

## 2. Content filter

The library is for parents reading to small children at bedtime. Reject
anything that has:

- Graphic violence, on-page death described in detail, body horror.
- Sexual content of any kind.
- Adult language.
- Religious or political proselytizing. Folk tales that mention gods or
  rituals as part of the story are fine; sermons are not.
- Racial caricature or slurs (a surprising amount of early-20th-century
  public-domain material has these — read carefully).
- Long classroom-style introductions, ads, or broken/test recordings.

**Borderline content goes in `safety.flags`, not silently in.** Examples:

- `mild-peril` — Peter Rabbit nearly gets caught in the garden.
- `sad-ending` — The Little Match Girl.
- `older-language` — archaic words a young child won't understand without
  help.

Each entry must set `safety.reviewed: true` and a `safety.reviewer`
identifier (e.g. `perplexity-curator-v1`). If a track requires more than
two flags or any flag involving violence/fear, **don't include it**.

---

## 3. Loudness measurement

This is the core reason quondam exists. We measure each track once at
ingestion and let the player apply a per-track gain at runtime so volume
is consistent night to night.

Use ffmpeg's EBU R128 filter:

```
ffmpeg -hide_banner -nostats -i input.mp3 -af ebur128=peak=true -f null -
```

The relevant lines in stderr at the end look like:

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

- `loudness.integratedLufs` ← the `I:` value (a negative number, typically
  `-26` to `-12`).
- `loudness.truePeakDbtp` ← the `Peak:` value (also negative, typically
  `-3` to `-0.1`).
- `loudness.targetLufs` ← `-18.0` for v1. (Quieter than broadcast `-23`
  and well below streaming `-14` — appropriate for bedtime.)

The player computes per-track gain as
`clamp(targetLufs - integratedLufs, -12, +12) dB` and rides it through a
brick-wall limiter at -1 dBFS.

---

## 4. Categorization vocabulary

**Closed sets — adding new values requires updating both `schema.json` and
`src/catalog/types.ts`. Do not invent values.**

### `ageBand`

| Value | Meaning |
|---|---|
| `0-3` | Lullabies, very simple repetition, no narrative tension. |
| `3-6` | Picture-book level fables, short fairy tales, gentle adventures. |
| `6-9` | Chapter books, longer fairy tales, more complex plots. |
| `9-12` | Classic novels, mythology, longer-form storytelling. |

### `lengthBucket`

| Value | Range |
|---|---|
| `short` | < 10 minutes |
| `medium` | 10–30 minutes |
| `long` | 30 minutes+ |

`lengthBucket` must agree with `durationSec`. CI does not enforce this; the
reviewer should spot-check.

### `mood` (array, ≥1, controlled vocabulary)

| Value | When to use |
|---|---|
| `calming` | Slow pacing, no jump scares or shouting. The default for bedtime. |
| `adventurous` | Light peril, journey/quest structure, but still age-appropriate. |
| `funny` | Wordplay, comic situations, gentle humor. |
| `fairy-tale` | Recognizable fairy-tale tropes (princes, witches, talking animals). |
| `nature` | Animals, weather, the outdoors as a major character. |
| `classic` | Canonical children's literature (Aesop, Grimm, Potter, Grahame, Burnett, etc.). |

A story can carry multiple moods. Don't tag everything `calming` — reserve
it for genuinely soothing material.

---

## 4a. Rich metadata (optional but strongly encouraged)

The player's design depends on rich text metadata to feel calm and
beautiful instead of empty. None of these fields are required, but a
catalog entry without them will look bare. Aim to fill them all unless
the work genuinely doesn't merit it.

### `summary` (1 sentence)

A one-line blurb shown on library cards. Verb-first, present tense, no
spoilers. Example:

> "A mischievous young rabbit slips into Mr. McGregor's garden and learns
> why his mother told him not to."

### `description` (1–3 paragraphs)

Long-form description shown on the Player hero. This is where you set the
mood. Tell the parent what the book is *like* — the pacing, the warmth,
the kind of evening it suits. Don't summarize the plot beat by beat.

### `authorBio` (2–4 sentences)

Brief, honest, factual. Birth/death years, nationality, one or two notes
about the work or the life that helps a parent place the author. Avoid
listicle-style accolades.

### `relevance` (1–2 sentences)

Why a parent should pick this book *for bedtime, for this child*. Not a
review of the book in general — a reason to put it in the queue tonight.

### `coverUrl` (URL, optional)

A direct URL to a book-cover image. The player will use it as-is.

**You usually don't need to set this.** The player auto-derives a cover
from the archive.org identifier in `audioUrl` using
`https://archive.org/services/img/{identifier}` — that endpoint returns
the same thumbnail you see on the book's archive.org page, with CORS
headers, for free. Only set `coverUrl` when:

- The auto-derived thumbnail is wrong, ugly, or missing.
- You have a better high-resolution scan from Wikimedia Commons or Open
  Library that's clearly public domain.

If both are missing, the player renders a beautiful generated SVG cover
from the title and a deterministic palette — so it never looks broken.

### `series` (object, optional)

When a story is one chapter of a larger work split across multiple audio
files, group them with `series`. The player uses this to show "Tomorrow
night: ..." with the next chapter's teaser:

```jsonc
"series": {
  "id": "wind-in-the-willows",     // shared across all chapters in the work
  "name": "The Wind in the Willows",
  "order": 1,                       // 1-based
  "totalParts": 12,
  "nextTeaser": "Mole and Ratty pay a visit to the boastful Mr Toad..."
}
```

The `nextTeaser` belongs to *this* chapter (it teases what's next from
here). The very last chapter in a series should omit `nextTeaser`.

### `chapters` (array, optional)

When a *single* audio file contains multiple internal chapters or
sections (e.g. a collection of fables in one mp3), provide markers:

```jsonc
"chapters": [
  { "title": "The Fox and the Grapes", "startSec": 0, "teaser": "Sour grapes." },
  { "title": "The Tortoise and the Hare", "startSec": 184, "teaser": "Slow and steady." }
]
```

The player finds the chapter containing the current playback position
and uses the *next* chapter's teaser as "tomorrow night."

You will rarely need both `series` and `chapters` on the same entry.

---

## 4b. Restoration hint (optional)

Many public-domain recordings — especially older LibriVox volunteer
recordings and Archive.org radio transcriptions — have audible tape hiss or
background noise. The player ships with a "Reduce hiss" toggle backed by a
high-band downward expander. You can hint to the player that a track needs
it via an optional `restoration` block:

```jsonc
"restoration": {
  "hissLevel": "high",        // "none" | "low" | "high"
  "suggestDenoise": true      // auto-engage on first play
}
```

When `suggestDenoise: true`, the player turns the toggle on by default for
that track. The user can still override it (per-story), and the override is
remembered.

**When to set `hissLevel: "high"`:** if you can clearly hear constant tape
hiss in the gaps between sentences during a quiet listen. Don't set it for
the natural quietness of a high-quality recording.

Omit the whole `restoration` block for clean modern recordings.

---

## 5. ID rules

```
{provider}-{author-slug}-{title-slug}
```

- `provider`: `librivox` or `archive`.
- `author-slug`: lowercase, ASCII, hyphenated. Use the canonical author
  name, not the narrator. Drop honorifics.
- `title-slug`: lowercase, ASCII, hyphenated. For chapters, append
  `-ch{N}` or a slugged chapter title.

**IDs are forever.** They're the keys for resume positions and favorites
in localStorage. If you fix a typo in the title, do **not** change the ID.

Examples:

- `librivox-aesop-the-fox-and-the-grapes`
- `librivox-beatrix-potter-the-tale-of-peter-rabbit`
- `librivox-kenneth-grahame-the-wind-in-the-willows-ch1`

---

## 6. PR workflow

1. Branch from `main`.
2. Add or modify entries in `catalog/catalog.json`. One PR may contain a
   batch of entries.
3. Bump `generatedAt` to the current ISO 8601 UTC timestamp.
4. CI runs:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
   - `npm run validate:catalog` — JSON Schema validation against
     `catalog/schema.json`.
5. A human reviewer spot-checks 2–3 random entries: clicks `pageUrl`,
   confirms it matches, sanity-checks the loudness numbers, and listens to
   the first 30 seconds for content vibe.
6. Squash-merge.

---

## 7. Worked example

A complete entry, end to end:

```json
{
  "id": "librivox-aesop-the-fox-and-the-grapes",
  "title": "The Fox and the Grapes",
  "author": "Aesop",
  "narrator": "LibriVox Volunteers",
  "summary": "A short fable about a fox who decides the grapes he cannot reach must be sour anyway.",
  "source": {
    "provider": "librivox",
    "pageUrl": "https://librivox.org/aesops-fables-volume-1-by-aesop/",
    "audioUrl": "https://archive.org/download/aesops_fables_v1_librivox/aesopsfables_001_aesop.mp3",
    "license": "public-domain",
    "attribution": "LibriVox volunteers"
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
