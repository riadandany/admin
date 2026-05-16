// Generate gentle sounds via WebAudio (no external assets)
function playTone(freq, duration, type = 'sine', volume = 0.05) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // ignore
  }
}

export const sounds = {
  send: () => playTone(880, 0.12, 'triangle', 0.04),
  receive: () => { playTone(660, 0.1, 'sine', 0.05); setTimeout(() => playTone(880, 0.15, 'sine', 0.04), 80); },
  click: () => playTone(1200, 0.05, 'sine', 0.02),
  success: () => { playTone(660, 0.1, 'sine', 0.05); setTimeout(() => playTone(990, 0.15, 'sine', 0.05), 90); },
};
