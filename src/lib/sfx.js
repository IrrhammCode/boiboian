/**
 * Web Audio SFX — Knockout Court. No external files required.
 */
let ctx = null;
let master = null;
let muted = false;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function env(node, t0, a, d, peak = 1) {
  node.gain.cancelScheduledValues(t0);
  node.gain.setValueAtTime(0.0001, t0);
  node.gain.exponentialRampToValueAtTime(peak, t0 + a);
  node.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

function tone({ freq = 440, type = 'sine', dur = 0.12, a = 0.01, peak = 0.4, slide = 0, when = 0 }) {
  if (muted) return;
  const c = ac();
  const t0 = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  env(g, t0, a, dur, peak);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + a + dur + 0.02);
}

function noise({ dur = 0.15, peak = 0.25, low = 800, when = 0, type = 'lowpass' }) {
  if (muted) return;
  const c = ac();
  const t0 = c.currentTime + when;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = low;
  const g = c.createGain();
  env(g, t0, 0.008, dur, peak);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
}

const CUES = {
  ui_tap: () => tone({ freq: 680, type: 'triangle', dur: 0.05, peak: 0.2 }),
  ui_confirm: () => {
    tone({ freq: 540, type: 'triangle', dur: 0.07, peak: 0.22 });
    tone({ freq: 820, type: 'triangle', dur: 0.08, peak: 0.18, when: 0.06 });
  },
  count_beep: () => tone({ freq: 700, type: 'square', dur: 0.08, peak: 0.15 }),
  whistle_go: () => {
    tone({ freq: 1020, type: 'triangle', dur: 0.18, peak: 0.22, slide: 220 });
    tone({ freq: 1280, type: 'sine', dur: 0.12, peak: 0.12, when: 0.02 });
  },
  ball_throw: () => {
    noise({ dur: 0.12, peak: 0.22, low: 1600, type: 'bandpass' });
    tone({ freq: 190, type: 'sine', dur: 0.1, peak: 0.12, slide: -70 });
  },
  ball_pass: () => {
    noise({ dur: 0.08, peak: 0.16, low: 1100 });
    tone({ freq: 260, type: 'sine', dur: 0.07, peak: 0.12 });
  },
  ball_catch: () => {
    tone({ freq: 150, type: 'sine', dur: 0.1, peak: 0.22, slide: -40 });
    noise({ dur: 0.05, peak: 0.1, low: 500 });
  },
  ball_bounce: () => tone({ freq: 120, type: 'sine', dur: 0.07, peak: 0.12, slide: -30 }),
  ball_drop: () => {
    tone({ freq: 95, type: 'sine', dur: 0.12, peak: 0.18 });
    noise({ dur: 0.08, peak: 0.1, low: 320 });
  },
  tag_hit: () => {
    tone({ freq: 210, type: 'square', dur: 0.08, peak: 0.22, slide: -90 });
    noise({ dur: 0.1, peak: 0.2, low: 800 });
  },
  kid_out: () => tone({ freq: 310, type: 'triangle', dur: 0.2, peak: 0.14, slide: -170 }),
  shard_pick: () => {
    tone({ freq: 920, type: 'triangle', dur: 0.05, peak: 0.14 });
    tone({ freq: 1180, type: 'sine', dur: 0.04, peak: 0.1, when: 0.03 });
  },
  shard_place: () => {
    tone({ freq: 540, type: 'triangle', dur: 0.06, peak: 0.2 });
    tone({ freq: 400, type: 'triangle', dur: 0.08, peak: 0.14, when: 0.04 });
  },
  shard_reject: () => tone({ freq: 180, type: 'square', dur: 0.1, peak: 0.12, slide: -40 }),
  pyramid_collapse: () => {
    noise({ dur: 0.38, peak: 0.38, low: 700 });
    tone({ freq: 80, type: 'sine', dur: 0.28, peak: 0.25, slide: -40 });
  },
  near_miss: () => noise({ dur: 0.1, peak: 0.14, low: 2200, type: 'bandpass' }),
  boi: () => {
    tone({ freq: 440, type: 'triangle', dur: 0.15, peak: 0.28 });
    tone({ freq: 660, type: 'triangle', dur: 0.2, peak: 0.24, when: 0.08 });
    tone({ freq: 880, type: 'sine', dur: 0.25, peak: 0.2, when: 0.16 });
    noise({ dur: 0.2, peak: 0.15, low: 900, when: 0.05 });
  },
  wipe: () => {
    tone({ freq: 220, type: 'sawtooth', dur: 0.25, peak: 0.16, slide: -120 });
    noise({ dur: 0.2, peak: 0.12, low: 400 });
  },
  foot: () => noise({ dur: 0.04, peak: 0.05, low: 280 }),
};

export function unlockAudio() { ac(); }
export function setMuted(v) { muted = !!v; }
export const sfx = new Proxy(CUES, {
  get(t, k) {
    if (k in t) return () => { try { t[k](); } catch { /* ignore */ } };
    return () => {};
  },
});
