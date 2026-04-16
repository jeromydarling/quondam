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
 *   3. AI generation — only runs if a provider API key is set. Supported
 *      providers, tried in order:
 *        - Recraft         (RECRAFT_API_KEY) — primary choice, tuned for
 *                          the "digital_illustration/hand_drawn" style
 *                          that suits children's-book covers
 *        - Gemini 2.5 Flash Image (GEMINI_API_KEY) — alternative
 *      Skipped entirely if no provider key is set — the entry's coverUrl
 *      stays null and BookCover falls through to the generated SVG.
 *
 * For every entry where a cover is found, the image is written to
 * public/covers/{story-id}.jpg and the catalog entry's coverUrl is set to
 * "covers/{story-id}.jpg" (a relative path that BookCover resolves against
 * Vite's BASE_URL at render time — see src/lib/coverUrl.ts).
 *
 * Idempotent: running again is a no-op for entries that already have a
 * coverUrl set. Failed lookups are logged and skipped; re-run after
 * adding a provider key to pick up the rest.
 *
 * Usage:
 *   node scripts/fetch-covers.mjs              # stages 1+2 only
 *   RECRAFT_API_KEY=... node scripts/fetch-covers.mjs  # + stage 3 via Recraft
 *   GEMINI_API_KEY=...  node scripts/fetch-covers.mjs  # + stage 3 via Gemini
 *   node scripts/fetch-covers.mjs --only s1,s2 # skip AI
 *   node scripts/fetch-covers.mjs --id librivox-aesop-fables  # one entry
 *   node scripts/fetch-covers.mjs --dry-run    # don't write anything
 */

import { readFile, writeFile, mkdir, unlink, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(REPO_ROOT, "catalog/catalog.json");
const COVERS_DIR = path.join(REPO_ROOT, "public/covers");

const RECRAFT_API_KEY = process.env.RECRAFT_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AI_PROVIDER_AVAILABLE = Boolean(RECRAFT_API_KEY || GEMINI_API_KEY);
const USER_AGENT =
  "quondam-cover-pipeline/1.0 (+https://github.com/jeromydarling/quondam)";

// Files smaller than this are almost certainly placeholders / waveforms /
// auto-generated thumbnails rather than real cover art. Bumped from 5 KB
// to 20 KB after the first real run produced lots of 9-11 KB junk files.
const MIN_COVER_BYTES = 20_000;

// Track content hashes seen during a single run so we don't save the same
// image under multiple story IDs (radio shows where many episodes share
// one archive.org item).
const seenHashes = new Set();

function hashBuffer(buf) {
  return createHash("sha1").update(buf).digest("hex");
}

// ---------- CLI args ----------
const args = parseArgs(process.argv.slice(2));

async function main() {
  if (args.audit) {
    return runAudit();
  }

  const catalogRaw = await readFile(CATALOG_PATH, "utf-8");
  const catalog = JSON.parse(catalogRaw);

  if (!args.dryRun) await mkdir(COVERS_DIR, { recursive: true });

  // Pre-load hashes of files already on disk so we don't re-fetch the
  // same content into a different story slot.
  await preloadExistingHashes();

  const stories = args.id
    ? catalog.stories.filter((s) => s.id === args.id)
    : catalog.stories;

  if (args.id && stories.length === 0) {
    console.error(`No story found with id ${args.id}`);
    process.exit(1);
  }

  const stats = { updated: 0, skipped: 0, failed: 0, dedup: 0, stage: {} };

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
    if (!result && args.stages.includes("s3") && AI_PROVIDER_AVAILABLE) {
      // Prefer Recraft when both keys are present — it's tuned for the
      // hand-drawn storybook style we want. Gemini is the fallback.
      if (RECRAFT_API_KEY) {
        result = await tryRecraftCover(story);
        if (result) result.stage = "recraft";
      }
      if (!result && GEMINI_API_KEY) {
        result = await tryGeminiCover(story);
        if (result) result.stage = "gemini";
      }
    }

    // Hash-dedupe within this run: if we've already saved this exact
    // image bytes for another story, skip — it's almost certainly a
    // shared archive.org item placeholder. Force the next stage to
    // produce something unique.
    if (result) {
      const h = hashBuffer(result.buffer);
      if (seenHashes.has(h)) {
        console.log(
          `  ⚠ ${result.stage} returned a duplicate of an earlier cover, skipping`,
        );
        stats.dedup++;
        result = null;
      } else {
        seenHashes.add(h);
      }
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
  console.log(`dedup'd:  ${stats.dedup} (rejected as duplicate of an earlier cover in this run)`);
  console.log(`failed:   ${stats.failed}`);
  if (Object.keys(stats.stage).length > 0) {
    console.log("by source:");
    for (const [k, v] of Object.entries(stats.stage)) {
      console.log(`  ${k}: ${v}`);
    }
  }
  if (args.dryRun) console.log("(dry run — no files written)");
  if (!AI_PROVIDER_AVAILABLE && args.stages.includes("s3")) {
    console.log(
      "\nStage 3 (AI generation) was requested but neither RECRAFT_API_KEY nor GEMINI_API_KEY is set — it was skipped.",
    );
  } else if (args.stages.includes("s3")) {
    const provider = RECRAFT_API_KEY
      ? GEMINI_API_KEY
        ? "recraft (primary) + gemini (fallback)"
        : "recraft"
      : "gemini";
    console.log(`\nAI provider in use: ${provider}`);
  }
}

// ---------- Stage 1: archive.org ----------

// Names that almost always indicate a placeholder, waveform, item logo,
// or auto-generated thumbnail rather than real cover art.
const ARCHIVE_BAD_NAME_RE =
  /waveform|spectrogram|__ia_thumb|_thumb\.|_small\.|playlist|logo|banner|header|screenshot|preview|item_image/i;

// Names that strongly suggest real cover art (used to gate audio items,
// where the default thumbnail is almost always a waveform).
const ARCHIVE_COVER_NAME_RE = /cover|front|poster|jacket|art\b/i;

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
    const mediatype = meta.metadata?.mediatype || "";

    // Look for an uploaded cover image. Filter on:
    //   - format JPEG (we deliberately exclude PNG and Item Image — for
    //     audio items those are almost always placeholder waveforms,
    //     program logos, or banners, never real cover art)
    //   - name doesn't match the placeholder/waveform/thumbnail patterns
    //   - source == "original" preferred (not a derivative auto-generated
    //     by archive.org)
    let candidates = files.filter(
      (f) =>
        f.format === "JPEG" &&
        !ARCHIVE_BAD_NAME_RE.test(f.name),
    );
    // Prefer originals over derivatives.
    const originals = candidates.filter((f) => f.source === "original");
    if (originals.length > 0) candidates = originals;

    // For audio items (radio shows, audiobooks), the default item
    // thumbnail is usually a waveform. Only accept files whose name
    // strongly suggests real cover art. For non-audio items we're more
    // permissive.
    if (mediatype === "audio") {
      candidates = candidates.filter((f) => ARCHIVE_COVER_NAME_RE.test(f.name));
    }

    // Prefer files whose name contains "cover".
    const coverFile =
      candidates.find((f) => /cover/i.test(f.name)) || candidates[0];
    if (!coverFile) return null;

    const url = `https://archive.org/download/${identifier}/${encodeURIComponent(coverFile.name)}`;
    const imgRes = await fetch(url, { headers: { "user-agent": USER_AGENT } });
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    // Guard against tiny files that are almost certainly thumbnails,
    // waveforms, or broken responses.
    if (buffer.length < MIN_COVER_BYTES) return null;
    // Guard against the archive.org-serves-PNG-bytes-for-a-jpg-named-file
    // case. We only want real JPEGs because we save as {story-id}.jpg.
    if (!isJpegBuffer(buffer)) return null;
    return { buffer };
  } catch (e) {
    console.log(`  archive.org error: ${e.message}`);
    return null;
  }
}

/** Pure: returns true iff the buffer's magic bytes are a JPEG SOI marker. */
function isJpegBuffer(buf) {
  return buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;
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
      if (buffer.length < MIN_COVER_BYTES) continue;
      return { buffer };
    } catch {
      // Try next variant
    }
  }
  return null;
}

