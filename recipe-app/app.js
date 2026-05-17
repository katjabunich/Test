import { RECIPES, RECIPE_BY_ID, CUISINE_LABELS, CATEGORIES } from './recipes.js';
import { SYNONYMS, FEELINGS } from './synonyms.js';

// ============================================================
// State (localStorage)
// ============================================================

const LS_FAV = 'recipes.favorites';
const LS_SHOP = 'recipes.shopping';
const LS_SEEN = 'recipes.lastSeen';
const LS_SKIP = 'recipes.skipped';

const state = {
  favorites: loadJSON(LS_FAV, []),
  shopping: loadJSON(LS_SHOP, []),
  lastSeen: loadJSON(LS_SEEN, []),
  skipped: loadJSON(LS_SKIP, []),
};

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function isFav(id) { return state.favorites.includes(id); }

function toggleFav(id) {
  if (isFav(id)) state.favorites = state.favorites.filter(x => x !== id);
  else state.favorites = [id, ...state.favorites];
  saveJSON(LS_FAV, state.favorites);
  updateBadge();
}

function isSkipped(id) { return state.skipped.includes(id); }

function skipRecipe(id) {
  if (!isSkipped(id)) {
    state.skipped = [id, ...state.skipped];
    saveJSON(LS_SKIP, state.skipped);
  }
}

function unskipRecipe(id) {
  state.skipped = state.skipped.filter(x => x !== id);
  saveJSON(LS_SKIP, state.skipped);
}

// Active recipe pool — excludes skipped
function activeRecipes() {
  return RECIPES.filter(r => !isSkipped(r.id));
}

function addRecipeToShopping(id) {
  const r = RECIPE_BY_ID[id];
  if (!r) return;
  const additions = r.ingredients.map(ing => ({
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    category: ing.category,
    sourceRecipeId: id,
    sourceRecipeName: r.name,
    checked: false,
    addedAt: Date.now(),
  }));
  state.shopping = [...state.shopping, ...additions];
  saveJSON(LS_SHOP, state.shopping);
  updateBadge();
}

function toggleShopItem(idx) {
  state.shopping[idx].checked = !state.shopping[idx].checked;
  saveJSON(LS_SHOP, state.shopping);
}

function clearChecked() {
  state.shopping = state.shopping.filter(i => !i.checked);
  saveJSON(LS_SHOP, state.shopping);
  updateBadge();
}

function clearShopping() {
  state.shopping = [];
  saveJSON(LS_SHOP, state.shopping);
  updateBadge();
}

function markSeen(id) {
  state.lastSeen = [id, ...state.lastSeen.filter(x => x !== id)].slice(0, 12);
  saveJSON(LS_SEEN, state.lastSeen);
}

function updateBadge() {
  const setBadge = (el, count) => {
    if (!el) return;
    if (count > 0) { el.hidden = false; el.textContent = count > 99 ? '99+' : count; }
    else el.hidden = true;
  };
  const shopCount = state.shopping.filter(i => !i.checked).length;
  const favCount = state.favorites.length;
  setBadge(document.getElementById('shop-badge'), shopCount);
  setBadge(document.getElementById('bnav-shop-badge'), shopCount);
  setBadge(document.getElementById('bnav-fav-badge'), favCount);
}

// ============================================================
// Similarity engine
// ============================================================

function tagsOf(r) {
  return new Set([
    r.cuisine,
    r.protein,
    ...(r.moods || []),
    ...(r.textures || []),
    ...(r.sauceChar || []),
    ...(r.cookingMethod || []),
    ...(r.keyIngredients || []),
  ]);
}

function expandQueryTags(q) {
  const lower = q.toLowerCase().trim();
  const tags = new Set();
  if (!lower) return tags;
  for (const key in SYNONYMS) {
    if (lower.includes(key)) {
      for (const t of SYNONYMS[key]) tags.add(t);
    }
  }
  return tags;
}

