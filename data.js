// Contestants and hunters. Specs feed sprites.js; lines are what the hunters say.
const CHARS = {
  connor: {
    name: "Connor", tag: "The Big Fella",
    spec: {
      build: "big", belly: 1, strong: 1, skin: "#e8b08a", hair: "#24170f", hairStyle: "volume",
      beard: "big", beardColor: "#1f140d", mouth: "smile",
      top: { style: "tee", color: "#283326", graphic: "ring" },
      bottom: { style: "shorts", color: "#3b4152" },
      socks: { color: "#f3f3f3", stripe: "#c8102e" },
      shoes: { style: "hi", color: "#c8102e", accent: "#121212", toe: "#f4f4f4", sole: "#f4f4f4" },
    },
  },
  mel: {
    name: "Mel", tag: "Pop culture queen. Never wrong on Harry Potter.", perk: "hp",
    spec: {
      build: "curvy", skin: "#f2c6a6", hair: "#f2cf73", hairStyle: "long", mouth: "grin", blush: 1, lashes: 1, eye: "#2d5a7a",
      top: { style: "cardigan", color: "#efe0c4", inner: "#d98ca6", button: "#b48b5a" },
      bottom: { style: "jeans", color: "#6a8cc4" },
      shoes: { style: "low", color: "#f7f7f7", accent: "#e9b8c8", sole: "#e2e2e2" },
    },
  },
  aroha: {
    name: "Aroha", tag: "Never misses a fact",
    spec: {
      build: "avg", skin: "#a8714f", hair: "#1c1310", hairStyle: "curly", mouth: "smile", pounamu: 1,
      top: { style: "jumper", color: "#e0a92e" }, bottom: { style: "pants", color: "#1e1e26" },
      shoes: { style: "boot", color: "#5a3a24", sole: "#2a1a10" },
    },
  },
  steve: {
    name: "Big Steve", tag: "Tradie. Knows sport.",
    spec: {
      build: "big", belly: 1, strong: 1, skin: "#f0b892", hair: "#c2602a", hairStyle: "bald", beard: "big", beardColor: "#b4531f", mouth: "grin",
      top: { style: "tee", color: "#2f4b7a", graphic: "hivis" }, bottom: { style: "shorts", color: "#4a4033" },
      socks: { color: "#7a7a7a", knee: false }, shoes: { style: "boot", color: "#6b4a2b", sole: "#1d1d1d" },
    },
  },
  priya: {
    name: "Priya", tag: "Science brain",
    spec: {
      build: "slim", skin: "#b9805a", hair: "#151018", hairStyle: "ponytail", mouth: "smirk", glasses: "#2b2b3b", lashes: 1,
      top: { style: "blazer", color: "#178a8a", inner: "#f4f1ea" }, bottom: { style: "pants", color: "#232336" },
      shoes: { style: "low", color: "#1b1b1b", sole: "#444" },
    },
  },
  june: {
    name: "Nana June", tag: "Fifty years of crosswords",
    spec: {
      build: "avg", skin: "#f1cdb6", hair: "#d9d6e2", hairStyle: "curly", mouth: "smile", glasses: "#8b4a8b", blush: 1,
      top: { style: "cardigan", color: "#7a3f8f", inner: "#f2e6f0", button: "#f2d16b" }, bottom: { style: "skirt", color: "#4d5874" },
      shoes: { style: "low", color: "#3a2a24", sole: "#2a1a10" },
    },
  },
  tama: {
    name: "Tama", tag: "Rugby head, quiz heart",
    spec: {
      build: "big", strong: 1, skin: "#9a6446", hair: "#120d0a", hairStyle: "fade", mouth: "smile", beard: "goatee",
      top: { style: "jersey", color: "#141414", trim: "#f2f2f2" }, bottom: { style: "shorts", color: "#f2f2f2" },
      socks: { color: "#141414", stripe: "#f2f2f2" }, shoes: { style: "low", color: "#1d1d1d", accent: "#3fd0ff", sole: "#e9e9e9" },
    },
  },
  jess: {
    name: "Jess", tag: "Pop culture queen",
    spec: {
      build: "slim", skin: "#f6d2bd", hair: "#ff6fae", hairStyle: "bob", mouth: "grin", lashes: 1, earring: "#ffd34d",
      top: { style: "denim", color: "#4e78b8", inner: "#1f1f2e" }, bottom: { style: "skirt", color: "#1b1b26" },
      shoes: { style: "boot", color: "#151515", sole: "#3a3a3a" },
    },
  },
};