// ---------- Stage 3: AI generation ----------
//
// Two providers supported. Recraft is the primary — its hand-drawn
// illustration sub-style is a near-perfect match for our bedtime
// aesthetic, and the API is simpler (returns a URL; we download). Gemini
// is an alternative. If both keys are set, Recraft runs first and Gemini
// only fills in when Recraft fails.

function buildCoverPrompt(story) {
  const moodCues = (story.mood || []).join(", ");
  return [
    `A warm, hand-drawn illustration in the style of a vintage children's`,
    `storybook cover for "${story.title}" by ${story.author}.`,
    `Painterly, soft edges, warm earth tones, textured paper feel, no text`,
    `and no lettering anywhere in the image.`,
    moodCues ? `Mood: ${moodCues}.` : "",
    `The composition should suit a 2:3 vertical book-cover aspect ratio.`,
  ]
    .filter(Boolean)
    .join(" ");
}

// Recraft

async function tryRecraftCover(story) {
  const prompt = buildCoverPrompt(story);
  try {
    const res = await fetch(
      "https://external.api.recraft.ai/v1/images/generations",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${RECRAFT_API_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          style: "digital_illustration",
          substyle: "hand_drawn",
          size: "1024x1365", // ~3:4 — closest Recraft offers to 2:3
          n: 1,
          response_format: "url",
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      console.log(
        `  recraft http ${res.status}: ${body.slice(0, 200).replace(/\n/g, " ")}`,
      );
      return null;
    }
    const data = await res.json();
    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) {
      console.log(`  recraft: no image url in response`);
      return null;
    }
    // Download the returned image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.log(`  recraft download failed: ${imgRes.status}`);
      return null;
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length < MIN_COVER_BYTES) {
      console.log(`  recraft returned a suspiciously tiny file, skipping`);
      return null;
    }
    return { buffer };
  } catch (e) {
    console.log(`  recraft error: ${e.message}`);
    return null;
  }
}