function search(query) {
  const lower = query.toLowerCase().trim();
  if (!lower) return [];

  // Split into separate words. Each word can match independently — broader recall.
  const words = lower.split(/\s+/).filter(w => w.length >= 2);
  const fullTags = expandQueryTags(lower);
  const perWordTags = words.map(w => expandQueryTags(w));
  const allWordTags = new Set([...fullTags, ...perWordTags.flat()]);

  const scored = activeRecipes().map(r => {
    let score = 0;
    const nameL = r.name.toLowerCase();
    const descL = (r.description || '').toLowerCase();
    const rTags = tagsOf(r);

    // Full query as substring in name = strongest signal
    if (nameL.includes(lower)) score += 80;
    // Each word as substring in name
    for (const w of words) {
      if (nameL.includes(w)) score += 30;
      if (descL.includes(w)) score += 8;
    }
    // Tag matches from synonyms
    for (const t of allWordTags) {
      if (rTags.has(t)) score += 12;
    }
    // Ingredient name matches
    for (const ing of r.ingredients) {
      const ingL = ing.name.toLowerCase();
      if (ingL.includes(lower)) score += 10;
      for (const w of words) {
        if (w.length >= 3 && ingL.includes(w)) score += 5;
      }
    }
    // Cuisine name direct hit
    if (CUISINE_LABELS[r.cuisine] && lower.includes(CUISINE_LABELS[r.cuisine].toLowerCase())) {
      score += 25;
    }
    return { r, score };
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 12).map(x => x.r);
}

// Suggestions shown in search field placeholder and on empty-result page
export const SEARCH_HINTS = [
  'лимон', 'хрустящее', 'паста болоньезе', 'острое', 'сливочное',
  'курица', 'стейк', 'индия', 'турция', 'без мяса', 'быстро',
  'медовое', 'мясо с овощами', 'свежее', 'тёплое сытное', 'паназиатское',
  'граната', 'кисло-яркое', 'жареная корка', 'базилик', 'чимичурри',
];

function searchByFeeling(feelingKey) {
  const f = FEELINGS[feelingKey];
  if (!f) return [];
  const matchTags = new Set(f.match.any || []);
  const scored = activeRecipes().map(r => {
    let score = 0;
    const rTags = tagsOf(r);
    for (const t of matchTags) {
      if (rTags.has(t)) score += 10;
    }
    if (f.match.minSpice && r.spice >= f.match.minSpice) score += 5;
    return { r, score };
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score + Math.random() * 0.5 - 0.25);
  return scored.slice(0, 8).map(x => x.r);
}

function similarTo(recipe, limit = 4) {
  const baseTags = tagsOf(recipe);
  const scored = activeRecipes()
    .filter(r => r.id !== recipe.id)
    .map(r => {
      const rTags = tagsOf(r);
      let score = 0;
      for (const t of baseTags) if (rTags.has(t)) score++;
      if (r.cuisine === recipe.cuisine) score += 1;
      if (r.protein === recipe.protein) score += 0.5;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(x => x.r);
}

function randomRecipe() {
  const active = activeRecipes();
  const recent = new Set(state.lastSeen);
  const candidates = active.filter(r => !recent.has(r.id));
  const pool = candidates.length ? candidates : active;
  return pool[Math.floor(Math.random() * pool.length)];
}

function random3() {
  const pool = [...activeRecipes()];
  const out = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

// Find recipes similar to user's favorites (top N)
function similarToFavorites(limit = 6) {
  const favSet = new Set(state.favorites);
  if (favSet.size === 0) return [];
  const favRecipes = state.favorites.map(id => RECIPE_BY_ID[id]).filter(Boolean);
  const candidates = activeRecipes().filter(r => !favSet.has(r.id));
  const scored = candidates.map(r => {
    let score = 0;
    const rTags = tagsOf(r);
    for (const fav of favRecipes) {
      const favTags = tagsOf(fav);
      for (const t of favTags) if (rTags.has(t)) score += 1;
      if (r.cuisine === fav.cuisine) score += 2;
      if (r.protein === fav.protein) score += 1;
    }
    return { r, score };
  })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(x => x.r);
}

// ============================================================
// View helpers
// ============================================================

const root = document.getElementById('view-root');

function render(html) {
  if (window.__hintTimer) {
    clearInterval(window.__hintTimer);
    window.__hintTimer = null;
  }
  root.classList.remove('view');
  void root.offsetWidth;
  root.innerHTML = html;
  root.classList.add('view');
  window.scrollTo({ top: 0, behavior: 'instant' });
  bindCommonHandlers();
  updateNavActive();
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') e.className = attrs[k];
    else if (k === 'html') e.innerHTML = attrs[k];
    else if (k.startsWith('on')) e[k.toLowerCase()] = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Build version — bumped on every deploy to bust browser image cache.
// Images are content-addressable by recipe id but the file CONTENT changes
// when we swap photo sources, so we need a version param to force re-fetch.
const IMG_V = '20';

// Resolve image source — every recipe uses the locally-bundled photo from build.
function imgSrc(recipe) {
  return `./images/${recipe.id}.jpg?v=${IMG_V}`;
}

// Image element. If a file ever goes missing at runtime, hide the parent .card
// instead of showing a placeholder (per user preference: no broken-image fallback).
function imgEl(recipe) {
  return `<img src="${imgSrc(recipe)}" alt="${escapeHtml(recipe.name)}" loading="lazy" decoding="async" onerror="window.__handleImgFail(this)" />`;
}

window.__handleImgFail = function (img) {
  const card = img.closest('.card');
  if (card) {
    card.style.display = 'none';
  } else {
    // detail/hero context — soften with neutral, no text
    const parent = img.parentElement;
    if (parent) parent.style.background = 'var(--surface-2)';
    img.style.display = 'none';
  }
};

// Legacy stub (kept harmless in case something old still calls it)
window.__buildPhotoFallback = function (alt) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:100%;height:100%;background:var(--surface-2);';
  return wrap;
};

function spiceDots(n) {
  if (!n) return '';
  return '🌶'.repeat(n);
}

function cardHtml(r) {
  const fav = isFav(r.id) ? 'is-fav' : '';
  return `
    <a class="card" href="#/recipe/${r.id}" data-card-id="${r.id}">
      <div class="card-photo">
        ${imgEl(r)}
        <button class="card-skip" data-skip-id="${r.id}" aria-label="Скрыть это блюдо" title="Скрыть навсегда">×</button>
        <button class="card-fav ${fav}" data-fav-id="${r.id}" aria-label="Избранное">${isFav(r.id) ? '♥' : '♡'}</button>
      </div>
      <div class="card-meta">
        <div class="eyebrow">${CUISINE_LABELS[r.cuisine] || ''} · ${r.time} мин${r.spice ? ' · ' + spiceDots(r.spice) : ''}</div>
        <div class="card-title">${escapeHtml(r.name)}</div>
        <div class="card-italic">${escapeHtml(r.description)}</div>
      </div>
    </a>
  `;
}

function smallCardHtml(r) {
  return `
    <a class="card" href="#/recipe/${r.id}">
      <div class="card-photo">${imgEl(r)}</div>
      <div class="card-meta">
        <div class="eyebrow">${CUISINE_LABELS[r.cuisine] || ''} · ${r.time} мин</div>
        <div class="card-title">${escapeHtml(r.name)}</div>
      </div>
    </a>
  `;
}

function bindCommonHandlers() {
  root.querySelectorAll('[data-fav-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.favId;
      toggleFav(id);
      btn.classList.toggle('is-fav', isFav(id));
      btn.textContent = isFav(id) ? '♥' : '♡';
      btn.classList.add('just-fav');
      setTimeout(() => btn.classList.remove('just-fav'), 480);
    });
  });

  root.querySelectorAll('[data-skip-id]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.skipId;
      const recipe = RECIPE_BY_ID[id];
      skipRecipe(id);
      const card = btn.closest('[data-card-id]');
      if (card) {
        card.style.transition = 'opacity 0.2s, transform 0.2s';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.92)';
        setTimeout(() => { card.style.display = 'none'; }, 220);
      }
      showUndoToast(`Скрыла «${recipe?.name || id}»`, () => {
        unskipRecipe(id);
        if (card) {
          card.style.display = '';
          card.style.opacity = '';
          card.style.transform = '';
        }
      });
    });
  });
}