const HUNTERS = {
  archivist: {
    name: "THE ARCHIVIST", short: "The Archivist", stars: 1, acc: 0.8, speed: 5.0, tier: 1.0, color: "#9db4e0",
    blurb: "Has read every book in the library. Twice. Fond of footnotes.",
    spec: {
      build: "slim", skin: "#e9d2bd", hair: "#c9ccd6", hairStyle: "slick", mouth: "smirk", mean: 1, monocle: 1, browColor: "#8d909c",
      top: { style: "suit", color: "#3a3d4a", tie: "#9c1b2e", vest: "#5a2a35" }, bottom: { style: "pants", color: "#2d2f3a" },
      shoes: { style: "low", color: "#1a1a1a", sole: "#0a0a0a" },
    },
    lines: {
      intro: ["Ah. Fresh minds. Let us see what you've read.", "I've catalogued every fact you think you know.", "Shh. This is a library. And you are overdue."],
      offer: ["A modest figure for a modest mind. Or be bold.", "Choose wisely. I have already filed your mistakes.", "The high road is a long shelf. Can you reach it?"],
      right: ["Correct. Naturally.", "Filed and indexed.", "As it says on page one."],
      wrong: ["A rare misprint.", "Even the best reference has errata.", "I shall be reviewing that."],
      caught: ["Returned to the shelf. Overdue.", "Your card has been cancelled.", "Archived."],
      home: ["Hm. You've earned a library card.", "Well read. Barely.", "Very well. Proceed."],
      win: ["The record shows: I prevailed.", "Another volume for my collection."],
      lose: ["An error in my records. It won't happen twice.", "Remarkable. I shall make a note of it."],
    },
  },
  grimwood: {
    name: "LADY GRIMWOOD", short: "Lady Grimwood", stars: 2, acc: 0.84, speed: 4.5, tier: 1.2, color: "#ff6b8b",
    blurb: "Cold as a cathedral. Has never once said 'well done'.",
    spec: {
      build: "slim", skin: "#efe3e6", hair: "#141018", hairStyle: "streak", mouth: "stern", mean: 1, lashes: 1, eye: "#7a0f2a", earring: "#c9c9d6",
      top: { style: "gown", color: "#8f1430", trim: "#2a0a12" }, bottom: { style: "none", color: "#000" },
      shoes: { style: "heel", color: "#141414" },
    },
    lines: {
      intro: ["Do sit down. This won't take long.", "I've seen better contestants in a waiting room.", "You look nervous. Good."],
      offer: ["Take the money and run. Or don't. I'd prefer you didn't.", "Greed suits you. Go on.", "The low offer is beneath you. Then again, so is the high one."],
      right: ["Obviously.", "Keep up.", "Was that meant to be hard?"],
      wrong: ["A momentary lapse.", "Don't get used to it.", "Enjoy that. It won't last."],
      caught: ["Off you go, darling.", "That's the end of you.", "Next."],
      home: ["How tiresome.", "Fine. Go home.", "Lucky. Very lucky."],
      win: ["Was there ever any doubt?", "Dreadfully predictable."],
      lose: ["I'll allow it. Once.", "Hm. Well played, I suppose."],
    },
  },
  kahu: {
    name: "KAHU", short: "Kahu", stars: 3, acc: 0.88, speed: 4.1, tier: 1.4, color: "#f2b84b",
    blurb: "The hawk. Circles high, strikes fast, never misses a weak answer.",
    spec: {
      build: "big", strong: 1, skin: "#9b6545", hair: "#0f0b08", hairStyle: "topknot", tie: "#e9e1cf", beard: "goatee", mouth: "stern", mean: 1,
      top: { style: "cloak", color: "#6b4426", trim: "#e9e1cf" }, bottom: { style: "pants", color: "#14110e" },
      shoes: { style: "boot", color: "#1d1712", sole: "#0b0907" },
    },
    lines: {
      intro: ["I see everything from up here.", "The hawk is circling.", "Kia ora. Let's see how fast you run."],
      offer: ["Fly high or stay low. Either way, I'm watching.", "Take the high road. I dare you.", "Small steps or big money. Choose."],
      right: ["Sharp eyes.", "Straight to it.", "Too easy."],
      wrong: ["Even hawks miss sometimes.", "The wind took that one.", "Hmph."],
      caught: ["Got you.", "Swooped.", "Nowhere to hide."],
      home: ["You got away. This time.", "Fast feet.", "Fair play to you."],
      win: ["The hawk always comes back.", "Too slow, team."],
      lose: ["Ka pai. You earned that.", "Well flown. Respect."],
    },
  },
  null: {
    name: "DR. NULL", short: "Dr. Null", stars: 4, acc: 0.93, speed: 3.6, tier: 1.7, color: "#58f5ff",
    blurb: "Part scientist, part machine. Calculates your odds as zero.",
    spec: {
      build: "avg", skin: "#d9c2b0", hair: "#222", hairStyle: "bald", mouth: "smirk", goggles: "#ff2a4a",
      top: { style: "coat", color: "#eef2f6", inner: "#1d2133" }, bottom: { style: "pants", color: "#1d2133" },
      shoes: { style: "boot", color: "#2a2f3d", sole: "#11141c" },
    },
    lines: {
      intro: ["Initialising. Probability of your success: low.", "I have run this simulation 10,000 times. You lose.", "Hello, test subjects."],
      offer: ["My models recommend the low offer. For you.", "Risk appetite detected. Interesting.", "Compute your choice. Quickly."],
      right: ["Correct. As calculated.", "Trivial.", "Answer verified."],
      wrong: ["Anomaly logged.", "Recalibrating.", "A rounding error."],
      caught: ["Subject eliminated.", "Experiment concluded.", "Zero. As predicted."],
      home: ["Unexpected result.", "Outlier detected.", "Statistically irritating."],
      win: ["Hypothesis confirmed.", "Experiment successful. For me."],
      lose: ["Error. Error. Well played.", "My models... were wrong."],
    },
  },
};

