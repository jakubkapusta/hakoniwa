// All sound is synthesized with Web Audio: one-shot effects plus ambient layers that pieces switch on.
export type Layer = 'town' | 'leaves' | 'chime' | 'bubble' | 'crickets' | 'rain' | 'frogs' | 'hum' | 'crow' | 'engine' | 'stream' | 'suzu' | 'sweep' | 'wind' | 'waves' | 'taiko' | 'onsen' | 'crossing' | 'cicadas' | 'birds' | 'mill' | 'bonsho';

let AC: AudioContext | null = null;
let master: GainNode, noiseB: AudioBuffer;
let muted = false;

export function audio(): AudioContext | null {
  if (!AC) {
    try {
      AC = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      master = AC.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(AC.destination);
      noiseB = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const d = noiseB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch { return null; }
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
export function setMuted(m: boolean) { muted = m; if (AC) master.gain.setTargetAtTime(m ? 0 : 0.6, AC.currentTime, 0.1); }

function noise(t0: number, dur: number, { type = 'lowpass' as BiquadFilterType, freq = 800, q = 1, gain = 0.5, attack = 0.002, out = master as AudioNode } = {}) {
  const ac = AC!, s = ac.createBufferSource(); s.buffer = noiseB;
  const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(out); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
}
function tone(t0: number, freq: number, dur: number, { type = 'sine' as OscillatorType, gain = 0.3, attack = 0.005, slide = 0, out = master as AudioNode } = {}) {
  const ac = AC!, o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(out); o.start(t0); o.stop(t0 + dur + 0.05);
}
const pluck = (t: number, f: number, g = 0.16, out: AudioNode = master) => {
  tone(t, f, 1.5, { type: 'triangle', gain: g, out }); tone(t, f * 2, 0.6, { gain: g * 0.35, out }); tone(t, f * 3.01, 0.25, { gain: g * 0.12, out });
};
// D yo-scale (D E G A B), the pentatonic of Japanese folk songs
const YO = [293.7, 329.6, 392, 440, 493.9, 587.3, 659.3, 784, 880, 987.8];

export const sfx = {
  pick() { if (!audio()) return; noise(AC!.currentTime, 0.1, { type: 'highpass', freq: 2600, gain: 0.1 }); },
  fold(n = 4) { if (!audio()) return; const t = AC!.currentTime; for (let i = 0; i < n; i++) noise(t + i * 0.14 + Math.random() * 0.03, 0.05, { type: 'bandpass', freq: 1300 + Math.random() * 700, q: 3, gain: 0.16 }); },
  tok(big = 1) { if (!audio()) return; const t = AC!.currentTime; noise(t, 0.1, { freq: 700 + 400 / big, gain: 0.4 * big }); tone(t, 170 / Math.sqrt(big), 0.16, { gain: 0.3, slide: 70 }); },
  back() { if (!audio()) return; const t = AC!.currentTime; noise(t, 0.08, { type: 'highpass', freq: 1800, gain: 0.08 }); tone(t, 330, 0.15, { gain: 0.06, slide: 260 }); },
  chime() { if (!audio()) return; const t = AC!.currentTime; pluck(t, 587.3); pluck(t + 0.13, 880); },
  finale() { if (!audio()) return; const t = AC!.currentTime; YO.slice(0, 7).forEach((f, i) => pluck(t + i * 0.17, f, 0.14)); pluck(t + 1.4, 392, 0.12); pluck(t + 1.4, 587.3, 0.1); },
  secret() { if (!audio()) return; const t = AC!.currentTime; [880, 987.8, 1174.7, 1318.5].forEach((f, i) => tone(t + i * 0.07, f, 0.5, { gain: 0.08 })); },
  boom(far = 1) { if (!audio()) return; const t = AC!.currentTime + 0.25 * far; tone(t, 60, 1.2, { gain: 0.35, slide: 35 }); noise(t, 1.3, { freq: 400, gain: 0.3, attack: 0.01 });
    for (let i = 0; i < 8; i++) noise(t + 0.3 + Math.random() * 0.8, 0.04, { type: 'highpass', freq: 3500, gain: 0.05 }); },
  /** Shishi-odoshi: the bamboo tube tips over and knocks on its stone. */
  bamboo() { if (!audio()) return; const t = AC!.currentTime; noise(t, 0.05, { type: 'bandpass', freq: 1200, q: 4, gain: 0.35 }); tone(t, 520, 0.25, { type: 'triangle', gain: 0.22, slide: 470 }); tone(t, 1040, 0.08, { gain: 0.06 });
    noise(t + 0.02, 0.4, { type: 'bandpass', freq: 2400, q: 0.8, gain: 0.05, attack: 0.03 }); },
  open() { if (!audio()) return; const t = AC!.currentTime; noise(t, 0.35, { type: 'bandpass', freq: 900, q: 0.8, gain: 0.12, attack: 0.08 }); },
};

/** A looping ambience. `level` 0..1 is set every frame from the scene (fades), `night` scales evening-only layers. */
class AmbientLayer {
  out: GainNode;
  level = 0;
  private nextAt = 0;
  private srcs: AudioScheduledSourceNode[] = [];
  constructor(public kind: Layer) {
    const ac = AC!; this.out = ac.createGain(); this.out.gain.value = 0; this.out.connect(master);
    const bed = (type: BiquadFilterType, freq: number, q: number, gain: number, lfo = 0) => {
      const s = ac.createBufferSource(); s.buffer = noiseB; s.loop = true;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ac.createGain(); g.gain.value = gain;
      s.connect(f).connect(g).connect(this.out); s.start(); this.srcs.push(s);
      if (lfo) { const o = ac.createOscillator(); o.frequency.value = lfo; const og = ac.createGain(); og.gain.value = gain * 0.7; o.connect(og).connect(g.gain); o.start(); this.srcs.push(o); }
    };
    if (kind === 'town') bed('lowpass', 320, 0.5, 0.35, 0.07);
    if (kind === 'leaves') bed('bandpass', 1800, 0.6, 0.12, 0.13);
    if (kind === 'rain') { bed('highpass', 1400, 0.4, 0.22); bed('bandpass', 500, 0.6, 0.12); }
    if (kind === 'stream') bed('bandpass', 1100, 1.5, 0.1, 0.4);
    if (kind === 'cicadas') { bed('bandpass', 5200, 4, 0.05, 27); bed('bandpass', 4300, 5, 0.03, 19); }
    if (kind === 'wind') { bed('bandpass', 380, 0.8, 0.22, 0.07); bed('bandpass', 900, 2, 0.05, 0.11); }
    if (kind === 'waves') { bed('lowpass', 520, 0.6, 0.35, 0.09); bed('highpass', 2500, 0.4, 0.06, 0.09); }
    if (kind === 'mill') { bed('bandpass', 1500, 0.9, 0.09, 0.6); bed('lowpass', 300, 0.7, 0.1, 0.25); }
    if (kind === 'hum') { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 100; const f = ac.createBiquadFilter(); f.frequency.value = 260; const g = ac.createGain(); g.gain.value = 0.025; o.connect(f).connect(g).connect(this.out); o.start(); this.srcs.push(o); }
    if (kind === 'engine') { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 46; const f = ac.createBiquadFilter(); f.frequency.value = 180; const g = ac.createGain(); g.gain.value = 0.14; o.connect(f).connect(g).connect(this.out); o.start(); this.srcs.push(o); bed('lowpass', 160, 0.8, 0.2, 9); }
  }
  /** Random events for the sparse layers. */
  tick(now: number) {
    if (now < this.nextAt || this.level < 0.01) return;
    const t = now + 0.02, out = this.out;
    switch (this.kind) {
      case 'chime': // furin: a glass wind bell
        [2093, 2637, 3136].forEach((f, i) => tone(t + i * 0.05 * Math.random(), f * (0.98 + Math.random() * 0.04), 2.2, { gain: 0.035, out }));
        this.nextAt = now + 3 + Math.random() * 6; break;
      case 'bubble':
        tone(t, 180 + Math.random() * 220, 0.08, { gain: 0.12, slide: 420 + Math.random() * 300, out });
        this.nextAt = now + 0.12 + Math.random() * 0.5; break;
      case 'crickets':
        for (let i = 0; i < 3; i++) tone(t + i * 0.06, 4300 + Math.random() * 300, 0.04, { gain: 0.03, out });
        this.nextAt = now + 0.35 + Math.random() * 0.5; break;
      case 'frogs': {
        const f = 90 + Math.random() * 60, n = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) { tone(t + i * 0.11, f, 0.08, { type: 'square', gain: 0.04, slide: f * 0.8, out }); noise(t + i * 0.11, 0.06, { type: 'bandpass', freq: 700, q: 4, gain: 0.05, out }); }
        this.nextAt = now + 0.6 + Math.random() * 1.8; break;
      }
      case 'crow':
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) noise(t + i * 0.38, 0.28, { type: 'bandpass', freq: 1100, q: 6, gain: 0.25, attack: 0.03, out });
        this.nextAt = now + 7 + Math.random() * 9; break;
      case 'suzu': // shrine bells: a bright shaken cluster
        for (let i = 0; i < 9; i++) tone(t + i * 0.045 + Math.random() * 0.02, 2600 + Math.random() * 900, 0.35, { type: 'triangle', gain: 0.035, out });
        this.nextAt = now + 9 + Math.random() * 10; break;
      case 'taiko': { // festival drums: don, don, ka-don
        const hit = (at: number, f: number, g: number) => { tone(at, f, 0.5, { gain: g, slide: f * 0.6, out }); noise(at, 0.08, { freq: 500, gain: g * 0.5, out }); };
        hit(t, 85, 0.45); hit(t + 0.45, 85, 0.4); noise(t + 0.85, 0.04, { type: 'highpass', freq: 2000, gain: 0.12, out }); hit(t + 1.05, 95, 0.5);
        this.nextAt = now + 2.4; break;
      }
      case 'onsen': // a wooden bucket set down in the tiled bath hall, with its echo
        [0, 0.18, 0.36].forEach((d, i) => tone(t + d, 410 - i * 8, 0.6, { type: 'triangle', gain: 0.12 / (1 + i * 1.6), out }));
        if (Math.random() < 0.5) noise(t + 0.5, 0.7, { type: 'bandpass', freq: 1800, q: 0.6, gain: 0.05, attack: 0.05, out });
        this.nextAt = now + 4 + Math.random() * 6; break;
      case 'crossing': // railway crossing bell
        tone(t, 760, 0.3, { type: 'square', gain: 0.035, out }); tone(t, 1520, 0.15, { gain: 0.02, out });
        this.nextAt = now + 0.52; break;
      case 'birds': // a bush warbler (uguisu): a long whistle, then a quick 'hokekyo'
        if (Math.random() < 0.6) { tone(t, 1250, 0.9, { gain: 0.035, attack: 0.25, slide: 1300 }); [0, 0.12, 0.3].forEach((d, i) => tone(t + 1.05 + d, [1900, 2500, 1800][i], i === 2 ? 0.35 : 0.1, { gain: 0.04, slide: [2300, 2200, 1650][i] })); }
        else for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) tone(t + i * 0.13, 3200 + Math.random() * 900, 0.07, { gain: 0.02, slide: 2600 }); // sparrows
        this.nextAt = now + 4 + Math.random() * 7; break;
      case 'mill': // the water wheel's paddles slapping, a wooden creak now and then
        noise(t, 0.12, { type: 'bandpass', freq: 700, q: 1.5, gain: 0.12 });
        if (Math.random() < 0.25) tone(t + 0.2, 180 + Math.random() * 40, 0.35, { type: 'sawtooth', gain: 0.012, slide: 150 });
        this.nextAt = now + 0.9; break;
      case 'bonsho': // a far temple bell
        [110, 220.6, 277.5, 331].forEach((f, i) => tone(t, f, 6 - i, { type: i ? 'sine' : 'triangle', gain: [0.12, 0.05, 0.03, 0.025][i], attack: 0.01 }));
        this.nextAt = now + 16 + Math.random() * 8; break;
      case 'sweep': // a bamboo broom on gravel
        noise(t, 0.45, { type: 'bandpass', freq: 3200, q: 0.7, gain: 0.07, attack: 0.15, out });
        this.nextAt = now + 1.6 + Math.random() * 0.6; break;
      default: this.nextAt = now + 1000;
    }
  }
  stop() { this.srcs.forEach((s) => { try { s.stop(); } catch { /* already stopped */ } }); this.out.disconnect(); }
}

const NIGHT_ONLY: Layer[] = ['crickets', 'frogs', 'bonsho'];
const VOL: Partial<Record<Layer, number>> = { town: 0.5, leaves: 0.8, rain: 1, hum: 1, engine: 1, stream: 0.8 };

export class Ambience {
  private layers = new Map<Layer, AmbientLayer>();
  private want = new Map<Layer, number>();
  set(kind: Layer, on: number) { this.want.set(kind, on); }
  update(evening: number) {
    if (!AC || AC.state !== 'running') return;
    for (const [kind, w] of this.want) {
      let l = this.layers.get(kind);
      if (!l && w > 0) { l = new AmbientLayer(kind); this.layers.set(kind, l); }
      if (!l) continue;
      const target = w * (NIGHT_ONLY.includes(kind) ? 0.25 + 0.75 * evening : 1) * (VOL[kind] ?? 1);
      l.level += (target - l.level) * 0.03;
      l.out.gain.setTargetAtTime(l.level, AC.currentTime, 0.05);
      l.tick(AC.currentTime);
    }
  }
  clear() { this.layers.forEach((l) => l.stop()); this.layers.clear(); this.want.clear(); }
}