function showUndoToast(msg, undoFn) {
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${escapeHtml(msg)}</span><button class="toast-undo" type="button">Вернуть</button>`;
  t.classList.add('show');
  const undoBtn = t.querySelector('.toast-undo');
  const cleanup = () => t.classList.remove('show');
  undoBtn?.addEventListener('click', () => { undoFn(); cleanup(); });
  clearTimeout(showUndoToast._timer);
  showUndoToast._timer = setTimeout(cleanup, 5000);
}

function updateNavActive() {
  const hash = location.hash || '#/';
  const matches = (name) => {
    if (name === 'home') return hash === '#/' || hash === '' || hash.startsWith('#/search') || hash.startsWith('#/feel/');
    if (name === 'menu') return hash.startsWith('#/menu');
    if (name === 'favorites') return hash.startsWith('#/favorites');
    if (name === 'shopping') return hash.startsWith('#/shopping');
    return false;
  };
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.classList.toggle('active', matches(a.dataset.nav));
  });
  document.querySelectorAll('[data-bnav]').forEach(a => {
    a.classList.toggle('active', matches(a.dataset.bnav));
  });
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1900);
}

// ============================================================
// Views
// ============================================================

function viewHome() {
  const surpriseRecipe = randomRecipe();
  const favSimilar = similarToFavorites(8);

  const feelingsHtml = Object.entries(FEELINGS).map(([k, f]) => `
    <button class="feel-tile" data-feel="${k}">
      <span class="feel-emoji">${f.emoji}</span>
      <span class="feel-label">${f.label}</span>
    </button>
  `).join('');

  const similarFavsHtml = favSimilar.length === 0 ? '' : `
    <section class="home-section home-similar-favs">
      <h2 class="home-section-title">Похожее на <em>любимое</em></h2>
      <div class="similar-favs-scroll">
        ${favSimilar.map(r => `
          <a class="card mini-card" href="#/recipe/${r.id}" data-card-id="${r.id}">
            <div class="card-photo">${imgEl(r)}</div>
            <div class="card-meta">
              <div class="card-title">${escapeHtml(r.name)}</div>
              <div class="eyebrow">${CUISINE_LABELS[r.cuisine] || ''} · ${r.time} мин</div>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
  `;

  render(`
    <div class="home">
      <section class="home-greet">
        <h1 class="home-greet-title">${getTimeGreeting()}<br>что <em>хочется</em>?</h1>
        <p class="home-greet-sub">Выбери что-то одно — приготовим за полчаса.</p>
        <a class="home-audit-link" href="#/audit">📷 Проверить все фото</a>
      </section>

      <section class="home-spotlight" data-surprise-id="${surpriseRecipe.id}">
        <div class="spotlight-photo">
          <img src="${imgSrc(surpriseRecipe)}" alt="${escapeHtml(surpriseRecipe.name)}" loading="eager" decoding="async" onerror="window.__handleImgFail(this)" />
        </div>
        <button class="spotlight-reshuffle" data-go="reshuffle" aria-label="Другое блюдо">↻</button>
        <div class="spotlight-content">
          <div class="spotlight-eyebrow">Сегодня</div>
          <div class="spotlight-title">${escapeHtml(surpriseRecipe.name)}</div>
          <button class="spotlight-cta" data-go="surprise">Открыть рецепт →</button>
        </div>
      </section>

      ${similarFavsHtml}

      <section class="home-section">
        <h2 class="home-section-title">Знаю <em>что хочу</em></h2>
        <form class="home-search" id="home-search-form">
          <span class="home-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.5" y2="16.5"/>
            </svg>
          </span>
          <input class="home-search-input" id="home-search-input" placeholder="лимон, хрустящее, паста, турция..." autocomplete="off" />
        </form>
      </section>

      <section class="home-section">
        <h2 class="home-section-title">Или <em>по ощущениям</em></h2>
        <div class="feel-grid">${feelingsHtml}</div>
      </section>
    </div>
  `);

  const form = document.getElementById('home-search-form');
  const input = document.getElementById('home-search-input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) location.hash = '#/search?q=' + encodeURIComponent(q);
  });
  // Rotating placeholder — visibly shows what kinds of queries the search understands
  let hintIdx = 0;
  const updateHint = () => {
    if (document.activeElement === input || input.value) return;
    input.placeholder = SEARCH_HINTS[hintIdx % SEARCH_HINTS.length];
    hintIdx++;
  };
  updateHint();
  const hintTimer = setInterval(updateHint, 2200);
  window.__hintTimer = hintTimer;

  root.querySelectorAll('[data-feel]').forEach(b => {
    b.addEventListener('click', () => {
      location.hash = '#/feel/' + b.dataset.feel;
    });
  });

  const spotlight = root.querySelector('.home-spotlight');
  if (spotlight) {
    const cta = spotlight.querySelector('[data-go="surprise"]');
    const reshuffle = spotlight.querySelector('[data-go="reshuffle"]');
    const open = () => { location.hash = '#/recipe/' + spotlight.dataset.surpriseId; };
    cta?.addEventListener('click', open);
    spotlight.querySelector('.spotlight-photo')?.addEventListener('click', open);
    reshuffle?.addEventListener('click', (e) => {
      e.stopPropagation();
      reshuffle.classList.add('spinning');
      setTimeout(() => viewHome(), 220);
    });
  }
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Поздно.';
  if (h < 11) return 'Доброе утро.';
  if (h < 16) return 'Здравствуй.';
  if (h < 22) return 'Добрый вечер.';
  return 'Ночь.';
}

function viewSearch(query) {
  const results = search(query);
  const hasResults = results.length > 0;
  const cards = (hasResults ? results : random3())
    .map(r => cardHtml(r)).join('');

  const hintsChips = SEARCH_HINTS.slice(0, 8).map(h =>
    `<a href="#/search?q=${encodeURIComponent(h)}" class="hint-chip">${escapeHtml(h)}</a>`
  ).join('');

  render(`
    <div class="shell">
      <header class="results-header">
        <div class="eyebrow results-eyebrow eyebrow-accent">${hasResults ? `Похоже на «${escapeHtml(query)}»` : `Ничего под «${escapeHtml(query)}»`}</div>
        <h1 class="results-title">${hasResults ? `Нашла ${results.length}` : 'Попробуй так'}</h1>
        ${!hasResults ? `<div class="hint-chips">${hintsChips}</div>` : ''}
      </header>
      <div class="results-grid">${cards}</div>
      <p style="text-align:center;color:var(--ink-soft);padding:24px 0 64px;">
        <a href="#/" style="color:var(--accent);font-weight:600;">← Начать заново</a>
      </p>
    </div>
  `);
}

function viewFeel(key) {
  const f = FEELINGS[key];
  if (!f) { location.hash = '#/'; return; }
  const results = searchByFeeling(key);
  const cards = results.map(r => cardHtml(r)).join('');

  render(`
    <div class="shell">
      <header class="results-header">
        <div class="eyebrow results-eyebrow eyebrow-accent">${f.emoji} По ощущениям</div>
        <h1 class="results-title">${escapeHtml(f.label)}</h1>
        <p class="body-italic" style="margin-top:12px;">${escapeHtml(f.tagline)}</p>
      </header>
      <div class="results-grid">${cards}</div>
      <p style="text-align:center;color:var(--ink-soft);padding-bottom:64px;">
        Не то ощущение? <a href="#/" style="color:var(--accent);font-weight:500;">Попробовать другое →</a>
      </p>
    </div>
  `);
}

function viewRecipe(id) {
  const r = RECIPE_BY_ID[id];
  if (!r) { location.hash = '#/'; return; }
  markSeen(id);
  const fav = isFav(id);
  const ingHtml = r.ingredients.map(i => `
    <li>
      <span class="ing-name">${escapeHtml(i.name)}</span>
      <span class="ing-amt">${i.amount} ${i.unit}</span>
    </li>
  `).join('');
  const stepsHtml = r.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
  const sim = similarTo(r).map(rr => smallCardHtml(rr)).join('');

  render(`
    <div class="shell-wide">
      <div class="detail-back">
        <a href="javascript:history.back()">← Назад</a>
        <button class="detail-fav ${fav ? 'is-fav' : ''}" data-fav-id="${id}">${fav ? '♥' : '♡'}</button>
      </div>

      <section class="detail-hero">
        <div class="detail-photo">${imgEl(r)}</div>
        <div class="detail-text">
          <div class="eyebrow detail-eyebrow eyebrow-accent">${CUISINE_LABELS[r.cuisine] || ''}</div>
          <h1 class="detail-title">${escapeHtml(r.name)}</h1>
          <p class="detail-desc">${escapeHtml(r.description)}</p>

          <div class="detail-meta-row">
            <div class="meta-item">
              <div class="meta-label">Время</div>
              <div class="meta-val">${r.time} мин</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Острота</div>
              <div class="meta-val">${r.spice ? spiceDots(r.spice) : '—'}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Порций</div>
              <div class="meta-val">2</div>
            </div>
          </div>

          <div class="tabs" role="tablist">
            <button class="tab active" data-tab="ing">Ингредиенты</button>
            <button class="tab" data-tab="steps">Шаги</button>
          </div>

          <div data-pane="ing">
            <ul class="ing-list">${ingHtml}</ul>
            <button class="cook-cta" data-action="cook" type="button">Готовить пошагово →</button>
            <button class="shop-cta" data-action="shop" type="button">🛒 В список покупок</button>
          </div>

          <div data-pane="steps" hidden>
            <ol class="steps-list">${stepsHtml}</ol>
            <button class="cook-cta" data-action="cook" type="button">Готовить пошагово →</button>
          </div>
        </div>
      </section>

      <section class="similar">
        <header class="similar-header">
          <div>
            <h2 class="similar-title">Похожее по вкусу</h2>
            <p class="similar-italic">Если эта не зашла</p>
          </div>
        </header>
        <div class="scroll-row">${sim}</div>
      </section>
    </div>
  `);

  // Tab switching
  const tabs = root.querySelectorAll('.tab');
  const panes = {
    ing: root.querySelector('[data-pane="ing"]'),
    steps: root.querySelector('[data-pane="steps"]'),
  };
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const k = t.dataset.tab;
    for (const key in panes) panes[key].hidden = (key !== k);
  }));

  // Add to shopping list
  root.querySelectorAll('[data-action="shop"]').forEach(btn => {
    btn.addEventListener('click', () => {
      addRecipeToShopping(id);
      btn.textContent = '✓ Добавлено';
      btn.classList.add('added');
      showToast(`+${r.ingredients.length} в списке покупок`);
      setTimeout(() => {
        btn.textContent = '🛒 В список покупок';
        btn.classList.remove('added');
      }, 1900);
    });
  });

  // Cook mode
  root.querySelectorAll('[data-action="cook"]').forEach(btn => {
    btn.addEventListener('click', () => {
      location.hash = '#/recipe/' + id + '/cook';
    });
  });
}