const CHAR_ORDER = ["connor", "mel", "aroha", "steve", "priya", "june", "tama", "jess"];
const HUNTER_ORDER = ["archivist", "grimwood", "kahu", "null"];

// The show's host: an original character. Cheeky, warm, can't stop giggling.
const HOST = {
  name: "Gaz Goodwin", short: "Gaz",
  spec: {
    build: "avg", skin: "#eec3a1", hair: "#cfd3dc", hairStyle: "short", mouth: "grin", blush: 1, browColor: "#9a9ca6",
    top: { style: "suit", color: "#1f2d66", tie: "#ffcf4a", vest: "#1f2d66" }, bottom: { style: "pants", color: "#1a2452" },
    shoes: { style: "low", color: "#5a2e16", sole: "#2a1408" },
  },
  lines: {
    welcome: ["Evening! Ooh, lovely crowd tonight.", "Welcome to THE RUNDOWN! Ha ha!", "Right, who's feeling clever?", "Big night, this. Big night!", "Hello, hello! Settle down, settle down."],
    intro: ["Tonight's hunter... is {h}! Ooh, I wouldn't.", "Give it up for {h}! Or don't. They'll remember.", "Brace yourselves, it's {h}!"],
    turn: ["{p}! Lovely to see you. Sixty seconds, off you pop!", "Here's {p}! Nerves of steel, this one. I think.", "{p}, the floor is yours. No pressure. Loads of pressure!"],
    home: ["{p} is HOME! Ha ha! Get in!", "Oh, you beauty! {p} made it!", "Look at that! {p} is safe and sound!"],
    caught: ["Oh no. Oh, {p}. I'm gutted for you.", "Ooh, that's a shame. {p} has been caught.", "Nooo! {p}! I can't watch."],
    final: ["This is it. The Last Stand. Hold on to your hats!", "Two minutes. Every answer counts. Ooh, I'm nervous!"],
    hunt: ["Right. Over to you, hunter. Go easy. Please.", "Your target's set. Can they catch you? Ha!"],
    win: ["YOU'VE DONE IT! Ha ha ha! Brilliant!", "Get in there! What a team!", "Unbelievable! The hunter's been beaten!"],
    lose: ["Oh, so close. So, so close.", "Ahh. The hunter wins tonight. Chin up!", "Gutted. Absolutely gutted for you."],
  },
};

