# PerplexityAI — Write Cover Scene Descriptions for Quondam

You are writing **visual scene descriptions** for 183 bedtime stories in
a children's audio app called **quondam**. These descriptions will be
fed directly into an AI image generator (Recraft) to produce book-cover
illustrations in a pen-and-ink watercolor style inspired by early
Winnie-the-Pooh (E.H. Shepard).

The image generator has NO knowledge of these stories. It only sees
your scene description. If you write "a fable about sour grapes," it
draws generic children. If you write "a red fox standing on hind legs
beneath a vine of fat purple grapes, stretching upward with one paw,
the grapes just out of reach," it draws THAT.

**Your job: for every story, write one rich, painterly scene
description that tells the image generator exactly what to draw.**

---

## Where to find the stories

Read the full catalog from this URL:

```
https://raw.githubusercontent.com/jeromydarling/quondam/main/catalog/catalog.json
```

Each entry has `id`, `title`, `author`, `summary`, and `description`.
Use ALL of those fields to understand the story before writing the scene.

---

## What makes a GREAT coverScene

Each `coverScene` should read like art direction for an illustrator.
Include as many of these as the story supports:

1. **Specific characters with visual details** — "a small brown rabbit
   in a blue jacket," not "a rabbit." "A tall man in a cowboy hat with
   a black mask over his eyes," not "a hero."
2. **A concrete physical setting** — "a moonlit forest clearing with
   silver birch trees," not "a forest." "A dusty western trail at
   sunset," not "outside."
3. **A single clear action or pose** — "kneeling beside a wounded
   traveler," "peering through a cottage window," "running through
   rows of lettuce." Give the characters something to DO.
4. **Key objects that anchor the scene** — "a vine of fat purple
   grapes," "an old red boxcar with its door half open," "a golden
   crown lying on a stone step."
5. **Lighting and mood** — "warm late-afternoon light streaming through
   the trees," "soft gray morning mist," "candlelight from a single
   window."
6. **Composition hint** — "seen from behind as they walk away down the
   path," "close-up of two faces peering through a rain-streaked
   window," "wide view of a tiny figure crossing a vast meadow."

**Do NOT include:**
- The story's title or author (the app already shows those separately)
- Plot summaries or morals ("this teaches us about honesty")
- Abstract concepts ("dramatized with reverence")
- References to audio, radio, recordings, or the medium
- Any text that should appear IN the image (the generator has a
  separate instruction to never add text)

---

## Examples

### GOOD (specific, painterly, visual):

**The Fox and the Grapes** (Aesop):
> A red fox standing on hind legs in a sun-dappled vineyard, one paw
> stretched toward a cluster of fat purple grapes hanging just out of
> reach from a wooden trellis. The fox's expression is determined, its
> tail curled behind it. Warm golden afternoon light.

**Hansel and Gretel** (Brothers Grimm):
> Two small children — a boy in a brown cap and a girl with braids —
> standing hand in hand at the edge of a dark pine forest, staring at a
> small cottage whose walls are made of gingerbread and whose roof is
> frosted with white icing. A faint curl of smoke from the chimney.
> Dusk light, long shadows.

**The Lone Ranger** (radio drama):
> A masked rider on a white horse rearing up on a rocky desert ridge at
> sunset. The rider wears a wide-brimmed hat and a black domino mask.
> Beside him on a paint horse, a man with long dark hair watches the
> horizon. Orange and purple sky behind them, silhouetted cactus.

**The Good Samaritan** (Bible):
> A man in a simple robe kneeling on a dusty road beside a wounded
> traveler, gently lifting the traveler's head. A donkey waits
> patiently nearby. Rocky hillside in the background, warm low sun
> casting long shadows. The kneeling man's face is kind and unhurried.

**Big Jon and Sparkie** (radio show):
> A tall, gentle-looking man sitting on a wooden fence under an oak
> tree, holding a tiny elf on his knee. The elf has pointed ears, a
> green cap, and a mischievous grin. Fireflies glow in the meadow
> behind them. Warm twilight.