function viewCook(id) {
  const r = RECIPE_BY_ID[id];
  if (!r) { location.hash = '#/'; return; }
  let step = 0;

  const renderStep = () => {
    const pct = ((step + 1) / r.steps.length) * 100;
    const isLast = step === r.steps.length - 1;
    root.innerHTML = `
      <div class="cook-shell">
        <header class="cook-bar">
          <a href="#/recipe/${id}" class="cook-close" aria-label="Закрыть">×</a>
          <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div class="step-num">${String(step + 1).padStart(2,'0')} / ${String(r.steps.length).padStart(2,'0')}</div>
        </header>
        <div class="cook-body">
          <div class="cook-step">${escapeHtml(r.steps[step])}</div>
        </div>
        <nav class="cook-nav">
          <button class="cook-btn" data-act="prev" ${step === 0 ? 'disabled' : ''}>← Назад</button>
          <button class="cook-btn primary" data-act="next">${isLast ? 'Готово ✓' : 'Дальше →'}</button>
        </nav>
      </div>
    `;
    root.querySelector('[data-act="prev"]').addEventListener('click', () => {
      if (step > 0) { step--; renderStep(); }
    });
    root.querySelector('[data-act="next"]').addEventListener('click', () => {
      if (isLast) {
        location.hash = '#/recipe/' + id;
        showToast('Получилось вкусно ✨');
      } else {
        step++; renderStep();
      }
    });
  };

  root.classList.remove('view');
  void root.offsetWidth;
  root.classList.add('view');
  renderStep();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function viewMenu() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const cuisineF = params.get('cuisine') || '';
  const proteinF = params.get('protein') || '';
  const timeF = params.get('time') || '';

  let filtered = activeRecipes();
  if (cuisineF) filtered = filtered.filter(r => r.cuisine === cuisineF);
  if (proteinF) filtered = filtered.filter(r => r.protein === proteinF);
  if (timeF) filtered = filtered.filter(r => r.time <= parseInt(timeF));

  const cuisines = [...new Set(RECIPES.map(r => r.cuisine))];
  const proteins = ['beef', 'pork', 'chicken', 'turkey', 'vegetarian'];
  const proteinLabels = { beef: 'Говядина', pork: 'Свинина', chicken: 'Курица', turkey: 'Индейка', vegetarian: 'Без мяса' };

  const chip = (label, active, href) => `<a href="${href}" class="chip ${active ? 'active' : ''}">${escapeHtml(label)}</a>`;
  const buildLink = (overrides) => {
    const p = new URLSearchParams();
    const merged = { cuisine: cuisineF, protein: proteinF, time: timeF, ...overrides };
    for (const k in merged) {
      if (merged[k]) p.set(k, merged[k]);
    }
    const qs = p.toString();
    return '#/menu' + (qs ? '?' + qs : '');
  };

  const cuisineChips = [
    chip('Все', !cuisineF, buildLink({ cuisine: '' })),
    ...cuisines.map(c => chip(CUISINE_LABELS[c] || c, cuisineF === c, buildLink({ cuisine: c })))
  ].join('');

  const proteinChips = [
    chip('Все', !proteinF, buildLink({ protein: '' })),
    ...proteins.map(p => chip(proteinLabels[p], proteinF === p, buildLink({ protein: p })))
  ].join('');

  const timeChips = [
    chip('Любое', !timeF, buildLink({ time: '' })),
    chip('≤ 20 мин', timeF === '20', buildLink({ time: '20' })),
    chip('≤ 30 мин', timeF === '30', buildLink({ time: '30' })),
  ].join('');

  const cards = filtered.map(r => cardHtml(r)).join('');

  render(`
    <div class="shell-wide menu-page">
      <header class="results-header">
        <div class="eyebrow results-eyebrow eyebrow-accent">Меню</div>
        <h1 class="results-title">Все ${RECIPES.length} блюд</h1>
      </header>
      <div class="menu-filters">
        <div class="filter-section">
          <span class="filter-label">Кухня</span>
          ${cuisineChips}
        </div>
      </div>
      <div class="menu-filters" style="border:0;padding-bottom:0;">
        <div class="filter-section">
          <span class="filter-label">Белок</span>
          ${proteinChips}
        </div>
      </div>
      <div class="menu-filters">
        <div class="filter-section">
          <span class="filter-label">Время</span>
          ${timeChips}
        </div>
      </div>
      <div class="menu-count">${filtered.length} ${filtered.length === 1 ? 'блюдо' : 'блюд'}</div>
      <div class="menu-grid">${cards || '<div class="empty"><div class="empty-icon">🍽</div><div class="empty-title">Под эти фильтры ничего</div><div class="empty-desc">Сними один фильтр.</div></div>'}</div>
    </div>
  `);
}