// ---------- Team Discovery Channel and the RPG layer ----------
// Stats run 1-255 in each category. Looks for Zach, Jackie and Jeremy are placeholders until we get descriptions.
Object.assign(CHARS, {
  jackie: {
    name: "Jackie", tag: "Mum. All-round ace.",
    spec: {
      build: "avg", skin: "#efc6a8", hair: "#a8602f", hairStyle: "bob", mouth: "smile", glasses: "#6a2f4f", earring: "#ffd166", blush: 1, lashes: 1, eye: "#3a5a3a",
      top: { style: "cardigan", color: "#2f7f7a", inner: "#f4ead6", button: "#ffd166" }, bottom: { style: "pants", color: "#2a2a3a" },
      shoes: { style: "low", color: "#4a2a1a", sole: "#2a1408" },
    },
  },
  zach: {
    name: "Zach", tag: "Knows every map by heart",
    spec: {
      build: "avg", skin: "#e9b996", hair: "#5a3a22", hairStyle: "volume", mouth: "smirk", cap: "#23345e", eye: "#3a2a1a",
      top: { style: "tee", color: "#3a7ca5", graphic: "globe" }, bottom: { style: "shorts", color: "#b8a37a" },
      shoes: { style: "low", color: "#e8e8e8", accent: "#23345e", sole: "#cfcfcf" },
    },
  },
  jeremy: {
    name: "Jeremy", tag: "Down from Wellington. Sport nut.",
    spec: {
      build: "avg", strong: 1, skin: "#f0c09a", hair: "#c9a25a", hairStyle: "short", beard: "stubble", mouth: "grin", eye: "#2a4a6a",
      top: { style: "jersey", color: "#f2c230", trim: "#141414", graphic: "stripe", stripe: "#141414" }, bottom: { style: "shorts", color: "#141414" },
      socks: { color: "#141414", stripe: "#f2c230", knee: false }, shoes: { style: "low", color: "#141414", accent: "#f2c230", sole: "#e9e9e9" },
    },
  },
});
CHARS.connor.tag = "Quiz master. Team captain.";
CHAR_ORDER.splice(0, CHAR_ORDER.length, "connor", "jackie", "zach", "jeremy", "mel", "aroha", "steve", "priya", "june", "tama", "jess");

const TEAM = { name: "Team Discovery Channel", captain: "connor", members: ["connor", "mel", "jackie", "zach", "jeremy"] };

// starting level and stats; levels and stats then grow with play (see rpg.js)
const BASE = (() => {
  const S = (all, o = {}) => ({ gk: all, nz: all, geo: all, sci: all, sport: all, ent: all, hist: all, games: all, ...o });
  return {
    connor: { lv: 50, stats: S(210) },
    jackie: { lv: 42, stats: S(175, { gk: 185, nz: 180, hist: 182, ent: 178, sport: 160 }) },
    zach: { lv: 24, stats: S(105, { geo: 205, gk: 122, hist: 115 }) },
    jeremy: { lv: 24, stats: S(100, { sport: 205, nz: 150, gk: 115, ent: 110 }) },
    mel: { lv: 32, stats: S(160, { ent: 210, gk: 185, nz: 165 }) },
    aroha: { lv: 18, stats: S(100, { nz: 175, hist: 140 }) },
    steve: { lv: 12, stats: S(82, { sport: 170, gk: 95 }) },
    priya: { lv: 20, stats: S(110, { sci: 195, geo: 125 }) },
    june: { lv: 30, stats: S(115, { gk: 160, hist: 165, ent: 130 }) },
    tama: { lv: 16, stats: S(90, { sport: 160, nz: 145 }) },
    jess: { lv: 16, stats: S(95, { ent: 190 }) },
  };
})();

