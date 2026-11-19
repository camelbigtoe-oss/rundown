// Picture round: national flags drawn as SVG from their official layouts.
// Only flags whose geometry is simple enough to draw exactly, and none that are near-twins
// of another country's flag (so no Chad/Romania or Indonesia/Monaco).
const Flags = (() => {
  "use strict";
  const rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const poly = (pts, c) => `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${c}"/>`;
  const circ = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>`;
  function star(cx, cy, R, c, rot = -90) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? R * 0.382 : R, a = ((rot + i * 36) * Math.PI) / 180;
      pts.push([+(cx + rr * Math.cos(a)).toFixed(3), +(cy + rr * Math.sin(a)).toFixed(3)]);
    }
    return poly(pts, c);
  }
  // stripes: colours with optional weights
  function H(w, h, cols, wts) { wts ||= cols.map(() => 1); const t = wts.reduce((a, b) => a + b); let y = 0; return cols.map((c, i) => { const s = rect(0, y, w, (h * wts[i]) / t + 0.01, c); y += (h * wts[i]) / t; return s; }).join(""); }
  function V(w, h, cols, wts) { wts ||= cols.map(() => 1); const t = wts.reduce((a, b) => a + b); let x = 0; return cols.map((c, i) => { const s = rect(x, 0, (w * wts[i]) / t + 0.01, h, c); x += (w * wts[i]) / t; return s; }).join(""); }
  // Nordic cross: horizontal segments [hoist, cross, fly], vertical [top, cross, bottom]
  function nordic(hs, vs, bg, cross, inner, innerHs, innerVs) {
    const w = hs.reduce((a, b) => a + b), h = vs.reduce((a, b) => a + b);
    let s = rect(0, 0, w, h, bg) + rect(hs[0], 0, hs[1], h, cross) + rect(0, vs[0], w, vs[1], cross);
    if (inner) s += rect(innerHs[0], 0, innerHs[1], h, inner) + rect(0, innerVs[0], w, innerVs[1], inner);
    return [w, h, s];
  }

  const F = {
    Germany: [5, 3, H(5, 3, ["#000000", "#DD0000", "#FFCE00"])],
    Austria: [3, 2, H(3, 2, ["#C8102E", "#FFFFFF", "#C8102E"])],
    Hungary: [2, 1, H(2, 1, ["#CE2939", "#FFFFFF", "#477050"])],
    Netherlands: [3, 2, H(3, 2, ["#AE1C28", "#FFFFFF", "#21468B"])],
    Luxembourg: [5, 3, H(5, 3, ["#EA141D", "#FFFFFF", "#51ADDA"])],
    Russia: [3, 2, H(3, 2, ["#FFFFFF", "#0039A6", "#D52B1E"])],
    Bulgaria: [5, 3, H(5, 3, ["#FFFFFF", "#00966E", "#D62612"])],
    Estonia: [11, 7, H(11, 7, ["#0072CE", "#000000", "#FFFFFF"])],
    Lithuania: [5, 3, H(5, 3, ["#FDB913", "#006A44", "#C1272D"])],
    Armenia: [2, 1, H(2, 1, ["#D90012", "#0033A0", "#F2A800"])],
    "Sierra Leone": [3, 2, H(3, 2, ["#1EB53A", "#FFFFFF", "#0072C6"])],
    Gabon: [4, 3, H(4, 3, ["#009E60", "#FCD116", "#3A75C4"])],
    Yemen: [3, 2, H(3, 2, ["#CE1126", "#FFFFFF", "#000000"])],
    Poland: [8, 5, H(8, 5, ["#FFFFFF", "#DC143C"])],
    Ukraine: [3, 2, H(3, 2, ["#0057B7", "#FFD700"])],
    Colombia: [3, 2, H(3, 2, ["#FCD116", "#003893", "#CE1126"], [2, 1, 1])],
    Latvia: [2, 1, H(2, 1, ["#9E3039", "#FFFFFF", "#9E3039"], [2, 1, 2])],
    Mauritius: [3, 2, H(3, 2, ["#EA2839", "#1A206D", "#FFD500", "#00A551"])],
    Thailand: [3, 2, H(3, 2, ["#A51931", "#F4F5F8", "#2D2A4A", "#F4F5F8", "#A51931"], [1, 1, 2, 1, 1])],
    Botswana: [3, 2, H(3, 2, ["#75AADB", "#FFFFFF", "#000000", "#FFFFFF", "#75AADB"], [9, 1, 4, 1, 9])],
    France: [3, 2, V(3, 2, ["#000091", "#FFFFFF", "#E1000F"])],
    Italy: [3, 2, V(3, 2, ["#009246", "#FFFFFF", "#CE2B37"])],
    Ireland: [2, 1, V(2, 1, ["#169B62", "#FFFFFF", "#FF883E"])],
    "Ivory Coast": [3, 2, V(3, 2, ["#F77F00", "#FFFFFF", "#009E60"])],
    Belgium: [15, 13, V(15, 13, ["#000000", "#FAE042", "#ED2939"])],
    Mali: [3, 2, V(3, 2, ["#14B53A", "#FCD116", "#CE1126"])],
    Guinea: [3, 2, V(3, 2, ["#CE1126", "#FCD116", "#009460"])],
    Nigeria: [2, 1, V(2, 1, ["#008751", "#FFFFFF", "#008751"])],
    Peru: [3, 2, V(3, 2, ["#D91023", "#FFFFFF", "#D91023"])],
    Denmark: nordic([12, 4, 21], [12, 4, 12], "#C8102E", "#FFFFFF"),
    Sweden: nordic([5, 2, 9], [4, 2, 4], "#006AA7", "#FECC00"),
    Finland: nordic([5, 3, 10], [4, 3, 4], "#FFFFFF", "#002F6C"),
    Norway: nordic([6, 4, 12], [6, 4, 6], "#BA0C2F", "#FFFFFF", "#00205B", [7, 2], [7, 2]),
    Iceland: nordic([7, 4, 14], [7, 4, 7], "#02529C", "#FFFFFF", "#DC1E35", [8, 2], [8, 2]),
    Japan: [3, 2, rect(0, 0, 3, 2, "#FFFFFF") + circ(1.5, 1, 0.6, "#BC002D")],
    Bangladesh: [10, 6, rect(0, 0, 10, 6, "#006A4E") + circ(4.5, 3, 2, "#F42A41")],
    Palau: [8, 5, rect(0, 0, 8, 5, "#4AADD6") + circ(3.5, 2.5, 1.5, "#FFDE00")],
    Laos: [3, 2, H(3, 2, ["#CE1126", "#002868", "#CE1126"], [1, 2, 1]) + circ(1.5, 1, 0.4, "#FFFFFF")],
    Switzerland: [32, 32, rect(0, 0, 32, 32, "#DA291C") + rect(13, 6, 6, 20, "#FFFFFF") + rect(6, 13, 20, 6, "#FFFFFF")],
    Benin: [3, 2, rect(0, 0, 3, 1, "#FCD116") + rect(0, 1, 3, 1, "#E8112D") + rect(0, 0, 1.2, 2, "#008751")],
    Madagascar: [3, 2, rect(0, 0, 3, 1, "#FC3D32") + rect(0, 1, 3, 1, "#007E3A") + rect(0, 0, 1, 2, "#FFFFFF")],
    "Czech Republic": [3, 2, rect(0, 0, 3, 1, "#FFFFFF") + rect(0, 1, 3, 1, "#D7141A") + poly([[0, 0], [1.5, 1], [0, 2]], "#11457E")],
    Jamaica: [2, 1, rect(0, 0, 2, 1, "#009B3A") + poly([[0, 0], [1, 0.5], [0, 1]], "#000000") + poly([[2, 0], [1, 0.5], [2, 1]], "#000000") +
      `<path d="M0,0 L2,1 M2,0 L0,1" stroke="#FED100" stroke-width="0.16"/>`],
    Bahamas: [2, 1, H(2, 1, ["#00778B", "#FFC72C", "#00778B"]) + poly([[0, 0], [0.866, 0.5], [0, 1]], "#000000")],
    Sudan: [2, 1, H(2, 1, ["#D21034", "#FFFFFF", "#000000"]) + poly([[0, 0], [0.667, 0.5], [0, 1]], "#007229")],
    "United Arab Emirates": [2, 1, H(2, 1, ["#00732F", "#FFFFFF", "#000000"]) + rect(0, 0, 0.5, 1, "#FF0000")],
    Kuwait: [2, 1, H(2, 1, ["#007A3D", "#FFFFFF", "#CE1126"]) + poly([[0, 0], [0.5, 0.333], [0.5, 0.667], [0, 1]], "#000000")],
    Tonga: [2, 1, rect(0, 0, 2, 1, "#C10000") + rect(0, 0, 0.8, 0.5, "#FFFFFF") + rect(0.34, 0.08, 0.12, 0.34, "#C10000") + rect(0.23, 0.19, 0.34, 0.12, "#C10000")],
    Samoa: [2, 1, rect(0, 0, 2, 1, "#CE1126") + rect(0, 0, 1, 0.5, "#002B7F") +
      star(0.5, 0.1, 0.065, "#fff") + star(0.33, 0.24, 0.065, "#fff") + star(0.66, 0.2, 0.065, "#fff") + star(0.5, 0.4, 0.08, "#fff") + star(0.59, 0.3, 0.04, "#fff")],
    England: [5, 3, rect(0, 0, 5, 3, "#FFFFFF") + rect(2.2, 0, 0.6, 3, "#CE1124") + rect(0, 1.2, 5, 0.6, "#CE1124")],
    Scotland: [5, 3, rect(0, 0, 5, 3, "#005EB8") + `<path d="M0,0 L5,3 M5,0 L0,3" stroke="#FFFFFF" stroke-width="0.6"/>`],
    Georgia: [3, 2, rect(0, 0, 3, 2, "#FFFFFF") + rect(1.3, 0, 0.4, 2, "#FF0000") + rect(0, 0.8, 3, 0.4, "#FF0000") +
      [[0.65, 0.4], [2.35, 0.4], [0.65, 1.6], [2.35, 1.6]].map(([x, y]) => rect(x - 0.05, y - 0.22, 0.1, 0.44, "#FF0000") + rect(x - 0.22, y - 0.05, 0.44, 0.1, "#FF0000")).join("")],
    Chile: [3, 2, rect(0, 0, 3, 1, "#FFFFFF") + rect(0, 1, 3, 1, "#D52B1E") + rect(0, 0, 1, 1, "#0039A6") + star(0.5, 0.5, 0.25, "#FFFFFF")],
    Vietnam: [3, 2, rect(0, 0, 3, 2, "#DA251D") + star(1.5, 1.04, 0.6, "#FFFF00")],
    Somalia: [3, 2, rect(0, 0, 3, 2, "#4189DD") + star(1.5, 1.03, 0.5, "#FFFFFF")],
  };
  // look-alikes to use as wrong options when the round shows choices
  const names = Object.keys(F);

  function svg(name) {
    const [w, h, body] = F[name];
    return `<svg class="flag" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Flag">${body}</svg>`;
  }
  // as bank-style items so the pub quiz can treat them like any question
  const items = names.map((n) => ({
    id: "flag-" + n.toLowerCase().replace(/\s+/g, "-"), c: "flag", q: "Which country's flag is this?", flag: n, a: n,
    w: names.filter((m) => m !== n).slice(0, 3),
    x: { "Ivory Coast": ["Côte d'Ivoire", "Cote d'Ivoire"], "United Arab Emirates": ["UAE", "Emirates"], "Czech Republic": ["Czechia", "Czech"], Netherlands: ["Holland"] }[n] || [],
  }));
  return { svg, names, items };
})();
