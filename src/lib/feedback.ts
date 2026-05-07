/* Sound + haptic micro-feedback. All sounds are programmatically generated
   via Web Audio API — no MP3/WAV assets shipped. AudioContext is created
   lazily on first call (browsers require a user-gesture before audio can
   start). User can toggle sound/haptic in Settings; preference persists in
   localStorage. */

const SOUND_KEY = "dela.sound";
const HAPTIC_KEY = "dela.haptic";

type AudioCtx = typeof AudioContext extends { new (): infer T } ? T : never;
let ctx: AudioCtx | null = null;

function getCtx(): AudioCtx | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "off";
}

export function isHapticEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(HAPTIC_KEY) !== "off";
}

export function setSoundEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, v ? "on" : "off");
}

export function setHapticEnabled(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HAPTIC_KEY, v ? "on" : "off");
}

function tone(freq: number, durationMs: number, opts: {
  type?: OscillatorType;
  gain?: number;
  attackMs?: number;
} = {}) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const dur = durationMs / 1000;
  const attack = (opts.attackMs ?? 4) / 1000;
  const peak = opts.gain ?? 0.18;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function playTick() {
  if (!isSoundEnabled()) return;
  tone(659.25, 60, { type: "sine", gain: 0.16 });
}

export function playPop() {
  if (!isSoundEnabled()) return;
  tone(523.25, 80, { type: "triangle", gain: 0.14, attackMs: 6 });
}

export function playCelebrate() {
  if (!isSoundEnabled()) return;
  // C5 + E5 + G5 chord, slight stagger for bell-like decay
  tone(523.25, 320, { type: "sine", gain: 0.12 });
  setTimeout(() => tone(659.25, 300, { type: "sine", gain: 0.11 }), 40);
  setTimeout(() => tone(783.99, 280, { type: "sine", gain: 0.10 }), 80);
}

export function playWhoosh() {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const dur = 0.24;

  // Generate a short burst of white noise
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + dur);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  src.connect(filter).connect(gain).connect(c.destination);
  src.start(now);
  src.stop(now + dur);
}

function vibrate(pattern: number | number[]) {
  if (!isHapticEnabled()) return;
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* iOS Safari throws on some versions — silently ignore */
  }
}

export function hapticTick() {
  vibrate(8);
}

export function hapticPop() {
  vibrate(12);
}

export function hapticCelebrate() {
  vibrate([20, 40, 20, 40, 20]);
}

export function feedbackTaskComplete() {
  playTick();
  hapticTick();
}

export function feedbackHabitComplete() {
  playTick();
  hapticTick();
}

export function feedbackStreakMilestone() {
  playCelebrate();
  hapticCelebrate();
}

export function feedbackModalOpen() {
  playPop();
  hapticPop();
}

export function feedbackSplashOut() {
  playWhoosh();
}
