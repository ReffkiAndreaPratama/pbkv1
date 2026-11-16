// Efek suara ringan berbasis Web Audio API — tanpa file aset.
// Semua fungsi aman dipanggil di SSR/test (tidak menyentuh window).

export type SoundName = "select" | "inspect" | "fix" | "wrong" | "win" | "lose";

const STORAGE_KEY = "techtutor:sound-muted";
let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {
      /* browser bisa menolak sebelum ada gesture; abaikan */
    });
  }
  return ctx;
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* localStorage bisa diblokir; abaikan */
  }
}

/** Balik status mute dan kembalikan status baru (true = mute). */
export function toggleSoundMuted(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}

interface ToneOptions {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  endFreq?: number;
}

function tone(ac: AudioContext, { freq, start, duration, type = "sine", gain = 0.05, endFreq }: ToneOptions) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  const t0 = ac.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), t0);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + duration);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

export function playSound(name: SoundName): void {
  if (isSoundMuted()) return;
  const ac = audioContext();
  if (!ac) return;

  try {
    switch (name) {
      case "select":
        tone(ac, { freq: 660, start: 0, duration: 0.06, type: "square", gain: 0.018 });
        break;
      case "inspect":
        tone(ac, { freq: 520, endFreq: 760, start: 0, duration: 0.12, type: "triangle", gain: 0.035 });
        break;
      case "fix":
        tone(ac, { freq: 660, start: 0, duration: 0.1, type: "triangle", gain: 0.04 });
        tone(ac, { freq: 990, start: 0.08, duration: 0.16, type: "triangle", gain: 0.045 });
        break;
      case "wrong":
        tone(ac, { freq: 220, start: 0, duration: 0.16, type: "sawtooth", gain: 0.035 });
        tone(ac, { freq: 150, start: 0.12, duration: 0.22, type: "sawtooth", gain: 0.03 });
        break;
      case "win":
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          tone(ac, { freq, start: i * 0.1, duration: 0.2, type: "triangle", gain: 0.05 });
        });
        break;
      case "lose":
        [392, 329.63, 261.63, 196].forEach((freq, i) => {
          tone(ac, { freq, start: i * 0.13, duration: 0.22, type: "sawtooth", gain: 0.035 });
        });
        break;
    }
  } catch {
    /* audio bukan hal kritis; jangan sampai mengganggu permainan */
  }
}
