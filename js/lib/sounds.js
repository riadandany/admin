// Sound effects - generates short click sounds via Web Audio API
// Can be overridden by URLs set in site_settings

let audioCtx = null;
function getCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  return audioCtx;
}

// Synth click: short blip with quick decay (different freqs for each type)
function synthClick(freq = 880, dur = 0.06) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.5, 60), ctx.currentTime + dur);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur + 0.02);
  } catch {}
}

const audioCache = {};
function playUrl(url, volume = 0.5) {
  if (!url) return false;
  try {
    let a = audioCache[url];
    if (!a) { a = new Audio(url); a.volume = volume; audioCache[url] = a; }
    a.currentTime = 0;
    a.play().catch(() => {});
    return true;
  } catch { return false; }
}

let settingsRef = { sound_nav_url: '', sound_button_url: '', sound_page_url: '' };
export function setSoundSettings(s) {
  settingsRef = { ...settingsRef, ...(s || {}) };
}

export const playNav = () => { if (!playUrl(settingsRef.sound_nav_url)) synthClick(1000, 0.05); };
export const playButton = () => { if (!playUrl(settingsRef.sound_button_url)) synthClick(660, 0.07); };
export const playPage = () => { if (!playUrl(settingsRef.sound_page_url)) synthClick(520, 0.12); };
