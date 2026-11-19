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

  // ---------- pub: Phat Eddie's on quiz night ----------
  // Warm anime pub interior: a big window onto the dusk city with the neon sign in it,
  // fairy lights, timber and green walls, brass beer taps and hanging plants.
  function buildPub() {
    const r = rng(42);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const P = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    // walls: deep green above, timber panelling below
    const wainY = Math.floor(H * 0.58);
    for (let y = 0; y < wainY; y++) { const k = y / wainY; P(k < 0.5 ? "#1e3a36" : "#1a332f", 0, y, W, 1); }
    for (let i = 0; i < W; i += 4) P(i % 8 ? "rgba(255,255,255,.02)" : "rgba(0,0,0,.08)", i, 0, 2, wainY); // wallpaper stripe
    P("#5a3418", 0, wainY - 3, W, 3); P("#8a5428", 0, wainY - 3, W, 1);
    for (let i = 0; i < W; i += 12) { P("#4a2a14", i, wainY, 12, H - wainY); P("#5c361a", i + 1, wainY + 2, 10, H - wainY - 4); P("#3a2010", i, wainY, 1, H - wainY); }
    // ceiling beam
    P("#3a2010", 0, 0, W, 6); P("#5a3418", 0, 6, W, 2);
    // the big window with the city outside
    const ww = Math.min(W - 24, Math.floor(W * 0.62)), wh = Math.floor(H * 0.3), wx = Math.floor((W - ww) / 2), wy = 18;
    const sky = ["#2b1c6e", "#47238a", "#7a2f96", "#c0418f", "#ff6f8e", "#ffa07a"];
    for (let y = 0; y < wh; y++) P(sky[Math.min(sky.length - 1, Math.floor((y / wh) * sky.length))], wx, wy + y, ww, 1);
    const hz = wy + Math.floor(wh * 0.78), sunR = Math.floor(ww * 0.14), sunX = wx + Math.floor(ww * 0.7);
    for (let y = -sunR; y < 0; y++) { if (y > -sunR * 0.5 && (-y) % 3 === 0) continue; const w = Math.floor(Math.sqrt(sunR * sunR - y * y)); P(y < -sunR * 0.5 ? "#ffe39a" : "#ffb070", sunX - w, hz + y, w * 2, 1); }
    const wins = [];
    for (let i = wx; i < wx + ww;) { const bw = 4 + Math.floor(r() * 7), bh = 5 + Math.floor(r() * wh * 0.45); P("#1a1140", i, hz - bh, bw, bh); for (let yy = hz - bh + 2; yy < hz - 1; yy += 3) for (let xx = i + 1; xx < i + bw - 1; xx += 2) if (r() < 0.3) wins.push({ x: xx, y: yy, ph: r() * 40 }); i += bw; }
    P("#120c2c", wx, hz, ww, wy + wh - hz);
    // window frame and panes
    P("#6b4426", wx - 3, wy - 3, ww + 6, 3); P("#6b4426", wx - 3, wy + wh, ww + 6, 4); P("#6b4426", wx - 3, wy, 3, wh); P("#6b4426", wx + ww, wy, 3, wh);
    P("#8a5a30", wx - 4, wy + wh, ww + 8, 1);
    for (let i = 1; i < 3; i++) P("#5a3418", wx + Math.floor((ww * i) / 3), wy, 2, wh);
    P("#5a3418", wx, wy + Math.floor(wh * 0.45), ww, 2);
    P("rgba(255,255,255,.07)", wx + 3, wy + 2, 2, wh - 4); P("rgba(255,255,255,.05)", wx + 6, wy + 2, 1, wh - 4);
    // shelves of bottles either side of the window
    for (const side of [0, 1]) {
      const sx0 = side ? wx + ww + 6 : 3, sw = (side ? W - 3 : wx - 6) - sx0;
      if (sw < 8) continue;
      for (let s = 0; s < 3; s++) {
        const sy = wy + 10 + s * Math.floor(wh / 3);
        P("#6b4426", sx0, sy, sw, 2);
        for (let bx = sx0 + 1; bx < sx0 + sw - 2; bx += 3 + Math.floor(r() * 2)) {
          const bh2 = 5 + Math.floor(r() * 5), col = ["#3f8a52", "#c8702a", "#d8b25a", "#7a2a40", "#4a6aa0", "#e8e0c8"][Math.floor(r() * 6)];
          P(col, bx, sy - bh2, 2, bh2); P(col, bx, sy - bh2 - 2, 1, 2); P("rgba(255,255,255,.35)", bx, sy - bh2 + 1, 1, 2);
        }
      }
    }
    // chalkboard and a dartboard on the panelling
    const cbw = 40, cbx = 8, cby = wainY - 34;
    P("#6b4426", cbx - 2, cby - 2, cbw + 4, 28); P("#1f2a24", cbx, cby, cbw, 24);
    x.font = "6px DotGothic16, monospace"; x.textBaseline = "middle"; x.fillStyle = "rgba(240,240,230,.85)";
    x.fillText("QUIZ NITE", cbx + 4, cby + 7); x.fillStyle = "rgba(255,209,102,.85)"; x.fillText("TUES 7PM", cbx + 4, cby + 17);
    const dx = W - 20, dy = wainY - 20;
    for (const [rr, col] of [[10, "#1a1a1a"], [8, "#e8dcc0"], [6, "#1a1a1a"], [4, "#c0392b"], [2, "#2e8b57"], [1, "#c0392b"]]) { x.fillStyle = col; x.beginPath(); x.arc(dx, dy, rr, 0, 6.29); x.fill(); }
    // bar counter with brass taps and stools
    const cy = Math.floor(H * 0.78);
    P("#2a160a", 0, cy - 2, W, 2); P("#8a5428", 0, cy, W, 3); P("#b87a3a", 0, cy, W, 1);
    P("#4a2812", 0, cy + 3, W, H - cy - 3);
    for (let i = 0; i < W; i += 14) { P("#3a1e0c", i, cy + 5, 1, H - cy); P("rgba(255,200,120,.06)", i + 2, cy + 5, 10, H - cy); }
    P("#c9a24a", 0, cy + 12, W, 1);
    const tx = Math.floor(W / 2) - 16;
    for (let i = 0; i < 5; i++) { const px = tx + i * 8; P("#d8b25a", px, cy - 14, 2, 14); P("#fff1a8", px, cy - 14, 1, 10); P(["#e0303f", "#3fb0d8", "#2fbf96", "#ffd166", "#ff6f8e"][i], px - 1, cy - 20, 4, 6); }
    for (let i = 0; i < W; i += 30) { P("#2a160a", i + 8, cy + 14, 2, H - cy); P("#7a2a30", i + 4, cy + 10, 10, 3); }
    return { c, wins, wainY, wx, ww, wy, wh };
  }
  function pubScene(t) {
    pub ||= buildPub();
    g.drawImage(pub.c, 0, 0);
    for (const w of pub.wins) { if (!reduce && Math.sin(t * 0.3 + w.ph) > 0.9) continue; g.fillStyle = "#ffd27a"; g.fillRect(w.x, w.y, 1, 1); }
    // neon sign hanging in the window
    const flick = !reduce && Math.sin(t * 7) > 0.995 ? 0.5 : 1;
    const sx = pub.wx + Math.floor(pub.ww / 2), sy = pub.wy + Math.floor(pub.wh * 0.22);
    g.font = "8px DotGothic16, monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = `rgba(255,80,160,${0.35 * flick})`; g.fillRect(sx - 34, sy - 7, 68, 14);
    g.fillStyle = `rgba(255,80,160,${0.6 * flick})`; g.fillText("PHAT EDDIE'S", sx + 1, sy + 1);
    g.fillStyle = `rgba(255,228,242,${flick})`; g.fillText("PHAT EDDIE'S", sx, sy);
    g.textAlign = "left";
    // fairy lights strung in loops under the beam
    const cols = ["#ffd166", "#ff6f8e", "#6fe3ff", "#6ff0c8"];
    for (let i = 0, x0 = 0; x0 < W; i++, x0 += 26) {
      for (let k = 0; k <= 26; k += 2) {
        const yy = 9 + Math.round(Math.sin((k / 26) * Math.PI) * 6);
        g.fillStyle = "rgba(20,10,4,.8)"; g.fillRect(x0 + k, yy, 1, 1);
        if (k % 6 === 0) {
          const on = reduce || Math.sin(t * 1.2 + i + k) > -0.4;
          const c = cols[(i + k / 6) % cols.length];
          g.fillStyle = on ? c : "rgba(255,255,255,.15)"; g.fillRect(x0 + k, yy + 1, 1, 2);
          if (on) { g.fillStyle = c.replace("#", "#") + "33"; g.fillRect(x0 + k - 1, yy, 3, 4); }
        }
      }
    }
    // hanging plants at the edges, swaying a touch
    for (const px of [6, W - 10]) {
      const sw = reduce ? 0 : Math.round(Math.sin(t * 0.6 + px) * 1);
      g.fillStyle = "#2a160a"; g.fillRect(px + 2, 0, 1, 20);
      g.fillStyle = "#7a4a24"; g.fillRect(px, 20, 6, 4);
      g.fillStyle = "#3f8a52"; for (let k = 0; k < 6; k++) g.fillRect(px + k + sw * (k % 2), 24, 1, 4 + ((k * 3) % 7));
      g.fillStyle = "#6fc07a"; g.fillRect(px + 1, 21, 4, 1);
    }
    // warm glow over everything
    const gl = g.createRadialGradient(W / 2, H * 0.4, 4, W / 2, H * 0.4, W * 0.9);
    gl.addColorStop(0, "rgba(255,190,110,.12)"); gl.addColorStop(1, "rgba(20,8,20,.35)");
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
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
