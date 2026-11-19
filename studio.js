// Pixel backdrops in a 90s anime style, drawn at low resolution and scaled up.
// "blue": dusk city under a striped setting sun. "gold": the same at sunrise.
// "red": slow-turning speed lines for the hunter's big moments. "pub": Phat Eddie's.
const Studio = (() => {
  "use strict";
  const cv = document.getElementById("studio");
  const g = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PX = 3;
  let W = 0, H = 0, mood = "blue", last = 0, flash = null, base = null, scene = null, pub = null;
  const t0 = performance.now();
  const SKIES = {
    blue: { bands: ["#140f33", "#1d1650", "#2b1c6e", "#47238a", "#7a2f96", "#c0418f", "#ff6f8e", "#ffa07a"], sun: ["#fff1a8", "#ffd27a", "#ff9a6a", "#ff5f8a"], city: "#1a1140", ground: "#120c2c", win: ["#ffd27a", "#ff8fb0", "#8fe3ff"] },
    gold: { bands: ["#2a1850", "#4a2470", "#7a3080", "#b8487a", "#e8706a", "#ffa060", "#ffc870", "#ffe39a"], sun: ["#fffbe0", "#fff1a8", "#ffd27a", "#ffb060"], city: "#2a1640", ground: "#1e1236", win: ["#fff1a8", "#ffb0c8", "#a8f0ff"] },
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296); }
  function hex(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function size() { W = Math.ceil(innerWidth / PX); H = Math.ceil(innerHeight / PX); cv.width = W; cv.height = H; base = null; scene = null; pub = null; }
  addEventListener("resize", size);
  size();

  // ---------- dusk / sunrise city ----------
  function buildSky(k) {
    const P = SKIES[k], r = rng(11);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"), hz = Math.floor(H * 0.62);
    // dithered sky bands
    const img = x.createImageData(W, hz), d = img.data, cols = P.bands.map(hex), n = cols.length - 1;
    for (let y = 0; y < hz; y++) {
      const f = (y / hz) * n;
      for (let i = 0; i < W; i++) {
        const thr = BAYER[(y % 4) * 4 + (i % 4)] / 16;
        const idx = Math.min(n, Math.floor(f) + (f % 1 > thr ? 1 : 0));
        const o = (y * W + i) * 4, cc = cols[idx];
        d[o] = cc[0]; d[o + 1] = cc[1]; d[o + 2] = cc[2]; d[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    // striped sun sitting on the horizon
    const sr = Math.max(18, Math.floor(W * 0.2)), sx = Math.floor(W * 0.5), sy = hz;
    for (let y = -sr; y < 0; y++) {
      const band = Math.floor(((y + sr) / sr) * P.sun.length);
      const gap = y > -sr * 0.55 && ((-y) % 5 === 0 || (y > -sr * 0.3 && (-y) % 3 === 0));
      if (gap) continue;
      const w = Math.floor(Math.sqrt(sr * sr - y * y));
      x.fillStyle = P.sun[Math.min(P.sun.length - 1, band)]; x.fillRect(sx - w, sy + y, w * 2, 1);
    }
    // skyline
    const buildings = [];
    for (let i = -4; i < W + 4;) {
      const w = 6 + Math.floor(r() * 10), h = 8 + Math.floor(r() * (H * 0.16)) + (Math.abs(i - sx) < sr ? 0 : Math.floor(r() * 10));
      buildings.push({ x: i, w, h }); i += w + (r() < 0.3 ? 1 : 0);
    }
    const wins = [];
    for (const b of buildings) {
      x.fillStyle = P.city; x.fillRect(b.x, hz - b.h, b.w, b.h);
      if (r() < 0.25) x.fillRect(b.x + Math.floor(b.w / 2), hz - b.h - 4, 1, 4); // antenna
      for (let wy = hz - b.h + 3; wy < hz - 2; wy += 3) for (let wx = b.x + 2; wx < b.x + b.w - 1; wx += 3) if (r() < 0.32) wins.push({ x: wx, y: wy, c: P.win[Math.floor(r() * P.win.length)], ph: r() * 40 });
    }
    // ground / water
    x.fillStyle = P.ground; x.fillRect(0, hz, W, H - hz);
    x.fillStyle = "rgba(255,255,255,.06)"; x.fillRect(0, hz, W, 1);
    // stars and clouds are animated, so they're stored rather than drawn here
    const stars = Array.from({ length: Math.floor(W * 0.5) }, () => ({ x: Math.floor(r() * W), y: Math.floor(r() * hz * 0.5), ph: r() * 6.3, b: r() < 0.15 }));
    const clouds = Array.from({ length: 5 }, (_, i) => ({ x: r() * W, y: 18 + i * Math.floor(hz * 0.09) + Math.floor(r() * 6), w: 24 + Math.floor(r() * 40), sp: 0.4 + r() * 0.6 }));
    return { c, hz, sx, sr, wins, stars, clouds, P };
  }
  function city(t, k) {
    if (!scene || scene.k !== k) { scene = buildSky(k); scene.k = k; }
    const S = scene;
    g.drawImage(S.c, 0, 0);
    // stars
    for (const s of S.stars) {
      const a = reduce ? 0.6 : 0.35 + 0.35 * Math.sin(t * 0.8 + s.ph);
      g.fillStyle = `rgba(255,246,232,${a.toFixed(2)})`; g.fillRect(s.x, s.y, 1, 1);
      if (s.b) { g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); }
    }
    // clouds drifting slowly, lit pink from below
    for (const cl of S.clouds) {
      const x = ((cl.x + (reduce ? 0 : t * cl.sp)) % (W + cl.w * 2)) - cl.w;
      g.fillStyle = "rgba(90,50,140,.55)"; g.fillRect(Math.floor(x), cl.y, cl.w, 3); g.fillRect(Math.floor(x + cl.w * 0.2), cl.y - 2, Math.floor(cl.w * 0.5), 2);
      g.fillStyle = "rgba(255,140,170,.45)"; g.fillRect(Math.floor(x + 2), cl.y + 3, cl.w - 4, 1);
    }
    // windows flicker on and off now and then
    for (const w of S.wins) { if (!reduce && Math.sin(t * 0.3 + w.ph) > 0.92) continue; g.fillStyle = w.c; g.fillRect(w.x, w.y, 1, 1); }
    // sun reflection shimmering on the water
    for (let i = 0, y = S.hz + 2; y < H; y += 3, i++) {
      const w = Math.max(2, Math.floor(S.sr * (1 - i * 0.07) + (reduce ? 0 : Math.sin(t * 1.5 + i) * 3)));
      if (w <= 2) break;
      g.fillStyle = `rgba(255,140,150,${Math.max(0.05, 0.4 - i * 0.03).toFixed(2)})`; g.fillRect(S.sx - w, y, w * 2, 1);
    }
  }

  // ---------- speed lines ----------
  function speed(t) {
    g.fillStyle = "#1a0712"; g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.38, R = Math.hypot(W, H), n = 40, rot = reduce ? 0 : t * 0.05;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2, w = (i % 3 === 0 ? 0.05 : 0.025);
      g.fillStyle = i % 2 ? "rgba(255,77,94,.22)" : "rgba(255,200,210,.08)";
      g.beginPath(); g.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14);
      g.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); g.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); g.closePath(); g.fill();
    }
    const grd = g.createRadialGradient(cx, cy, 2, cx, cy, W * 0.5);
    grd.addColorStop(0, "rgba(255,120,130,.25)"); grd.addColorStop(1, "rgba(255,120,130,0)");
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
  }

  // ---------- pub ----------
  const SKIN = ["#e9b996", "#d39b78", "#b07a58", "#8a5a40", "#6a4432"];
  function buildPub() {
    const r = rng(42), shelves = [];
    for (let s = 0; s < 3; s++) {
      const row = [];
      for (let x = 4; x < W - 4; x += 3 + Math.floor(r() * 2)) row.push({ x, h: 6 + Math.floor(r() * 6), c: ["#3f8a52", "#8a4a26", "#d8b25a", "#7a2a40", "#e8e0c8", "#4a6aa0", "#c8702a"][Math.floor(r() * 7)], neck: r() < 0.7 });
      shelves.push(row);
    }
    const punters = [];
    for (let x = -4; x < W + 6; x += 13) punters.push({ x: x + Math.floor(r() * 4), skin: SKIN[Math.floor(r() * SKIN.length)], hair: ["#1d140f", "#3b2414", "#7a4a22", "#d8b070", "#222", "#c86a3a"][Math.floor(r() * 6)], shirt: ["#3a4a8a", "#8a3a4a", "#3a7a5a", "#7a5a3a", "#5a3a7a"][Math.floor(r() * 5)], ph: r() * 6.28, sp: 0.2 + r() * 0.3, pint: r() < 0.7 });
    return { shelves, punters };
  }
  function pubScene(t) {
    pub ||= buildPub();
    for (let x = 0; x < W; x += 8) { g.fillStyle = (x / 8) % 2 ? "#3a2416" : "#422a18"; g.fillRect(x, 0, 8, H); g.fillStyle = "#2a180e"; g.fillRect(x, 0, 1, H); }
    const by = 34, bh = Math.floor(H * 0.42);
    g.fillStyle = "#1c2a32"; g.fillRect(2, by, W - 4, bh);
    pub.shelves.forEach((row, s) => {
      const sy = by + 14 + s * Math.floor(bh / 3);
      g.fillStyle = "#6b4426"; g.fillRect(2, sy, W - 4, 2);
      for (const b of row) {
        g.fillStyle = b.c; g.fillRect(b.x, sy - b.h, 2, b.h);
        if (b.neck) g.fillRect(b.x, sy - b.h - 2, 1, 2);
        g.fillStyle = "rgba(255,255,255,.3)"; g.fillRect(b.x, sy - b.h + 1, 1, 2);
      }
    });
    for (let i = 0; i < 4; i++) {
      const lx = ((i + 0.5) / 4) * W;
      g.fillStyle = "#111"; g.fillRect(lx, 0, 1, 14); g.fillRect(lx - 4, 14, 9, 3);
      g.fillStyle = "#ffd27a"; g.fillRect(lx - 2, 17, 5, 1);
      const grd = g.createRadialGradient(lx, 18, 1, lx, 44, 52);
      grd.addColorStop(0, "rgba(255,200,110,.22)"); grd.addColorStop(1, "rgba(255,200,110,0)");
      g.fillStyle = grd; g.fillRect(lx - 55, 17, 110, 90);
    }
    const cbx = 6, cby = by + bh + 8;
    g.fillStyle = "#5a3a20"; g.fillRect(cbx - 1, cby - 1, 40, 26); g.fillStyle = "#1f2a24"; g.fillRect(cbx, cby, 38, 24);
    g.font = "6px DotGothic16, monospace"; g.textBaseline = "middle"; g.fillStyle = "rgba(240,240,230,.8)";
    g.fillText("QUIZ", cbx + 4, cby + 8); g.fillText("TUES 7PM", cbx + 3, cby + 18);
    const dx = W - 22, dy = by + bh + 18;
    for (const [rr, c] of [[11, "#1a1a1a"], [9, "#e8dcc0"], [7, "#1a1a1a"], [5, "#c0392b"], [3, "#2e8b57"], [1, "#c0392b"]]) { g.fillStyle = c; g.beginPath(); g.arc(dx, dy, rr, 0, 6.29); g.fill(); }
    const cy = Math.floor(H * 0.8);
    g.fillStyle = "#5a3418"; g.fillRect(0, cy, W, 4); g.fillStyle = "#7a4a24"; g.fillRect(0, cy, W, 1);
    g.fillStyle = "#3a2010"; g.fillRect(0, cy + 4, W, H - cy);
    for (const p of pub.punters) {
      const y = cy + 2, x = p.x, lift = !reduce && Math.sin(t * p.sp + p.ph) > 0.9;
      g.fillStyle = p.shirt; g.fillRect(x, y - 9, 9, 10);
      g.fillStyle = p.skin; g.fillRect(x + 2, y - 15, 5, 6);
      g.fillStyle = p.hair; g.fillRect(x + 2, y - 16, 5, 2);
      if (p.pint) { const py = lift ? y - 15 : y - 5, px = x + 9; g.fillStyle = "#e09a30"; g.fillRect(px, py, 3, 5); g.fillStyle = "#fff6e0"; g.fillRect(px, py - 1, 3, 1); }
    }
    const v = g.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.95);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(20,10,30,.5)");
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 100) return; // 10 fps keeps it calm and light on battery
    last = now;
    const t = (now - t0) / 1000;
    if (mood === "pub") pubScene(t);
    else if (mood === "red") speed(t);
    else city(t, mood === "gold" ? "gold" : "blue");
    // a quick impact frame after big moments
    if (flash && now < flash.until) { g.fillStyle = `rgba(${flash.rgb},${(((flash.until - now) / 300) * 0.35).toFixed(2)})`; g.fillRect(0, 0, W, H); }
  }
  requestAnimationFrame(frame);
  return {
    set(m) { mood = m; },
    cheer() { flash = { until: performance.now() + 300, rgb: "255,246,232" }; },
    gasp() { flash = { until: performance.now() + 300, rgb: "255,77,94" }; },
  };
})();
