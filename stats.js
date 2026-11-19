// Career stats: every answer, game and personal best on this device, for the Career Stats page.
const Stats = (() => {
  "use strict";
  const KEY = "rd.stats";
  let s;
  try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { s = {}; }
  s = { since: Date.now(), cats: {}, games: [], vs: {}, answered: 0, right: 0, streak: 0, pushbacks: 0, ponder: 0, ...s };
  s.best = { cash: 0, pot: 0, steps: 0, offer: 0, streak: 0, ...(s.best || {}) };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

  // one answered question in a category, right or wrong
  function answer(cat, ok) {
    if (!cat) return;
    const c = (s.cats[cat] ||= { r: 0, t: 0 });
    c.t++; s.answered++;
    if (ok) { c.r++; s.right++; s.streak++; s.best.streak = Math.max(s.best.streak, s.streak); } else s.streak = 0;
    save();
  }
  function best(k, v) { if (v > (s.best[k] || 0)) { s.best[k] = v; save(); } }
  function bump(k, n = 1) { s[k] = (s[k] || 0) + n; save(); }
  function game(g) {
    s.games.push(g); if (s.games.length > 200) s.games.shift();
    const v = (s.vs[g.hunter] ||= { w: 0, l: 0 }); if (g.won) v.w++; else v.l++;
    save();
  }
  return { answer, best, bump, game, get data() { return s; } };
})();
