// Chiptune sound effects made with WebAudio. No files to load.
const Sfx = (() => {
  "use strict";
  let ctx = null, on = true;
  try { on = localStorage.getItem("rd.sound") !== "0"; } catch {}
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ctx.state === "suspended") ctx.resume(); return ctx; }
  function tone(freq, dur, type = "square", vol = 0.08, when = 0, slide = 0) {
    if (!on) return; const a = ac(); if (!a) return;
    const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const seq = (notes, type, vol, gap = 0.09) => notes.forEach((f, i) => f && tone(f, gap * 1.6, type, vol, i * gap));
  return {
    get on() { return on; },
    toggle() { on = !on; try { localStorage.setItem("rd.sound", on ? "1" : "0"); } catch {} if (on) this.tap(); return on; },
    unlock() { ac(); },
    tap() { tone(660, 0.05, "square", 0.04); },
    right() { seq([784, 1047], "square", 0.06, 0.07); },
    wrong() { tone(196, 0.22, "sawtooth", 0.05, 0, -80); },
    tick() { tone(1200, 0.03, "square", 0.025); },
    step() { tone(330, 0.08, "triangle", 0.09); },
    hunter() { seq([220, 0, 220, 185], "sawtooth", 0.05, 0.1); },
    caught() { seq([392, 330, 262, 196, 131], "sawtooth", 0.06, 0.12); },
    home() { seq([523, 659, 784, 1047, 1319], "square", 0.06, 0.08); },
    fanfare() { seq([523, 523, 784, 0, 659, 784, 1047], "square", 0.06, 0.11); },
    buzz() { tone(110, 0.4, "square", 0.06); },
    blip() { tone(740, 0.025, "square", 0.018); },
    shout() { seq([330, 660], "sawtooth", 0.05, 0.06); },
  };
})();