**The Boxcar Children: The Flight** (chapter 1):
> Four children walking single-file along a railroad track at dusk —
> the oldest girl carrying a bundle, the oldest boy carrying the
> youngest child on his back, and a middle girl holding a cracked
> teacup. An empty red boxcar sits on a siding in the distance. Warm
> fading light, tall grass on either side of the tracks.

### BAD (vague, abstract, unusable):

- "A story about orphaned children" → what do orphaned children LOOK
  like? Where are they?
- "A beloved Saturday morning children's show" → this describes the
  FORMAT, not a scene
- "Dramatized with reverence" → the generator has no idea what to draw
- "The classic fairy tale brought to life" → means nothing visually
- "Four orphaned children run away" → better, but WHERE? What do they
  look like? What are they carrying?

---

## Output — write directly to the repo

You have write access to `github.com/jeromydarling/quondam`. Do NOT
return a separate JSON file — write the `coverScene` values directly
into `catalog/catalog.json` and open a PR.

**Steps:**

1. Read `catalog/catalog.json` from the `main` branch.
2. For each of the 183 entries in `stories[]`, add a `coverScene`
   field (string) with your visual scene description. Place it right
   after `coverUrl` (or after `relevance` if `coverUrl` is absent).
3. Do not modify any other fields. Do not remove or reorder entries.
4. Commit the updated `catalog/catalog.json` to a new branch
   (e.g. `perplexity/cover-scenes`) and open a PR into `main`.
5. PR title: "Add coverScene descriptions for all 183 entries"

The `coverScene` field is already in the JSON schema
(`catalog/schema.json`) and the TypeScript types
(`src/catalog/types.ts`), so CI will validate your output.

**Length per entry:** 2–4 sentences. Rich enough to paint a mental
picture, short enough for the generator's prompt window (~200 words
max per scene, but 50–100 is ideal).

**Tone:** warm, gentle, slightly old-fashioned — imagine you're
describing a scene to a children's book illustrator in 1926.

---

## Special notes for specific categories

### Radio shows (Big Jon and Sparkie, Lone Ranger, Superman, Sgt. Preston, Let's Pretend, Cinnamon Bear, Greatest Story Ever Told)
These have no book illustrations to reference. Invent a signature
scene for the show based on its characters and setting. For episodic
shows, describe the MAIN CHARACTERS in their iconic setting (not a
specific episode plot), so all episodes of the same show get visually
related covers.

### Multi-chapter books (Boxcar Children ch1-17, Pooh ch1-3, etc.)
Each chapter should have a DIFFERENT scene (depicting that chapter's
key moment), but describe the SAME characters consistently:
- Boxcar Children: four children (oldest girl with dark hair, oldest
  boy, a younger girl, a small boy), simple 1920s-era clothes
- Winnie-the-Pooh: a small round bear in a red shirt, a tiny pink
  piglet, a boy in shorts and a sun hat
- The Lone Ranger: masked rider on a white horse, companion with long
  dark hair on a paint horse

### Bible stories
Describe the scene with historical accuracy but warmth — robes, sandals,
dusty roads, oil lamps, stone buildings. Avoid anything that feels
clinical or academic.

### Fairy tales and fables
Lean into the magical/fantastical elements — enchanted forests, talking
animals, castles, witches' cottages. These are the bread and butter of
the Shepard illustration style.

---

## Verification

Before submitting, confirm:
- [ ] Exactly 183 entries in the JSON object
- [ ] Every key matches a real `id` from the catalog
- [ ] No entry contains the story's title, author name, or the word
      "text" (these get added by the app, not the illustration)
- [ ] No entry references audio, radio, recordings, or broadcasts
- [ ] Every entry has at least one specific character, one setting, and
      one action/pose
- [ ] Bible stories use historically appropriate dress and settings
- [ ] Multi-chapter series describe the same characters consistently
      across chapters (same hair color, same clothing, etc.)
