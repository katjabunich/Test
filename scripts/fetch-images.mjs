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

// Live URL of the production deployment — used to fetch prior manifest
// so we can reuse already-resolved Unsplash URLs across builds (avoids
// the demo API's 50 req/hour rate limit blocking late queries).
const LIVE_URL = 'https://doit-git-claude-recipe-finder-app-fz5bs-katjabunichs-projects.vercel.app/images-manifest.json';

let priorManifest = {};
try {
  const r = await fetch(LIVE_URL, { signal: AbortSignal.timeout(15_000) });
  if (r.ok) {
    priorManifest = await r.json();
    console.log(`Loaded prior manifest from live deploy (${Object.keys(priorManifest).length} entries)`);
  } else {
    console.log(`Prior manifest fetch HTTP ${r.status} — proceeding without cache`);
  }
} catch (e) {
  console.log(`No prior manifest available (${e.name || e.message}) — proceeding without cache`);
}

// Dynamic import of recipes.js (it's an ES module)
const mod = await import(recipesPath);
const recipes = mod.RECIPES;

console.log(`\nfetch-images: ${recipes.length} recipes\n`);

let okCount = 0, failCount = 0, cachedCount = 0;
const failures = [];

const COMMON_HEADERS = {
  'User-Agent': 'recipe-app-build/1.0 (https://github.com/katjabunich/Test; build)',
  'Accept-Language': 'en-US,en;q=0.9',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Resolve `wiki:Article_Title` → real image URL via Wikipedia REST summary API.
// Returns null if article has no image / doesn't exist.
// Search Unsplash for a curated, professional food photo matching a query.
// Returns the URL of the first high-relevance result.
// Fallback key — can move to Vercel env (UNSPLASH_ACCESS_KEY) later
const UNSPLASH_FALLBACK_KEY = 'EzHVfQPa7UaEhWyp_OXjEztr4_QGRxnSQc6kRBhjt90';

async function searchUnsplashImage(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY || UNSPLASH_FALLBACK_KEY;
  if (!key) return null;
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&content_filter=high&orientation=squarish`;
  const res = await fetch(url, {
    headers: {
      ...COMMON_HEADERS,
      Authorization: `Client-ID ${key}`,
      Accept: 'application/json',
      'Accept-Version': 'v1',
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const first = data.results?.[0];
  if (!first) return null;
  return first.urls?.regular || first.urls?.small || null;
}

async function resolveWikiArticleImage(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { ...COMMON_HEADERS, Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.originalimage?.source || data.thumbnail?.source || null;
}

// Search Wikimedia Commons for food photos matching a keyword.
// Returns the URL of the best JPG (highest resolution, not a logo/diagram).
async function searchCommonsImage(query) {
  // Step 1: search files matching the query
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=20&format=json&origin=*`;
  const sRes = await fetch(searchUrl, { headers: COMMON_HEADERS, signal: AbortSignal.timeout(15_000) });
  if (!sRes.ok) return null;
  const sData = await sRes.json();
  const candidates = (sData.query?.search || [])
    .map(r => r.title) // "File:Bolognese.jpg"
    .filter(t => /\.jpe?g$/i.test(t))           // jpgs only
    .filter(t => !/(logo|icon|diagram|map|stamp|chart|seal|coat[_ ]of[_ ]arms)/i.test(t));

  if (!candidates.length) return null;

  // Step 2: get image info (size, dimensions) for top candidates
  const titles = candidates.slice(0, 10).join('|');
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
  const iRes = await fetch(infoUrl, { headers: COMMON_HEADERS, signal: AbortSignal.timeout(15_000) });
  if (!iRes.ok) return null;
  const iData = await iRes.json();
  const pages = Object.values(iData.query?.pages || {});

  // Pick the highest-resolution image with width > 800
  let best = null;
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    if (info.width < 800) continue;
    if (info.size < 50_000) continue; // < 50KB likely junk
    if (!best || info.width > best.width) best = info;
  }
  if (!best) {
    // No high-res candidate. Take whatever's first and reasonably big.
    for (const p of pages) {
      const info = p.imageinfo?.[0];
      if (info && info.size > 20_000) { best = info; break; }
    }
  }
  if (!best) return null;

  // Return a 900px-wide thumbnail URL (Wikimedia auto-generates)
  // best.url is the original. We'll request a thumb to save bandwidth.
  return best.url;
}

// Extract the filename portion from an upload.wikimedia.org URL.
// e.g. .../commons/thumb/a/b/Risotto_alla_milanese.jpg/640px-X.jpg → "Risotto_alla_milanese.jpg"
function fileNameFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/commons\/(?:thumb\/)?[a-f0-9]\/[a-f0-9]{2}\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchImage(url, attempt = 1) {
  const res = await fetch(url, {
    headers: {
      ...COMMON_HEADERS,
      Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8',
    },
    signal: AbortSignal.timeout(20_000),
    redirect: 'follow',
  });
  if (res.status === 429 && attempt <= 3) {
    await sleep(1500 * attempt);
    return fetchImage(url, attempt + 1);
  }
  return res;
}