// Gemini 2.5 Flash Image

async function tryGeminiCover(story) {
  const prompt = buildCoverPrompt(story);

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

// ---------- Audit mode ----------
//
// `node scripts/fetch-covers.mjs --audit` walks public/covers/ and removes
// any file that's:
//   - smaller than MIN_COVER_BYTES (likely a placeholder / waveform)
//   - byte-for-byte identical to an earlier file (duplicate from a shared
//     archive.org item)
//
// For every removed file, the corresponding catalog entry's coverUrl is
// cleared so the next pipeline run will re-attempt that entry through
// stages 2 (Wikipedia) and 3 (Recraft / Gemini).
//
// Useful after a workflow run that pulled too aggressively from
// archive.org. Doesn't make any network requests.

async function runAudit() {
  console.log("Auditing public/covers/ ...\n");
  const catalogRaw = await readFile(CATALOG_PATH, "utf-8");
  const catalog = JSON.parse(catalogRaw);

  const files = (await readdir(COVERS_DIR))
    .filter((f) => f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".png"))
    .sort();

  // Hash every file to find duplicates.
  const seen = new Map(); // hash → first filename that had it
  const remove = []; // { name, reason }

  for (const name of files) {
    const fp = path.join(COVERS_DIR, name);
    const buf = await readFile(fp);
    const size = buf.length;
    const h = hashBuffer(buf);

    if (size < MIN_COVER_BYTES) {
      remove.push({ name, reason: `size ${size}B < ${MIN_COVER_BYTES}B` });
      continue;
    }
    // We save covers as {story-id}.jpg, so anything that isn't a real
    // JPEG is either a thumbnail PNG, a logo, a placeholder served with
    // the wrong content-type, or a WebP that's pretending to be a JPG.
    // Reject all of them — the next workflow run will re-attempt these
    // entries via stages 2 / 3.
    if (name.toLowerCase().endsWith(".jpg") && !isJpegBuffer(buf)) {
      const magic = buf.slice(0, 4).toString("hex");
      remove.push({
        name,
        reason: `not a real JPEG (magic=${magic})`,
      });
      continue;
    }
    const earlier = seen.get(h);
    if (earlier) {
      remove.push({ name, reason: `duplicate of ${earlier}` });
      continue;
    }
    seen.set(h, name);
  }

  if (remove.length === 0) {
    console.log(`All ${files.length} cover files passed the audit.`);
    return;
  }

  console.log(`Of ${files.length} files, ${remove.length} flagged for removal:\n`);
  for (const { name, reason } of remove.slice(0, 20)) {
    console.log(`  ${name}  (${reason})`);
  }
  if (remove.length > 20) {
    console.log(`  ... and ${remove.length - 20} more`);
  }

  if (args.dryRun) {
    console.log("\n(dry run — no files deleted, catalog unchanged)");
    return;
  }

  // Build a set of story IDs whose coverUrl needs clearing.
  const removedIds = new Set(
    remove.map((r) => r.name.replace(/\.(jpg|png)$/i, "")),
  );

  // Delete files
  for (const { name } of remove) {
    await unlink(path.join(COVERS_DIR, name));
  }

  // Clear catalog coverUrl for the affected stories
  let cleared = 0;
  for (const story of catalog.stories) {
    if (removedIds.has(story.id) && story.coverUrl) {
      delete story.coverUrl;
      cleared++;
    }
  }

  await writeFile(
    CATALOG_PATH,
    JSON.stringify(catalog, null, 2) + "\n",
  );

  console.log(
    `\n✓ Removed ${remove.length} files; cleared ${cleared} catalog coverUrl entries.`,
  );
  console.log(
    `Re-run the workflow to fill in the gaps via stages 2 and 3.`,
  );
}

// Pre-load hashes of files already on disk so we don't re-fetch the same
// content into a different story slot.
async function preloadExistingHashes() {
  if (!existsSync(COVERS_DIR)) return;
  const files = await readdir(COVERS_DIR);
  for (const name of files) {
    if (!/\.(jpg|png)$/i.test(name)) continue;
    try {
      const buf = await readFile(path.join(COVERS_DIR, name));
      seenHashes.add(hashBuffer(buf));
    } catch {
      // ignore unreadable files
    }
  }
}

// ---------- helpers ----------

function parseArgs(argv) {
  const out = {
    dryRun: false,
    force: false,
    id: null,
    audit: false,
    stages: ["s1", "s2", "s3"],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force") out.force = true;
    else if (a === "--audit") out.audit = true;
    else if (a === "--id") out.id = argv[++i];
    else if (a === "--only") out.stages = argv[++i].split(",");
    else if (a === "-h" || a === "--help") {
      console.log(
        "Usage:\n" +
          "  node scripts/fetch-covers.mjs [--dry-run] [--force] [--id <story-id>] [--only s1,s2,s3]\n" +
          "  node scripts/fetch-covers.mjs --audit [--dry-run]    # prune duplicates and tiny files",
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
