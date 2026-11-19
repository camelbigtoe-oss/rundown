// Game rules. One Game object runs the whole show; the UI only reads its state and sends inputs.
// In online play the host's phone runs the Game and broadcasts the state to everyone else.
const Engine = (() => {
  "use strict";
  const CASH_TIME = 60000, FINAL_TIME = 120000, PUSH_TIME = 8000, LOCK_TIME = 3000, STEP = 1000, ROWS = 8;
  const START = { high: 2, mid: 3, low: 4 };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const round = (v, to) => Math.round(v / to) * to;

  class Game {
    constructor(cfg, onChange) {
      this.onChange = onChange; this.timers = []; this.ans = null; this.avoid = new Set(); this.fbk = 0;
      this.H = HUNTERS[cfg.hunter];
      this.s = {
        v: 0, phase: "intro", hunter: cfg.hunter, mode: cfg.mode, host: cfg.host || null, code: cfg.code || null,
        players: cfg.players.map((p) => ({ id: p.id, name: p.name, char: p.char, stats: p.stats || null, cash: 0, offer: 0, take: null, result: null, won: 0 })),
        turn: 0, line: this.say("intro"), pot: 0, now: Date.now(),
      };
      this.loop = setInterval(() => this.tick(), 150);
      this.emit();
    }
    say(k) { return pick(this.H.lines[k]); }
    cur() { return this.s.players[this.s.turn]; }
    emit() { this.s.v++; this.s.now = Date.now(); this.onChange(this.s); }
    later(ms, fn) { const id = setTimeout(() => { this.timers = this.timers.filter((x) => x !== id); fn(); }, ms); this.timers.push(id); }
    destroy() { clearInterval(this.loop); this.timers.forEach(clearTimeout); this.timers = []; }
    // a strong subject sometimes crosses off one wrong answer (the "hunch")
    q(n, stats) {
      const q = Bank.next(n, this.avoid); this.ans = q.ans;
      let strike = null;
      if (stats) {
        const v = stats[q.c === "flag" ? "geo" : q.c] || 0;
        if (Math.random() < v / (n === 3 ? 700 : 500)) { const w = [...Array(n).keys()].filter((i) => i !== q.ans); strike = w[Math.floor(Math.random() * w.length)]; }
      }
      return { id: q.id, c: q.c, q: q.q, opts: q.opts, strike };
    }
    teamStats() {
      const home = this.s.players.filter((p) => p.result === "home" && p.stats); if (!home.length) return null;
      const out = {}; for (const k of Object.keys(home[0].stats)) out[k] = Math.max(...home.map((p) => p.stats[k] || 0)); return out;
    }

    // who may do what (pid null = everyone on this one device)
    can(pid, act) {
      const s = this.s;
      if (pid == null) return true;
      if (act === "go") return pid === s.host || (s.phase === "turnIntro" && pid === this.cur().id);
      if (act === "skip") return pid === s.host;
      if (act === "final") return s.players.some((p) => p.id === pid && p.result === "home");
      return pid === this.cur()?.id;
    }

    input(pid, act, val) {
      if (!this.can(pid, act)) return;
      const ph = this.s.phase;
      if (act === "go") {
        if (ph === "intro") { this.s.phase = "turnIntro"; this.s.line = ""; this.emit(); }
        else if (ph === "turnIntro") this.startCash();
        else if (ph === "turnEnd") this.nextTurn();
        else if (ph === "finalIntro") this.startFinalP();
        else if (ph === "finalHIntro") this.startFinalH();
      }
      else if (act === "cash") this.cashAns(val);
      else if (act === "take") this.take(val);
      else if (act === "board") this.boardAns(val);
      else if (act === "final") this.finalAns(pid, val);
      else if (act === "skip" && ["turnIntro", "cash", "offer", "board"].includes(ph)) { this.timers.forEach(clearTimeout); this.timers = []; this.endTurn("skipped"); }
    }

    tick() {
      const s = this.s, now = Date.now();
      if (s.phase === "cash" && now >= s.cash.end) this.toOffer();
      else if (s.phase === "finalP" && now >= s.final.end) { s.phase = "finalHIntro"; s.line = "My turn."; this.emit(); }
      else if (s.phase === "finalH") this.hunterTick(now);
    }

    // ---- cash builder ----
    startCash() {
      this.s.phase = "cash";
      this.s.cash = { end: Date.now() + CASH_TIME, score: 0, fb: null, ...this.q(4, this.cur().stats) };
      this.emit();
    }
    cashAns(i) {
      const c = this.s.cash; if (this.s.phase !== "cash") return;
      const ok = i === this.ans; if (ok) c.score++;
      c.fb = { k: ++this.fbk, ok, a: c.opts[this.ans], q: c.q, c: c.c };
      Object.assign(c, this.q(4, this.cur().stats)); this.emit();
    }
    toOffer() {
      const p = this.cur(), base = this.s.cash.score * STEP, T = this.H.tier;
      p.cash = base;
      const high = round(Math.max(base * rand(2.2, 3.4), 5000) + rand(2000, 6000) * T, 1000);
      const low = base >= 2000 ? Math.max(500, round(base * rand(0.12, 0.35), 500)) : -round(rand(1000, 3000), 500);
      this.s.offer = { high, mid: base, low };
      this.s.phase = "offer"; this.s.line = this.say("offer"); this.emit();
    }
    take(k) {
      if (this.s.phase !== "offer" || !(k in START)) return;
      const p = this.cur(); p.take = k; p.offer = this.s.offer[k];
      this.s.phase = "board";
      this.s.board = { p: START[k], h: 0, step: "ask", pick: null, hp: null, ans: null, k: 0 };
      this.boardNext();
    }

    // ---- head-to-head board ----
    boardNext() {
      const b = this.s.board;
      Object.assign(b, this.q(3, this.cur().stats), { step: "ask", pick: null, hp: null, ans: null, k: b.k + 1 });
      this.s.line = ""; this.emit();
    }
    boardAns(i) {
      const b = this.s.board; if (this.s.phase !== "board" || b.step !== "ask") return;
      b.pick = i; b.step = "lock"; this.emit();
      this.later(1400, () => {
        const right = Math.random() < this.H.acc;
        b.hp = right ? this.ans : pick([0, 1, 2].filter((x) => x !== this.ans));
        b.ans = this.ans; b.step = "reveal"; this.s.line = this.say(right ? "right" : "wrong"); this.emit();
        this.later(2600, () => this.boardMove());
      });
    }
    boardMove() {
      const b = this.s.board;
      if (b.pick === b.ans) b.p++;
      if (b.p >= ROWS) return this.endTurn("home");
      if (b.hp === b.ans) b.h++;
      if (b.h >= b.p) return this.endTurn("caught");
      b.step = "move"; this.emit();
      this.later(900, () => this.boardNext());
    }
    endTurn(res) {
      const s = this.s; this.cur().result = res;
      if (s.board) s.board.step = "done";
      s.phase = "turnEnd"; s.line = res === "skipped" ? "" : this.say(res); this.emit();
    }
    nextTurn() {
      const s = this.s; s.turn++;
      if (s.turn < s.players.length) { s.phase = "turnIntro"; s.line = ""; s.board = null; s.cash = null; s.offer = null; this.emit(); return; }
      const home = s.players.filter((p) => p.result === "home");
      if (!home.length) { s.phase = "end"; s.won = false; s.final = null; s.line = this.say("win"); this.emit(); return; }
      s.pot = Math.max(0, home.reduce((a, p) => a + p.offer, 0));
      s.final = { start: home.length, score: home.length, hs: 0 };
      s.phase = "finalIntro"; s.line = ""; this.emit();
    }

    // ---- final chase: the team's run ----
    startFinalP() {
      const f = this.s.final;
      Object.assign(f, { end: Date.now() + FINAL_TIME, lock: 0, fb: null, cur: this.q(4, this.teamStats()) });
      this.s.phase = "finalP"; this.emit();
    }
    finalAns(pid, i) {
      const s = this.s, f = s.final, now = Date.now();
      if (s.phase === "finalP") {
        if (now < f.lock) return;
        const ok = i === this.ans;
        if (ok) f.score++; else f.lock = now + LOCK_TIME;
        f.fb = { k: ++this.fbk, ok, a: f.cur.opts[this.ans], who: pid, c: f.cur.c };
        f.cur = this.q(4, this.teamStats()); this.emit();
      } else if (s.phase === "finalH" && f.push && !f.push.done) {
        const ok = i === f.push.ans;
        Object.assign(f.push, { done: true, ok, pick: i, who: pid });
        if (ok) { if (f.hs > 0) f.hs--; else f.score++; }
        this.emit();
        this.later(1600, () => this.resume());
      }
    }

    // ---- final chase: the hunter's run ----
    startFinalH() {
      const f = this.s.final;
      Object.assign(f, { hs: 0, end: Date.now() + FINAL_TIME, paused: false, remain: 0, push: null, hq: null, hk: 0 });
      this.s.phase = "finalH"; this.s.line = ""; this.emit();
      this.later(800, () => this.hunterNext());
    }
    hunterNext() {
      const f = this.s.final; if (this.s.phase !== "finalH") return;
      const q = Bank.next(4, this.avoid);
      this.hAns = q.ans;
      f.hq = { q: q.q, opts: q.opts, ans: null, hp: null, k: ++f.hk };
      this.hDue = Date.now() + this.H.speed * 1000 * rand(0.7, 1.3);
      this.emit();
    }
    hunterTick(now) {
      const s = this.s, f = s.final;
      if (f.push) {
        if (!f.push.done && now >= f.push.end) { Object.assign(f.push, { done: true, ok: false }); this.emit(); this.later(1200, () => this.resume()); }
        return;
      }
      if (f.paused) return;
      if (now >= f.end) return this.endFinal(true);
      if (this.hDue && now >= this.hDue && f.hq) {
        this.hDue = null;
        const right = Math.random() < this.H.acc;
        f.hq.ans = this.hAns;
        f.hq.hp = right ? this.hAns : pick([0, 1, 2, 3].filter((x) => x !== this.hAns));
        if (right) {
          f.hs++;
          if (f.hs >= f.score) return this.endFinal(false);
          this.emit(); this.later(650, () => this.hunterNext());
        } else {
          f.remain = f.end - now; f.paused = true; s.line = this.say("wrong");
          const opts = f.hq.opts.filter((_, i) => i !== f.hq.hp);
          f.push = { q: f.hq.q, opts, ans: opts.indexOf(f.hq.opts[this.hAns]), end: now + PUSH_TIME, done: false, ok: null, pick: null };
          this.emit();
        }
      }
    }
    resume() {
      const f = this.s.final; if (this.s.phase !== "finalH") return;
      f.push = null; f.paused = false; f.end = Date.now() + f.remain; this.s.line = "";
      this.emit(); this.later(300, () => this.hunterNext());
    }
    endFinal(teamWon) {
      const s = this.s; this.timers.forEach(clearTimeout); this.timers = [];
      s.phase = "end"; s.won = teamWon;
      if (s.final) s.final.left = Math.max(0, s.final.end - Date.now());
      const home = s.players.filter((p) => p.result === "home");
      if (teamWon) home.forEach((p) => (p.won = Math.round(s.pot / home.length)));
      s.line = this.say(teamWon ? "lose" : "win"); this.emit();
    }
  }
  return { Game, ROWS, CASH_TIME, FINAL_TIME, PUSH_TIME, STEP };
})();
