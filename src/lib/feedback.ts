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

/** Tick = wooden tap. Two layers stacked: a tiny noise click for the
   "attack" feel + a low sine "body" with quick pitch dip for warmth.
   Result: organic percussive blip, not a microwave beep. */
export function playTick() {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  // Click layer — 8ms noise burst, lowpass-filtered to remove harshness.
  const clickBuf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * 0.012)), c.sampleRate);
  const clickData = clickBuf.getChannelData(0);
  for (let i = 0; i < clickData.length; i++) {
    const env = Math.pow(1 - i / clickData.length, 2.5);
    clickData[i] = (Math.random() * 2 - 1) * env;
  }
  const clickSrc = c.createBufferSource();
  clickSrc.buffer = clickBuf;
  const clickFilter = c.createBiquadFilter();
  clickFilter.type = "lowpass";
  clickFilter.frequency.setValueAtTime(1800, now);
  clickFilter.frequency.exponentialRampToValueAtTime(700, now + 0.012);
  const clickGain = c.createGain();
  clickGain.gain.setValueAtTime(0.10, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
  clickSrc.connect(clickFilter).connect(clickGain).connect(c.destination);
  clickSrc.start(now);

  // Body layer — sine with pitch dip 240 → 180 Hz, ~35ms
  const body = c.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(240, now);
  body.frequency.exponentialRampToValueAtTime(180, now + 0.03);
  const bodyGain = c.createGain();
  bodyGain.gain.setValueAtTime(0, now);
  bodyGain.gain.linearRampToValueAtTime(0.07, now + 0.003);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  body.connect(bodyGain).connect(c.destination);
  body.start(now);
  body.stop(now + 0.06);
}

/** Pop = soft "thup" for modal open. Lowpass-filtered noise puff +
   a brief sine. Even quieter than tick — modals are visual, sound just
   confirms. */
export function playPop() {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * 0.05)), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.pow(1 - i / data.length, 1.8);
    data[i] = (Math.random() * 2 - 1) * env * 0.6;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.05);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.07, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(now);
}

/** Celebrate = single soft chime, not arcade fanfare. Fundamental + 2
   inharmonic partials with bell envelope (instant attack, long tail).
   Each partial fades at a different rate, giving organic shimmer. */
export function playCelebrate() {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;

  const partials = [
    { freq: 587.33, gain: 0.10, decay: 0.9 },  // D5 fundamental
    { freq: 880.00, gain: 0.06, decay: 0.55 }, // A5 fifth (close)
    { freq: 1174.66, gain: 0.04, decay: 0.35 }, // D6 octave
  ];

  for (const p of partials) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(p.freq, now);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(p.gain, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + p.decay + 0.02);
  }
}

/** Whoosh = brief filtered noise sweep, splash → app transition. */
export function playWhoosh() {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const dur = 0.28;

  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.sin((i / data.length) * Math.PI);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.setValueAtTime(0.8, now);
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(280, now + dur);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.10, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(now);
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
