// Image fetcher — runs at Vercel build time.
// For each recipe, downloads its image URL and saves to recipe-app/images/{id}.jpg
// Logs which succeeded vs failed. Does NOT hard-fail on first pass (diagnostic mode).
// After fixing all broken URLs, set STRICT=true to make build fail if any image is missing.

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const STRICT = process.env.STRICT === '1';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const recipesPath = join(repoRoot, 'recipe-app/recipes.js');
const imagesDir = join(repoRoot, 'recipe-app/images');

mkdirSync(imagesDir, { recursive: true });

// Dynamic import of recipes.js (it's an ES module)
const mod = await import(recipesPath);
const recipes = mod.RECIPES;

console.log(`\nfetch-images: ${recipes.length} recipes\n`);

let okCount = 0, failCount = 0, cachedCount = 0;
const failures = [];

async function fetchOne(recipe) {
  const dest = join(imagesDir, `${recipe.id}.jpg`);

  // Cache: skip if already exists and >10KB
  if (existsSync(dest) && statSync(dest).size > 10_000) {
    cachedCount++;
    return { ok: true, recipe, cached: true };
  }

  const url = recipe.image;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { ok: false, recipe, reason: 'no_url' };
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; recipe-app-build/1.0)',
        'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://recipe-app.local/',
      },
      signal: AbortSignal.timeout(20_000),
      redirect: 'follow',
    });

    if (!res.ok) {
      return { ok: false, recipe, reason: `HTTP ${res.status}` };
    }

    const ctype = res.headers.get('content-type') || '';
    if (!ctype.startsWith('image/')) {
      return { ok: false, recipe, reason: `not_image: ${ctype}` };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) {
      return { ok: false, recipe, reason: `too_small: ${buf.length}B` };
    }

    writeFileSync(dest, buf);
    return { ok: true, recipe };
  } catch (err) {
    return { ok: false, recipe, reason: err.name || err.message };
  }
}

// Process in parallel batches (concurrency=8)
const batchSize = 8;
for (let i = 0; i < recipes.length; i += batchSize) {
  const batch = recipes.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(fetchOne));
  for (const r of results) {
    if (r.ok) {
      if (!r.cached) {
        okCount++;
        process.stdout.write(`✓ ${r.recipe.id}\n`);
      }
    } else {
      failCount++;
      failures.push({ id: r.recipe.id, name: r.recipe.name, reason: r.reason, url: r.recipe.image });
      process.stdout.write(`✗ ${r.recipe.id}: ${r.reason}\n`);
    }
  }
}

console.log(`\n────────────────────────`);
console.log(`Cached: ${cachedCount}`);
console.log(`Downloaded: ${okCount}`);
console.log(`Failed:    ${failCount}`);
console.log(`────────────────────────\n`);

if (failures.length > 0) {
  console.log('\nFailed images (need Wikimedia replacement or removal):');
  for (const f of failures) {
    console.log(`  - ${f.id} (${f.name}): ${f.reason}`);
    console.log(`    url: ${f.url}`);
  }
  console.log('');
}

if (STRICT && failCount > 0) {
  console.error(`\nSTRICT mode: failing build due to ${failCount} missing images.`);
  process.exit(1);
}

console.log('Continuing build. Failed images will use remote fallback at runtime.');
process.exit(0);
