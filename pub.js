// TUESDAY QUIZ: a practice pub quiz night. Eight rounds of ten, typed answers on an answer sheet,
// a joker to double one round, marking at the end of each round and a leaderboard against
// the regulars. Same questions for everyone in a given week; a fresh set each week.
const Pub = (() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ROUNDS = [
    { c: "gk", name: "General Knowledge" },
    { c: "geo", name: "Geography" },
    { c: "flag", name: "Picture Round: Flags" },
    { c: "sci", name: "Science & Nature" },
    { c: "sport", name: "Sport" },
    { c: "nz", name: "Aotearoa" },
    { c: "ent", name: "Film, TV & Music" },
    { c: "hist", name: "History" },
  ];
  const PER = 10;
  const RIVALS = ["Quizteama Aguilera", "Les Quizerables", "The Quizzly Bears", "Agatha Quiztie", "Universally Challenged", "Tequila Mockingbird", "Trivia Newton-John", "Sherlock Homies"];
  let st = null; // the quiz in progress

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
      const skill = 0.42 + r() * 0.36, joker = Math.floor(r() * ROUNDS.length);
      const scores = ROUNDS.map((rd, i) => { let n = 0; const p = rd.c === "flag" ? skill * 0.95 : skill; for (let k = 0; k < PER; k++) if (r() < p) n++; return i === joker ? n * 2 : n; });
      return { name, scores, joker };
    });
  }

  // ---------- screens ----------
  function open() {
    st = UI.LS("rd.pub", null);
    home();
  }
  function home(offset = 0) {
    const w = weekNo() + offset;
    const hist = UI.LS("rd.pubhist", []);
    const resume = st && st.stage !== "done";
    const team = (st && st.team) || UI.LS("rd.team", "Phat Eddie's Finest");
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
    const team = ($("#team").value || "").trim() || "Phat Eddie's Finest";
    UI.SAVE("rd.team", team);
    const jk = $(".jk.on"); const joker = jk ? +jk.dataset.v : 5;
    st = { week: w, team, joker, round: 0, q: 0, stage: "q", ids: ROUNDS.map((r) => pickRound(r.c, w)), answers: ROUNDS.map(() => Array(PER).fill("")), marks: ROUNDS.map(() => null) };
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
        <button class="btn big gold" data-pub="scores"><b>SEE THE SCORES ▸</b></button>
        <p class="hint">Tap ✓/✗ to overrule the marking. ⚑ removes a question you think is wrong from future quizzes.</p>
      </section>`, "pub");
  }

  function table(upto) {
    const rv = rivals(st.week);
    const rows = [{ name: st.team, you: 1, total: ROUNDS.slice(0, upto + 1).reduce((a, _, i) => a + roundScore(i), 0) },
      ...rv.map((t) => ({ name: t.name, total: t.scores.slice(0, upto + 1).reduce((a, b) => a + b, 0) }))];
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
      hist.push({ date: tuesday(st.week), team: st.team, score: meRow.total, max: PER * (ROUNDS.length + 1), place: ord(meRow.place) });
      UI.SAVE("rd.pubhist", hist.slice(-40));
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
      case "resume": st.stage === "mark" ? mark() : st.stage === "board" ? scores() : question(); break;
      case "goto": st.q = +v; save(); question(); break;
      case "prev": move(-1); break;
      case "next": move(1); break;
      case "handin": handin(); break;
      case "toggle": st.marks[st.round][+v] = !st.marks[st.round][+v]; save(); mark(); break;
      case "report": if (confirm("Remove this question from future games on this phone?")) { Bank.flag(v); UI.toast("Question removed"); } break;
      case "scores": st.stage = "board"; save(); scores(); Sfx.step(); break;
      case "nextround": st.round++; st.q = 0; st.stage = "q"; save(); question(); break;
      case "home": home(); break;
    }
  });

  return { open, weekNo, pickRound, ROUNDS };
})();
