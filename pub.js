// TUESDAY QUIZ: a practice pub quiz night. Eight rounds of ten, typed answers on an answer sheet,
// a joker to double one round, marking at the end of each round and a leaderboard against
// the regulars. Same questions for everyone in a given week; a fresh set each week.
const Pub = (() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // quizzes saved before rounds rotated use this fixed line-up
  const LEGACY = [
    { c: "gk", name: "General Knowledge" }, { c: "geo", name: "Geography" }, { c: "flag", name: "Picture Round: Flags" },
    { c: "sci", name: "Science & Nature" }, { c: "sport", name: "Sport" }, { c: "nz", name: "Aotearoa" },
    { c: "ent", name: "Film, TV & Music" }, { c: "hist", name: "History" },
  ];
  // each week: General Knowledge first, flags third, Aotearoa sixth, and five other categories drawn by the week
  const ROTATE = ["geo", "sci", "sport", "ent", "hist", "games", "food", "lit", "art", "music", "words", "myth", "space", "animals", "tech", "body", "maths", "cars"];
  function roundsFor(w) {
    const picks = Bank.shuffle(ROTATE.slice(), Bank.rng(w * 2654435 + 99)).slice(0, 5);
    const name = (c) => ({ c, name: Bank.CATS[c] });
    return [name("gk"), name(picks[0]), { c: "flag", name: "Picture Round: Flags" }, name(picks[1]), name(picks[2]), name("nz"), name(picks[3]), name(picks[4])].map((r) => (r.c === "nz" ? { c: "nz", name: "Aotearoa" } : r));
  }
  let ROUNDS = roundsFor(0);
  // the Ponderer for a week, and how many points a solve on a given clue is worth
  const ponderFor = (w) => PONDERERS[((w % PONDERERS.length) + PONDERERS.length) % PONDERERS.length];
  const ponderPts = (clue) => 9 - clue;
  const PER = 10;
  const RIVALS = ["Quizteama Aguilera", "Les Quizerables", "The Quizzly Bears", "Agatha Quiztie", "Universally Challenged", "Tequila Mockingbird", "Trivia Newton-John", "Sherlock Homies"];
  let st = null; // the quiz in progress
  let party = UI_LS("rd.party", ["jackie", "zach"]);
  function UI_LS(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
  const PARTY = 2, HINTS = 2;
  function mateChip(id) {
    const r = RPG.get(id), on = party.includes(id);
    return `<button class="mate ${on ? "on" : ""}" data-pub="mate" data-v="${id}">${UI.portrait(id)}<b>${UI.esc(CHARS[id].name)}</b><small>Lv ${r.lv} · ${RPG.SHORT[RPG.best(id)]} ${r.stats[RPG.best(id)]}</small></button>`;
  }

  const esc = (s) => UI.esc(s);
  const save = () => UI.SAVE("rd.pub", st);

  // weeks are counted from Tuesday 6 Jan 2026; week 0 is that Tuesday's quiz
  const EPOCH = Date.UTC(2026, 0, 6);
  function weekNo(d = new Date()) { const day = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); return Math.floor((day - EPOCH) / (7 * 864e5)); }
  function tuesday(w) { const t = new Date(EPOCH + w * 7 * 864e5); return t.toLocaleDateString("en-NZ", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }); }

  function poolFor(c) { return c === "flag" ? Flags.items : (Bank.byCat[c] || []).filter((q) => !q.m && !Bank.flagged.has(q.id)); }
  // each category is shuffled once per cycle; week n takes the next 10 in line
  function pickRound(c, w) {
    const pool = poolFor(c), per = Math.max(1, Math.floor(pool.length / PER));
    const cycle = Math.floor(w / per), slot = ((w % per) + per) % per;
    const seed = (cycle + 1) * 7919 + [...c].reduce((a, ch) => a + ch.charCodeAt(0) * 31, 0);
    const order = Bank.shuffle(pool.slice(), Bank.rng(seed));
    return order.slice(slot * PER, slot * PER + PER).map((q) => q.id);
  }
  function itemById(id) { return id.startsWith("flag-") ? Flags.items.find((f) => f.id === id) : Bank.all.find((q) => q.id === id); }

  function rivals(w) {
    const r = Bank.rng(w * 104729 + 17);
    return RIVALS.map((name) => {
      const skill = 0.42 + r() * 0.36, joker = Math.floor(r() * ROUNDS.length), solve = 2 + Math.floor(r() * 8); // 9 = never
      const scores = ROUNDS.map((rd, i) => { let n = 0; const p = rd.c === "flag" ? skill * 0.95 : skill; for (let k = 0; k < PER; k++) if (r() < p) n++; return i === joker ? n * 2 : n; });
      return { name, scores, joker, solve };
    });
  }

  // ---------- screens ----------
  function open() {
    st = UI.LS("rd.pub", null);
    if (st) ROUNDS = st.rounds || LEGACY;
    home();
  }
  function home(offset = 0) {
    const w = weekNo() + offset;
    ROUNDS = roundsFor(w);
    const hist = UI.LS("rd.pubhist", []);
    const resume = st && st.stage !== "done";
    const team = (st && st.team) || UI.LS("rd.team", "Team Discovery Channel");
    UI.show(`${UI.bar("TUESDAY QUIZ")}
      <div class="neon-sign"><span>Phat Eddie's</span><small>★ QUIZ NIGHT ★</small></div>
      <section class="panel pub">
        <div class="pub-sign"><small>THIS WEEK</small><b>${tuesday(w)}</b><span>8 rounds · 10 questions · 1 joker</span></div>
        <div class="row gap center-row">
          <button class="btn small" data-pub="week" data-v="${offset - 1}">◂ Earlier week</button>
          <button class="btn small" data-pub="week" data-v="${offset + 1}" ${offset >= 0 ? "disabled" : ""}>Later week ▸</button>
        </div>
        ${resume ? `<button class="btn big amber" data-pub="resume"><b>CARRY ON: ${esc(st.team)}</b><small>${tuesday(st.week)} · round ${st.round + 1} of 8</small></button>` : ""}
        <label class="lbl">Team name<input id="team" maxlength="28" value="${esc(team)}"></label>
        <div class="lbl">Bring two teammates <span class="lbl-note">(${party.length}/${PARTY})</span></div>
        <div class="mates">${CHAR_ORDER.filter((id) => id !== "connor" && RPG.available(id)).map(mateChip).join("")}</div>
        <p class="hint">Each teammate can give ${HINTS} hints a round. Higher level and a stronger subject mean better clues, but low levels can get it wrong.</p>
        <div class="lbl">Joker round (doubles your score)</div>
        <div class="jokers">${ROUNDS.map((r, i) => `<button class="jk ${i === 5 ? "on" : ""}" data-pub="joker" data-v="${i}">${i + 1}. ${esc(r.name)}</button>`).join("")}</div>
        <button class="btn big gold" data-pub="start" data-v="${w}"><b>${resume ? "START A NEW QUIZ" : "START THE QUIZ"} ▸</b></button>
        <div class="rules">
          <p>Write your answers on the sheet, hand it in after each round, then mark it. Spelling doesn't have to be perfect: small typos are accepted, and you can tick or cross anything yourself.</p>
        </div>
        ${hist.length ? `<h2 class="h">Past quiz nights</h2><div class="hist">${hist.slice(-8).reverse().map((h) => `<div><span>${esc(h.date)} · ${esc(h.team)}</span><b>${h.score}/${h.max}</b><em>${h.place}</em></div>`).join("")}</div>` : ""}
      </section>`, "pub");
  }

  function start(w) {
    const team = ($("#team").value || "").trim() || "Team Discovery Channel";
    UI.SAVE("rd.team", team);
    const jk = $(".jk.on"); const joker = jk ? +jk.dataset.v : 5;
    st = { week: w, rounds: ROUNDS, ponder: { tried: {}, solved: 0, guesses: {} }, team, joker, round: 0, q: 0, stage: "q", ids: ROUNDS.map((r) => pickRound(r.c, w)), answers: ROUNDS.map(() => Array(PER).fill("")), marks: ROUNDS.map(() => null),
      party: party.slice(), hints: ROUNDS.map(() => ({})), left: ROUNDS.map(() => Object.fromEntries(party.map((id) => [id, HINTS]))), xp: [] };
    save(); question();
  }

  function question() {
    const r = ROUNDS[st.round], id = st.ids[st.round][st.q], it = itemById(id);
    const last = st.q === PER - 1;
    UI.show(`${UI.bar("ROUND " + (st.round + 1) + (st.round === st.joker ? " · JOKER" : ""))}
      <section class="panel pub sheet">
        <div class="sheet-team">${esc(st.team)} · ${tuesday(st.week)}</div>
        <div class="round-head"><b>${esc(r.name)}</b><span>${st.q + 1} / ${PER}</span></div>
        <div class="dots">${st.answers[st.round].map((a, i) => `<button class="dot ${i === st.q ? "on" : ""} ${a ? "done" : ""}" data-pub="goto" data-v="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join("")}</div>
        <div class="qcard pubq paper">${it.flag ? `<div class="flag-wrap">${Flags.svg(it.flag)}</div>` : ""}<p>${esc(it.q)}</p></div>
        <input id="ans" class="answer" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Your answer" value="${esc(st.answers[st.round][st.q])}">
        ${partyBar(it)}
        <div class="row gap">
          <button class="btn" data-pub="prev" ${st.q === 0 ? "disabled" : ""}>◂ Back</button>
          ${last ? `<button class="btn gold" data-pub="handin"><b>HAND IN SHEET ▸</b></button>` : `<button class="btn teal" data-pub="next"><b>NEXT ▸</b></button>`}
        </div>
        <p class="hint">Not sure? Leave it blank and come back. Nothing is marked until you hand in.</p>
      </section>`, "pub");
    const inp = $("#ans");
    inp.addEventListener("input", () => { st.answers[st.round][st.q] = inp.value; save(); });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); last ? handin() : move(1); } });
    if (matchMedia("(pointer:fine)").matches) inp.focus();
  }
  function partyBar(it) {
    const ps = st.party || []; if (!ps.length) return "";
    const h = st.hints && st.hints[st.round][st.q];
    const cat = RPG.catOf(it.c);
    return `<div class="party">${ps.map((id) => {
      const r = RPG.get(id), n = st.left[st.round][id] ?? 0;
      return `<button class="ask" data-pub="ask" data-v="${id}" ${n <= 0 || h ? "disabled" : ""}>${UI.portrait(id)}<span><b>Ask ${esc(CHARS[id].name)}</b><small>Lv ${r.lv} · ${RPG.SHORT[cat]} ${r.stats[cat]} · ${n} left</small></span></button>`;
    }).join("")}</div>
    ${h ? UI.vn(h.id, CHARS[h.id].name.toUpperCase(), h.text, true, "teammate") : ""}`;
  }
  // XP for the round: Connor and the party learn from every right answer; whoever hinted learns most
  function awardRound(i) {
    st.xp ||= [];
    if (st.xp[i] || !st.marks[i]) return;
    st.xp[i] = 1;
    st.ids[i].forEach((id, k) => Stats.answer(itemById(id).c, !!st.marks[i][k]));
    const ups = [];
    st.ids[i].forEach((id, k) => {
      if (!st.marks[i][k]) return;
      RPG.bump("correct");
      const it = itemById(id), h = st.hints && st.hints[i][k];
      ups.push(RPG.gain("connor", it.c, 1));
      for (const m of st.party || []) ups.push(RPG.gain(m, it.c, h && h.id === m ? 3 : 1));
    });
    const seen = new Set();
    ups.filter(Boolean).reverse().forEach((u) => { if (!seen.has(u.id)) { seen.add(u.id); UI.levelUp(u); } });
    setTimeout(UI.unlockCheck, 1200);
  }
  function move(d) { st.q = Math.max(0, Math.min(PER - 1, st.q + d)); save(); question(); }
  function handin() {
    const blank = st.answers[st.round].filter((a) => !a.trim()).length;
    if (blank && !confirm(`${blank} answer${blank > 1 ? "s are" : " is"} blank. Hand in anyway?`)) return;
    st.marks[st.round] = st.ids[st.round].map((id, i) => Bank.matches(st.answers[st.round][i], itemById(id)));
    st.stage = "mark"; save(); mark();
  }
  function roundScore(i) { const m = st.marks[i]; if (!m) return 0; const n = m.filter(Boolean).length; return i === st.joker ? n * 2 : n; }

  function mark() {
    const i = st.round, r = ROUNDS[i];
    UI.show(`${UI.bar("MARKING · ROUND " + (i + 1))}
      <section class="panel pub">
        <div class="round-head"><b>${esc(r.name)}</b><span>${roundScore(i)}${i === st.joker ? " (joker ×2)" : ""} pts</span></div>
        <div class="marks">${st.ids[i].map((id, k) => {
          const it = itemById(id), ok = st.marks[i][k], yours = st.answers[i][k];
          return `<div class="mk ${ok ? "ok" : "no"}">
            <div class="mk-q"><b>${k + 1}.</b> ${it.flag ? `<span class="mini-flag">${Flags.svg(it.flag)}</span>` : esc(it.q)}</div>
            <div class="mk-a"><span>${yours ? esc(yours) : "<i>blank</i>"}</span><b>${esc(it.a)}</b></div>
            <button class="tick" data-pub="toggle" data-v="${k}" aria-label="Toggle mark">${ok ? "✓" : "✗"}</button>
            ${it.flag ? "" : `<button class="flagq" data-pub="report" data-v="${esc(id)}" title="Report a problem with this question">⚑</button>`}
          </div>`;
        }).join("")}</div>
        ${ponderBox()}
        <button class="btn big gold" data-pub="scores"><b>SEE THE SCORES ▸</b></button>
        <p class="hint">Tap ✓/✗ to overrule the marking. ⚑ removes a question you think is wrong from future quizzes.</p>
      </section>`, "pub");
  }

  function ponderBox() {
    if (!st.ponder) return "";
    const P = ponderFor(st.week), k = st.round + 1, p = st.ponder;
    const clues = P.clues.slice(0, k).map((c, i) => `<li class="${i === k - 1 ? "new" : ""}"><b>Clue ${i + 1}</b> · ${ponderPts(i + 1)} pts<span>${esc(c)}</span></li>`).join("");
    let foot;
    if (p.solved) foot = `<div class="pd-solved">SOLVED on clue ${p.solved}: <b>${esc(P.a)}</b> · +${ponderPts(p.solved)} pts</div>`;
    else if (p.tried[st.round]) foot = `<div class="pd-wrong">Your guess "${esc(p.guesses[st.round])}" isn't it. New clue next round.</div>`;
    else foot = `<div class="pd-guess"><input id="pd" placeholder="Your guess (worth ${ponderPts(k)} pts)" autocomplete="off"><button class="btn small gold" data-pub="ponder"><b>LOCK IN</b></button></div>`;
    if (!p.solved && k === 8 && p.tried[st.round]) foot += `<div class="pd-wrong">The answer was <b>${esc(P.a)}</b>.</div>`;
    return `<div class="ponder"><div class="pd-head"><span>THE PONDERER</span><small>Clues get easier each round. Points drop each time.</small></div><ol>${clues}</ol>${foot}</div>`;
  }
  function table(upto) {
    const rv = rivals(st.week);
    const myP = st.ponder && st.ponder.solved && st.ponder.solved - 1 <= upto ? ponderPts(st.ponder.solved) : 0;
    const rows = [{ name: st.team, you: 1, total: ROUNDS.slice(0, upto + 1).reduce((a, _, i) => a + roundScore(i), 0) + myP },
      ...rv.map((t) => ({ name: t.name, total: t.scores.slice(0, upto + 1).reduce((a, b) => a + b, 0) + (t.solve <= 8 && t.solve - 1 <= upto ? ponderPts(t.solve) : 0) }))];
    rows.sort((a, b) => b.total - a.total || (b.you ? 1 : 0) - (a.you ? 1 : 0));
    let place = 0, prev = null;
    rows.forEach((r, i) => { if (r.total !== prev) place = i + 1; r.place = place; prev = r.total; });
    return rows;
  }
  const ord = (n) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");

  function scores() {
    const i = st.round, rows = table(i), last = i === ROUNDS.length - 1;
    const meRow = rows.find((r) => r.you);
    if (last && st.stage !== "done") {
      st.stage = "done";
      const hist = UI.LS("rd.pubhist", []);
      hist.push({ date: tuesday(st.week), team: st.team, score: meRow.total, max: PER * (ROUNDS.length + 1) + 8, place: ord(meRow.place) });
      UI.SAVE("rd.pubhist", hist.slice(-40));
      if (meRow.place === 1) { RPG.bump("pubWins"); setTimeout(UI.unlockCheck, 800); }
    }
    save();
    UI.show(`${UI.bar(last ? "FINAL SCORES" : "AFTER ROUND " + (i + 1))}
      <section class="panel pub">
        ${last ? `<div class="pub-sign"><small>${esc(st.team)}</small><b>${ord(meRow.place)} PLACE</b><span>${meRow.total} points</span></div>` : ""}
        <div class="scoreboard chalk"><div class="chalk-title">LEADERBOARD</div>${rows.map((r) => `<div class="sb ${r.you ? "you" : ""}"><em>${r.place}</em><span>${esc(r.name)}</span><b>${r.total}</b></div>`).join("")}</div>
        ${last ? `<button class="btn big gold" data-pub="home"><b>DONE ▸</b></button>` : `<button class="btn big teal" data-pub="nextround"><b>ROUND ${i + 2}: ${esc(ROUNDS[i + 1].name.toUpperCase())} ▸</b></button>`}
      </section>`, last && meRow.place === 1 ? "gold" : "pub");
  }

  // ---------- events ----------
  document.getElementById("app").addEventListener("click", (e) => {
    const t = e.target.closest("[data-pub]"); if (!t || t.disabled) return;
    Sfx.tap();
    const v = t.dataset.v;
    switch (t.dataset.pub) {
      case "week": home(+v); break;
      case "joker": $$(".jk").forEach((b) => b.classList.toggle("on", b === t)); break;
      case "start": if (st && st.stage !== "done" && !confirm("Start over? Your quiz in progress will be lost.")) return; start(+v); break;
      case "ponder": {
        const g = ($("#pd").value || "").trim(); if (!g) return;
        const P = ponderFor(st.week);
        st.ponder.tried[st.round] = true; st.ponder.guesses[st.round] = g;
        if (Bank.matches(g, { a: P.a, x: P.x, c: "ponder" })) { st.ponder.solved = st.round + 1; Stats.bump("ponder"); UI.shout("SOLVED!", "safe"); }
        else Sfx.wrong();
        save(); mark(); break;
      }
      case "resume": ROUNDS = st.rounds || LEGACY; st.stage === "mark" ? mark() : st.stage === "board" ? scores() : question(); break;
      case "goto": st.q = +v; save(); question(); break;
      case "prev": move(-1); break;
      case "next": move(1); break;
      case "handin": handin(); break;
      case "toggle": st.marks[st.round][+v] = !st.marks[st.round][+v]; save(); mark(); break;
      case "report": if (confirm("Remove this question from future games on this phone?")) { Bank.flag(v); UI.toast("Question removed"); } break;
      case "scores": st.stage = "board"; awardRound(st.round); save(); scores(); Sfx.step(); break;
      case "mate": {
        if (party.includes(v)) party = party.filter((x) => x !== v);
        else { party.push(v); if (party.length > PARTY) party.shift(); }
        UI.SAVE("rd.party", party);
        $$(".mate").forEach((b) => b.classList.toggle("on", party.includes(b.dataset.v)));
        const note = $(".lbl-note"); if (note) note.textContent = `(${party.length}/${PARTY})`;
        break;
      }
      case "ask": {
        const it = itemById(st.ids[st.round][st.q]);
        if (!st.left[st.round][v]) return;
        const h = RPG.hint(v, it);
        st.hints[st.round][st.q] = { id: v, text: h.text };
        st.left[st.round][v]--; save(); question();
        break;
      }
      case "nextround": st.round++; st.q = 0; st.stage = "q"; save(); question(); break;
      case "home": home(); break;
    }
  });

  return { open, weekNo, pickRound, roundsFor };
})();