// ---------- hidden characters: unlocked by challenges (see UNLOCKS) ----------
Object.assign(CHARS, {
  raven: {
    name: "Raven Noir", tag: "Goth queen of the history round", hidden: true,
    spec: {
      build: "curvy", bust: 3, hips: 5, skin: "#f3e3e6", hair: "#141018", hairStyle: "long", eye: "#8a3ad0", lashes: 1, lips: "#5a0a2a", mouth: "smirk", choker: "#111", earring: "#c9c9d6",
      top: { style: "corset", color: "#1a1020", trim: "#7a2a6a" }, bottom: { style: "skirt", color: "#141018" },
      socks: { color: "#111", net: 1, from: 37 }, shoes: { style: "tall", color: "#111" },
    },
  },
  velvet: {
    name: "Velvet Hex", tag: "Witchy. Mixes potions and science.", hidden: true,
    spec: {
      build: "curvy", bust: 3, hips: 5, skin: "#ecd6d2", hair: "#5a2a8a", hairStyle: "streak", eye: "#d04a8a", lashes: 1, lips: "#3a0a3a", mouth: "smile", choker: "#2a0a2a", chokerGem: "#9a5ad0",
      top: { style: "gown", color: "#2a0f3a", trim: "#9a5ad0", sleeve: "#3a1a4a" }, bottom: { style: "none", color: "#000" },
      shoes: { style: "heel", color: "#141014" },
    },
  },
  nyx: {
    name: "Nyx", tag: "Punk goth. Knows every song.", hidden: true,
    spec: {
      build: "avg", bust: 3, hips: 5, skin: "#f0dcd6", hair: "#e8e8f0", hairStyle: "bob", eye: "#ff3a4a", lashes: 1, lips: "#2a0a1a", mouth: "smirk", choker: "#111", earring: "#c9c9d6",
      top: { style: "denim", color: "#1a1a1a", inner: "#5a0a1a" }, bottom: { style: "skirt", color: "#2a1a2a" },
      socks: { color: "#111", net: 1, from: 35 }, shoes: { style: "tall", color: "#141414" },
    },
  },
  rei: {
    name: "Rei Nova", tag: "Starship pilot. Science ace.", hidden: true,
    spec: {
      build: "curvy", bust: 3, hips: 5, skin: "#f6dccb", hair: "#3fa7ff", hairStyle: "long", eye: "#ff6f8e", lashes: 1, mouth: "grin", blush: 1,
      top: { style: "bodysuit", color: "#eef2f6", accent: "#ff4d5e" }, bottom: { style: "tights", color: "#eef2f6" },
      shoes: { style: "boot", color: "#ff4d5e", sole: "#3a0a10" },
    },
  },
  ember: {
    name: "Ember", tag: "Fire mage. Lives for sport.", hidden: true,
    spec: {
      build: "curvy", bust: 3, hips: 5, skin: "#f2c8a8", hair: "#ff4d2a", hairStyle: "ponytail", eye: "#ffb020", lashes: 1, lips: "#c0302a", mouth: "smile", earring: "#ffd166",
      top: { style: "dress", color: "#b3132b", trim: "#ffd166" }, bottom: { style: "none", color: "#000" },
      shoes: { style: "tall", color: "#4a1a0a", accent: "#ffd166" },
    },
  },
  yuki: {
    name: "Yuki Storm", tag: "Ice ninja. Has been everywhere.", hidden: true,
    spec: {
      build: "avg", bust: 3, hips: 5, strong: 1, skin: "#f4e6dc", hair: "#dff4ff", hairStyle: "long", eye: "#6fe3ff", lashes: 1, mouth: "smirk",
      top: { style: "bodysuit", color: "#1d2a5a", accent: "#bfefff" }, bottom: { style: "tights", color: "#1d2a5a" },
      shoes: { style: "tall", color: "#bfefff", accent: "#1d2a5a" },
    },
  },
});
CHAR_ORDER.push("raven", "velvet", "nyx", "rei", "ember", "yuki");
(() => {
  const S = (all, o = {}) => ({ gk: all, nz: all, geo: all, sci: all, sport: all, ent: all, hist: all, games: all, ...o });
  Object.assign(BASE, {
    raven: { lv: 35, stats: S(130, { hist: 200, ent: 160 }) },
    velvet: { lv: 35, stats: S(130, { sci: 195, hist: 160 }) },
    nyx: { lv: 35, stats: S(130, { ent: 200, gk: 150 }) },
    rei: { lv: 35, stats: S(130, { sci: 200, geo: 160 }) },
    ember: { lv: 35, stats: S(130, { sport: 195, gk: 150 }) },
    yuki: { lv: 35, stats: S(130, { geo: 200, nz: 150 }) },
  });
})();

