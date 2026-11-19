// Screens and controls. Reads game state (local, hosted or received) and turns it into HTML.
const UI = (() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $("#app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const SAVE = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const money = (n) => (n < 0 ? "−" : "") + "$" + Math.abs(n).toLocaleString("en-NZ");
  const LETTERS = ["A", "B", "C", "D"];

  const me = LS("rd.me", null) || { id: uid(), name: "Connor", char: "connor" };
  SAVE("rd.me", me);

  let screen = "title";
  let game = null;        // Engine.Game when this device runs the show
  let role = "local";     // local | host | guest
  let remote = null, skew = 0, lastKey = "", lastState = null, lastSeen = 0;
  let lobby = null, beat = null, hello = null, watchdog = null;
  let setup = null;

  // ---------- small building blocks ----------
  function spr(id, cls = "") {
    const c = CHARS[id] || HUNTERS[id] || (id === "host" ? HOST : null); if (!c) return "";
    return `<img class="spr ${cls}" src="${Sprites.url(id, c.spec)}" alt="${esc(c.name)}" draggable="false">`;
  }
  function portrait(id, cls = "") {
    const c = CHARS[id] || HUNTERS[id] || (id === "host" ? HOST : null); if (!c) return "";
    return `<img class="pt ${cls}" src="${Portraits.url(id, c.spec)}" alt="${esc(c.name)}" draggable="false">`;
  }
  // visual-novel dialogue box: portrait, name plate, typed-out line
  function vn(id, name, text, fresh, cls = "") {
    if (!text) return "";
    return `<div class="vn ${cls} ${fresh ? "pop" : ""}"><div class="vn-face">${portrait(id)}</div>
      <div class="vn-body"><div class="vn-name">${esc(name)}</div><p class="vn-text" data-type>${esc(text)}</p></div><i class="vn-next">▼</i></div>`;
  }
  const typed = new Set();
  function typeIn() {
    for (const el of $$("[data-type]")) {
      const full = el.textContent;
      if (typed.has(full)) continue;
      typed.add(full); if (typed.size > 80) typed.clear();
      el.textContent = ""; let i = 0;
      const box = el.closest(".vn"); if (box) box.classList.add("typing");
      const step = () => {
        if (!el.isConnected) return;
        i = Math.min(full.length, i + 2); el.textContent = full.slice(0, i);
        if (i % 6 === 0) Sfx.blip();
        if (i < full.length) el._t = setTimeout(step, 24); else if (box) box.classList.remove("typing");
      };
      if (box) box.addEventListener("click", () => { clearTimeout(el._t); el.textContent = full; box.classList.remove("typing"); }, { once: true });
      step();
    }
  }
  // big anime shout across the screen
  function shout(text, cls = "") {
    const d = document.createElement("div"); d.className = "shout " + cls;
    d.innerHTML = `<div class="shout-lines"></div><span>${esc(text)}</span>`;
    document.body.appendChild(d); Sfx.shout();
    setTimeout(() => d.remove(), 1300);
  }
  function statBars(id, small) {
    const r = RPG.get(id); if (!r) return "";
    return `<div class="statgrid ${small ? "small" : ""}">${RPG.CATS.map((k) => `<div class="st"><span>${RPG.SHORT[k]}</span><div class="sbar"><i style="width:${(r.stats[k] / RPG.MAX) * 100}%"></i></div><b>${r.stats[k]}</b></div>`).join("")}</div>`;
  }
  function levelUp(up) { if (!up) return; shout("LEVEL UP!", "lvl"); toast(`${CHARS[up.id].name} reached Lv ${up.lv}!`, 2400); }
  function stars(n) { return `<span class="stars" aria-label="${n} of 4">${"★".repeat(n)}<i>${"★".repeat(4 - n)}</i></span>`; }
  function toast(msg, ms = 1600) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), ms); }
  function bar(title = "") {
    return `<header class="bar">
      <button class="icon" data-act="home" aria-label="Menu">◂</button>
      <div class="bar-title">${title}</div>
      <button class="icon" data-act="sound" aria-label="Sound">${Sfx.on ? "♪" : "×"}</button>
    </header>`;
  }
  function show(html, mood = "blue") { if (screen !== "title") clearInterval(titleTimer); app.innerHTML = html; Studio.set(mood); app.scrollTop = 0; typeIn(); }
  // the host's patter: same line for the same moment, so re-renders don't flicker
  function hostLine(kind, s, seed = 0) {
    const L = HOST.lines[kind], cur = s && s.players[s.turn];
    const n = (s ? s.turn * 7 + (s.players.length * 3) + (s.code ? s.code.charCodeAt(0) : 0) : 0) + seed;
    return L[n % L.length].replace("{p}", cur ? cur.name : "").replace("{h}", s ? HUNTERS[s.hunter].name : "");
  }
  function hostSays(text, fresh) { return vn("host", "GAZ", text, fresh, "host"); }

  // ---------- title ----------
  let titleTimer = null;
  function title() {
    screen = "title"; stopOnline(); endLocal();
    const rec = LS("rd.rec", { games: 0, wins: 0, total: 0, best: 0 });
    const cap = RPG.get("connor");
    let hi = 0, li = 0;
    const hunterFig = (h) => `${portrait(h, "pt-l")}<figcaption>${esc(HUNTERS[h].short)}<small>${"★".repeat(HUNTERS[h].stars)}</small></figcaption>`;
    show(`
      <section class="title-screen">
        <div class="ep-card"><span>EPISODE ${String(rec.games + 1).padStart(2, "0")}</span><span>TONIGHT</span></div>
        <div class="logo-wrap">
          <div class="kana">ザ・ランダウン</div>
          <h1 class="logo">THE<br>RUNDOWN</h1>
          <div class="logo-sub">One hunter. One way home.</div>
        </div>
        <div class="cast-row">
          <figure class="cast">${portrait("connor", "pt-l")}<figcaption>Connor<small>Lv ${cap.lv}</small></figcaption></figure>
          <figure class="cast host">${portrait("host", "pt-l")}<figcaption>Gaz<small>Host</small></figcaption></figure>
          <figure class="cast hunter" id="t-hunter">${hunterFig(HUNTER_ORDER[0])}</figure>
        </div>
        <div id="t-line">${vn("host", "GAZ", HOST.lines.welcome[0], true, "host")}</div>
        <nav class="menu win">
          <button class="choice" data-go="solo"><b>Solo run</b><small>You against a hunter</small></button>
          <button class="choice" data-go="team"><b>Team, one phone</b><small>2 to 4 players, pass it round</small></button>
          <button class="choice" data-go="online"><b>Team online</b><small>Everyone on their own phone</small></button>
          <button class="choice" data-go="pub"><b>Tuesday quiz</b><small>Quiz night at Phat Eddie's</small></button>
          <button class="choice" data-go="roster"><b>${esc(TEAM.name)}</b><small>Levels and stats</small></button>
        </nav>
        <div class="records win">
          <div><small>Games</small><b>${rec.games}</b></div>
          <div><small>Won</small><b>${money(rec.total)}</b></div>
          <div><small>Best</small><b>${money(rec.best)}</b></div>
        </div>
        <div class="title-foot"><span>Made for Connor</span><button class="link" data-act="sound">${Sfx.on ? "Sound on" : "Sound off"}</button></div>
      </section>`);
    clearInterval(titleTimer);
    titleTimer = setInterval(() => {
      if (screen !== "title") return clearInterval(titleTimer);
      hi = (hi + 1) % HUNTER_ORDER.length; li = (li + 1) % HOST.lines.welcome.length;
      const el = $("#t-hunter"), ln = $("#t-line");
      if (el) { el.innerHTML = hunterFig(HUNTER_ORDER[hi]); el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); }
      if (ln) { ln.innerHTML = vn("host", "GAZ", HOST.lines.welcome[li], true, "host"); typeIn(); }
    }, 5000);
  }

  // ---------- team roster with levels and stats ----------
  function roster() {
    screen = "roster";
    const card = (id) => {
      const r = RPG.get(id), c = CHARS[id], pct = Math.min(100, (r.xp / RPG.need(r.lv)) * 100);
      return `<div class="char-card win ${id === TEAM.captain ? "captain" : ""}">
        <div class="cc-top">${portrait(id, "pt-l")}
          <div class="cc-id"><b>${esc(c.name)}</b><small>${esc(c.tag)}</small>
            <div class="lv"><span>Lv ${r.lv}</span>${id === TEAM.captain ? `<em>QUIZ MASTER</em>` : `<em>Best: ${RPG.SHORT[RPG.best(id)]}</em>`}</div>
            <div class="xp" title="XP to next level"><i style="width:${pct}%"></i></div>
          </div>
        </div>
        ${statBars(id)}
      </div>`;
    };
    show(`${bar("THE TEAM")}
      <section class="roster">
        <div class="team-head win"><small>Quiz team</small><b>${esc(TEAM.name)}</b><span>Stats run 1 to 255 and grow as you answer questions in that subject. Every right answer earns XP.</span></div>
        ${TEAM.members.map(card).join("")}
        <h2 class="h">Other contestants</h2>
        ${CHAR_ORDER.filter((i) => !TEAM.members.includes(i)).map(card).join("")}
      </section>`);
  }

  // ---------- setup: pick players and a hunter ----------
  function startSetup(mode) {
    const n = mode === "solo" ? 1 : 2;
    const order = CHAR_ORDER;
    const players = [];
    for (let i = 0; i < n; i++) { const c = i === 0 ? me.char : order[(order.indexOf(me.char) + i) % order.length]; players.push({ char: c, name: i === 0 ? me.name : CHARS[c].name }); }
    setup = { mode, step: "players", players, hunter: LS("rd.hunter", "archivist") };
    renderSetup();
  }
  function renderSetup() {
    screen = "setup";
    const s = setup;
    if (s.step === "players") {
      show(`${bar(s.mode === "solo" ? "SOLO RUN" : "TEAM · ONE PHONE")}
        <section class="panel">
          <h2 class="h">${s.mode === "solo" ? "Pick your contestant" : "Who's playing?"}</h2>
          <div class="slots">
            ${s.players.map((p, i) => slot(p, i)).join("")}
          </div>
          ${s.mode === "team" ? `<div class="row gap">
            <button class="btn small" data-act="less" ${s.players.length <= 2 ? "disabled" : ""}>− Player</button>
            <button class="btn small" data-act="more" ${s.players.length >= 4 ? "disabled" : ""}>+ Player</button>
          </div><p class="hint">Playing all four yourself works too. Each player takes their own turn on the board.</p>` : ""}
          <button class="btn big gold" data-act="to-hunter"><b>CHOOSE YOUR HUNTER ▸</b></button>
        </section>`);
    } else {
      show(`${bar("CHOOSE YOUR HUNTER")}
        <section class="panel">
          <div class="hunters">${HUNTER_ORDER.map((h) => hunterCard(h, s.hunter === h)).join("")}</div>
          <button class="btn big red" data-act="begin"><b>FACE ${esc(HUNTERS[s.hunter].name)} ▸</b></button>
        </section>`, "red");
    }
  }
  function slot(p, i) {
    const c = CHARS[p.char];
    return `<div class="slot" data-i="${i}">
      <button class="arrow" data-act="prev" data-i="${i}" aria-label="Previous character">◂</button>
      <div class="slot-mid">
        <div class="slot-spr">${spr(p.char, "bob")}</div>
        <input class="name" data-i="${i}" maxlength="14" value="${esc(p.name)}" aria-label="Player name">
        <div class="slot-tag">${esc(c.tag)} · <b>Lv ${RPG.get(p.char).lv}</b></div>
        ${statBars(p.char, true)}
      </div>
      <button class="arrow" data-act="next" data-i="${i}" aria-label="Next character">▸</button>
    </div>`;
  }
  function hunterCard(h, on) {
    const H = HUNTERS[h];
    return `<button class="hcard ${on ? "on" : ""}" data-hunter="${h}" style="--hc:${H.color}">
      <div class="hcard-spr">${spr(h, "bob")}</div>
      <div class="hcard-txt"><b>${esc(H.name)}</b>${stars(H.stars)}<small>${esc(H.blurb)}</small></div>
    </button>`;
  }

  // ---------- running a local game ----------
  function beginLocal() {
    const s = setup;
    s.players.forEach((p) => { p.name = (p.name || "").trim() || CHARS[p.char].name; });
    if (s.mode === "solo") { me.char = s.players[0].char; me.name = s.players[0].name; SAVE("rd.me", me); }
    SAVE("rd.hunter", s.hunter);
    role = "local"; endLocal();
    lastKey = ""; lastState = null; skew = 0;
    game = new Engine.Game({ mode: s.mode, hunter: s.hunter, players: s.players.map((p) => ({ id: uid(), name: p.name, char: p.char, stats: RPG.stats(p.char) })) }, onState);
  }
  function endLocal() { if (game) { game.destroy(); game = null; } }
  function onState(s) {
    if (role === "host") Net.sendState(s);
    if (s.phase === "end" && (!lastState || lastState.phase !== "end")) record(s);
    renderGame(s);
  }

  // whose taps count on this device
  const myPid = () => (role === "local" ? null : me.id);
  function canAct(s, act) {
    const pid = myPid(); if (pid == null) return true;
    const cur = s.players[s.turn];
    if (act === "go") return pid === s.host || (s.phase === "turnIntro" && cur && pid === cur.id);
    if (act === "final") return s.players.some((p) => p.id === pid && p.result === "home");
    return cur && pid === cur.id;
  }
  function send(act, val) {
    Sfx.unlock();
    if (role === "guest") Net.send("input", { pid: me.id, a: act, v: val });
    else if (game) game.input(myPid(), act, val);
  }

  // ---------- the game screen ----------
  function viewKey(s) {
    const b = s.board, f = s.final;
    return [s.phase, s.turn, s.cash && s.cash.id, b && b.k, b && b.step, f && f.cur && f.cur.id, f && f.hq && f.hq.k, f && f.push && (f.push.done ? "d" : "p")].join("|");
  }
  function renderGame(s) {
    screen = "game";
    const prev = lastState; lastState = JSON.parse(JSON.stringify(s));
    const key = viewKey(s); const fresh = key !== lastKey; lastKey = key;
    sounds(prev, s);
    const H = HUNTERS[s.hunter], cur = s.players[s.turn];
    const mood = ["finalH", "finalHIntro"].includes(s.phase) || (s.phase === "board" && s.board.h >= s.board.p - 1) ? "red" : s.phase === "end" && s.won ? "gold" : "blue";
    let body = "";
    const bubble = (txt) => vn(s.hunter, H.name, txt, fresh, "hunter");
    const goBtn = (label, cls = "gold") => canAct(s, "go") ? `<button class="btn big ${cls}" data-send="go"><b>${label}</b></button>` : `<div class="waiting">Waiting for ${role === "guest" && s.phase === "turnIntro" ? esc(cur.name) : "the host"}…</div>`;
    const youAre = (p) => role !== "local" && p && p.id === me.id;

    switch (s.phase) {
      case "intro":
        body = `<section class="stage ${fresh ? "enter" : ""}">
          ${hostSays(hostLine("intro", s), fresh)}
          <div class="spot red">${spr(s.hunter, "huge bob")}</div>
          <h1 class="hname" style="--hc:${H.color}">${esc(H.name)}</h1>${stars(H.stars)}
          ${bubble(s.line)}
          <div class="lineup">${s.players.map((p) => `<div>${spr(p.char, "mini")}<span>${esc(p.name)}</span></div>`).join("")}</div>
          <div class="rules">
            <p><b>CASH DASH</b> 60 seconds. ${money(Engine.STEP)} for every right answer.</p>
            <p><b>THE RUNDOWN</b> Take your cash home down the board before the hunter catches you.</p>
            <p><b>LAST STAND</b> Everyone who made it home builds a lead. Then the hunter gives chase.</p>
          </div>
          ${goBtn("BRING IT ON ▸", "red")}
        </section>`;
        break;
      case "turnIntro":
        body = `<section class="stage ${fresh ? "enter" : ""}">
          ${hostSays(hostLine("turn", s), fresh)}
          <div class="kicker">PLAYER ${s.turn + 1} OF ${s.players.length}</div>
          <div class="spot">${spr(cur.char, "huge bob")}</div>
          <h1 class="pname">${esc(cur.name)}${youAre(cur) ? " (you)" : ""}</h1>
          ${role === "local" && s.players.length > 1 ? `<p class="pass">Pass the phone to <b>${esc(cur.name)}</b></p>` : ""}
          <div class="rules"><p><b>CASH DASH</b> 60 seconds on the clock. Tap the right answer. Wrong answers cost nothing but time.</p></div>
          ${goBtn("START THE CLOCK ▸", "teal")}
          ${hostSkip(s)}
        </section>`;
        break;
      case "cash": {
        const c = s.cash, mine = canAct(s, "cash");
        body = `<section class="play">
          <div class="hud">
            <div class="who">${spr(cur.char, "mini")}<span>${esc(cur.name)}</span></div>
            <div class="clock" data-end="${c.end}">60</div>
            <div class="bank"><small>BANK</small><b>${money(c.score * Engine.STEP)}</b></div>
          </div>
          <div class="timebar"><i data-bar="${c.end}" data-len="${Engine.CASH_TIME}"></i></div>
          ${qcard(c, fresh)}
          <div class="opts four">${c.opts.map((o, i) => optBtn("cash", o, i, mine, c.strike, cur.name)).join("")}</div>
          ${c.fb ? `<div class="fb ${c.fb.ok ? "ok" : "no"}" data-k="${c.fb.k}">${c.fb.ok ? "✓ RIGHT" : `✗ It was <b>${esc(c.fb.a)}</b>`}</div>` : ""}
          ${mine ? "" : `<div class="watch">${esc(cur.name)} is playing</div>`}
          ${hostSkip(s)}
        </section>`;
        break;
      }
      case "offer": {
        const o = s.offer, mine = canAct(s, "take");
        const card = (k, label, steps, cls) => `<button class="offer ${cls}" data-send="take" data-v="${k}" ${mine ? "" : "disabled"}>
          <small>${label}</small><b>${money(o[k])}</b><span>${steps} steps to get home</span></button>`;
        body = `<section class="stage ${fresh ? "enter" : ""}">
          ${bubble(s.line)}
          <p class="center">${esc(cur.name)} banked <b class="gold-t">${money(cur.cash)}</b>. Pick where you start.</p>
          <div class="offers">
            ${card("high", "HIGH ROAD", 8 - 2, "high")}
            ${card("mid", "YOUR CASH", 8 - 3, "mid")}
            ${card("low", "LOW ROAD", 8 - 4, "low")}
          </div>
          <p class="hint">The high road starts closer to the hunter. The low road starts further away.</p>
          ${mine ? "" : `<div class="watch">${esc(cur.name)} is choosing…</div>`}
          ${hostSkip(s)}
        </section>`;
        break;
      }
      case "board": body = boardView(s, fresh, bubble); break;
      case "turnEnd": {
        const r = cur.result;
        body = `<section class="stage ${fresh ? "enter" : ""}">
          <div class="result ${r}">${r === "home" ? "HOME!" : r === "caught" ? "CAUGHT!" : "SKIPPED"}</div>
          <div class="spot ${r === "caught" ? "red" : ""}">${spr(cur.char, "huge " + (r === "caught" ? "sad" : "bob"))}${r === "caught" ? spr(s.hunter, "big lunge") : ""}</div>
          ${r !== "skipped" ? hostSays(hostLine(r, s), fresh) : ""}
          ${r === "home" ? `<p class="center"><b>${esc(cur.name)}</b> takes <b class="gold-t">${money(cur.offer)}</b> into the Last Stand.</p>` : `<p class="center">${esc(cur.name)}'s money goes back to the hunter.</p>`}
          ${bubble(s.line)}
          ${goBtn(s.turn + 1 < s.players.length ? "NEXT PLAYER ▸" : "TO THE LAST STAND ▸")}
        </section>`;
        break;
      }
      case "finalIntro": {
        const home = s.players.filter((p) => p.result === "home");
        body = `<section class="stage ${fresh ? "enter" : ""}">
          ${hostSays(hostLine("final", s), fresh)}
          <div class="kicker">LAST STAND</div>
          <div class="pot"><small>PRIZE POT</small><b>${money(s.pot)}</b></div>
          <div class="lineup">${home.map((p) => `<div>${spr(p.char, "mid bob")}<span>${esc(p.name)}</span></div>`).join("")}</div>
          <div class="rules">
            <p>You start <b>${s.final.start} step${s.final.start > 1 ? "s" : ""}</b> ahead: one for each player who made it home.</p>
            <p>2 minutes. Every right answer is one more step. A wrong answer locks you out for 3 seconds.</p>
            ${home.length > 1 && role !== "local" ? "<p>Anyone in the team can answer. Fastest finger wins.</p>" : ""}
          </div>
          ${goBtn("GO! ▸", "teal")}
        </section>`;
        break;
      }
      case "finalP": {
        const f = s.final, mine = canAct(s, "final"), locked = f.lock > s.now;
        body = `<section class="play">
          <div class="hud">
            <div class="who"><small>STEPS</small><b class="big-n">${f.score}</b></div>
            <div class="clock" data-end="${f.end}">2:00</div>
            <div class="bank"><small>POT</small><b>${money(s.pot)}</b></div>
          </div>
          <div class="timebar"><i data-bar="${f.end}" data-len="${Engine.FINAL_TIME}"></i></div>
          ${qcard(f.cur, fresh)}
          <div class="opts four ${locked ? "locked" : ""}" ${locked ? `data-lock="${f.lock}"` : ""}>${f.cur.opts.map((o, i) => optBtn("final", o, i, mine, f.cur.strike, "Team")).join("")}</div>
          ${f.fb ? `<div class="fb ${f.fb.ok ? "ok" : "no"}" data-k="${f.fb.k}">${f.fb.ok ? "✓ STEP!" : `✗ It was <b>${esc(f.fb.a)}</b>`}</div>` : ""}
          ${mine ? "" : `<div class="watch">The team is running</div>`}
        </section>`;
        break;
      }
      case "finalHIntro": {
        const f = s.final;
        body = `<section class="stage ${fresh ? "enter" : ""}">
          ${hostSays(hostLine("hunt", s), fresh)}
          <div class="kicker red-t">THE HUNTER'S TURN</div>
          <div class="spot red">${spr(s.hunter, "huge bob")}</div>
          <div class="pot"><small>TARGET</small><b>${f.score} STEPS</b></div>
          ${bubble(s.line)}
          <div class="rules"><p>${esc(H.short)} has 2 minutes to answer ${f.score} right. Every time they slip up, you get a <b>pushback</b> question. Get it right and they step back.</p></div>
          ${goBtn("UNLEASH THE HUNTER ▸", "red")}
        </section>`;
        break;
      }
      case "finalH": body = hunterRunView(s, fresh, bubble); break;
      case "end": {
        const won = s.won, home = s.players.filter((p) => p.result === "home");
        body = `<section class="stage ${fresh ? "enter" : ""}">
          <div class="result ${won ? "home" : "caught"}">${won ? "YOU WIN!" : "CAUGHT!"}</div>
          ${won ? `<div class="pot win"><small>TAKING HOME</small><b>${money(s.pot)}</b></div>
            <div class="lineup">${home.map((p) => `<div>${spr(p.char, "mid bob")}<span>${esc(p.name)}</span><em>${money(p.won)}</em></div>`).join("")}</div>`
          : `<div class="spot red">${spr(s.hunter, "huge bob")}</div><p class="center">${home.length ? `The hunter reeled you in with ${Math.max(0, Math.ceil((s.final?.left || 0) / 1000))} seconds to spare.` : "Nobody made it home."}</p>`}
          ${bubble(s.line)}
          ${hostSays(hostLine(won ? "win" : "lose", s), fresh)}
          ${role === "guest" ? `<div class="waiting">Waiting for the host…</div><button class="btn" data-act="home">Leave room</button>`
          : `<div class="row gap">
              <button class="btn big gold" data-act="again"><b>${role === "host" ? "BACK TO LOBBY" : "PLAY AGAIN"}</b></button>
              <button class="btn big" data-act="home"><b>MENU</b></button>
            </div>`}
        </section>`;
        break;
      }
      default: body = `<section class="stage"><div class="waiting">Loading…</div></section>`;
    }
    const tag = role === "local" ? (s.mode === "solo" ? "SOLO RUN" : "TEAM") : `ROOM ${esc(s.code || "")}`;
    show(bar(tag) + body, mood);
  }

  function hostSkip(s) {
    if (role !== "host") return "";
    const cur = s.players[s.turn]; if (!cur || cur.id === me.id) return "";
    return `<button class="link skip" data-send="skip">Skip ${esc(cur.name)} (dropped out?)</button>`;
  }
  function optBtn(act, o, i, mine, strike, who) {
    const struck = strike === i;
    return `<button class="opt ${struck ? "struck" : ""}" data-send="${act}" data-v="${i}" ${mine && !struck ? "" : "disabled"}><em>${LETTERS[i]}</em><span class="ot">${esc(o)}</span>${struck ? `<span class="hunch">${esc(who)}'s hunch: not this</span>` : ""}</button>`;
  }
  function qcard(q, fresh) {
    return `<div class="qcard ${fresh ? "flip" : ""}"><div class="qcat">${esc(Bank.CATS[q.c] || "")}</div><p>${esc(q.q)}</p></div>`;
  }

  function boardView(s, fresh, bubble) {
    const b = s.board, cur = s.players[s.turn], mine = canAct(s, "board");
    const rows = [];
    for (let r = 0; r < Engine.ROWS; r++) {
      let cls = "row-cell", inner = "";
      if (r === b.h) { cls += " hunter"; inner = `${spr(s.hunter, "tiny")}<span>${esc(HUNTERS[s.hunter].short)}</span>`; }
      if (r === b.p) { cls += " player"; inner = `${spr(cur.char, "tiny")}<span>${esc(cur.name)}</span><b>${money(cur.offer)}</b>`; }
      if (r > b.h && r < b.p) cls += " gap";
      if (r < b.h) cls += " behind";
      rows.push(`<div class="${cls}">${inner}</div>`);
    }
    rows.push(`<div class="row-cell home-row">HOME</div>`);
    const st = b.step, rev = st === "reveal" || st === "move";
    const optCls = (i) => {
      const c = ["opt"];
      if (b.pick === i) c.push("picked");
      if (b.strike === i) c.push("struck");
      if (rev) { if (i === b.ans) c.push("right"); else if (b.pick === i) c.push("wrong"); }
      return c.join(" ");
    };
    return `<section class="play board-play">
      <div class="board">${rows.join("")}</div>
      <div class="board-side">
        ${qcard(b, fresh)}
        <div class="opts three">${b.opts.map((o, i) => `<button class="${optCls(i)}" data-send="board" data-v="${i}" ${mine && st === "ask" && b.strike !== i ? "" : "disabled"}>
          <em>${LETTERS[i]}</em><span class="ot">${esc(o)}</span>${b.strike === i && !rev ? `<span class="hunch">${esc(cur.name)}'s hunch: not this</span>` : ""}${rev && b.hp === i ? `<span class="htag">${esc(HUNTERS[s.hunter].short)}</span>` : ""}${rev && b.pick === i ? `<span class="ptag">${esc(cur.name)}</span>` : ""}</button>`).join("")}</div>
        <div class="board-msg">${st === "lock" ? `<span class="thinking">${esc(HUNTERS[s.hunter].short)} is locking in<i>.</i><i>.</i><i>.</i></span>` : st === "ask" ? (mine ? "Pick your answer" : `${esc(cur.name)} is thinking…`) : ""}</div>
        ${rev ? bubble(s.line) : ""}
      </div>
      ${hostSkip(s)}
    </section>`;
  }

  function hunterRunView(s, fresh, bubble) {
    const f = s.final, H = HUNTERS[s.hunter], mine = canAct(s, "final");
    const pct = Math.min(100, (f.hs / f.score) * 100);
    const remain = f.paused ? f.remain : null;
    let qa = "";
    if (f.push) {
      const p = f.push;
      qa = `<div class="push ${fresh ? "pop" : ""}">
        <div class="push-head">PUSHBACK!</div>
        <p>${esc(H.short)} got it wrong. Answer this to push them back a step.</p>
        <div class="qcard"><p>${esc(p.q)}</p></div>
        <div class="opts three">${p.opts.map((o, i) => {
          const c = ["opt"]; if (p.done) { if (i === p.ans) c.push("right"); else if (p.pick === i) c.push("wrong"); }
          return `<button class="${c.join(" ")}" data-send="final" data-v="${i}" ${mine && !p.done ? "" : "disabled"}><em>${LETTERS[i]}</em>${esc(o)}</button>`;
        }).join("")}</div>
        ${p.done ? `<div class="fb ${p.ok ? "ok" : "no"}">${p.ok ? "✓ PUSHED BACK!" : "✗ No pushback"}</div>` : `<div class="timebar small"><i data-bar="${p.end}" data-len="${Engine.PUSH_TIME}"></i></div>`}
      </div>`;
    } else if (f.hq) {
      const q = f.hq, done = q.hp != null;
      qa = `<div class="hq ${fresh ? "flip" : ""}">
        <div class="qcard dim"><p>${esc(q.q)}</p></div>
        <div class="hq-ans">${done ? (q.hp === q.ans ? `<span class="ok">✓ ${esc(q.opts[q.ans])}</span>` : `<span class="no">✗ ${esc(q.opts[q.hp])}</span>`) : `<span class="thinking">thinking<i>.</i><i>.</i><i>.</i></span>`}</div>
      </div>`;
    }
    return `<section class="play">
      <div class="hud">
        <div class="who red-t"><small>HUNTER</small><b class="big-n">${f.hs}</b></div>
        <div class="clock ${f.paused ? "paused" : ""}" ${remain == null ? `data-end="${f.end}"` : ""}>${remain == null ? "2:00" : fmt(remain)}</div>
        <div class="bank"><small>TARGET</small><b class="big-n">${f.score}</b></div>
      </div>
      <div class="chase-track">
        <div class="track-fill" style="width:${pct}%"></div>
        <div class="track-hunter" style="left:${pct}%">${spr(s.hunter, "tiny")}</div>
        <div class="track-team">${s.players.filter((p) => p.result === "home").map((p) => spr(p.char, "tiny")).join("")}</div>
      </div>
      <div class="hunter-row">${bubble(s.line)}</div>
      ${qa}
    </section>`;
  }

  function fmt(ms) { const t = Math.max(0, Math.ceil(ms / 1000)); return t >= 60 ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : String(t); }

  // live clocks and timer bars
  let lastTick = 0;
  function frame() {
    requestAnimationFrame(frame);
    const now = Date.now() - skew;
    for (const el of $$("[data-end]")) {
      const left = +el.dataset.end - now; const txt = fmt(left);
      if (el.textContent !== txt) {
        el.textContent = txt;
        if (left <= 10000 && left > 0) { el.classList.add("hot"); if (Math.ceil(left / 1000) !== lastTick) { lastTick = Math.ceil(left / 1000); Sfx.tick(); } }
      }
    }
    for (const el of $$("[data-bar]")) el.style.width = Math.max(0, Math.min(100, ((+el.dataset.bar - now) / +el.dataset.len) * 100)) + "%";
    for (const el of $$("[data-lock]")) if (+el.dataset.lock - now <= 0) { el.classList.remove("locked"); el.removeAttribute("data-lock"); }
  }
  requestAnimationFrame(frame);

  function sounds(p, s) {
    if (!p) return;
    const cur = s.players[s.turn], mineP = (pl) => pl && (role === "local" || pl.id === me.id);
    if (s.cash && s.cash.fb && s.cash.fb.ok && (!p.cash || !p.cash.fb || p.cash.fb.k !== s.cash.fb.k) && mineP(cur)) levelUp(RPG.gain(cur.char, s.cash.fb.c, 1));
    if (s.board && p.board && s.board.step === "reveal" && p.board.step !== "reveal" && s.board.pick === s.board.ans && mineP(cur)) levelUp(RPG.gain(cur.char, s.board.c, 2));
    if (s.final && s.final.fb && s.final.fb.ok && (!p.final || !p.final.fb || p.final.fb.k !== s.final.fb.k)) {
      const who = s.players.filter((pl) => pl.result === "home" && (s.final.fb.who ? pl.id === s.final.fb.who : true) && mineP(pl));
      for (const pl of who) levelUp(RPG.gain(pl.char, s.final.fb.c, 1));
    }
    if (s.phase === "turnEnd" && p.phase !== "turnEnd") { const r = cur.result; if (r === "home") shout("SAFE!", "safe"); else if (r === "caught") shout("GOTCHA!", "gotcha"); }
    if (s.phase === "end" && p.phase !== "end") shout(s.won ? "VICTORY!" : "CAUGHT!", s.won ? "safe" : "gotcha");
    if (s.final && s.final.push && s.final.push.done && s.final.push.ok && p.final && p.final.push && !p.final.push.done) shout("PUSHBACK!", "safe");
    if (s.phase === "intro" && p.phase !== "intro") shout("HERE COMES THE HUNTER", "gotcha");
    const b = s.board, pb = p.board;
    if (b && pb && b.step === "reveal" && pb.step !== "reveal") (b.pick === b.ans ? Studio.cheer(1200) : Studio.gasp(1200));
    if (s.phase === "turnEnd" && p.phase !== "turnEnd") (s.players[s.turn].result === "home" ? Studio.cheer(3000) : Studio.gasp(2500));
    if (s.phase === "end" && p.phase !== "end") (s.won ? Studio.cheer(5000) : Studio.gasp(3000));
    if (s.final && s.final.push && s.final.push.done && p.final && p.final.push && !p.final.push.done && s.final.push.ok) Studio.cheer(1500);
    if (s.phase === "intro" && p.phase !== "intro") Studio.cheer(1500);
    if (s.cash && s.cash.fb && (!p.cash || !p.cash.fb || p.cash.fb.k !== s.cash.fb.k)) s.cash.fb.ok ? Sfx.right() : Sfx.wrong();
    const f = s.final, pf = p.final;
    if (f && f.fb && (!pf || !pf.fb || pf.fb.k !== f.fb.k)) f.fb.ok ? Sfx.right() : Sfx.wrong();
    if (s.board && p.board && s.board.step === "reveal" && p.board.step !== "reveal") s.board.pick === s.board.ans ? Sfx.right() : Sfx.wrong();
    if (s.board && p.board && s.board.step === "move" && p.board.step !== "move") Sfx.step();
    if (s.phase === "turnEnd" && p.phase !== "turnEnd") (s.players[s.turn].result === "home" ? Sfx.home : Sfx.caught)();
    if (s.phase === "intro" && p.phase !== "intro") Sfx.hunter();
    if (s.phase === "finalHIntro" && p.phase !== "finalHIntro") Sfx.hunter();
    if (f && pf && f.hq && pf.hq && f.hq.hp != null && pf.hq.hp == null) f.hq.hp === f.hq.ans ? Sfx.step() : Sfx.buzz();
    if (f && f.push && f.push.done && pf && pf.push && !pf.push.done) f.push.ok ? Sfx.right() : Sfx.wrong();
    if (s.phase === "end" && p.phase !== "end") s.won ? Sfx.fanfare() : Sfx.caught();
  }
  function confetti() {
    const box = document.createElement("div"); box.className = "confetti";
    const cols = ["#ffcf4a", "#2fe6c8", "#ff5d8f", "#7c5cff", "#fff3d6"];
    for (let i = 0; i < 60; i++) { const b = document.createElement("i"); b.style.left = Math.random() * 100 + "%"; b.style.background = cols[i % cols.length]; b.style.animationDelay = Math.random() * 1.2 + "s"; b.style.animationDuration = 2 + Math.random() * 2 + "s"; box.appendChild(b); }
    app.appendChild(box);
  }

  function record(s) {
    const rec = LS("rd.rec", { games: 0, wins: 0, total: 0, best: 0 });
    const mine = role === "local" ? s.players : s.players.filter((p) => p.id === me.id);
    const won = mine.reduce((a, p) => a + (p.won || 0), 0);
    rec.games++; if (s.won && won > 0) rec.wins++; rec.total += won; rec.best = Math.max(rec.best, won);
    SAVE("rd.rec", rec);
  }

  // ---------- online ----------
  function onlineScreen(err = "") {
    screen = "online"; stopOnline();
    show(`${bar("TEAM · ONLINE")}
      <section class="panel">
        <h2 class="h">You</h2>
        <div class="slots">${slot({ char: me.char, name: me.name }, 0)}</div>
        <button class="btn big purple" data-act="host"><b>HOST A ROOM</b><small>Get a code to share</small></button>
        <div class="join">
          <input id="code" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters" aria-label="Room code">
          <button class="btn big teal" data-act="join"><b>JOIN</b></button>
        </div>
        ${err ? `<p class="err">${esc(err)}</p>` : ""}
        <p class="hint">Up to 4 players, each on their own phone. Everyone needs internet. The host's phone runs the game, so keep it awake.</p>
      </section>`, "blue");
  }
  function saveMe() {
    const n = $("input.name"); if (n) me.name = n.value.trim() || CHARS[me.char].name;
    SAVE("rd.me", me);
  }
  async function hostRoom() {
    saveMe();
    const code = Net.code();
    role = "host";
    lobby = { phase: "lobby", code, host: me.id, hunter: LS("rd.hunter", "archivist"), players: [{ id: me.id, name: me.name, char: me.char, stats: RPG.stats(me.char) }], now: Date.now() };
    lobbyView();
    try {
      await Net.open(code, me.id, {
        hello: (p) => {
          if (!lobby || game) { if (game) Net.sendState(game.s); return; }
          const ex = lobby.players.find((x) => x.id === p.pid);
          const st = p.stats && typeof p.stats === "object" ? Object.fromEntries(RPG.CATS.map((k) => [k, Math.max(0, Math.min(RPG.MAX, +p.stats[k] || 0))])) : null;
          if (ex) { ex.name = p.name; ex.char = p.char; ex.stats = st; }
          else if (lobby.players.length < 4) lobby.players.push({ id: p.pid, name: String(p.name).slice(0, 14), char: CHARS[p.char] ? p.char : "aroha", stats: st });
          pushLobby();
        },
        bye: (p) => { if (lobby && !game) { lobby.players = lobby.players.filter((x) => x.id !== p.pid); pushLobby(); } },
        input: (m) => { if (game) game.input(m.pid, m.a, m.v); },
        presence: (ids) => { if (lobby && !game) { const before = lobby.players.length; lobby.players = lobby.players.filter((x) => x.id === me.id || ids.includes(x.id)); if (before !== lobby.players.length) pushLobby(); } },
      });
      beat = setInterval(() => Net.sendState(game ? game.s : { ...lobby, now: Date.now() }), 2000);
      pushLobby();
    } catch (e) { onlineScreen(e.message); }
  }
  function pushLobby() { lobby.now = Date.now(); Net.sendState(lobby); if (screen === "lobby") lobbyView(); }
  async function joinRoom() {
    saveMe();
    const code = ($("#code").value || "").trim().toUpperCase();
    if (!/^[A-Z]{4}$/.test(code)) return onlineScreen("Enter the 4-letter room code.");
    role = "guest"; remote = null;
    show(`${bar("JOINING " + esc(code))}<section class="stage"><div class="waiting">Finding room ${esc(code)}…</div></section>`);
    try {
      await Net.open(code, me.id, {
        state: (st) => {
          lastSeen = Date.now(); skew = Date.now() - st.now;
          const inIt = st.players.some((p) => p.id === me.id);
          if (!inIt) { if (st.phase !== "lobby") { stopOnline(); onlineScreen("That room's game has already started."); } return; }
          if (hello) { clearInterval(hello); hello = null; }
          remote = st;
          if (st.phase === "lobby") { if (game) endLocal(); lobby = st; lobbyView(); } else renderGame(st);
        },
      });
      const sayHi = () => Net.send("hello", { pid: me.id, name: me.name, char: me.char, stats: RPG.stats(me.char) });
      sayHi(); hello = setInterval(sayHi, 1500);
      setTimeout(() => { if (!remote && role === "guest") { stopOnline(); onlineScreen(`No room called ${code}. Check the code with the host.`); } }, 9000);
      watchdog = setInterval(() => { if (remote && Date.now() - lastSeen > 12000) toast("Lost contact with the host…", 2500); }, 4000);
    } catch (e) { onlineScreen(e.message); }
  }
  function lobbyView() {
    screen = "lobby";
    const L = lobby, host = role === "host";
    show(`${bar("ROOM " + esc(L.code))}
      <section class="panel">
        <div class="code-box"><small>ROOM CODE</small><b>${esc(L.code)}</b><span>${host ? "Tell your team to tap Team · Online, then Join." : "You're in! Waiting for the host to start."}</span></div>
        <h2 class="h">Players (${L.players.length}/4)</h2>
        <div class="lineup big">${L.players.map((p) => `<div>${spr(p.char, "mid bob")}<span>${esc(p.name)}${p.id === L.host ? " ★" : ""}</span></div>`).join("")}</div>
        <h2 class="h">Hunter</h2>
        ${host ? `<div class="hunters compact">${HUNTER_ORDER.map((h) => hunterCard(h, L.hunter === h)).join("")}</div>
          <button class="btn big red" data-act="start-online"><b>START THE SHOW ▸</b></button>`
        : `<div class="hunters compact">${hunterCard(L.hunter, true)}</div><div class="waiting">Waiting for the host to start…</div>`}
      </section>`, host ? "blue" : "blue");
  }
  function startOnline() {
    lastKey = ""; lastState = null; skew = 0;
    SAVE("rd.hunter", lobby.hunter);
    game = new Engine.Game({ mode: "online", host: me.id, code: lobby.code, hunter: lobby.hunter, players: lobby.players }, onState);
  }
  function stopOnline() {
    if (role !== "local") { try { Net.send("bye", { pid: me.id }); } catch {} }
    clearInterval(beat); clearInterval(hello); clearInterval(watchdog); beat = hello = watchdog = null;
    Net.close(); endLocal(); lobby = null; remote = null; role = "local";
  }

  // ---------- events ----------
  app.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t || t.disabled) return;
    Sfx.unlock();
    if (t.dataset.go) {
      Sfx.tap();
      const g = t.dataset.go;
      if (g === "solo" || g === "team") startSetup(g);
      else if (g === "online") onlineScreen();
      else if (g === "pub") { screen = "pub"; Pub.open(); }
      else if (g === "roster") roster();
      return;
    }
    if (t.dataset.send) { Sfx.tap(); send(t.dataset.send, t.dataset.v == null ? null : t.dataset.send === "take" ? t.dataset.v : +t.dataset.v); return; }
    if (t.dataset.hunter) {
      Sfx.tap();
      if (screen === "lobby" && role === "host") { lobby.hunter = t.dataset.hunter; pushLobby(); }
      else if (setup) { setup.hunter = t.dataset.hunter; renderSetup(); }
      return;
    }
    const a = t.dataset.act; if (!a) return;
    Sfx.tap();
    const i = +t.dataset.i;
    switch (a) {
      case "home":
        if ((screen === "game" && lastState && lastState.phase !== "end") || screen === "lobby") { if (!confirm("Leave this game?")) return; }
        title(); break;
      case "sound": Sfx.toggle(); $$("[data-act=sound]").forEach((b) => (b.textContent = b.classList.contains("link") ? (Sfx.on ? "Sound on" : "Sound off") : Sfx.on ? "♪" : "×")); break;
      case "prev": case "next": {
        const dir = a === "next" ? 1 : -1;
        const list = screen === "online" ? [{ char: me.char, name: me.name }] : setup.players;
        const p = list[i]; const nameInput = $(`input.name[data-i="${i}"]`);
        const typed = nameInput ? nameInput.value.trim() : p.name;
        const wasDefault = !typed || typed === CHARS[p.char].name;
        p.char = CHAR_ORDER[(CHAR_ORDER.indexOf(p.char) + dir + CHAR_ORDER.length) % CHAR_ORDER.length];
        p.name = wasDefault ? CHARS[p.char].name : typed;
        if (screen === "online") { me.char = p.char; me.name = p.name; SAVE("rd.me", me); onlineScreen(); } else renderSetup();
        break;
      }
      case "more": syncNames(); { const used = setup.players.map((p) => p.char); const c = CHAR_ORDER.find((x) => !used.includes(x)) || "aroha"; setup.players.push({ char: c, name: CHARS[c].name }); } renderSetup(); break;
      case "less": syncNames(); setup.players.pop(); renderSetup(); break;
      case "to-hunter": syncNames(); setup.step = "hunter"; renderSetup(); break;
      case "begin": beginLocal(); break;
      case "again":
        if (role === "host") { endLocal(); lastState = null; lobby.phase = "lobby"; pushLobby(); }
        else if (setup) beginLocal(); else title();
        break;
      case "host": hostRoom(); break;
      case "join": joinRoom(); break;
      case "start-online": if (lobby.players.length < 1) return; startOnline(); break;
    }
  });
  app.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "code") joinRoom(); });
  function syncNames() { $$("input.name").forEach((inp) => { const p = setup.players[+inp.dataset.i]; if (p) p.name = inp.value; }); }
  addEventListener("beforeunload", () => { if (role !== "local") try { Net.send("bye", { pid: me.id }); } catch {} });

  // keep the screen on during a game where supported
  let lock = null;
  async function wake() { try { if ("wakeLock" in navigator && !lock && document.visibilityState === "visible") { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => (lock = null)); } } catch {} }
  document.addEventListener("visibilitychange", wake);
  document.addEventListener("pointerdown", wake, { once: true });

  title();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});

  return { esc, spr, portrait, vn, bar, show, toast, title, money, LS, SAVE, me, statBars, levelUp, shout, typeIn };
})();
