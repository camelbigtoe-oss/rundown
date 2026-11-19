// Animated pixel backdrops, drawn at low resolution and scaled up.
// "Studio": LED wall, moving-head lights, stage and a live crowd that claps, cheers and gasps.
// "Pub": the Tuesday quiz venue, with a back bar, neon sign, pendant lamps and punters.
const Studio = (() => {
  "use strict";
  const cv = document.getElementById("studio");
  const g = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PX = 3;
  let W = 0, H = 0, mood = "blue", last = 0, cheerUntil = 0, gaspUntil = 0, crowd = [], pub = null, flashes = [];
  const t0 = performance.now();
  const MOODS = {
    blue: { top: "#07081c", mid: "#17124a", led: [47, 230, 200], led2: [138, 107, 255], beam: "255,214,110", floor: "#1d1650", glow: "47,230,200" },
    red: { top: "#12040a", mid: "#3e0a1c", led: [255, 59, 79], led2: [255, 140, 60], beam: "255,90,110", floor: "#320b1a", glow: "255,59,79" },
    gold: { top: "#110904", mid: "#432709", led: [255, 207, 74], led2: [255, 120, 200], beam: "255,225,130", floor: "#36210b", glow: "255,207,74" },
  };
  const SKIN = ["#f1c6a6", "#e0a882", "#c68a62", "#9b6545", "#6e4530", "#f6d9c4"];
  const HAIR = ["#1d140f", "#3b2414", "#7a4a22", "#e8c66a", "#b9b9c6", "#c2602a", "#111", "#ff6fae"];
  const SHIRT = ["#e63946", "#2fe6c8", "#ffcf4a", "#8a6bff", "#ff8c3a", "#3fa7ff", "#f4f1ea", "#4be07e", "#ff5d8f", "#262626"];

  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0) / 4294967296); }
  function size() {
    W = Math.ceil(innerWidth / PX); H = Math.ceil(innerHeight / PX);
    cv.width = W; cv.height = H;
    const r = rng(7);
    crowd = [];
    for (let row = 0; row < 3; row++) {
      for (let x = -6 + row * 4; x < W + 8; x += 9) {
        crowd.push({ x: x + Math.floor(r() * 3), row, skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * HAIR.length)],
          shirt: SHIRT[Math.floor(r() * SHIRT.length)], ph: r() * 6.28, sp: 2 + r() * 3, sign: r() < 0.06, signCol: SHIRT[Math.floor(r() * 4)], bald: r() < 0.12, long: r() < 0.3 });
      }
    }
    pub = null;
  }
  addEventListener("resize", size);
  size();

  // ---------- studio ----------
  function studio(t, now) {
    const m = MOODS[mood] || MOODS.blue;
    const cheer = now < cheerUntil, gasp = now < gaspUntil;
    const floorY = Math.floor(H * 0.68);
    // back wall gradient
    for (let i = 0; i < 12; i++) { g.fillStyle = mix(m.top, m.mid, i / 11); g.fillRect(0, Math.floor((i * floorY) / 12), W, Math.ceil(floorY / 12) + 1); }
    // LED wall: dot matrix with scrolling chevrons and a slow sweep
    const lx = 6, ly = 22, lw = W - 12, lh = Math.floor(floorY * 0.62);
    g.fillStyle = "#05050f"; g.fillRect(lx - 1, ly - 1, lw + 2, lh + 2);
    for (let y = 0; y < lh; y += 3) for (let x = 0; x < lw; x += 3) {
      const cx = x - lw / 2, chev = (Math.abs(cx) * 0.6 + y - t * (cheer ? 40 : 14)) % 24;
      const wave = Math.sin(x * 0.05 + t * 0.8) * 0.5 + 0.5;
      let a = chev < 0 ? 0 : chev < 5 ? 0.55 : 0.08;
      a *= 0.55 + wave * 0.45; if (gasp) a *= 0.35;
      const c = (Math.floor((x + y) / 30 + t * 0.3) % 2) ? m.led : m.led2;
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(2)})`;
      g.fillRect(lx + x, ly + y, 2, 2);
    }
    // lighting truss and fixtures
    g.fillStyle = "#24243a"; g.fillRect(0, 5, W, 3);
    for (let x = 2; x < W; x += 6) { g.fillStyle = "#34344e"; g.fillRect(x, 5, 1, 3); }
    // moving-head beams in crossing colours
    const beams = 6;
    for (let i = 0; i < beams; i++) {
      const bx = ((i + 0.5) / beams) * W;
      const speed = cheer ? 2.2 : 0.55;
      const sway = reduce ? 0 : Math.sin(t * speed + i * 1.9) * W * 0.32;
      const tx = bx + sway, bw = W * 0.12;
      const col = [m.beam, "47,230,200", "255,93,143", m.beam, "138,107,255", "255,207,74"][i];
      g.fillStyle = `rgba(${col},${gasp ? 0.03 : 0.075})`;
      g.beginPath(); g.moveTo(bx - 1, 9); g.lineTo(bx + 2, 9); g.lineTo(tx + bw / 2, floorY + 6); g.lineTo(tx - bw / 2, floorY + 6); g.closePath(); g.fill();
      g.fillStyle = `rgba(${col},0.08)`; g.beginPath(); g.ellipse(tx, floorY + 6, bw * 0.7, 3, 0, 0, 6.29); g.fill();
      g.fillStyle = "#3a3a52"; g.fillRect(bx - 2, 8, 5, 3);
      g.fillStyle = `rgba(${col},1)`; g.fillRect(bx - 1, 11, 3, 1);
    }
    // stage floor
    g.fillStyle = m.floor; g.fillRect(0, floorY, W, H - floorY);
    g.fillStyle = `rgba(${m.glow},0.7)`; g.fillRect(0, floorY, W, 1);
    for (let x = 0; x < W; x += 4) { const on = (Math.floor(x / 4 + t * 6) % 3) === 0; g.fillStyle = on ? `rgba(${m.glow},0.9)` : `rgba(${m.glow},0.25)`; g.fillRect(x, floorY + 2, 2, 1); }
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = -10; i <= 10; i++) { g.strokeStyle = "rgba(255,255,255,0.04)"; g.beginPath(); g.moveTo(W / 2 + i * 6, floorY + 3); g.lineTo(W / 2 + i * 34, H); g.stroke(); }
    // crowd
    drawCrowd(t, now, cheer, gasp, m);
  }

  function drawCrowd(t, now, cheer, gasp, m) {
    const base = [H - 22, H - 11, H + 1];
    for (let row = 0; row < 3; row++) {
      for (const p of crowd) {
        if (p.row !== row) continue;
        const ph = t * p.sp + p.ph;
        const bounce = cheer && !reduce ? (Math.sin(ph * 2) > 0 ? -2 : 0) : (!reduce && Math.sin(ph * 0.5) > 0.97 ? -1 : 0);
        const y = base[row] + bounce, x = p.x;
        // body
        g.fillStyle = p.shirt; g.fillRect(x, y - 7, 8, 9);
        g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x + 6, y - 7, 2, 9);
        // head and hair
        g.fillStyle = p.skin; g.fillRect(x + 2, y - 12, 4, 5);
        if (!p.bald) { g.fillStyle = p.hair; g.fillRect(x + 2, y - 13, 4, 2); if (p.long) g.fillRect(x + 1, y - 12, 1, 5), g.fillRect(x + 6, y - 12, 1, 5); }
        // arms: up when cheering, a clap now and then, hands on head when gasping
        g.fillStyle = p.skin;
        if (gasp) { g.fillRect(x + 1, y - 14, 2, 1); g.fillRect(x + 5, y - 14, 2, 1); g.fillStyle = p.shirt; g.fillRect(x, y - 13, 1, 6); g.fillRect(x + 7, y - 13, 1, 6); }
        else if (cheer) { const up = Math.sin(ph * 2 + 1) > -0.3; g.fillStyle = p.shirt; g.fillRect(x - 1, y - (up ? 15 : 10), 1, up ? 8 : 4); g.fillRect(x + 8, y - (up ? 15 : 10), 1, up ? 8 : 4); g.fillStyle = p.skin; g.fillRect(x - 1, y - (up ? 16 : 11), 1, 1); g.fillRect(x + 8, y - (up ? 16 : 11), 1, 1); }
        else if (!reduce && Math.sin(ph) > 0.6) { const c = Math.sin(ph * 6) > 0; g.fillRect(x + (c ? 3 : 2), y - 5, 1, 2); g.fillRect(x + (c ? 4 : 5), y - 5, 1, 2); }
        if (p.sign && row < 2) { const sy = y - 21 + (cheer ? Math.round(Math.sin(ph * 3)) : 0); g.fillStyle = "#f4f1ea"; g.fillRect(x - 2, sy, 12, 6); g.fillStyle = p.signCol; g.fillRect(x - 1, sy + 2, 10, 2); g.fillStyle = "#8a6a4a"; g.fillRect(x + 3, sy + 6, 1, 3); }
      }
      // haze over the rows further back
      if (row < 2) { g.fillStyle = `rgba(${m.glow},${row === 0 ? 0.08 : 0.04})`; g.fillRect(0, base[row] - 20, W, 22); }
    }
    // camera flashes when the crowd goes up
    if (cheer && !reduce && Math.random() < 0.35) flashes.push({ x: Math.random() * W, y: H - 8 - Math.random() * 20, life: 3 });
    flashes = flashes.filter((f) => f.life-- > 0);
    for (const f of flashes) { g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(f.x, f.y, 2, 2); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(f.x - 2, f.y, 6, 2); g.fillRect(f.x, f.y - 2, 2, 6); }
  }

  // ---------- pub ----------
  function buildPub() {
    const r = rng(42), shelves = [];
    for (let s = 0; s < 3; s++) {
      const row = [];
      for (let x = 4; x < W - 4; x += 3 + Math.floor(r() * 2)) row.push({ x, h: 6 + Math.floor(r() * 6), c: ["#2f7a3a", "#7a3a1a", "#c9a24a", "#6b1d2a", "#e8e0c8", "#3a5f8a", "#b8641e"][Math.floor(r() * 7)], neck: r() < 0.7 });
      shelves.push(row);
    }
    const punters = [];
    for (let x = -4; x < W + 6; x += 13) punters.push({ x: x + Math.floor(r() * 4), skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * 6)], shirt: ["#2a3a5a", "#5a2a2a", "#2f4a2f", "#4a3a2a", "#3a3a3a", "#6a5a3a"][Math.floor(r() * 6)], ph: r() * 6.28, sp: 0.4 + r() * 0.5, pint: r() < 0.7 });
    return { shelves, punters };
  }
  function pubScene(t, now) {
    pub ||= buildPub();
    const cheer = now < cheerUntil;
    // timber wall
    for (let x = 0; x < W; x += 8) { g.fillStyle = (x / 8) % 2 ? "#2b1a10" : "#311e12"; g.fillRect(x, 0, 8, H); g.fillStyle = "#1e120a"; g.fillRect(x, 0, 1, H); }
    // back bar mirror and shelves
    const by = 34, bh = Math.floor(H * 0.42);
    g.fillStyle = "#1a2a2a"; g.fillRect(2, by, W - 4, bh);
    g.fillStyle = "rgba(255,200,120,.06)"; for (let i = 0; i < W; i += 14) g.fillRect(i, by, 5, bh);
    pub.shelves.forEach((row, s) => {
      const sy = by + 14 + s * Math.floor(bh / 3);
      g.fillStyle = "#6b4426"; g.fillRect(2, sy, W - 4, 2); g.fillStyle = "#3a2414"; g.fillRect(2, sy + 2, W - 4, 1);
      for (const b of row) {
        g.fillStyle = b.c; g.fillRect(b.x, sy - b.h, 2, b.h);
        if (b.neck) g.fillRect(b.x, sy - b.h - 2, 1, 2);
        if (Math.sin(t * 1.5 + b.x) > 0.96) { g.fillStyle = "rgba(255,255,255,.9)"; g.fillRect(b.x, sy - b.h + 1, 1, 1); }
        else { g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(b.x, sy - b.h + 1, 1, 2); }
      }
    });
    // pendant lamps with warm pools of light
    for (let i = 0; i < 4; i++) {
      const lx = ((i + 0.5) / 4) * W + (reduce ? 0 : Math.sin(t * 0.7 + i) * 1.2);
      g.strokeStyle = "#111"; g.beginPath(); g.moveTo(((i + 0.5) / 4) * W, 0); g.lineTo(lx, 14); g.stroke();
      g.fillStyle = "#1a1a1a"; g.fillRect(lx - 4, 14, 8, 3);
      g.fillStyle = "#ffd27a"; g.fillRect(lx - 2, 17, 4, 1);
      const grd = g.createRadialGradient(lx, 18, 1, lx, 40, 46);
      grd.addColorStop(0, "rgba(255,200,110,.22)"); grd.addColorStop(1, "rgba(255,200,110,0)");
      g.fillStyle = grd; g.fillRect(lx - 50, 17, 100, 80);
    }
    // neon sign
    const flick = !reduce && Math.sin(t * 13) > 0.985 ? 0.35 : 1;
    neon("PHAT EDDIE'S", W / 2, 27, "255,80,160", flick);
    // chalkboard and dartboard
    const cbx = 6, cby = by + bh + 8;
    g.fillStyle = "#5a3a20"; g.fillRect(cbx - 1, cby - 1, 40, 26); g.fillStyle = "#1f2a24"; g.fillRect(cbx, cby, 38, 24);
    chalk("QUIZ", cbx + 4, cby + 8); chalk("TUES 7PM", cbx + 3, cby + 18);
    const dx = W - 22, dy = by + bh + 18;
    for (const [r, c] of [[11, "#1a1a1a"], [9, "#e8dcc0"], [7, "#1a1a1a"], [5, "#c0392b"], [3, "#2e8b57"], [1, "#c0392b"]]) { g.fillStyle = c; g.beginPath(); g.arc(dx, dy, r, 0, 6.29); g.fill(); }
    // bar counter
    const cy = Math.floor(H * 0.8);
    g.fillStyle = "#5a3418"; g.fillRect(0, cy, W, 4); g.fillStyle = "#7a4a24"; g.fillRect(0, cy, W, 1);
    g.fillStyle = "#3a2010"; g.fillRect(0, cy + 4, W, H - cy);
    for (let x = 0; x < W; x += 10) { g.fillStyle = "#2a160a"; g.fillRect(x, cy + 6, 1, H); }
    g.fillStyle = "#c9a24a"; g.fillRect(0, cy + 10, W, 1);
    // punters along the bar, raising pints now and then
    for (const p of pub.punters) {
      const y = cy + 2, x = p.x, lift = cheer || (!reduce && Math.sin(t * p.sp + p.ph) > 0.8);
      g.fillStyle = p.shirt; g.fillRect(x, y - 9, 9, 10);
      g.fillStyle = p.skin; g.fillRect(x + 2, y - 15, 5, 6);
      g.fillStyle = p.hair; g.fillRect(x + 2, y - 16, 5, 2);
      if (p.pint) {
        const py = lift ? y - 16 : y - 5, px = x + 9;
        g.fillStyle = "rgba(230,150,40,.95)"; g.fillRect(px, py, 3, 5); g.fillStyle = "#fff6e0"; g.fillRect(px, py - 1, 3, 1);
        g.fillStyle = p.skin; g.fillRect(px - 1, py + 2, 1, 2);
      }
    }
  }
  function neon(text, cx, cy, rgb, a) {
    g.font = "8px 'Press Start 2P', monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    const w = g.measureText(text).width;
    g.fillStyle = "#120810"; g.fillRect(cx - w / 2 - 5, cy - 8, w + 10, 16);
    g.strokeStyle = "#3a2a2a"; g.strokeRect(cx - w / 2 - 5, cy - 8, w + 10, 16);
    g.fillStyle = `rgba(${rgb},${0.18 * a})`; g.fillRect(cx - w / 2 - 4, cy - 7, w + 8, 14);
    g.fillStyle = `rgba(${rgb},${0.5 * a})`; g.fillText(text, cx + 1, cy + 1);
    g.fillStyle = `rgba(255,220,240,${a})`; g.fillText(text, cx, cy);
  }
  function chalk(text, x, y) { g.font = "5px 'Press Start 2P', monospace"; g.textAlign = "left"; g.textBaseline = "middle"; g.fillStyle = "rgba(240,240,230,.85)"; g.fillText(text, x, y); }

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 66) return; // ~15 fps is plenty for a backdrop
    last = now;
    const t = (now - t0) / 1000;
    g.clearRect(0, 0, W, H);
    if (mood === "pub") pubScene(t, now); else studio(t, now);
  }
  function mix(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
  requestAnimationFrame(frame);
  return {
    set(m) { mood = m; },
    cheer(ms = 1800) { cheerUntil = performance.now() + ms; gaspUntil = 0; },
    gasp(ms = 1800) { gaspUntil = performance.now() + ms; cheerUntil = 0; },
  };
})();
