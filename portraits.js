// Anime-style pixel bust portraits (40x40) for dialogue boxes, menus and stat cards.
// Built from the same specs as the full-body sprites: big glinting eyes, cel-shaded hair.
const Portraits = (() => {
  "use strict";
  const N = 40;
  const cache = new Map();
  const shade = (h, a) => Sprites.shade(h, a);
  const LONG = ["long", "streak"];

  function paint(ctx, s) {
    ctx.clearRect(0, 0, N, N);
    const P = (c, x, y, w = 1, h = 1) => { if (!c) return; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const sk = s.skin, sks = shade(sk, -0.2), skl = shade(sk, 0.14);
    const hc = s.hair || "#222", hs = shade(hc, -0.38), hl = shade(hc, 0.35);
    const t = s.top || { style: "tee", color: "#446" };
    const tc = t.color, ts = shade(tc, -0.32), tl = shade(tc, 0.18);
    const st = s.hairStyle, ink = "#1a1030";

    // hair behind the head
    if (LONG.includes(st)) { P(hs, 8, 9, 24, 26); P(hc, 8, 9, 3, 25); }
    if (st === "ponytail") { P(hs, 28, 9, 5, 18); P(hc, 29, 10, 2, 16); }
    if (st === "bob") { P(hs, 9, 9, 22, 17); }
    if (st === "curly") { P(hs, 8, 6, 24, 20); }

    // shoulders and clothes
    const sw = s.build === "big" ? 38 : s.build === "slim" ? 28 : 33, sx = Math.floor((N - sw) / 2);
    P(tc, sx, 32, sw, 8); P(tc, sx + 3, 30, sw - 6, 2); P(ts, sx + sw - 5, 31, 5, 9); P(tl, sx + 1, 33, 2, 7);
    if (t.style === "cloak") { P(shade(tc, -0.2), sx - 1, 30, sw + 2, 10); for (let x = sx; x < sx + sw; x += 3) P(shade(tc, 0.22), x, 33 + (x % 2) * 2, 2, 1); P(t.trim || "#e9e1cf", sx, 30, sw, 1); }
    // neck
    P(sks, 17, 25, 6, 6); P(sk, 18, 25, 4, 5);
    // collar details
    const st2 = t.style;
    if (st2 === "suit") { P("#f4f4f4", 17, 30, 6, 6); P(t.tie || "#b3132b", 19, 31, 2, 9); P(ts, 15, 30, 2, 10); P(ts, 23, 30, 2, 10); }
    else if (st2 === "cardigan" || st2 === "blazer" || st2 === "denim") { P(t.inner || "#fff", 16, 30, 8, 10); P(sk, 18, 30, 4, 2); P(ts, 15, 30, 1, 10); P(ts, 24, 30, 1, 10); }
    else if (st2 === "coat") { P(t.inner || "#1d2133", 17, 30, 6, 10); P("#cfd6e0", 15, 30, 2, 10); P("#cfd6e0", 23, 30, 2, 10); }
    else if (st2 === "hoodie") { P(ts, 13, 29, 14, 3); P(sk, 18, 30, 4, 2); P("#eee", 17, 32, 1, 4); P("#eee", 22, 32, 1, 4); }
    else if (st2 === "jersey") { P(t.trim || "#fff", 16, 30, 8, 2); P(sk, 18, 30, 4, 1); }
    else if (st2 === "gown") { P(sk, 15, 30, 10, 4); P(t.trim || shade(tc, -0.4), 14, 33, 12, 1); }
    else if (st2 === "jumper") { P(ts, 16, 30, 8, 2); P(sk, 18, 30, 4, 1); }
    else { P(sk, 17, 30, 6, 2); P(sks, 18, 32, 4, 1); }
    if (t.graphic === "ring") { P("#f7c948", 19, 34, 2, 1); P("#f7c948", 18, 35, 1, 2); P("#f7c948", 21, 35, 1, 2); P("#f7c948", 19, 37, 2, 1); }
    if (t.graphic === "globe") { P("#2f6fb0", 18, 34, 4, 4); P("#4bbf6a", 18, 35, 2, 1); P("#4bbf6a", 20, 37, 2, 1); }
    if (t.graphic === "hivis") { P("#d4f21f", sx, 32, 6, 8); P("#d4f21f", sx + sw - 6, 32, 6, 8); P("#cfd6dd", sx, 36, 6, 1); P("#cfd6dd", sx + sw - 6, 36, 6, 1); }
    if (t.graphic === "stripe") { P(t.stripe || "#fff", sx, 36, sw, 2); }
    if (s.pounamu) { P("#2fa36b", 19, 33, 2, 3); P("#7be0a8", 19, 33, 1, 1); }

    // head: anime shape with a tapered chin
    P(sk, 12, 8, 16, 14); P(sk, 13, 22, 14, 2); P(sk, 14, 24, 12, 1); P(sk, 16, 25, 8, 1); P(sk, 18, 26, 4, 1);
    P(sks, 26, 10, 2, 12); P(sks, 25, 22, 2, 2); P(sks, 23, 24, 3, 1); P(sks, 21, 25, 3, 1);
    P(sk, 11, 15, 1, 4); P(sk, 28, 15, 1, 4); P(sks, 28, 16, 1, 2);
    // shadow cast by the fringe
    P(sks, 12, 12, 16, 1);

    // eyes
    const iris = s.eye || "#3a2a5a", irisD = shade(iris, -0.45), irisL = shade(iris, 0.45);
    const lash = s.lashColor || ink;
    for (const [x, inner] of [[13, 1], [22, 0]]) {
      P("#fff", x, 15, 5, 4);
      const ix = inner ? x + 2 : x;
      P(iris, ix, 15, 3, 4); P(irisD, ix, 15, 3, 1); P(irisL, ix, 18, 3, 1);
      P("#fff", ix, 16, 1, 1); P("rgba(255,255,255,.7)", ix + 2, 17, 1, 1);
      if (s.mean) { P(lash, x, 14, 5, 1); P(lash, inner ? x + 4 : x, 15, 1, 1); }
      else { P(lash, x - (inner ? 1 : 0), 14, 6, 1); P(lash, inner ? x - 1 : x + 5, 15, 1, 1); }
      if (s.lashes) P(lash, inner ? x - 1 : x + 5, 14, 1, 1), P(lash, inner ? x - 2 : x + 6, 13, 1, 1);
      P(sks, x, 19, 5, 1);
    }
    // brows
    const brow = s.browColor || hs;
    if (s.mean) { P(brow, 13, 11, 2, 1); P(brow, 15, 12, 3, 1); P(brow, 22, 12, 3, 1); P(brow, 25, 11, 2, 1); }
    else { P(brow, 13, 12, 5, 1); P(brow, 22, 12, 5, 1); }
    // nose, mouth, cheeks
    P(sks, 20, 20, 1, 2);
    const mc = "#7a2a35";
    switch (s.mouth) {
      case "grin": P(mc, 17, 22, 6, 3); P("#fff", 18, 22, 4, 1); P("#e66a7a", 18, 24, 4, 1); break;
      case "stern": P(mc, 18, 23, 4, 1); break;
      case "smirk": P(mc, 18, 23, 3, 1); P(mc, 21, 22, 1, 1); break;
      default: P(mc, 18, 23, 4, 1); P(mc, 17, 22, 1, 1); P(mc, 22, 22, 1, 1);
    }
    if (s.blush) { for (const x of [13, 24]) { P("rgba(255,110,140,.55)", x, 20, 3, 1); P("rgba(255,110,140,.35)", x + 1, 21, 2, 1); } }

    // hair, front
    const bangs = (xs, low) => xs.forEach((x, i) => { const d = low + (i % 2); P(hc, x, 10, 3, d - 10); P(hc, x + 1, d, 1, 1); });
    if (st === "bald") { P(skl, 16, 9, 6, 1); P(skl, 15, 10, 2, 1); }
    else if (st === "slick") { P(hc, 11, 5, 18, 5); P(hc, 10, 8, 3, 6); P(hc, 27, 8, 3, 6); P(hl, 13, 6, 12, 1); P(hs, 22, 8, 6, 1); }
    else if (st === "mohawk") { P(hs, 11, 7, 18, 3); P(hs, 10, 9, 2, 5); P(hs, 28, 9, 2, 5); P(hc, 17, 0, 6, 9); P(hl, 18, 1, 2, 5); }
    else if (st === "fade") { P(hs, 11, 7, 18, 4); P(hs, 10, 10, 2, 5); P(hs, 28, 10, 2, 5); P(hc, 12, 5, 16, 4); P(hl, 14, 5, 8, 1); }
    else if (st === "volume") {
      P(hc, 10, 3, 20, 8); P(hc, 12, 1, 4, 2); P(hc, 18, 0, 5, 3); P(hc, 24, 2, 4, 2);
      P(hc, 9, 8, 3, 9); P(hc, 28, 8, 3, 8); bangs([12, 15, 19, 23], 13);
      P(hl, 13, 4, 9, 1); P(hl, 19, 1, 2, 1); P(hs, 24, 5, 5, 3);
    } else if (st === "curly") {
      P(hc, 9, 2, 22, 9); for (const [x, y] of [[9, 1], [14, 0], [20, 0], [26, 1], [8, 5], [30, 5]]) P(hc, x, y, 4, 3);
      P(hc, 8, 9, 4, 13); P(hc, 28, 9, 4, 13); bangs([12, 16, 20, 24], 12);
      for (const [x, y] of [[11, 3], [17, 2], [23, 3], [9, 12], [29, 14]]) P(hl, x, y, 2, 1);
    } else if (st === "bob") {
      P(hc, 10, 3, 20, 8); P(hc, 9, 8, 4, 17); P(hc, 27, 8, 4, 17); P(hc, 11, 10, 18, 3);
      P(hl, 13, 4, 10, 1); P(hl, 10, 12, 1, 9); P(hs, 29, 10, 1, 14);
    } else if (LONG.includes(st)) {
      P(hc, 10, 3, 20, 8); P(hc, 9, 8, 3, 27); P(hc, 28, 8, 3, 27); bangs([12, 15, 18, 21, 24], 13);
      P(hl, 13, 4, 10, 1); P(hl, 9, 14, 1, 14); P(hs, 30, 12, 1, 20);
      if (st === "streak") { P("#f2f2f2", 13, 3, 3, 10); P("#f2f2f2", 9, 10, 2, 18); }
    } else {
      P(hc, 10, 3, 20, 8); P(hc, 9, 7, 3, 9); P(hc, 28, 7, 3, 8); bangs([12, 15, 19, 23], 13);
      P(hl, 13, 4, 9, 1); P(hs, 24, 5, 5, 2);
      if (st === "bun") { P(hc, 16, 0, 8, 4); P(hl, 17, 0, 3, 1); }
      if (st === "topknot") { P(hc, 17, 0, 6, 4); P(s.tie || "#c8a14a", 17, 3, 6, 1); }
    }

    // beards
    if (s.beard) {
      const bd = s.beardColor || hc, bdl = shade(bd, 0.25), bds = shade(bd, -0.3);
      if (s.beard === "big") {
        P(bd, 11, 14, 2, 8); P(bd, 27, 14, 2, 8);
        P(bd, 12, 19, 16, 5); P(bd, 13, 24, 14, 3); P(bd, 15, 27, 10, 2); P(bd, 17, 29, 6, 1);
        P(bd, 16, 21, 8, 1); P("#9a4a4a", 18, 23, 4, 1);
        P(bdl, 14, 22, 2, 1); P(bdl, 20, 26, 2, 1); P(bdl, 16, 27, 1, 1); P(bds, 25, 20, 3, 6);
      } else if (s.beard === "goatee") { P(bd, 17, 22, 6, 1); P(bd, 18, 24, 4, 3); }
      else if (s.beard === "mo") { P(bd, 16, 21, 8, 1); }
      else if (s.beard === "stubble") { for (let y = 20; y < 26; y++) for (let x = 13 + (y % 2); x < 27; x += 2) P(shade(sk, -0.25), x, y, 1, 1); }
    }

    // extras
    if (s.glasses) { const g = s.glasses; for (const x of [12, 21]) { P(g, x, 14, 7, 1); P(g, x, 19, 7, 1); P(g, x, 14, 1, 6); P(g, x + 6, 14, 1, 6); } P(g, 19, 16, 2, 1); }
    if (s.monocle) { const g = "#e8c66a"; P(g, 21, 14, 7, 1); P(g, 21, 19, 7, 1); P(g, 21, 14, 1, 6); P(g, 27, 14, 1, 6); P(g, 27, 20, 1, 8); P("rgba(200,230,255,.35)", 22, 15, 5, 4); }
    if (s.goggles) { P("#22252e", 10, 13, 20, 7); P(s.goggles, 12, 15, 6, 3); P(s.goggles, 22, 15, 6, 3); P("#fff", 12, 15, 2, 1); P("#fff", 22, 15, 2, 1); }
    if (s.earring) { P(s.earring, 11, 20, 1, 2); P(s.earring, 28, 20, 1, 2); }
    if (s.cap) { P(s.cap, 10, 2, 20, 8); P(shade(s.cap, 0.25), 13, 3, 8, 1); P(shade(s.cap, -0.35), 7, 9, 16, 2); P(hc, 9, 10, 3, 6); P(hc, 28, 10, 3, 5); }
  }

  function url(id, spec) {
    if (cache.has(id)) return cache.get(id);
    const c = document.createElement("canvas"); c.width = N; c.height = N;
    paint(c.getContext("2d"), spec);
    const u = c.toDataURL("image/png"); cache.set(id, u); return u;
  }
  return { url };
})();