function viewFavorites() {
  const list = state.favorites.map(id => RECIPE_BY_ID[id]).filter(Boolean);
  const cards = list.map(r => cardHtml(r)).join('');
  const skippedList = state.skipped.map(id => RECIPE_BY_ID[id]).filter(Boolean);

  const skippedSection = skippedList.length === 0 ? '' : `
    <section class="skipped-section">
      <details>
        <summary>
          <span>Скрытые блюда (${skippedList.length})</span>
          <span class="caret">▾</span>
        </summary>
        <div class="skipped-grid">
          ${skippedList.map(r => `
            <div class="skipped-row" data-unskip-id="${r.id}">
              <div class="skipped-photo"><img src="${imgSrc(r)}" alt="${escapeHtml(r.name)}" onerror="this.style.display='none'" /></div>
              <div class="skipped-name">${escapeHtml(r.name)}</div>
              <button class="skipped-restore" data-unskip-id="${r.id}" type="button">Вернуть</button>
            </div>
          `).join('')}
        </div>
      </details>
    </section>
  `;

  render(`
    <div class="shell-wide">
      <header class="results-header">
        <div class="eyebrow results-eyebrow eyebrow-accent">Любимое</div>
        <h1 class="results-title">Избранное</h1>
      </header>
      ${list.length
        ? `<div class="menu-grid">${cards}</div>`
        : `<div class="empty">
            <div class="empty-icon">♡</div>
            <div class="empty-title">Пока пусто</div>
            <div class="empty-desc">Тапни ♡ на блюде, чтобы сохранить его сюда.<br><br>Чтобы скрыть блюдо навсегда — тапни × в углу карточки.</div>
            <a class="btn btn-primary" href="#/">Найти что-то вкусное →</a>
          </div>`
      }
      ${skippedSection}
    </div>
  `);

  root.querySelectorAll('[data-unskip-id]').forEach(el => {
    if (!el.classList.contains('skipped-restore')) return;
    el.addEventListener('click', () => {
      const id = el.dataset.unskipId;
      unskipRecipe(id);
      viewFavorites();
    });
  });
}

