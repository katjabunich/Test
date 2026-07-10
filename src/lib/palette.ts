/* «Фарфор и хвоя» — single source of truth for user-pickable colours.
   Sphere/habit colours are stored in the DB as the pastel hex; the deep
   pair is derived here at render time so chips stay "pastel background +
   deep text/icon" everywhere. No lilac anywhere by design. */

export type ColorPair = {
  /** Chip/ring/squircle fill — soft pastel, stored in DB. */
  pastel: string;
  /** Text/icon/progress colour on top of the pastel. */
  deep: string;
};

export const COLOR_PAIRS: ColorPair[] = [
  { pastel: "#BFDCC6", deep: "#3E7A57" }, // шалфей
  { pastel: "#B9CFE2", deep: "#3D6484" }, // пыльно-голубой
  { pastel: "#F1DCA3", deep: "#8A6E22" }, // сливочный
  { pastel: "#F0C9CC", deep: "#A05560" }, // румянец
  { pastel: "#F6C9A8", deep: "#B06A38" }, // персик
  { pastel: "#E2AE95", deep: "#94512F" }, // глина
];

/** Picker swatches — the pastels, in order. */
export const PICKER_COLORS: string[] = COLOR_PAIRS.map((p) => p.pastel);

/* Legacy pastels that may already be stored in the DB → nearest new pair,
   so existing spheres/habits render coherently without a data migration. */
const LEGACY_MAP: Record<string, ColorPair> = {
  "#86c79a": COLOR_PAIRS[0], // old mint → шалфей
  "#4f9c6a": COLOR_PAIRS[0],
  "#a8d8b9": COLOR_PAIRS[0],
  "#6bbf8a": COLOR_PAIRS[0],
  "#0abab5": COLOR_PAIRS[0], // tiffany → шалфей
  "#6ba4c2": COLOR_PAIRS[1], // old pool → пыльно-голубой
  "#a1c9e0": COLOR_PAIRS[1],
  "#b5a3df": COLOR_PAIRS[1], // old lavender → пыльно-голубой (сирень выведена)
  "#c4b8e8": COLOR_PAIRS[1],
  "#f5c563": COLOR_PAIRS[2], // old butter → сливочный
  "#f5d76e": COLOR_PAIRS[2],
  "#e89bb0": COLOR_PAIRS[3], // old blush → румянец
  "#f2b5c8": COLOR_PAIRS[3],
  "#f4936e": COLOR_PAIRS[4], // old peach → персик
  "#f9c4a8": COLOR_PAIRS[4],
  "#d96a52": COLOR_PAIRS[5], // old alert → глина
  "#e8756a": COLOR_PAIRS[5],
};

/** Resolve any stored hex (new, legacy, or arbitrary) to a coherent pair. */
export function resolvePair(stored: string | null | undefined): ColorPair {
  if (!stored) return COLOR_PAIRS[0];
  const key = stored.toLowerCase();
  const exact = COLOR_PAIRS.find((p) => p.pastel.toLowerCase() === key);
  if (exact) return exact;
  if (LEGACY_MAP[key]) return LEGACY_MAP[key];
  return { pastel: stored, deep: darken(stored) };
}

/** Pastel fill for a stored colour (legacy hexes get remapped). */
export function pastelOf(stored: string | null | undefined): string {
  return resolvePair(stored).pastel;
}

/** Deep pair for a stored colour — for text/icons on the pastel. */
export function deepOf(stored: string | null | undefined): string {
  return resolvePair(stored).deep;
}

/* Fallback for unknown hexes: darken + desaturate toward ink so custom
   colours still produce a readable pair. */
function darken(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#3E7A57";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c: number) => Math.round(c * 0.45 + 30 * 0.55);
  return `#${[mix(r), mix(g), mix(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}
