// Question bank. Category files call Bank.add(cat, text) with one question per line:
//   question | answer | wrong1; wrong2; wrong3 | other accepted answers | flags
// flags: "m" = only works with options shown (left out of the typed pub quiz).
const Bank = (() => {
  "use strict";
  const CATS = {
    gk: "General Knowledge", nz: "Aotearoa", geo: "Geography", sci: "Science & Nature",
    sport: "Sport", ent: "Film & TV", hist: "History", games: "Video Games", food: "Food & Drink",
    lit: "Literature", art: "Art & Design", music: "Music", words: "Words & Language", myth: "Mythology",
    space: "Space", animals: "Animals & Nature", tech: "Technology", body: "The Human Body",
    maths: "Maths & Numbers", cars: "Cars & Transport",
  };
  const all = [];
  const byCat = {};
  const LS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const SAVE = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  let seen = new Set(LS("rd.seen", []));
  let flagged = new Set(LS("rd.flag", []));

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  function add(cat, text) {
    (byCat[cat] ||= []);
    for (const raw of text.replace(/\r/g, "").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const [q, a, w = "", x = "", f = ""] = line.split("|").map((p) => p.trim());
      const wrong = w.split(";").map((s) => s.trim()).filter(Boolean);
      if (!q || !a || wrong.length < 3) { console.warn("bad question", line); continue; }
      const item = { id: cat + "-" + hash(q), c: cat, q, a, w: wrong, x: x.split(";").map((s) => s.trim()).filter(Boolean), m: f.includes("m"), hp: f.includes("h") };
      all.push(item); byCat[cat].push(item);
    }
  }

  function shuffle(a, rnd = Math.random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // a question with n options, avoiding ones this device has seen until the pool runs dry
  function next(n = 3, avoid) {
    let pool = all.filter((q) => !flagged.has(q.id) && !seen.has(q.id) && !(avoid && avoid.has(q.id)));
    if (pool.length < 20) {
      seen = new Set();
      pool = all.filter((q) => !flagged.has(q.id) && !(avoid && avoid.has(q.id)));
    }
    const item = pool[Math.floor(Math.random() * pool.length)];
    seen.add(item.id); SAVE("rd.seen", [...seen]);
    if (avoid) avoid.add(item.id);
    return pose(item, n);
  }

  function pose(item, n) {
    const opts = shuffle([item.a, ...shuffle(item.w.slice()).slice(0, n - 1)]);
    return { id: item.id, c: item.c, q: item.q, opts, ans: opts.indexOf(item.a), a: item.a, hp: item.hp };
  }

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ").replace(/[^a-z0-9 ]/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  // typed answer check: exact after tidying, or a small typo on longer words; numbers must be exact
  // a typo is forgiven only if every short word (3 letters or fewer) is exact, so "Vitamin A" never passes for "Vitamin D"
  function typoOK(g, ok, tol) {
    if (lev(g, ok) > tol) return false;
    const a = g.split(" "), b = ok.split(" ");
    if (a.length === b.length) for (let i = 0; i < a.length; i++) if (Math.min(a[i].length, b[i].length) <= 3 && a[i] !== b[i]) return false;
    return true;
  }
  function matches(input, item) {
    const g = norm(input); if (!g) return false;
    const accepted = [item.a, ...item.x].map(norm);
    if (accepted.includes(g)) return true;
    // never accept one of the listed wrong answers, or anything closer to a wrong answer than to a right one
    const wrongs = (item.w || []).map(norm).filter((w) => !accepted.includes(w));
    if (wrongs.includes(g)) return false;
    const nearestWrong = wrongs.length ? Math.min(...wrongs.map((w) => lev(g, w))) : Infinity;
    for (const ok of accepted) {
      if (/\d/.test(ok)) continue;
      const tol = ok.length >= 9 ? 2 : ok.length >= 5 ? 1 : 0;
      if (tol && typoOK(g, ok, tol) && lev(g, ok) < nearestWrong) return true;
      // surname-only answers for people ("Hillary" for "Edmund Hillary")
      if (isPerson(item.a) && g.length >= 4) {
        const parts = ok.split(" ");
        if (lev(g, parts[parts.length - 1]) <= (g.length >= 7 ? 1 : 0)) return true;
      }
    }
    return false;
  }

  // looks like a person's name: 2-4 capitalised words, no place or thing words
  const NOT_PERSON = /\b(strait|lake|river|mount|mt|island|islands|sound|sea|ocean|falls|desert|canal|cup|war|wars|wall|stone|street|coast|leone|kingdom|states|city|bay|museum|road|red|blanc|perk|tavern|theory|deep|cloud|black|white|ferns|blacks|whites|kiwis|old|new|great|north|south|east|west|open|masters|treaty|empire|death|ides|lighthouse|pyramid|rising|apparatus)\b/i;
  function isPerson(a) {
    const w = a.trim().split(/\s+/);
    return w.length >= 2 && w.length <= 4 && !/^the\b/i.test(a) && w.every((x) => /^[A-ZÀ-Ý]/.test(x) || /^(van|de|da|von|der|du|le|la|of)$/.test(x) || /^[A-Z].?$/.test(x)) && !NOT_PERSON.test(a) && !/d/.test(a);
  }

  function flag(id) { flagged.add(id); SAVE("rd.flag", [...flagged]); }
  function unflagAll() { flagged = new Set(); SAVE("rd.flag", []); }

  // seeded random for the weekly quiz
  function rng(seed) { let t = seed >>> 0; return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }

  return { add, next, pose, matches, norm, all, byCat, CATS, shuffle, rng, flag, unflagAll, get flagged() { return flagged; } };
})();