// challenge to unlock each hidden character; p = progress counters (rpg.js)
const UNLOCKS = {
  raven: { hint: "Win a solo run", test: (p) => p.soloWins >= 1 },
  nyx: { hint: "Get caught 3 times", test: (p) => p.caught >= 3 },
  ember: { hint: "Beat Kahu or Dr. Null", test: (p) => !!(p.beat.kahu || p.beat.null) },
  rei: { hint: "Win $100,000 in total", test: (p) => p.total >= 100000 },
  yuki: { hint: "Answer 150 questions right", test: (p) => p.correct >= 150 },
  velvet: { hint: "Come 1st at a Tuesday quiz", test: (p) => p.pubWins >= 1 },
};

// ---------- secret boss: Shadow Connor (unlock by beating all four hunters) ----------
HUNTERS.shadow = {
  name: "SHADOW CONNOR", short: "Shadow Connor", stars: 4, acc: 0.97, speed: 3.0, tier: 2.0, color: "#ff2a4a", hidden: true,
  blurb: "Connor's dark mirror. Knows everything Connor knows, and everything he's forgotten.",
  spec: {
    build: "big", belly: 1, strong: 1, skin: "#4a3f5e", hair: "#0a0a12", hairStyle: "volume", beard: "big", beardColor: "#0a0a12",
    mouth: "smirk", mean: 1, eye: "#ff2a4a", browColor: "#000",
    top: { style: "tee", color: "#141018", graphic: "ring" }, bottom: { style: "shorts", color: "#141018" },
    socks: { color: "#2a2a3a", stripe: "#ff2a4a" }, shoes: { style: "hi", color: "#141018", accent: "#ff2a4a", toe: "#2a2a3a", sole: "#2a2a3a" },
  },
  lines: {
    intro: ["Hello, Connor. Did you miss me?", "I'm you, but I actually revised.", "Every answer you know, I knew first."],
    offer: ["Go on. Take the high road. You always do.", "I know which one you'll pick. I picked it first.", "Greedy. Just like me."],
    right: ["Obviously. I'm you.", "Too easy for us.", "We knew that one."],
    wrong: ["Even shadows flicker.", "That was your fault, not mine.", "Hm. A memory leak."],
    caught: ["Caught by yourself. How embarrassing.", "You can't outrun your own shadow.", "Back into the dark you go."],
    home: ["Lucky. Very lucky.", "You got away from yourself. Weird feeling, isn't it?", "Fine. Go home."],
    win: ["The shadow always wins.", "You were never going to beat yourself."],
    lose: ["Impossible. I AM you.", "Well played, light side. Well played."],
  },
};
HUNTER_ORDER.push("shadow");
UNLOCKS.shadow = { hint: "Beat all four hunters", test: (p) => ["archivist", "grimwood", "kahu", "null"].every((h) => p.beat[h]) };

