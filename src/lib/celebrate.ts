/* Streak celebration helper. Fires a soft mint confetti burst when a habit
   crosses 7/30/100 days. Dynamically imports canvas-confetti so the module
   doesn't run on the server. */

const MILESTONES = [7, 30, 100];

export function isStreakMilestone(streak: number): boolean {
  return MILESTONES.includes(streak);
}

export async function fireConfetti(color?: string) {
  if (typeof window === "undefined") return;
  try {
    const mod = await import("canvas-confetti");
    const confetti = mod.default;
    const palette = color
      ? [color, "#86c79a", "#4f9c6a", "#fbf6ee"]
      : ["#86c79a", "#4f9c6a", "#0ABAB5", "#b8e8e5", "#fbf6ee"];

    confetti({
      particleCount: 90,
      spread: 78,
      startVelocity: 38,
      origin: { y: 0.55 },
      colors: palette,
      scalar: 0.85,
      ticks: 220,
    });
  } catch {
    /* canvas-confetti load failed — celebration is non-essential, drop silently. */
  }
}
