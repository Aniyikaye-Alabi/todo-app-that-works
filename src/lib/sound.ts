/**
 * Synthesised UI sounds via the Web Audio API — no audio files.
 *
 * The AudioContext is created lazily on the first `play()` call, which always
 * happens inside a user gesture handler (browsers block autoplay otherwise).
 * Volume stays low (~0.2) and every blip is under 150ms, per the style guide §7.
 */

export type SoundName = 'tick' | 'confirm' | 'error' | 'delete' | 'focus' | 'break' | 'finish';

interface Tone {
  freq: number;
  /** Seconds. */
  duration: number;
  /** Seconds after the sound starts. */
  at?: number;
  type?: OscillatorType;
  gain?: number;
}

const SOUNDS: Record<SoundName, Tone[]> = {
  tick: [{ freq: 1800, duration: 0.02, type: 'square', gain: 0.08 }],
  confirm: [
    { freq: 880, duration: 0.06, type: 'square' },
    { freq: 1320, duration: 0.08, at: 0.06, type: 'square' },
  ],
  error: [{ freq: 110, duration: 0.14, type: 'sawtooth' }],
  delete: [
    { freq: 440, duration: 0.06, type: 'triangle' },
    { freq: 220, duration: 0.09, at: 0.06, type: 'triangle' },
  ],
  focus: [
    { freq: 660, duration: 0.08, type: 'square' },
    { freq: 990, duration: 0.12, at: 0.1, type: 'square' },
  ],
  break: [
    { freq: 990, duration: 0.08, type: 'triangle' },
    { freq: 660, duration: 0.12, at: 0.1, type: 'triangle' },
  ],
  finish: [
    { freq: 784, duration: 0.1, type: 'square' },
    { freq: 988, duration: 0.1, at: 0.12, type: 'square' },
    { freq: 1319, duration: 0.14, at: 0.24, type: 'square' },
  ],
};

const MASTER_VOLUME = 0.2;

let ctx: AudioContext | null = null;
let enabled = true;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function play(name: SoundName) {
  if (!enabled) return;
  const audio = getContext();
  if (!audio) return;
  const start = audio.currentTime;
  for (const tone of SOUNDS[name]) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const t0 = start + (tone.at ?? 0);
    const peak = MASTER_VOLUME * (tone.gain ?? 1);
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, t0);
    // Short attack/release envelope to avoid clicks.
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + tone.duration + 0.02);
  }
}
