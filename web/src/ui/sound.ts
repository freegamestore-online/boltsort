// Metallic one-shot tones made with Web Audio. No audio files. Callers must pass
// `enabled` from useSound().muted: the platform mutes sound by default.

export type SoundCue = "unscrew" | "fill" | "drop" | "win" | "lose";

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

/** One struck-metal partial pair: a sine plus an inharmonic triangle, decaying fast. */
function strike(ac: AudioContext, freq: number, start: number, length: number, gain: number): void {
  const out = ac.createGain();
  out.gain.setValueAtTime(0, start);
  out.gain.linearRampToValueAtTime(gain, start + 0.004);
  out.gain.exponentialRampToValueAtTime(0.0001, start + length);
  out.connect(ac.destination);

  const body = ac.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(freq, start);
  body.connect(out);

  // 2.76 is a non-integer ratio, which is what makes it sound metallic rather than musical.
  const ring = ac.createOscillator();
  ring.type = "triangle";
  ring.frequency.setValueAtTime(freq * 2.76, start);
  const ringGain = ac.createGain();
  ringGain.gain.value = 0.35;
  ring.connect(ringGain).connect(out);

  body.start(start);
  ring.start(start);
  body.stop(start + length);
  ring.stop(start + length);
}

/** Play a cue. Does nothing when `enabled` is false or Web Audio is unavailable. */
export function playCue(cue: SoundCue, enabled: boolean): void {
  if (!enabled) return;
  const ac = audioContext();
  if (!ac) return;
  const t = ac.currentTime;

  switch (cue) {
    case "unscrew":
      strike(ac, 1640, t, 0.12, 0.12);
      break;
    case "fill":
      strike(ac, 988, t, 0.25, 0.18);
      strike(ac, 1319, t + 0.06, 0.3, 0.14);
      break;
    case "drop":
      strike(ac, 220, t, 0.35, 0.22);
      strike(ac, 165, t + 0.12, 0.25, 0.12);
      break;
    case "win":
      [523, 659, 784, 1047].forEach((f, i) => strike(ac, f, t + i * 0.09, 0.4, 0.14));
      break;
    case "lose":
      strike(ac, 196, t, 0.5, 0.16);
      strike(ac, 147, t + 0.2, 0.6, 0.14);
      break;
  }
}
