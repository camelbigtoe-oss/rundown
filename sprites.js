// Pixel people. Every contestant and hunter is drawn from a small spec (build, hair, beard,
// clothes, shoes) onto a 32x48 grid, then cached as a PNG data URL for <img> tags.
const Sprites = (() => {
  "use strict";
  const W = 32, H = 48;
  const BUILDS = {
    slim: { tx: 10, tw: 12, arm: 3 },
    avg: { tx: 9, tw: 14, arm: 3 },
    curvy: { tx: 9, tw: 14, arm: 3 },
    big: { tx: 7, tw: 18, arm: 4 },
  };
  const cache = new Map();

  let K = 1; // shading strength; draw() turns it down for a flatter look
  function shade(hex, amt) {
    amt *= K;
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
    r = f(r); g = f(g); b = f(b);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function draw(ctx, s) {
    K = 0.5;
    try { paint(ctx, s); } finally { K = 1; }
  }
  function paint(ctx, s) {
    ctx.clearRect(0, 0, W, H);
    const P = (c, x, y, w = 1, h = 1) => { if (!c) return; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const b = BUILDS[s.build || "avg"];
    const L = b.tx, R = b.tx + b.tw - 1, mid = b.tx + Math.floor(b.tw / 2);
    const sk = s.skin, sks = shade(sk, -0.16), skl = shade(sk, 0.12);
    const hc = s.hair || "#222", hs = shade(hc, -0.3), hl = shade(hc, 0.25);
    const t = s.top || { style: "tee", color: "#446" };
    const tc = t.color, ts = shade(tc, -0.25), tl = shade(tc, 0.14);
    const bt = s.bottom || { style: "pants", color: "#333" };
    const bc = bt.color, bs = shade(bc, -0.25);
    const longHair = ["long", "streak"].includes(s.hairStyle);
    const longSleeve = ["hoodie", "cardigan", "suit", "jumper", "coat", "blazer", "denim", "cloak", "gown"].includes(t.style);

    // floor shadow
    P("rgba(0,0,0,.25)", L - 2, 46, b.tw + 4, 1);

    // hair that falls behind the body
    if (longHair) { P(hs, 8, 6, 16, 17); P(hc, 8, 6, 2, 16); }
    if (s.hairStyle === "ponytail") { P(hs, 22, 5, 3, 13); P(hc, 22, 5, 2, 12); }
    if (t.style === "cloak") { P(shade(tc, -0.45), L - b.arm - 1, 17, b.tw + 2 * b.arm + 2, 24); }

    // legs
    const lw = Math.floor((b.tw - 3) / 2);
    const legs = [[L + 1, lw], [R - lw, lw]];
    let skinTop = 31;
    if (bt.style === "shorts") skinTop = 36 + (s.build === "big" ? 1 : 0);
    if (bt.style === "skirt") skinTop = 37;
    if (t.style === "dress" || t.style === "gown") skinTop = t.style === "gown" ? 46 : 39;
    if (t.style === "coat") skinTop = 31;
    for (const [x, w] of legs) {
      if (bt.style === "pants" || bt.style === "jeans") { P(bc, x, 31, w, 13); P(bs, x + w - 1, 31, 1, 13); }
      else { P(sk, x, skinTop, w, 44 - skinTop); P(sks, x + w - 1, skinTop, 1, 44 - skinTop); }
      if (s.socks) {
        const top = s.socks.knee === false ? 41 : 38;
        P(s.socks.color, x, top, w, 44 - top); P(shade(s.socks.color, -0.18), x + w - 1, top, 1, 44 - top);
        if (s.socks.stripe) { P(s.socks.stripe, x, top, w, 1); P(s.socks.stripe, x, top + 2, w, 1); }
      }
    }
    // shoes
    const sh = s.shoes || { style: "low", color: "#222", sole: "#ddd" };
    for (const [x, w] of legs) {
      const sx = x - 1, sw = w + 2;
      if (sh.style === "hi") {
        P(sh.color, x, 41, w, 4);
        P(sh.accent || "#111", x, 41, w, 1);
        P(sh.color, sx, 44, sw, 2);
        P(sh.toe || "#f4f4f4", sx, 44, 3, 2);
        P(sh.accent || "#111", sx + 3, 44, 1, 2);
        P(sh.sole || "#eee", sx, 46, sw, 1);
        P(shade(sh.color, 0.3), x + 1, 42, 2, 1);
      } else if (sh.style === "boot") {
        P(sh.color, x, 40, w, 5); P(sh.color, sx, 44, sw, 2); P(sh.sole || "#222", sx, 46, sw, 1);
        P(shade(sh.color, 0.25), x + 1, 41, 1, 3);
      } else if (sh.style === "heel") {
        P(sh.color, sx + 1, 44, sw - 1, 2); P(shade(sh.color, -0.3), x + w - 1, 46, 1, 1);
      } else {
        P(sh.color, sx, 44, sw, 2); P(sh.accent || shade(sh.color, -0.2), sx + 1, 44, 2, 1); P(sh.sole || "#ddd", sx, 46, sw, 1);
      }
    }
    // bottoms
    if (bt.style === "shorts") {
      const end = skinTop - 1;
      P(bc, L, 31, b.tw, end - 30); P(bs, R - 1, 31, 2, end - 30);
      P(shade(bc, -0.4), mid - 1, 33, 1, end - 32);
      P(bs, L, end, lw + 1, 1); P(bs, R - lw, end, lw + 1, 1);
    } else if (bt.style === "skirt") {
      P(bc, L, 31, b.tw, 3); P(bc, L - 1, 34, b.tw + 2, 3); P(bs, R, 31, 1, 6);
    } else if (bt.style === "pants" || bt.style === "jeans") {
      P(bc, L, 31, b.tw, 3); P(shade(bc, -0.4), mid - 1, 33, 1, 11);
      if (bt.style === "jeans") { P(shade(bc, 0.2), L + 2, 36, 1, 2); P(shade(bc, 0.2), R - 3, 38, 1, 2); }
    }

    // torso
    let tL = L, tW = b.tw;
    P(tc, L, 17, b.tw, 14);
    if (s.belly) { P(tc, L - 1, 24, b.tw + 2, 7); P(ts, R + 1, 24, 1, 7); P(tl, L - 1, 25, 1, 5); }
    if (s.build === "curvy") { P(tc, L - 1, 27, b.tw + 2, 4); P(ts, R + 1, 27, 1, 4); }
    P(ts, R - 1, 17, 2, 14); P(tl, L, 18, 1, 12);
    // shoulder rounding
    P(tc, L - b.arm + 1, 17, b.arm - 1, 1); P(tc, R + 1, 17, b.arm - 1, 1);

    // style details
    if (t.style === "tee" || t.style === "jersey") {
      P(sks, mid - 2, 17, 4, 1); P(sk, mid - 1, 17, 2, 2);
      if (t.style === "jersey") { P(t.trim || "#fff", mid - 3, 17, 6, 1); P(t.trim || "#fff", mid - 1, 18, 2, 1); P(shade(tc, 0.12), L, 25, b.tw, 1); }
    }
    if (t.graphic === "ring") {
      const cx = mid, g = "#f7c948", gd = "#b8860b", gl = "#fff3b0";
      P(g, cx - 1, 20, 2, 1); P(gl, cx - 2, 21, 1, 1); P(g, cx + 1, 21, 1, 1);
      P(g, cx - 3, 22, 1, 2); P(gd, cx + 2, 22, 1, 2);
      P(g, cx - 2, 24, 1, 1); P(gd, cx + 1, 24, 1, 1); P(gd, cx - 1, 25, 2, 1);
      P("#ff7a1a", cx - 4, 21, 1, 1); P("#ff7a1a", cx + 3, 24, 1, 1); P("#ffb347", cx + 3, 21, 1, 1);
      for (let i = 0; i < 9; i += 2) P("#cfa53a", cx - 5 + i, 28, 1, 1);
      P("#5d6b4f", L + 1, 19, 1, 9); P("#5d6b4f", R - 2, 19, 1, 9);
    }
    if (t.graphic === "hivis") {
      P("#d4f21f", L, 17, 4, 14); P("#d4f21f", R - 3, 17, 4, 14); P("#d4f21f", L, 26, b.tw, 5);
      P("#cfd6dd", L, 23, 4, 1); P("#cfd6dd", R - 3, 23, 4, 1); P("#cfd6dd", L, 28, b.tw, 1);
      if (s.belly) { P("#d4f21f", L - 1, 26, b.tw + 2, 5); P("#cfd6dd", L - 1, 28, b.tw + 2, 1); }
    }
    if (t.graphic === "stripe") { P(t.stripe || "#fff", L, 22, b.tw, 2); P(t.stripe || "#fff", L - b.arm, 22, b.arm, 2); P(t.stripe || "#fff", R + 1, 22, b.arm, 2); }
    if (t.style === "hoodie") {
      P(ts, L + 2, 16, b.tw - 4, 2); P(sks, mid - 1, 17, 2, 1);
      P("#eee", mid - 2, 18, 1, 4); P("#eee", mid + 1, 18, 1, 4);
      P(ts, L + 3, 26, b.tw - 6, 3); P(shade(tc, -0.35), L, 30, b.tw, 1);
    }
    if (t.style === "jumper") { P(sks, mid - 2, 17, 4, 1); P(ts, mid - 3, 17, 6, 1); P(ts, L, 30, b.tw, 1); for (let x = L; x <= R; x += 2) P(ts, x, 30, 1, 1); }
    if (t.style === "cardigan" || t.style === "denim" || t.style === "blazer") {
      const inner = t.inner || "#fff";
      P(inner, mid - 2, 17, 4, 14); P(shade(inner, -0.12), mid + 1, 17, 1, 14);
      if (t.style === "cardigan") { P(ts, mid - 3, 17, 1, 14); P(ts, mid + 2, 17, 1, 14); P(t.button || "#c9a46a", mid - 3, 21, 1, 1); P(t.button || "#c9a46a", mid - 3, 25, 1, 1); }
      if (t.style === "denim") { P(ts, L + 2, 20, 3, 2); P(ts, R - 4, 20, 3, 2); P("#e8d48a", L + 3, 20, 1, 1); }
      if (t.style === "blazer") { P(ts, mid - 3, 17, 1, 6); P(ts, mid + 2, 17, 1, 6); }
      P(sk, mid - 1, 17, 2, 1);
    }
    if (t.style === "suit") {
      P("#f2f2f2", mid - 2, 17, 4, 6); P("#f2f2f2", mid - 1, 23, 2, 1);
      P(t.tie || "#b3132b", mid - 1, 18, 2, 6); P(shade(t.tie || "#b3132b", -0.3), mid - 1, 18, 2, 1);
      P(ts, mid - 3, 17, 1, 8); P(ts, mid + 2, 17, 1, 8); P(t.vest || ts, mid - 2, 23, 4, 7);
      P("#e8c66a", mid - 4, 22, 1, 1); // pocket chain
      P("#e8c66a", mid - 5, 23, 1, 1);
    }
    if (t.style === "dress" || t.style === "gown") {
      const end = t.style === "gown" ? 45 : 38;
      for (let y = 31, i = 0; y <= end; y++, i++) { const flare = Math.min(4, Math.floor(i / 2)); P(tc, L - flare, y, b.tw + 2 * flare, 1); P(ts, R + flare - 1, y, 1, 1); }
      P(t.trim || shade(tc, -0.4), L, 27, b.tw, 1);
      P(sks, mid - 3, 17, 6, 2); P(sk, mid - 2, 17, 4, 2);
    }
    if (t.style === "coat") {
      for (let y = 17; y <= 39; y++) { P(tc, L - (y > 30 ? 1 : 0), y, b.tw + (y > 30 ? 2 : 0), 1); }
      P(t.inner || "#1b1b2b", mid - 2, 17, 4, 14); P(ts, mid - 3, 17, 1, 23); P(ts, mid + 2, 17, 1, 23);
      P(ts, R, 17, 1, 23); P("#9ad", L + 1, 24, 3, 1);
    }
    if (t.style === "cloak") {
      P(shade(tc, -0.3), L - b.arm, 17, b.tw + 2 * b.arm, 4);
      for (let y = 18; y < 40; y += 2) for (let x = L - b.arm; x < R + b.arm + 1; x += 3) P((x + y) % 4 ? shade(tc, 0.25) : shade(tc, -0.2), x + ((y / 2) % 2), y, 2, 1);
      P(t.trim || "#e9e1cf", L - b.arm, 17, b.tw + 2 * b.arm, 1);
      P(t.trim || "#e9e1cf", mid - 1, 18, 2, 1);
    }

    // arms
    const armTop = 18;
    for (const side of [0, 1]) {
      const ax = side ? R + 1 : L - b.arm;
      const ac = t.style === "cloak" ? shade(tc, -0.1) : tc;
      if (t.style === "cloak") { P(ac, ax, armTop, b.arm, 15); P(sk, ax + (side ? 0 : 1), 33, b.arm - 1, 2); continue; }
      if (longSleeve) {
        P(ac, ax, armTop, b.arm, 12); P(shade(ac, -0.3), ax, 29, b.arm, 1);
        if (side) P(ts, ax + b.arm - 1, armTop, 1, 11); else P(tl, ax, armTop + 1, 1, 9);
      } else {
        P(ac, ax, armTop, b.arm, 4); P(shade(ac, -0.25), ax, armTop + 3, b.arm, 1);
        P(sk, ax, armTop + 4, b.arm, 8); P(sks, side ? ax + b.arm - 1 : ax, armTop + 4, 1, 8);
        if (s.strong) { P(skl, side ? ax : ax + 1, armTop + 5, 2, 2); P(sks, side ? ax + 1 : ax + 1, armTop + 9, 2, 1); }
      }
      P(sk, ax, 30, b.arm, 2); P(sks, ax, 31, b.arm, 1);
    }

    // neck + head
    P(sks, 14, 15, 4, 2);
    P(sk, 11, 4, 10, 1); P(sk, 10, 5, 12, 10); P(sk, 11, 15, 10, 1);
    P(sks, 21, 6, 1, 8); P(sks, 12, 15, 8, 1);
    P(sk, 9, 9, 1, 2); P(sk, 22, 9, 1, 2); P(sks, 22, 10, 1, 1);

    // face
    const brow = s.browColor || hs;
    if (s.mean) { P(brow, 12, 7, 2, 1); P(brow, 14, 8, 1, 1); P(brow, 17, 8, 1, 1); P(brow, 18, 7, 2, 1); }
    else { P(brow, 12, 7, 3, 1); P(brow, 17, 7, 3, 1); }
    const eye = s.eye || "#1a1020";
    P("#fff", 12, 9, 2, 2); P("#fff", 18, 9, 2, 2); P(eye, 13, 9, 1, 2); P(eye, 18, 9, 1, 2);
    if (s.lashes) { P("#2a1a22", 11, 8, 1, 1); P("#2a1a22", 20, 8, 1, 1); P("#2a1a22", 12, 8, 2, 1); P("#2a1a22", 18, 8, 2, 1); }
    P(sks, 15, 11, 2, 1);
    if (s.blush) { P("rgba(255,110,140,.3)", 11, 11, 2, 1); P("rgba(255,110,140,.3)", 19, 11, 2, 1); }
    const mc = "#7a2a35";
    switch (s.mouth) {
      case "grin": P(mc, 13, 12, 6, 2); P("#fff", 14, 12, 4, 1); P("#e66a7a", 15, 13, 2, 1); break;
      case "stern": P(mc, 14, 13, 4, 1); break;
      case "smirk": P(mc, 14, 13, 3, 1); P(mc, 17, 12, 1, 1); break;
      default: P(mc, 13, 12, 1, 1); P(mc, 14, 13, 4, 1); P(mc, 18, 12, 1, 1);
    }

    // hair
    const st = s.hairStyle;
    if (st === "short" || st === "bun" || st === "ponytail" || st === "topknot") {
      P(hc, 10, 2, 12, 3); P(hc, 9, 4, 14, 2); P(hc, 9, 6, 2, 3); P(hc, 21, 6, 2, 3); P(hc, 11, 5, 10, 1); P(hl, 12, 2, 5, 1); P(hs, 20, 3, 2, 2);
      if (st === "bun") { P(hc, 13, 0, 6, 3); P(hl, 14, 0, 2, 1); }
      if (st === "topknot") { P(hc, 14, 0, 4, 3); P(s.tie || "#c8a14a", 14, 2, 4, 1); P(hl, 15, 0, 1, 1); }
    } else if (st === "volume") {
      P(hc, 10, 1, 12, 2); P(hc, 9, 3, 14, 3); P(hc, 9, 6, 2, 4); P(hc, 21, 6, 2, 4); P(hc, 11, 6, 4, 1); P(hc, 15, 5, 7, 2);
      P(hl, 12, 1, 5, 1); P(hl, 10, 3, 3, 1); P(hs, 19, 3, 3, 2);
    } else if (longHair) {
      P(hc, 10, 2, 12, 3); P(hc, 9, 4, 14, 3); P(hc, 9, 6, 2, 13); P(hc, 21, 6, 2, 13); P(hc, 11, 5, 6, 2); P(hc, 17, 5, 3, 1);
      P(hl, 11, 3, 6, 1); P(hl, 9, 8, 1, 9); P(hs, 22, 7, 1, 11); P(hl, 12, 5, 2, 1);
      P(hc, 8, 17, 3, 5); P(hc, 21, 17, 3, 5); P(hs, 23, 18, 1, 4);
      if (st === "streak") { P("#f2f2f2", 12, 2, 2, 5); P("#f2f2f2", 9, 7, 1, 10); }
    } else if (st === "bob") {
      P(hc, 10, 2, 12, 3); P(hc, 9, 4, 14, 3); P(hc, 8, 6, 3, 9); P(hc, 21, 6, 3, 9); P(hc, 10, 5, 12, 2);
      P(hl, 11, 2, 6, 1); P(hl, 8, 7, 1, 7); P(hs, 23, 7, 1, 8);
    } else if (st === "curly") {
      P(hc, 9, 1, 14, 4); P(hc, 8, 3, 16, 4); P(hc, 8, 7, 3, 7); P(hc, 21, 7, 3, 7); P(hc, 10, 5, 12, 2);
      for (const [x, y] of [[10, 1], [14, 0], [18, 1], [8, 4], [22, 4], [12, 3], [17, 3], [9, 9], [22, 10]]) P(hl, x, y, 2, 1);
      for (const [x, y] of [[20, 2], [11, 6], [16, 5], [23, 8]]) P(hs, x, y, 1, 1);
    } else if (st === "mohawk") {
      P(hs, 10, 4, 12, 2); P(hs, 9, 6, 1, 3); P(hs, 22, 6, 1, 3); P(hc, 13, 0, 6, 5); P(hl, 14, 0, 2, 2);
    } else if (st === "slick") {
      P(hc, 10, 3, 12, 2); P(hc, 9, 4, 2, 5); P(hc, 21, 4, 2, 5); P(hc, 11, 5, 3, 1); P(hl, 12, 3, 7, 1); P(hs, 18, 4, 4, 1);
    } else if (st === "bald") {
      P(skl, 13, 5, 4, 1); P(skl, 12, 6, 2, 1);
    } else if (st === "fade") {
      P(hs, 10, 4, 12, 2); P(hs, 9, 6, 2, 2); P(hs, 21, 6, 2, 2); P(hc, 10, 2, 12, 3); P(hl, 12, 2, 6, 1);
    }

    // beard
    if (s.beard) {
      const bd = s.beardColor || hc, bdl = shade(bd, 0.22), bds = shade(bd, -0.3);
      if (s.beard === "big") {
        P(bd, 10, 7, 1, 4); P(bd, 21, 7, 1, 4);
        P(bd, 10, 11, 12, 5); P(bd, 10, 10, 2, 1); P(bd, 20, 10, 2, 1);
        P(bd, 10, 16, 12, 2); P(bd, 11, 18, 10, 1); P(bd, 13, 19, 6, 1);
        P(bd, 13, 11, 6, 1);
        P("#9a4a4a", 14, 13, 4, 1);
        P(bdl, 12, 15, 2, 1); P(bdl, 17, 16, 2, 1); P(bdl, 14, 18, 2, 1); P(bds, 20, 12, 2, 5);
      } else if (s.beard === "stubble") {
        for (let y = 12; y < 16; y++) for (let x = 11 + (y % 2); x < 21; x += 2) P(shade(sk, -0.28), x, y, 1, 1);
      } else if (s.beard === "mo") {
        P(bd, 13, 12, 6, 1); P(bd, 12, 13, 1, 1); P(bd, 19, 13, 1, 1);
      } else if (s.beard === "goatee") {
        P(bd, 13, 12, 6, 1); P(bd, 14, 14, 4, 2); P(bd, 15, 16, 2, 1);
      }
    }

    // eyewear + extras
    if (s.glasses) {
      const g = s.glasses;
      P(g, 11, 8, 4, 1); P(g, 11, 11, 4, 1); P(g, 11, 8, 1, 4); P(g, 14, 8, 1, 4);
      P(g, 17, 8, 4, 1); P(g, 17, 11, 4, 1); P(g, 17, 8, 1, 4); P(g, 20, 8, 1, 4); P(g, 15, 9, 2, 1);
    }
    if (s.monocle) { P("#e8c66a", 17, 8, 4, 1); P("#e8c66a", 17, 11, 4, 1); P("#e8c66a", 17, 8, 1, 4); P("#e8c66a", 20, 8, 1, 4); P("#e8c66a", 20, 12, 1, 4); P("rgba(200,230,255,.35)", 18, 9, 2, 2); }
    if (s.goggles) { P("#22252e", 9, 8, 14, 4); P(s.goggles, 11, 9, 4, 2); P(s.goggles, 17, 9, 4, 2); P("#fff", 11, 9, 1, 1); P("#fff", 17, 9, 1, 1); }
    if (s.earring) { P(s.earring, 22, 11, 1, 1); P(s.earring, 9, 11, 1, 1); }
    if (s.pounamu) { P("#2fa36b", mid - 1, 20, 2, 3); P("#7be0a8", mid - 1, 20, 1, 1); P("#3a2a1a", mid - 2, 17, 1, 3); P("#3a2a1a", mid + 1, 17, 1, 3); }
    if (s.cap) { P(s.cap, 9, 1, 14, 4); P(shade(s.cap, -0.3), 7, 5, 9, 1); P(shade(s.cap, 0.3), 14, 2, 2, 1); }
  }

  function url(id, spec) {
    if (cache.has(id)) return cache.get(id);
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    draw(c.getContext("2d"), spec);
    const u = c.toDataURL("image/png");
    cache.set(id, u);
    return u;
  }

  return { url, draw, shade, W, H };
})();
