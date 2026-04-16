#!/usr/bin/env node
/**
 * Merge a JSON mapping of { storyId: coverScene } into catalog.json.
 *
 * Usage:
 *   node scripts/merge-cover-scenes.mjs cover-scenes.json
 *
 * The input file should be the raw JSON object that Perplexity produces
 * from the prompts/perplexity-cover-scenes.md prompt. Each key is a
 * story id, each value is the coverScene string.
 *
 * Writes the patched catalog.json in place.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, "..", "catalog/catalog.json");

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/merge-cover-scenes.mjs <cover-scenes.json>");
  process.exit(1);
}

const scenesRaw = await readFile(inputPath, "utf-8");
const scenes = JSON.parse(scenesRaw);
const catalogRaw = await readFile(CATALOG_PATH, "utf-8");
const catalog = JSON.parse(catalogRaw);

let matched = 0;
let unmatched = 0;

for (const [id, scene] of Object.entries(scenes)) {
  const story = catalog.stories.find((s) => s.id === id);
  if (!story) {
    console.log(`  ⚠ no catalog entry for id "${id}"`);
    unmatched++;
    continue;
  }
  story.coverScene = scene;
  matched++;
}

await writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
console.log(`\n✓ Merged ${matched} coverScene values into catalog.json`);
if (unmatched > 0) {
  console.log(`  ${unmatched} ids in the input didn't match any catalog entry`);
}
console.log(`\nNext: run the cover pipeline to regenerate with the new scenes:`);
console.log(`  npm run covers -- --force`);