async function fetchOne(recipe) {
  const dest = join(imagesDir, `${recipe.id}.jpg`);
  const origImage = recipe.image;

  // Cache: skip if already exists and >10KB
  if (existsSync(dest) && statSync(dest).size > 10_000) {
    cachedCount++;
    return { ok: true, recipe, cached: true, source: origImage, resolvedUrl: null, fileName: null };
  }

  let url = recipe.image;
  let wikiArticle = null;
  if (!url || typeof url !== 'string') {
    return { ok: false, recipe, reason: 'no_url', source: origImage };
  }

  // Check prior manifest first — if cached for the same source, use the resolved URL.
  // This avoids hitting the Unsplash API rate limit on every build.
  const prior = priorManifest[recipe.id];
  let resolvedFromCache = false;
  if (prior && prior.ok && prior.source === origImage && prior.resolvedUrl) {
    url = prior.resolvedUrl;
    resolvedFromCache = true;
  }

  try {
    // Resolve prefix only if we don't have a cached URL
    if (!resolvedFromCache) {
      if (url.startsWith('wiki:')) {
        wikiArticle = url.slice(5);
        const resolved = await resolveWikiArticleImage(wikiArticle);
        if (!resolved) {
          return { ok: false, recipe, reason: `wiki_no_image: ${wikiArticle}`, source: origImage };
        }
        url = resolved;
      } else if (url.startsWith('commons:')) {
        const query = url.slice(8);
        const resolved = await searchCommonsImage(query);
        if (!resolved) {
          return { ok: false, recipe, reason: `commons_no_match: ${query}`, source: origImage };
        }
        url = resolved;
      } else if (url.startsWith('unsplash:')) {
        const query = url.slice(9);
        const resolved = await searchUnsplashImage(query);
        if (!resolved) {
          return { ok: false, recipe, reason: `unsplash_no_result_or_no_key: ${query}`, source: origImage };
        }
        url = resolved;
      }
    }

    if (!url.startsWith('http')) {
      return { ok: false, recipe, reason: 'no_url', source: origImage };
    }

    const res = await fetchImage(url);

    if (!res.ok) {
      return { ok: false, recipe, reason: `HTTP ${res.status}`, attemptedUrl: url, source: origImage };
    }

    const ctype = res.headers.get('content-type') || '';
    if (!ctype.startsWith('image/')) {
      return { ok: false, recipe, reason: `not_image: ${ctype}`, attemptedUrl: url, source: origImage };
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) {
      return { ok: false, recipe, reason: `too_small: ${buf.length}B`, attemptedUrl: url, source: origImage };
    }

    writeFileSync(dest, buf);
    return {
      ok: true,
      recipe,
      source: origImage,
      resolvedUrl: url,
      fileName: fileNameFromUrl(url),
      size: buf.length,
      reusedCache: resolvedFromCache,
    };
  } catch (err) {
    return { ok: false, recipe, reason: err.name || err.message, source: origImage };
  }
}

// Manifest of all per-recipe resolutions, written to recipe-app/images-manifest.json
// so we can verify visually via the /audit page in the app.
const manifest = {};

// Process in parallel batches (concurrency=3) with delay between batches to avoid rate limits
const batchSize = 3;
for (let i = 0; i < recipes.length; i += batchSize) {
  const batch = recipes.slice(i, i + batchSize);
  const results = await Promise.all(batch.map(fetchOne));
  for (const r of results) {
    if (r.ok) {
      manifest[r.recipe.id] = {
        ok: true,
        source: r.source,
        resolvedUrl: r.resolvedUrl || null,
        fileName: r.fileName,
        size: r.size || null,
        cached: !!r.cached,
        reusedCache: !!r.reusedCache,
      };
      if (!r.cached) {
        okCount++;
        const marker = r.reusedCache ? '⚡' : '✓';
        process.stdout.write(`${marker} ${r.recipe.id} → ${r.fileName || '(prior cache)'}\n`);
      }
    } else {
      manifest[r.recipe.id] = {
        ok: false,
        source: r.source,
        reason: r.reason,
      };
      failCount++;
      failures.push({ id: r.recipe.id, name: r.recipe.name, reason: r.reason, url: r.attemptedUrl || r.recipe.image });
      process.stdout.write(`✗ ${r.recipe.id}: ${r.reason}\n`);
    }
  }
  await sleep(250);
}

// Detect duplicate filenames — when two recipes resolve to the same Wikipedia file
const byFile = {};
for (const [id, m] of Object.entries(manifest)) {
  if (m.ok && m.fileName) {
    if (!byFile[m.fileName]) byFile[m.fileName] = [];
    byFile[m.fileName].push(id);
  }
}
const dupFiles = Object.entries(byFile).filter(([_, ids]) => ids.length > 1);
if (dupFiles.length) {
  console.log('\n⚠ DUPLICATE WIKIMEDIA FILES (different recipes share same photo):');
  for (const [file, ids] of dupFiles) {
    console.log(`  ${file}:`);
    ids.forEach(id => console.log(`    - ${id}`));
  }
}

// Write the manifest so the audit page can render it
writeFileSync(join(repoRoot, 'recipe-app/images-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nManifest written: recipe-app/images-manifest.json (${Object.keys(manifest).length} entries)`);

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