// ---------- Connor's unlockable outfits (original designs, video-game inspired) ----------
const OUTFITS = [
  { id: "classic", name: "Classic Connor", hint: "", patch: {} },
  { id: "blaster", name: "Blaster Bot", hint: "Play 5 games", test: (p) => p.games >= 5,
    patch: { top: { style: "bodysuit", color: "#2f6fe0", accent: "#7fd0ff" }, bottom: { style: "tights", color: "#2f6fe0" }, socks: null,
      shoes: { style: "boot", color: "#7fd0ff", sole: "#1a3a8a" }, helmet: { color: "#2f6fe0", accent: "#7fd0ff", gem: "#ff4d5e" }, cannon: { color: "#7fd0ff", accent: "#1a3a8a" } } },
  { id: "ninja", name: "Shadow Ninja", hint: "Answer 100 questions right", test: (p) => p.correct >= 100,
    patch: { top: { style: "bodysuit", color: "#17171c", accent: "#c8102e" }, bottom: { style: "tights", color: "#17171c" }, socks: null,
      shoes: { style: "low", color: "#17171c", sole: "#2a2a30" }, mask: "#17171c", headband: "#c8102e" } },
  { id: "wizard", name: "Arch Wizard", hint: "Answer 500 questions right", test: (p) => p.correct >= 500,
    patch: { top: { style: "gown", color: "#4b2fb8", trim: "#ffd166", sleeve: "#3a2290" }, bottom: { style: "none", color: "#000" }, socks: null,
      shoes: { style: "low", color: "#3a2a1a" }, wizardHat: { color: "#4b2fb8", star: "#ffd166" } } },
  { id: "paladin", name: "Holy Paladin", hint: "Beat The Archivist and Lady Grimwood", test: (p) => !!(p.beat.archivist && p.beat.grimwood),
    patch: { top: { style: "bodysuit", color: "#c9ced8", accent: "#ffd166" }, bottom: { style: "tights", color: "#9aa0ac" }, socks: null,
      shoes: { style: "boot", color: "#9aa0ac", sole: "#5a5f6a" }, helmet: { color: "#c9ced8", accent: "#ffd166", plume: "#c8102e" } } },
  { id: "marine", name: "Space Marine", hint: "Beat Dr. Null", test: (p) => !!p.beat.null,
    patch: { top: { style: "bodysuit", color: "#4a6a3a", accent: "#c9a24a" }, bottom: { style: "tights", color: "#4a6a3a" }, socks: null,
      shoes: { style: "boot", color: "#2a3a22", sole: "#141a10" }, helmet: { color: "#4a6a3a", accent: "#c9a24a", visor: "#ffb020" }, cannon: { color: "#555c66", accent: "#c9a24a" } } },
  { id: "golden", name: "Golden God", hint: "Win $250,000 in total", test: (p) => p.total >= 250000,
    patch: { top: { style: "suit", color: "#d4af37", tie: "#111", vest: "#b8932a" }, bottom: { style: "pants", color: "#d4af37" }, socks: null,
      shoes: { style: "low", color: "#d4af37", sole: "#8a6a1a" }, shades: 1 } },
  { id: "pirate", name: "Pirate Captain", hint: "Win a Tuesday quiz", test: (p) => p.pubWins >= 1,
    patch: { top: { style: "coat", color: "#9c1b2e", inner: "#f4ead6" }, bottom: { style: "pants", color: "#2a1a12" }, socks: null,
      shoes: { style: "boot", color: "#2a1a12", sole: "#120a06" }, pirateHat: "#141414", eyepatch: 1 } },
  { id: "hotdog", name: "The Hot Dog", hint: "Get caught 10 times", test: (p) => p.caught >= 10,
    patch: { top: { style: "hotdog", color: "#c8402e", bun: "#d9a35a" }, socks: null, shoes: { style: "low", color: "#c8102e", sole: "#7a0a1a" } } },
];
for (const o of OUTFITS) if (o.test) UNLOCKS["outfit:" + o.id] = { hint: o.hint, test: o.test };
const CONNOR_BASE = JSON.parse(JSON.stringify(CHARS.connor.spec));
