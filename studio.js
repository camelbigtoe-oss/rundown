// Quiet pixel backdrops, drawn at low resolution and scaled up.
// "Studio": a still, dithered dark set with one faint drifting light.
// "Pub": the Tuesday quiz venue, dimmed right down so the questions stay the focus.
const Studio = (() => {
  "use strict";
  const cv = document.getElementById("studio");
  const g = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PX = 3;
  let W = 0, H = 0, mood = "blue", last = 0, pulse = null, base = null, pub = null;
  const t0 = performance.now();
  // one tint per mood, all very close to black
  const MOODS = {
    blue: { top: [26, 29, 36], bottom: [11, 12, 15], light: "127,224,196" },
    red: { top: [36, 22, 20], bottom: [12, 10, 10], light: "255,90,54" },
    gold: { top: [34, 30, 20], bottom: [12, 11, 9], light: "232,200,114" },
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const SKIN = ["#c9a58a", "#b38a6c", "#9a7258", "#7a5644", "#5c3f32"];

  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296); }
  function size() { W = Math.ceil(innerWidth / PX); H = Math.ceil(innerHeight / PX); cv.width = W; cv.height = H; base = null; pub = null; }
  addEventListener("resize", size);
  size();

  // static layer: ordered-dither gradient, a horizon line and a sparse floor grid
  function buildBase(m) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), img = x.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) {
      const k = y / H;
      for (let i = 0; i < W; i++) {
        const thr = BAYER[(y % 4) * 4 + (i % 4)] / 16;
        const step = (k * 6 + thr * 0.9) | 0; // six dithered bands
        const f = Math.min(1, step / 6);
        const o = (y * W + i) * 4;
        d[o] = m.top[0] + (m.bottom[0] - m.top[0]) * f;
        d[o + 1] = m.top[1] + (m.bottom[1] - m.top[1]) * f;
        d[o + 2] = m.top[2] + (m.bottom[2] - m.top[2]) * f;
        d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    const hz = Math.floor(H * 0.7);
    x.fillStyle = "rgba(236,231,220,.06)"; x.fillRect(0, hz, W, 1);
    x.fillStyle = "rgba(236,231,220,.05)";
    for (let r = 1; r < 7; r++) { const y = hz + Math.round(Math.pow(r / 7, 1.7) * (H - hz)); for (let i = (r % 2) * 4; i < W; i += 8) x.fillRect(i, y, 1, 1); }
    return c;
  }

  function studio(t, now) {
    const m = MOODS[mood] || MOODS.blue;
    base ||= buildBase(m);
    g.drawImage(base, 0, 0);
    // one soft light, drifting very slowly
    const lx = W * (0.5 + (reduce ? 0 : Math.sin(t * 0.07) * 0.25)), ly = H * 0.32;
    const grd = g.createRadialGradient(lx, ly, 2, lx, ly, W * 0.7);
    grd.addColorStop(0, `rgba(${m.light},0.06)`); grd.addColorStop(1, `rgba(${m.light},0)`);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // a brief, faint wash from the floor after a big moment
    if (pulse && now < pulse.until) {
      const a = ((pulse.until - now) / pulse.len) * 0.12;
      const fl = g.createLinearGradient(0, H, 0, H * 0.55);
      fl.addColorStop(0, `rgba(${pulse.rgb},${a.toFixed(3)})`); fl.addColorStop(1, `rgba(${pulse.rgb},0)`);
      g.fillStyle = fl; g.fillRect(0, H * 0.55, W, H * 0.45);
    }
  }

  // ---------- pub ----------
  function buildPub() {
    const r = rng(42), shelves = [];
    for (let s = 0; s < 3; s++) {
      const row = [];
      for (let x = 4; x < W - 4; x += 3 + Math.floor(r() * 2)) row.push({ x, h: 6 + Math.floor(r() * 6), c: ["#3d5a3f", "#5a3a26", "#8a7444", "#4f2a30", "#a8a090", "#3a4a5e", "#7a5430"][Math.floor(r() * 7)], neck: r() < 0.7 });
      shelves.push(row);
    }
    const punters = [];
    for (let x = -4; x < W + 6; x += 13) punters.push({ x: x + Math.floor(r() * 4), skin: SKIN[Math.floor(r() * SKIN.length)], hair: ["#1d140f", "#3b2414", "#6a4a2a", "#a89a7a", "#222"][Math.floor(r() * 5)], shirt: ["#2a3240", "#3e2a2a", "#2c3a2c", "#3a3026", "#2a2a2a"][Math.floor(r() * 5)], ph: r() * 6.28, sp: 0.15 + r() * 0.2, pint: r() < 0.7 });
    return { shelves, punters };
  }
  function pubScene(t) {
    pub ||= buildPub();
    for (let x = 0; x < W; x += 8) { g.fillStyle = (x / 8) % 2 ? "#1f150e" : "#23170f"; g.fillRect(x, 0, 8, H); g.fillStyle = "#170f09"; g.fillRect(x, 0, 1, H); }
    const by = 34, bh = Math.floor(H * 0.42);
    g.fillStyle = "#141c1c"; g.fillRect(2, by, W - 4, bh);
    pub.shelves.forEach((row, s) => {
      const sy = by + 14 + s * Math.floor(bh / 3);
      g.fillStyle = "#4a301c"; g.fillRect(2, sy, W - 4, 2);
      for (const b of row) {
        g.fillStyle = b.c; g.fillRect(b.x, sy - b.h, 2, b.h);
        if (b.neck) g.fillRect(b.x, sy - b.h - 2, 1, 2);
        g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(b.x, sy - b.h + 1, 1, 2);
      }
    });
    for (let i = 0; i < 4; i++) {
      const lx = ((i + 0.5) / 4) * W;
      g.fillStyle = "#0d0d0d"; g.fillRect(lx, 0, 1, 14); g.fillRect(lx - 4, 14, 9, 3);
      g.fillStyle = "#d9b26a"; g.fillRect(lx - 2, 17, 5, 1);
      const grd = g.createRadialGradient(lx, 18, 1, lx, 44, 50);
      grd.addColorStop(0, "rgba(230,180,100,.14)"); grd.addColorStop(1, "rgba(230,180,100,0)");
      g.fillStyle = grd; g.fillRect(lx - 55, 17, 110, 90);
    }
    const cbx = 6, cby = by + bh + 8;
    g.fillStyle = "#3a2716"; g.fillRect(cbx - 1, cby - 1, 40, 26); g.fillStyle = "#1a201d"; g.fillRect(cbx, cby, 38, 24);
    g.font = "5px Silkscreen, monospace"; g.textBaseline = "middle"; g.fillStyle = "rgba(220,220,210,.6)";
    g.fillText("QUIZ", cbx + 4, cby + 8); g.fillText("TUES 7PM", cbx + 3, cby + 18);
    const dx = W - 22, dy = by + bh + 18;
    for (const [rr, c] of [[11, "#141414"], [9, "#8a8270"], [7, "#141414"], [5, "#6a2a22"], [3, "#2a4a36"], [1, "#6a2a22"]]) { g.fillStyle = c; g.beginPath(); g.arc(dx, dy, rr, 0, 6.29); g.fill(); }
    const cy = Math.floor(H * 0.8);
    g.fillStyle = "#3e2412"; g.fillRect(0, cy, W, 4); g.fillStyle = "#4e3018"; g.fillRect(0, cy, W, 1);
    g.fillStyle = "#26160b"; g.fillRect(0, cy + 4, W, H - cy);
    for (const p of pub.punters) {
      const y = cy + 2, x = p.x, lift = !reduce && Math.sin(t * p.sp + p.ph) > 0.92;
      g.fillStyle = p.shirt; g.fillRect(x, y - 9, 9, 10);
      g.fillStyle = p.skin; g.fillRect(x + 2, y - 15, 5, 6);
      g.fillStyle = p.hair; g.fillRect(x + 2, y - 16, 5, 2);
      if (p.pint) { const py = lift ? y - 15 : y - 5, px = x + 9; g.fillStyle = "#b07a2a"; g.fillRect(px, py, 3, 5); g.fillStyle = "#d8cfb8"; g.fillRect(px, py - 1, 3, 1); }
    }
    // dim it all down and vignette the edges
    g.fillStyle = "rgba(10,9,8,.35)"; g.fillRect(0, 0, W, H);
    const v = g.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.9);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.55)");
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 100) return; // 10 fps: the backdrop barely moves
    last = now;
    const t = (now - t0) / 1000;
    if (mood === "pub") pubScene(t); else studio(t, now);
  }
  requestAnimationFrame(frame);
  return {
    set(m) { if (m !== mood) { mood = m; base = null; } },
    cheer(ms = 1800) { pulse = { until: performance.now() + ms, len: ms, rgb: "127,224,196" }; },
    gasp(ms = 1800) { pulse = { until: performance.now() + ms, len: ms, rgb: "255,90,54" }; },
  };
})();
