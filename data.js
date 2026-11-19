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
    name: "Mel", tag: "Cool as",
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