function viewShopping() {
  const items = state.shopping;
  if (!items.length) {
    render(`
      <div class="shell">
        <header class="results-header">
          <div class="eyebrow results-eyebrow eyebrow-accent">Корзина</div>
          <h1 class="results-title">Список покупок</h1>
        </header>
        <div class="empty">
          <div class="empty-icon">🛒</div>
          <div class="empty-title">Пока пусто</div>
          <div class="empty-desc">Открой рецепт и нажми «В список покупок» — все ингредиенты прилетят сюда, сгруппированные по отделам магазина.</div>
          <a class="btn btn-primary" href="#/">Выбрать блюдо →</a>
        </div>
      </div>
    `);
    return;
  }

  // Merge duplicates by name+unit. Track which recipes each item came from.
  const merged = {};
  items.forEach((i, originalIdx) => {
    const key = i.name + '||' + i.unit;
    if (!merged[key]) merged[key] = { ...i, indices: [], totalAmount: 0, sources: [] };
    merged[key].indices.push(originalIdx);
    merged[key].totalAmount += Number(i.amount) || 0;
    if (i.sourceRecipeName && !merged[key].sources.includes(i.sourceRecipeName)) {
      merged[key].sources.push(i.sourceRecipeName);
    }
    merged[key].checked = merged[key].checked && i.checked;
  });

  // Group by category
  const grouped = {};
  for (const cat of CATEGORIES) grouped[cat.id] = [];
  Object.values(merged).forEach(m => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  });

  const sections = CATEGORIES.map(cat => {
    const list = grouped[cat.id];
    if (!list || !list.length) return '';
    const lis = list.map(m => {
      const fromMany = m.sources.length > 1;
      const sourcesHtml = m.sources.length
        ? `<div class="shop-sources">${fromMany ? '· ' : ''}${m.sources.map(s => escapeHtml(s)).join(' · ')}</div>`
        : '';
      return `
      <div class="shop-item ${m.checked ? 'checked' : ''}" data-indices="${m.indices.join(',')}">
        <div class="shop-check"></div>
        <div class="shop-body">
          <div class="shop-name">${escapeHtml(m.name)}</div>
          ${sourcesHtml}
        </div>
        <div class="shop-amt">${m.totalAmount} ${m.unit}</div>
      </div>
    `;
    }).join('');
    return `
      <section class="shop-section">
        <header class="shop-section-head">
          <span class="shop-section-icon">${cat.icon}</span>
          <h3 class="shop-section-title">${cat.label}</h3>
          <span class="shop-section-count">${list.length}</span>
        </header>
        ${lis}
      </section>
    `;
  }).join('');

  const checkedCount = items.filter(i => i.checked).length;

  render(`
    <div class="shell shop-page">
      <header class="shop-header">
        <div>
          <div class="eyebrow eyebrow-accent">Корзина</div>
          <h1 class="h-1">Список покупок</h1>
        </div>
        <div style="text-align:right;color:var(--ink-mid);font-size:13px;">
          ${items.length} позиций<br>
          ${checkedCount > 0 ? `<span style="color:var(--olive)">${checkedCount} взято</span>` : ''}
        </div>
      </header>

      ${sections}

      <div class="shop-actions">
        ${checkedCount > 0 ? '<button class="btn btn-ghost" data-act="clear-checked">Убрать взятое</button>' : ''}
        <button class="btn btn-ghost" data-act="clear-all" style="color:var(--accent);border-color:var(--accent-soft);">Очистить всё</button>
      </div>
    </div>
  `);

  root.querySelectorAll('.shop-item').forEach(el => {
    el.addEventListener('click', () => {
      const indices = el.dataset.indices.split(',').map(Number);
      const allChecked = indices.every(idx => state.shopping[idx]?.checked);
      indices.forEach(idx => {
        if (state.shopping[idx]) state.shopping[idx].checked = !allChecked;
      });
      saveJSON(LS_SHOP, state.shopping);
      updateBadge();
      viewShopping();
    });
  });

  const btnChecked = root.querySelector('[data-act="clear-checked"]');
  if (btnChecked) btnChecked.addEventListener('click', () => {
    clearChecked();
    viewShopping();
    showToast('Готово ✓');
  });
  root.querySelector('[data-act="clear-all"]').addEventListener('click', () => {
    if (confirm('Очистить весь список?')) {
      clearShopping();
      viewShopping();
    }
  });
}

