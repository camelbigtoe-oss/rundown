// Online rooms over Supabase Realtime broadcast. No tables needed: the host's phone runs the
// game and broadcasts state; other phones send their taps back as inputs.
const Net = (() => {
  "use strict";
  // Same Supabase project as the NEONWORD leaderboard. The anon key is meant to be public.
  const URL = "https://qqqkjvtqycwogrwpmbat.supabase.co";
  const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxcWtqdnRxeWN3b2dyd3BtYmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNDUyMjIsImV4cCI6MjExMDYyMTIyMn0.E8K1X_v-fz2MxzvfrMVZPCoDgFG_1vJWRqqVF22K654";
  let client = null, ch = null, pending = null;

  function code() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ"; let s = ""; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }

  async function open(room, pid, h) {
    if (!window.supabase) throw new Error("Online play needs an internet connection.");
    client ||= window.supabase.createClient(URL, KEY, { realtime: { params: { eventsPerSecond: 30 } } });
    close();
    ch = client.channel("rundown-" + room, { config: { broadcast: { self: false }, presence: { key: pid } } });
    ch.on("broadcast", { event: "state" }, ({ payload }) => h.state && h.state(payload))
      .on("broadcast", { event: "input" }, ({ payload }) => h.input && h.input(payload))
      .on("broadcast", { event: "hello" }, ({ payload }) => h.hello && h.hello(payload))
      .on("broadcast", { event: "bye" }, ({ payload }) => h.bye && h.bye(payload))
      .on("presence", { event: "sync" }, () => h.presence && h.presence(Object.keys(ch.presenceState())));
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error("Couldn't reach the game server.")), 10000);
      ch.subscribe((st) => {
        if (st === "SUBSCRIBED") { clearTimeout(t); ch.track({ pid, at: Date.now() }); res(); }
        else if (st === "CHANNEL_ERROR" || st === "TIMED_OUT") { clearTimeout(t); rej(new Error("Couldn't reach the game server.")); }
      });
    });
  }
  function send(event, payload) { if (ch) ch.send({ type: "broadcast", event, payload }); }
  // state can change several times in one tick: send only the latest
  function sendState(s) {
    pending = s;
    queueMicrotask(() => { if (pending) { send("state", JSON.parse(JSON.stringify(pending))); pending = null; } });
  }
  function close() { if (ch && client) { try { client.removeChannel(ch); } catch {} } ch = null; }
  return { open, send, sendState, close, code };
})();
