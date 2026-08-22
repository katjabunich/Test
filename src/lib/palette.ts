/* Warm palette harmonization for DB-sourced sphere/habit colors.
 *
 * Colors stored in the DB carry old cool seed values (mint #86c79a,
 * pool blue #6ba4c2, lilac #b5a3df, …) that clash with the warm
 * cream+terracotta «Рассвет» palette. Every DB color passes through
 * these helpers before it hits a surface: warmBase() pulls the hue
 * toward a caramel neutral while keeping colors distinguishable from
 * each other, and the tint/strong variants derive backgrounds and
 * text-adjacent accents from that warmed base.
 *
 * Pure string helpers — no React, safe on server and client.
 *
 * Nested color-mix() requires iOS 16.2+/modern Chrome. Where a browser
 * cannot resolve it the raw DB color is the graceful mental fallback:
 * nothing breaks, the surface just skips the warm correction.
 */

/** Warm caramel neutral every DB hue gets pulled toward. */
const WARM_ANCHOR = "#C99A6B";

/** Warm ink (--ink) used to darken accents for text-adjacent use. */
const WARM_INK = "#3B2E26";

/** Full-strength warmed color: 58% of the original hue blended into a
    warm caramel neutral. Use for saturated marks (habit rings, done
    fills, heatmap dots) that must stay warm-family but recognizable. */
export function warmBase(color: string): string {
  return `color-mix(in srgb, ${color} 58%, ${WARM_ANCHOR})`;
}

/** Card/chip background tint: mostly white over the warmed base. */
export function warmTint(color: string): string {
  return `color-mix(in srgb, #FFFFFF 82%, ${warmBase(color)})`;
}

/** Darkened warmed accent for dots, checkbox borders and anything that
    sits next to text — calm enough for the tinted surfaces. */
export function warmStrong(color: string): string {
  return `color-mix(in srgb, ${warmBase(color)} 72%, ${WARM_INK})`;
}