// ============================================================
// Router
// ============================================================

function router() {
  const hash = location.hash || '#/';
  const path = hash.split('?')[0];

  if (path === '#/' || path === '') return viewHome();

  if (path.startsWith('#/search')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    return viewSearch(params.get('q') || '');
  }
  if (path.startsWith('#/feel/')) {
    return viewFeel(path.replace('#/feel/', ''));
  }
  if (path.match(/^#\/recipe\/[^/]+\/cook$/)) {
    return viewCook(path.split('/')[2]);
  }
  if (path.startsWith('#/recipe/')) {
    return viewRecipe(path.split('/')[2]);
  }
  if (path.startsWith('#/menu')) return viewMenu();
  if (path.startsWith('#/favorites')) return viewFavorites();
  if (path.startsWith('#/shopping')) return viewShopping();
  if (path.startsWith('#/audit')) return viewAudit();

  return viewHome();
}

// Audit page: every recipe with its photo + source article, in compact grid.
// Lets Katja eyeball ALL photos at once and flag wrong ones by id.
async function viewAudit() {
  render(`<div class="shell-wide"><header class="results-header"><div class="eyebrow eyebrow-accent">Аудит фото</div><h1 class="results-title">Проверь все фото</h1><p style="color:var(--ink-mid);margin-top:10px;font-size:14px;">Розовый блок = файл не загрузился (Wikipedia не отдала фото). Под названием — id рецепта. Скинь мне id'шники с проблемами.</p></header><div class="audit-loading" style="padding:48px;text-align:center;color:var(--ink-soft);">Загружаю manifest…</div></div>`);

  // Fresh manifest, no cache
  let manifest = {};
  try {
    const res = await fetch('./images-manifest.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) manifest = await res.json();
  } catch {}

  // Timestamp suffix on every image so browser absolutely refetches
  const ts = Date.now();

  const rows = activeRecipes()
    .map(r => {
      const m = manifest[r.id] || {};
      const ok = m.ok !== false;
      const source = m.source || r.image || '—';
      const fileName = m.fileName;
      const size = m.size ? `${Math.round(m.size / 1024)}KB` : (ok ? '(?)' : `❌ ${m.reason || 'не загружено'}`);
      const cssClass = ok ? '' : 'audit-broken';
      return `
        <a class="audit-card ${cssClass}" href="#/recipe/${r.id}">
          <div class="audit-photo">
            <img src="./images/${r.id}.jpg?v=${IMG_V}&t=${ts}" alt="${escapeHtml(r.name)}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('audit-broken-img')" />
            ${!ok ? '<div class="audit-missing">НЕТ ФОТО</div>' : ''}
          </div>
          <div class="audit-text">
            <div class="audit-name">${escapeHtml(r.name)}</div>
            <div class="audit-meta">${escapeHtml(r.id)}</div>
            <div class="audit-src">${escapeHtml(source.replace('wiki:', '📖 '))}</div>
            <div class="audit-file" title="${escapeHtml(fileName || size)}">${escapeHtml(fileName ? `${fileName} · ${size}` : size)}</div>
          </div>
        </a>
      `;
    }).join('');

  const root = document.getElementById('view-root');
  root.querySelector('.audit-loading')?.remove();
  const grid = document.createElement('div');
  grid.className = 'audit-grid';
  grid.innerHTML = rows;
  root.querySelector('.shell-wide').appendChild(grid);
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  updateBadge();
  router();
});

if (document.readyState !== 'loading') {
  updateBadge();
  router();
}
