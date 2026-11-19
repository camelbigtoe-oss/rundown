// RPG layer: every character has a level and a 1-255 stat in each category.
// Correct answers earn XP (levels) and slowly raise the stat for that category.
// Stats power the chase "hunch" (crossing off a wrong answer) and pub quiz teammate hints.
const RPG = (() => {
  "use strict";
  const CATS = ["gk", "nz", "geo", "sci", "sport", "ent", "hist"];
  const SHORT = { gk: "GEN", nz: "NZ", geo: "GEO", sci: "SCI", sport: "SPT", ent: "ENT", hist: "HIS" };
  const MAX = 255, MAXLV = 99, PER_POINT = 4;
  let store;
  try { store = JSON.parse(localStorage.getItem("rd.rpg")) || {}; } catch { store = {}; }
  const save = () => { try { localStorage.setItem("rd.rpg", JSON.stringify(store)); } catch {} };
  const catOf = (c) => (c === "flag" ? "geo" : c);
  const need = (lv) => 10 + lv * 2; // XP from this level to the next

  function get(id) {
    const b = BASE[id]; if (!b) return null;
    if (!store[id]) store[id] = { lv: b.lv, xp: 0, stats: { ...b.stats }, prog: {} };
    return store[id];
  }
  const stat = (id, c) => { const r = get(id); return r ? r.stats[catOf(c)] || 0 : 0; };
  const stats = (id) => { const r = get(id); return r ? { ...r.stats } : null; };

  // returns { id, lv } when the character levels up
  function gain(id, c, amount = 1) {
    const r = get(id); if (!r) return null;
    const k = catOf(c); let up = null;
    if (CATS.includes(k)) {
      r.prog[k] = (r.prog[k] || 0) + amount;
      while (r.prog[k] >= PER_POINT) { r.prog[k] -= PER_POINT; if (r.stats[k] < MAX) r.stats[k]++; }
    }
    r.xp += amount;
    while (r.lv < MAXLV && r.xp >= need(r.lv)) { r.xp -= need(r.lv); r.lv++; up = { id, lv: r.lv }; }
    save(); return up;
  }
  function best(id) { const r = get(id); return CATS.reduce((a, c) => (r.stats[c] > r.stats[a] ? c : a), CATS[0]); }

  const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
  // letters revealed every third character: "H _ _ v _ _ i _ _"
  function pattern(a) {
    let n = 0;
    return [...a].map((ch) => { if (/[A-Za-z0-9À-ÿ]/.test(ch)) return n++ % 3 === 0 ? ch.toUpperCase() : "_"; return ch === " " ? "  " : ch; }).join(" ").replace(/\s{3,}/g, "   ");
  }
  // a teammate's hint for a pub quiz question: stronger stat + level = bigger clue.
  // Safe clues are always true; guesses can be wrong, less often the better they are.
  function hint(id, item, rnd = Math.random) {
    const s = stat(id, item.c), r = get(id), pw = s + (r ? r.lv : 0), a = item.a;
    const wrongs = item.w || [];
    const chars = a.replace(/[^A-Za-z0-9À-ÿ]/g, "");
    const digits = /^\d+$/.test(chars), words = a.trim().split(/\s+/).length;
    let tier, text;
    if (CHARS[id] && CHARS[id].perk === "hp" && item.hp) return { tier: 5, text: `Harry Potter? Easy. It's ${a}. I never get these wrong.` };
    if (pw >= 250 && wrongs.length) {
      tier = 4;
      const right = rnd() < Math.min(0.97, 0.5 + s / 600 + (r ? r.lv : 0) / 400);
      const say = right ? a : pick(wrongs, rnd);
      text = pick([`I'm pretty sure it's ${say}.`, `Easy. It's ${say}.`, `${say}. Trust me on this one.`], rnd);
    } else if (pw >= 195 && wrongs.length) {
      tier = 3;
      const other = pick(wrongs, rnd), pair = rnd() < 0.5 ? [a, other] : [other, a];
      text = `It's either ${pair[0]} or ${pair[1]}. I'd bet on one of those.`;
    } else if (pw >= 140) {
      tier = 2;
      text = `I've got some of it... ${pattern(a)}`;
    } else {
      tier = 1;
      text = digits ? `It's a ${chars.length}-digit number starting with ${chars[0]}.` : `It starts with "${chars[0].toUpperCase()}". ${chars.length} letters${words > 1 ? `, ${words} words` : ""}.`;
    }
    if (tier <= 2 && wrongs.length && rnd() < 0.35) {
      const right = rnd() < s / 300;
      text += ` Could it be ${right ? a : pick(wrongs, rnd)}?`;
    }
    return { tier, text };
  }
  // ---------- progress counters, unlocks and custom characters ----------
  let prog;
  try { prog = JSON.parse(localStorage.getItem("rd.prog")) || {}; } catch { prog = {}; }
  prog = { soloWins: 0, caught: 0, total: 0, correct: 0, pubWins: 0, beat: {}, unlocked: [], ...prog };
  const saveProg = () => { try { localStorage.setItem("rd.prog", JSON.stringify(prog)); } catch {} };
  function bump(key, n = 1) { prog[key] = (prog[key] || 0) + n; saveProg(); }
  function beat(h) { prog.beat[h] = true; saveProg(); }
  const isUnlocked = (id) => prog.unlocked.includes(id);
  const available = (id) => !!CHARS[id] && (!CHARS[id].hidden || isUnlocked(id));
  // returns ids that were just unlocked
  function checkUnlocks() {
    const out = [];
    for (const [id, u] of Object.entries(UNLOCKS)) if (!isUnlocked(id) && u.test(prog)) { prog.unlocked.push(id); out.push(id); }
    if (out.length) saveProg();
    return out;
  }

  let custom;
  try { custom = JSON.parse(localStorage.getItem("rd.custom")) || []; } catch { custom = []; }
  const saveCustom = () => { try { localStorage.setItem("rd.custom", JSON.stringify(custom)); } catch {} };
  function register(c) {
    CHARS[c.id] = { name: c.name, tag: c.tag || "Custom character", spec: c.spec, custom: true };
    if (!BASE[c.id]) BASE[c.id] = { lv: 10, stats: c.stats };
    if (!CHAR_ORDER.includes(c.id)) CHAR_ORDER.push(c.id);
  }
  custom.forEach(register);
  function addCustom(c) { custom.push(c); saveCustom(); register(c); }
  function removeCustom(id) {
    custom = custom.filter((c) => c.id !== id); saveCustom();
    delete CHARS[id]; delete BASE[id]; delete store[id]; save();
    const i = CHAR_ORDER.indexOf(id); if (i >= 0) CHAR_ORDER.splice(i, 1);
  }

  // secret links: ?unlock=all unlocks every hidden character on this device, ?unlock=reset locks them again
  function unlockAll() { prog.unlocked = Object.keys(UNLOCKS); saveProg(); }
  function relockAll() { prog.unlocked = []; saveProg(); }
  return { unlockAll, relockAll, CATS, SHORT, MAX, get, stat, stats, gain, need, best, hint, catOf, bump, beat, isUnlocked, available, checkUnlocks, addCustom, removeCustom, get prog() { return prog; } };
})();
