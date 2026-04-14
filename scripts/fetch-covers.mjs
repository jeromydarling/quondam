#!/usr/bin/env node
/**
 * quondam — cover fetch pipeline
 *
 * Walks catalog/catalog.json, finds entries without a coverUrl, and tries
 * three sources in order per entry:
 *
 *   1. archive.org — the item's own file listing (via
 *      https://archive.org/metadata/{identifier}). This is different from
 *      the services/img thumbnail — it can find real uploaded cover art
 *      that the thumbnail endpoint misses, and it will not return a
 *      waveform.
 *
 *   2. Wikipedia REST — the page summary endpoint
 *      https://en.wikipedia.org/api/rest_v1/page/summary/{title}. Returns
 *      originalimage.source for most books, radio shows, and films with a
 *      Wikipedia article. We try bare title, "Title (book)",
 *      "Title (radio program)", and "Title (story)" variants.
 *
 *   3. Gemini 2.5 Flash Image (a.k.a. "Nano Banana") — only runs if
 *      GEMINI_API_KEY is set in the environment. Generates a warm
 *      hand-drawn children's-storybook cover. Skipped entirely if the key
 *      is missing — the entry's coverUrl stays null and BookCover falls
 *      through to the generated SVG.
 *
 * For every entry where a cover is found, the image is written to
 * public/covers/{story-id}.jpg and the catalog entry's coverUrl is set to
 * "covers/{story-id}.jpg" (a relative path that BookCover resolves against
 * Vite's BASE_URL at render time — see src/lib/coverUrl.ts).
 *
 * Idempotent: running again is a no-op for entries that already have a
 * coverUrl set. Failed lookups are logged and skipped; re-run after
 * adding a Gemini key to pick up the rest.
 *
 * Usage:
 *   node scripts/fetch-covers.mjs              # stages 1+2 only
 *   GEMINI_API_KEY=... node scripts/fetch-covers.mjs  # + stage 3
 *   node scripts/fetch-covers.mjs --only s1,s2 # skip Gemini
 *   node scripts/fetch-covers.mjs --id librivox-aesop-fables  # one entry
 *   node scripts/fetch-covers.mjs --dry-run    # don't write anything
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(REPO_ROOT, "catalog/catalog.json");
const COVERS_DIR = path.join(REPO_ROOT, "public/covers");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const USER_AGENT =
  "quondam-cover-pipeline/1.0 (+https://github.com/jeromydarling/quondam)";

// ---------- CLI args ----------
const args = parseArgs(process.argv.slice(2));

async function main() {
  const catalogRaw = await readFile(CATALOG_PATH, "utf-8");
  const catalog = JSON.parse(catalogRaw);

  if (!args.dryRun) await mkdir(COVERS_DIR, { recursive: true });

  const stories = args.id
    ? catalog.stories.filter((s) => s.id === args.id)
    : catalog.stories;

  if (args.id && stories.length === 0) {
    console.error(`No story found with id ${args.id}`);
    process.exit(1);
  }

  const stats = { updated: 0, skipped: 0, failed: 0, stage: {} };

  for (const story of stories) {
    if (story.coverUrl && !args.force) {
      stats.skipped++;
      continue;
    }

    const localName = `${story.id}.jpg`;
    const localPath = path.join(COVERS_DIR, localName);

    // If we already have a local file for this story, just wire up the
    // catalog reference and move on.
    if (existsSync(localPath) && !args.force) {
      if (!args.dryRun) story.coverUrl = `covers/${localName}`;
      stats.updated++;
      stats.stage.localExisting = (stats.stage.localExisting || 0) + 1;
      console.log(`[${story.id}] already local → covers/${localName}`);
      continue;
    }

    console.log(`[${story.id}] "${story.title}" — searching…`);

    let result = null;

    if (args.stages.includes("s1")) {
      result = await tryArchiveOrgCover(story);
      if (result) result.stage = "archive.org";
    }
    if (!result && args.stages.includes("s2")) {
      result = await tryWikipediaCover(story);
      if (result) result.stage = "wikipedia";
    }
    if (!result && args.stages.includes("s3") && GEMINI_API_KEY) {
      result = await tryGeminiCover(story);
      if (result) result.stage = "gemini";
    }

    if (result) {
      if (!args.dryRun) {
        await writeFile(localPath, result.buffer);
        story.coverUrl = `covers/${localName}`;
      }
      console.log(`  ✓ ${result.stage} — ${result.buffer.length} bytes`);
      stats.updated++;
      stats.stage[result.stage] = (stats.stage[result.stage] || 0) + 1;
    } else {
      console.log(`  ✗ no cover found`);
      stats.failed++;
    }

    // Be polite: space out requests so we don't look like a scraper.
    await sleep(400);
  }

  if (!args.dryRun && !args.id) {
    await writeFile(
      CATALOG_PATH,
      JSON.stringify(catalog, null, 2) + "\n",
    );
  }

  console.log("\n────");
  console.log(`updated:  ${stats.updated}`);
  console.log(`skipped:  ${stats.skipped} (already had coverUrl)`);
  console.log(`failed:   ${stats.failed}`);
  if (Object.keys(stats.stage).length > 0) {
    console.log("by source:");
    for (const [k, v] of Object.entries(stats.stage)) {
      console.log(`  ${k}: ${v}`);
    }
  }
  if (args.dryRun) console.log("(dry run — no files written)");
  if (!GEMINI_API_KEY && args.stages.includes("s3")) {
    console.log(
      "\nGemini stage was requested but GEMINI_API_KEY is not set — stage 3 was skipped.",
    );
  }
}

// ---------- Stage 1: archive.org ----------

async function tryArchiveOrgCover(story) {
  const match = story.source.audioUrl.match(
    /https?:\/\/(?:[^/]*\.)?archive\.org\/download\/([^/]+)\//,
  );
  if (!match) return null;
  const identifier = match[1];

  try {
    const metaRes = await fetch(
      `https://archive.org/metadata/${identifier}`,
      { headers: { "user-agent": USER_AGENT } },
    );
    if (!metaRes.ok) return null;
    const meta = await metaRes.json();
    const files = meta.files || [];

    // Look for an uploaded cover image:
    //   - format "JPEG" or "PNG" or "Item Image"
    //   - name doesn't match waveform / spectrogram / derivative patterns
    //   - source == "original" (not a derivative generated by archive.org)
    const candidates = files.filter(
      (f) =>
        (f.format === "JPEG" ||
          f.format === "PNG" ||
          f.format === "Item Image") &&
        !/waveform|spectrogram|__ia_thumb|_thumb\.|_small\./i.test(f.name),
    );
    // Prefer files whose name contains "cover", otherwise the first one.
    const coverFile =
      candidates.find((f) => /cover/i.test(f.name)) || candidates[0];
    if (!coverFile) return null;

    const url = `https://archive.org/download/${identifier}/${encodeURIComponent(coverFile.name)}`;
    const imgRes = await fetch(url, { headers: { "user-agent": USER_AGENT } });
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    // Guard against tiny (under ~5 KB) files that are almost certainly
    // thumbnails or broken.
    if (buffer.length < 5000) return null;
    return { buffer };
  } catch (e) {
    console.log(`  archive.org error: ${e.message}`);
    return null;
  }
}

// ---------- Stage 2: Wikipedia ----------

async function tryWikipediaCover(story) {
  const variants = [
    story.title,
    `${story.title} (book)`,
    `${story.title} (novel)`,
    `${story.title} (short story)`,
    `${story.title} (radio program)`,
    `${story.title} (radio series)`,
  ];

  for (const variant of variants) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        variant.replace(/ /g, "_"),
      )}`;
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      // Skip disambiguation pages.
      if (data.type === "disambiguation") continue;
      const imgUrl = data.originalimage?.source || data.thumbnail?.source;
      if (!imgUrl) continue;
      const imgRes = await fetch(imgUrl, {
        headers: { "user-agent": USER_AGENT },
      });
      if (!imgRes.ok) continue;
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      if (buffer.length < 5000) continue;
      return { buffer };
    } catch {
      // Try next variant
    }
  }
  return null;
}

// ---------- Stage 3: Gemini 2.5 Flash Image ----------

async function tryGeminiCover(story) {
  const moodCues = (story.mood || []).join(", ");
  const prompt = [
    `A warm, hand-drawn illustration in the style of a vintage children's`,
    `storybook cover for "${story.title}" by ${story.author}.`,
    `Painterly, soft edges, warm earth tones, textured paper feel, no text`,
    `and no lettering anywhere in the image.`,
    moodCues ? `Mood: ${moodCues}.` : "",
    `The composition should suit a 2:3 vertical book-cover aspect ratio.`,
  ].join(" ");

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.log(
        `  gemini http ${res.status}: ${body.slice(0, 200).replace(/\n/g, " ")}`,
      );
      return null;
    }
    const data = await res.json();
    const part = data.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData,
    );
    if (!part) return null;
    const buffer = Buffer.from(part.inlineData.data, "base64");
    return { buffer };
  } catch (e) {
    console.log(`  gemini error: ${e.message}`);
    return null;
  }
}

// ---------- helpers ----------

function parseArgs(argv) {
  const out = {
    dryRun: false,
    force: false,
    id: null,
    stages: ["s1", "s2", "s3"],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force") out.force = true;
    else if (a === "--id") out.id = argv[++i];
    else if (a === "--only") out.stages = argv[++i].split(",");
    else if (a === "-h" || a === "--help") {
      console.log(
        "Usage: node scripts/fetch-covers.mjs [--dry-run] [--force] [--id <story-id>] [--only s1,s2,s3]",
      );
      process.exit(0);
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
