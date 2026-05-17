// Soft, refined send/receive tones via WebAudio (matching, calm)
let _ctx = null;
function ctx() {
  if (!_ctx) { const A = window.AudioContext || window.webkitAudioContext; if (A) _ctx = new A(); }
  return _ctx;
}
function tone({ freq = 600, dur = 0.18, type = 'sine', vol = 0.05, attack = 0.01, delay = 0 }) {
  try {
    const c = ctx(); if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  } catch (e) { /* noop */ }
}
export const sounds = {
  send: () => { tone({ freq: 760, dur: 0.14, type: 'sine', vol: 0.06 }); tone({ freq: 1020, dur: 0.18, type: 'sine', vol: 0.05, delay: 0.06 }); },
  receive: () => { tone({ freq: 540, dur: 0.16, type: 'sine', vol: 0.06 }); tone({ freq: 720, dur: 0.18, type: 'sine', vol: 0.05, delay: 0.07 }); },
  click: () => tone({ freq: 1200, dur: 0.04, type: 'sine', vol: 0.02 }),
  success: () => { tone({ freq: 660, dur: 0.1, vol: 0.05 }); tone({ freq: 990, dur: 0.15, vol: 0.05, delay: 0.09 }); },
};
