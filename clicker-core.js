"use strict";
// Core : state, formats, boucle, Voile (surchauffe), Grimoire (gacha), hors-ligne, sauvegarde locale.
const KEY = "coffre-clicker", $ = id => document.getElementById(id), M = (k, d) => Spells.mod(k, d);
const U = ["nL","µL","mL","L","kL","ML","GL","TL","PL","EL"], SF = ["","K","M","B","T","Qa","Qi"];
const fE = v => { if (v < 1e3) return v.toFixed(v < 10 ? 2 : 1) + " nL"; const i = Math.min(Math.floor(Math.log10(v) / 3), 9), x = v / 1e3 ** i; return x.toFixed(x < 10 ? 2 : x < 100 ? 1 : 0) + " " + U[i]; };
const fN = v => { if (v < 1e3) return v < 10 ? v.toFixed(1) : Math.floor(v) + ""; const i = Math.min(Math.floor(Math.log10(v) / 3), 6); return (v / 1e3 ** i).toFixed(2) + SF[i]; };

let S = { eth: 0, sg: 0, b: {}, seen: Date.now() };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
const save = () => { S.seen = Date.now(); localStorage.setItem(KEY, JSON.stringify(S)); };

// ---- Fragments de clés : EFFORT ACTIF uniquement (clic/sort < 10 s). 5 min d'effort = 1 fragment (5 fragments = 1 clé du Coffre).
// 10-15 min tryhard ≈ 2-3 fragments · plafond 9/jour (≈ 1,8 clé) · le farm idle ne donne rien. `fr.earned` est cumulatif : le Coffre
// réclame (earned − déjà réclamé), donc jamais de doublon même avec plusieurs appareils.
const FR_SEC = 300, FR_DAY = 9;
const dayKey = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
function fragTick(dt) {
  const f = S.fr || (S.fr = { earned: 0, eff: 0, day: "", today: 0 }), d = dayKey();
  if (f.day !== d) { f.day = d; f.today = 0; }
  if (f.today < FR_DAY && Spells.active()) {
    f.eff += dt;
    if (f.eff >= FR_SEC) {
      f.eff -= FR_SEC; f.earned++; f.today++; sfx("gold"); save(); cloudSave(true);
      toast("✦ Fragment de clé obtenu — envoyé au Coffre (" + f.today + "/" + FR_DAY + " aujourd'hui)");
    }
  }
  const r = Math.ceil(FR_SEC - f.eff);
  $("fr").textContent = f.today + " / " + FR_DAY;
  $("frs").textContent = f.today >= FR_DAY ? "Quota du jour atteint" : "Prochain : " + Math.floor(r / 60) + ":" + String(r % 60).padStart(2, "0") + " d'effort";
}

// ---- Cloud (Firebase injecté par clicker.html) : champ `clicker` du doc players/{uid}, écriture différée ≥ 30 s, jamais par tick.
const mergeFr = (a, b) => { const t = (b.day || "") > (a.day || "") || ((b.day || "") === (a.day || "") && (b.today || 0) > (a.today || 0)) ? b : a;
  return { earned: Math.max(a.earned || 0, b.earned || 0), eff: t.eff || 0, day: t.day || "", today: t.today || 0 }; };
let cloudT = 0;
async function cloudSave(force) {
  const u = window.auth && window.auth.currentUser, n = Date.now(); if (!u || (!force && n - cloudT < 3e4)) return; cloudT = n;
  try { await window.setDoc(window.doc(window.db, "players", u.uid), { clicker: { json: JSON.stringify(S), earned: (S.fr && S.fr.earned) || 0, ts: n } }, { merge: true }); }
  catch (e) { console.warn("cloudSave", e); }
}
async function cloudLoad(u) {
  try {
    const snap = await window.getDoc(window.doc(window.db, "players", u.uid)), c = snap.exists() ? snap.data().clicker : null;
    if (c && c.json) {
      const R = JSON.parse(c.json), fr = mergeFr(S.fr || {}, R.fr || {});
      if ((R.seen || 0) > (S.seen || 0)) { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, R); Spells.init(); }
      S.fr = fr; if (!(S.g && S.g.need > 0)) { S.g = { n: 0, t: "norm", need: 0, got: 0 }; nextPage(false); }
      save(); toast("☁ Progression synchronisée");
    }
    cloudSave(true);
  } catch (e) { console.warn("cloudLoad", e); }
}

let heat = 0, hot = 0, last = Date.now(), ac, tt;
const PG = { red: { p: .05, x: 4, d: 10, n: "Page Nécrotique" }, gold: { p: .01, x: 12, d: 8, n: "Page Dorée" } };

// Audio (Web Audio) : [freq, type, durée, volume]
const noise = (c, d) => { const b = c.createBuffer(1, c.sampleRate * d, c.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; };
const rumble = (c, n, v, d) => {                       // grondement sourd
  const o = c.createOscillator(), l = c.createBiquadFilter(), g = c.createGain(); o.type = "sawtooth"; l.type = "lowpass"; l.frequency.value = 160;
  o.frequency.setValueAtTime(70, n); o.frequency.exponentialRampToValueAtTime(38, n + d); g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d);
  o.connect(l); l.connect(g); g.connect(c.destination); o.start(n); o.stop(n + d);
};
const zap = (c, n) => {                                // décharge électrique cristalline + sourd
  [[2200 + Math.random() * 600, .035], [3400 + Math.random() * 800, .02]].forEach(([f, v]) => {
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(f, n); o.frequency.exponentialRampToValueAtTime(f / 2, n + .12);
    g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + .14); o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + .15);
  });
  const s = noise(c, .06), h = c.createBiquadFilter(), g = c.createGain(); h.type = "highpass"; h.frequency.value = 5000;
  g.gain.setValueAtTime(.05, n); g.gain.exponentialRampToValueAtTime(.001, n + .06); s.connect(h); h.connect(g); g.connect(c.destination); s.start(n);
  rumble(c, n, .07, .22);
};
const paper = (c, n, v, f, d) => {                     // papier feutré : bruit filtré en bande, attaque douce
  const s = noise(c, d), b = c.createBiquadFilter(), g = c.createGain(); b.type = "bandpass"; b.Q.value = .9;
  b.frequency.setValueAtTime(f, n); b.frequency.exponentialRampToValueAtTime(f * 1.8, n + d);
  g.gain.setValueAtTime(.0001, n); g.gain.exponentialRampToValueAtTime(v, n + d * .25); g.gain.exponentialRampToValueAtTime(.0001, n + d);
  s.connect(b); b.connect(g); g.connect(c.destination); s.start(n);
};
const bell = (c, n, f, v, d) => [1, 2.76, 4.07].forEach((m, i) => {   // carillon de cristal : partiels inharmoniques
  const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = f * m;
  g.gain.setValueAtTime(v / (i + 1), n); g.gain.exponentialRampToValueAtTime(.0005, n + d / (i + 1)); o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + d);
});
const choir = (c, n, fs, v, d, lp) => fs.forEach(f => [-6, 6].forEach(dt => {   // chœur harmonique : voix désaccordées, nappe lente
  const o = c.createOscillator(), l = c.createBiquadFilter(), g = c.createGain(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = dt; l.type = "lowpass"; l.frequency.value = lp;
  g.gain.setValueAtTime(.0001, n); g.gain.linearRampToValueAtTime(v, n + d * .3); g.gain.exponentialRampToValueAtTime(.0005, n + d);
  o.connect(l); l.connect(g); g.connect(c.destination); o.start(n); o.stop(n + d);
}));
const sfx = (t, m = 1) => { try {
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  const T0 = ac.currentTime;
  if (t === "zap") return zap(ac, T0); if (t === "rumble") return rumble(ac, T0, .12, .6);
  if (t === "paper") return paper(ac, T0, .05, 2200, .09);
  if (t === "turn") { paper(ac, T0, .09, 900, .5); return bell(ac, T0 + .25, 1568, .05, 1.2); }
  if (t === "chime") return bell(ac, T0, 1318 * m, .05, .9);
  if (t === "gold") { choir(ac, T0, [261.6, 392, 523.3, 659.3, 784], .03, 2.2, 2400); return bell(ac, T0 + .1, 2093, .06, 1.6); }
  if (t === "red") { choir(ac, T0, [98, 116.5, 146.8, 196], .045, 2.4, 700); return rumble(ac, T0, .08, 1.4); }
  const [f, ty, d, v] = { chime: [1320, "sine", .25, .05], gold: [1760, "triangle", .9, .08], red: [220, "triangle", .6, .08], deny: [110, "square", .12, .04] }[t];
  const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime;
  o.type = ty; o.frequency.setValueAtTime(f, n); if (t === "zap") o.frequency.exponentialRampToValueAtTime(f / 4, n + d);
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d);
  o.connect(g); g.connect(ac.destination); o.start(n); o.stop(n + d);
} catch (e) {} };

const toast = m => { const t = $("toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 3500); };
const fl = (e, txt, col) => {
  const p = e.currentTarget.closest(".pane"), r = p.getBoundingClientRect(), s = document.createElement("span");
  s.className = "fl"; s.textContent = txt; s.style.cssText = "left:" + (e.clientX - r.left || r.width / 2) + "px;top:" + (e.clientY - r.top || 150) + "px;color:" + col;
  p.append(s); setTimeout(() => s.remove(), 900);
};

let nx = Math.random();                                // tirage de la prochaine page (Augure l'affiche)
const kk = c => Math.min(10, c.rare * M("rare", 1)), typ = (r, c) => { const k = kk(c); return r < PG.gold.p * k ? "gold" : r < (PG.gold.p + PG.red.p) * k ? "red" : null; };
const px = k => k === "red" ? M("redX", 4) : PG[k].x;
const pageX = () => S.g && S.g.t !== "norm" ? px(S.g.t) : 1;       // ×Sagesse tant que la page spéciale est en lecture

// Pages = paliers de lecture : la Sagesse gagnée remplit la jauge ; page pleine → page suivante tirée (normale/spéciale).
// Pool = 3 + (flux Sg + 3 clics/s) × T, T = 2 s (début) → 12 s (≈ page 25). Page spéciale : pool × multiplicateur × durée.
function nextPage(user) {
  const c = Passives.calc(), G = S.g, r = nx; nx = Math.random();
  const t = Spells.force() ? (r < .2 ? "gold" : "red") : typ(r, c);
  const T = Math.min(12, 2 + .4 * G.n), farm = c.sgPS + 3 * c.pageClick;
  let need = 3 + farm * T; if (t) need *= px(t) * (1 + M("buffDur", 0) / 20);
  G.t = t || "norm"; G.need = need; G.got = 0;
  if (t && user) sfx(t);                               // son UNIQUEMENT si le joueur est à l'origine
}
function gainSg(a, user) {
  S.sg += a; const G = S.g; G.got += a; let k = 0;
  while (G.got >= G.need && k++ < 50) { const left = G.got - G.need; G.n++; nextPage(user); G.got = left; }
  if (k >= 50) G.got = 0; if (k) turnPage(user);
}

// ---- Voile d'Éther : filet SVG suspendu · ondes élastiques au clic (ripple) · curseur Orbe de Focalisation ----
const VC = 15, VR = 10, VP = [], RP = [], NS = "http://www.w3.org/2000/svg";
const RM = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function pos(p, t) {                                   // position d'un nœud : affaissement + balancement + ondes
  const w = p.j / (VR - 1); let x = p.x, y = p.y + 18 * w * (1 - ((p.x - 160) / 146) ** 2);
  if (!RM) { x += Math.sin(t * .0007 + p.j * .6) * 2.2 * w; y += Math.sin(t * .0009 + p.i * .5) * 1.6 * w; }
  for (const r of RP) {
    const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy) || 1, a = (t - r.t) / 1e3;
    const k = Math.sin(d * .09 - a * 9) * Math.exp(-a * 1.8) * Math.exp(-d / 90) * r.s * (RM ? .3 : 1) * 16 * (.35 + .65 * w);
    x += dx / d * k; y += dy / d * k;
  }
  return [x, y];
}
function ripple(e, s = 1) {                            // impact en coordonnées du viewBox 320×240 (global : réutilisable par les sorts)
  const r = $("veilSvg").getBoundingClientRect(), sc = Math.min(r.width / 320, r.height / 240), ok = e && e.clientX;
  RP.push({ x: ok ? (e.clientX - r.left - (r.width - 320 * sc) / 2) / sc : 160, y: ok ? (e.clientY - r.top - (r.height - 240 * sc) / 2) / sc : 120, t: performance.now(), s });
  if (RP.length > 8) RP.shift();
}
function initVeil() {
  const net = $("vNet"), kn = $("vKnots"), st = $("vStars"), mk = (par, tag) => { const e = document.createElementNS(NS, tag); par.append(e); return e; };
  for (let k = 0; k < 44; k++) { const c = mk(st, "circle"); c.setAttribute("cx", Math.random() * 320); c.setAttribute("cy", Math.random() * 240); c.setAttribute("r", .4 + Math.random() * .8); c.setAttribute("class", "vs"); c.style.animationDelay = -Math.random() * 3 + "s"; }
  for (let j = 0; j < VR; j++) for (let i = 0; i < VC; i++) VP.push({ i, j, x: 14 + i * 292 / (VC - 1), y: 22 + j * 188 / (VR - 1) });
  const H = Array.from({ length: VR }, () => mk(net, "path")), V = Array.from({ length: VC }, () => mk(net, "path"));
  const K = VP.filter(p => p.i % 2 === 0 && p.j % 2 === 0 && p.j > 0).map(p => { const c = mk(kn, "circle"); c.setAttribute("r", 1.8); return [p, c]; });
  const f1 = n => n.toFixed(1), sm = a => { let d = "M" + f1(a[0][0]) + " " + f1(a[0][1]); for (let k = 1; k < a.length - 1; k++) d += "Q" + f1(a[k][0]) + " " + f1(a[k][1]) + " " + f1((a[k][0] + a[k + 1][0]) / 2) + " " + f1((a[k][1] + a[k + 1][1]) / 2); const z = a[a.length - 1]; return d + "L" + f1(z[0]) + " " + f1(z[1]); };
  const frame = t => {
    requestAnimationFrame(frame); if (document.hidden) return;
    while (RP.length && t - RP[0].t > 3500) RP.shift();
    const w = VP.map(p => pos(p, t));
    H.forEach((e, j) => e.setAttribute("d", sm(w.slice(j * VC, j * VC + VC))));
    V.forEach((e, i) => e.setAttribute("d", sm(Array.from({ length: VR }, (_, j) => w[j * VC + i]))));
    K.forEach(([p, c]) => { const q = w[p.j * VC + p.i]; c.setAttribute("cx", f1(q[0])); c.setAttribute("cy", f1(q[1])); });
  };
  requestAnimationFrame(frame);
}
function initCursor() {                                // l'Orbe suit la souris ; au tactile il apparaît au tap
  const oc = $("orbCur"), vl = $("orb"), mv = e => { oc.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; oc.classList.add("on"); };
  document.body.append(oc); vl.addEventListener("pointermove", mv); vl.addEventListener("pointerleave", () => oc.classList.remove("on"));
  vl.addEventListener("pointerdown", e => { mv(e); if (e.pointerType === "touch") setTimeout(() => oc.classList.remove("on"), 350); });
}

function clickV(e) {
  const n = Date.now(); if (n < hot) { sfx("deny"); ripple(e, .25); return; }      // voile rigide pendant la surchauffe
  heat += 10; const over = heat >= 100; if (over) hot = n + 3000;                  // surchauffe : 3 s de pause
  const m = Spells.onClick(), g = Passives.calc().clickV * M("click", 1) * m; S.eth += g;
  sfx(over ? "rumble" : "zap"); ripple(e, over ? 1.8 : m > 1 ? 1.5 : 1); fl(e, "+" + fE(g), "#a78bfa");
  if (m > 1) critFx(e, "ill", "CRITIQUE ×" + m);        // Image Miroir : glyphe d'Illusion
}
// ---- Grimoire : double page · glyphes révélés par la jauge · page 3D · runes envolées · pages Nécrotique/Dorée · curseur Plume ----
const GL = [], PTS = [[1, 3], [9, 3], [1, 8], [9, 8], [1, 13], [9, 13], [5, 1], [5, 15]];
let turning = 0, clkPt = null, lastN = -1;
const runeD = () => { let d = "M5 1V15"; for (let k = 0, n = 2 + (Math.random() * 2 | 0); k < n; k++) { const a = PTS[Math.random() * 8 | 0], b = PTS[Math.random() * 8 | 0]; if (a !== b) d += "M" + a + "L" + b; } return d; };
const paneXY = e => { const p = e.currentTarget.closest(".pane"), r = p.getBoundingClientRect(); return { p, x: e.clientX - r.left || r.width / 2, y: e.clientY - r.top || 150 }; };
function buildGlyphs() {                               // 2 pages × 7 lignes × 5 pseudo-runes, nouvelle page = nouvelles runes
  GL.length = 0;
  ["gL", "gR"].forEach(id => {
    const g = $(id); g.innerHTML = "<circle cx='50' cy='13' r='6' class='sg'/><path d='M44 13h12M50 7v12' class='sg'/>";
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      const p = document.createElementNS(NS, "path"); p.setAttribute("d", runeD()); p.setAttribute("class", "gl");
      p.setAttribute("transform", "translate(" + (12 + c * 17) + "," + (28 + r * 17) + ") scale(.85)"); g.append(p); GL.push(p);
    }
  });
}
const reveal = p => { const n = Math.floor(p * GL.length); if (n === lastN) return; lastN = n; GL.forEach((g, i) => g.classList.toggle("on", i < n)); };
function flyRunes(pt, c0) {
  const col = c0 || (S.g.t === "red" ? "#fb7185" : "#f5d98a");
  for (let i = 0; i < 9; i++) {
    const s = document.createElement("span"); s.className = "fr"; s.innerHTML = "<svg viewBox='0 0 10 16' width='12' height='19'><path d='" + runeD() + "'/></svg>";
    s.style.cssText = "left:" + pt.x + "px;top:" + pt.y + "px;color:" + col + ";--dx:" + (Math.random() - .5) * 150 + "px;--dy:" + (-40 - Math.random() * 90) + "px;--r:" + (Math.random() - .5) * 200 + "deg";
    pt.p.append(s); setTimeout(() => s.remove(), 1200);
  }
}
function turnPage(user) {                              // page lue : feuillet 3D + nouvelles runes ; son/runes seulement si le joueur est à l'origine
  const lf = $("leaf"); setTimeout(() => { buildGlyphs(); lastN = -1; }, 420);
  if (!turning) { turning = 1; lf.classList.add("turn"); setTimeout(() => { lf.classList.remove("turn"); turning = 0; }, 900); }
  if (user) { sfx("turn"); flyRunes(clkPt || { p: document.querySelector(".grimoire"), x: 160, y: 150 }); }
}
function initBook() {
  buildGlyphs(); const bk = $("tome"), qc = $("quillCur"); document.body.append(qc);
  for (let i = 0; i < 14; i++) { const p = document.createElement("i"); p.className = "gp"; p.style.cssText = "left:" + (12 + Math.random() * 76) + "%;animation-delay:" + -Math.random() * 3 + "s;--gx:" + (Math.random() - .5) * 40 + "px"; bk.append(p); }
  const mv = e => { qc.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; qc.classList.add("on"); };
  bk.addEventListener("pointermove", mv); bk.addEventListener("pointerleave", () => qc.classList.remove("on"));
  bk.addEventListener("pointerdown", e => { mv(e); if (e.pointerType === "touch") setTimeout(() => qc.classList.remove("on"), 350); });
}

// ---- UI-C : habillage visuel par école de magie (registre : Spells.glyph / Spells.hue) ----
// schoolFx(k, pane, sort) : glyphe d'école + teinte + effet signature (Voile : ondes ; Grimoire : runes) · critFx(e, k, txt) : coup critique.
function schoolFx(k, p, s) {
  const pane = document.querySelector(p === "V" ? ".voile" : ".grimoire"), el = document.createElement("div"), c = Spells.hue(k);
  el.className = "sfx"; el.style.setProperty("--c", c);
  let h = "<i class='sfx-t'></i><b class='sfx-g fx-" + k + "'>" + Spells.glyph(k, 96) + "</b>";
  if (k === "evo") {                                   // Évocation : éclair zigzaguant
    let d = "", x = 20 + Math.random() * 60; for (let i = 0; i <= 8; i++) d += (i ? "L" : "M") + (x + (Math.random() - .5) * 18).toFixed(1) + " " + i * 12.5;
    h += "<svg class='bolt' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='" + d + "'/></svg>";
  }
  el.innerHTML = h; pane.append(el); setTimeout(() => el.remove(), 1000);
  if (p === "V") { const r = $("veilSvg").getBoundingClientRect(); [0, 90, 180].forEach(t => setTimeout(() => ripple({ clientX: r.left + r.width * (.2 + Math.random() * .6), clientY: r.top + r.height * (.3 + Math.random() * .5) }, k === "evo" ? 1.6 : 1.1), t)); }
  else flyRunes({ p: pane, x: pane.clientWidth / 2, y: 150 }, c);
}
function critFx(e, k, txt) {
  const pt = paneXY(e), el = document.createElement("div");
  el.className = "crit"; el.style.cssText = "left:" + pt.x + "px;top:" + pt.y + "px;color:" + Spells.hue(k);
  el.innerHTML = Spells.glyph(k, 54) + "<b>" + txt + "</b>"; pt.p.append(el); setTimeout(() => el.remove(), 900);
}

function clickG(e) {
  const c = Passives.calc(), pt = S.g.t, g = c.pageClick * pageX() * M("sg", 1);
  Spells.touch(); clkPt = paneXY(e); gainSg(g, true); sfx("paper"); fl(e, "+" + fN(g) + " Sg", pt === "gold" ? "#d4af37" : pt === "red" ? "#e11d48" : "#f5d98a");
}

function away(sec) {                                   // hors-ligne : timestamps, plafond 8 h (extensible via sorts)
  sec = Math.min(sec, M("offlineCap", 8) * 3600);
  const c = Passives.calc(), e = c.ethPS * sec, s = c.sgPS * sec * M("offlineSg", 1);
  S.eth += e; S.sg += s; if (e + s > 0) toast("Absence : +" + fE(e) + " · +" + fN(s) + " Sg");
}

function tick() {
  const n = Date.now(), dt = (n - last) / 1e3; last = n;
  if (dt > 5) { away(dt); return; }                    // onglet endormi
  const c = Passives.calc(); S.eth += c.ethPS * dt;
  if (c.sgPS > 0) gainSg(c.sgPS * dt * pageX(), false);             // lecture automatique : silencieuse
  fragTick(dt);
  if (n < hot) heat = (hot - n) / 30; else { if (hot) { hot = 0; heat = 0; } heat = Math.max(0, heat - M("cps", 10) * 10 * dt); }

  $("eth").textContent = fE(S.eth); $("sg").textContent = fN(S.sg);
  $("ethps").textContent = "+" + fE(c.ethPS) + "/s"; $("sgps").textContent = "+" + fN(c.sgPS) + " Sg/s";
  $("heat").style.width = Math.min(100, heat) + "%"; $("heatBox").classList.toggle("hot", n < hot); $("orb").classList.toggle("hot", n < hot); document.body.classList.toggle("hot", n < hot);
  $("heatTxt").textContent = n < hot ? "Surchauffe — canalisation en pause" : "Canalisation stable";
  const G = S.g, pt = G.t;
  $("buff").textContent = "Page " + (G.n + 1) + (pt === "norm" ? "" : " · " + PG[pt].n + " ×" + px(pt));
  $("buff").className = "buff" + (pt === "norm" ? "" : " " + pt);
  $("pgFill").style.width = Math.min(100, G.got / G.need * 100) + "%"; $("pgbar").className = "pgbar " + pt;
  $("pgTxt").textContent = fN(G.got) + " / " + fN(G.need) + " Sg lues";
  const tm = $("tome"); tm.classList.toggle("red", pt === "red"); tm.classList.toggle("gold", pt === "gold"); reveal(Math.min(1, G.got / G.need));
  Spells.tick(dt, n);
  $("hintG").textContent = Spells.has("div1") ? "Augure : prochaine page " + ({ gold: "Dorée", red: "Nécrotique" }[Spells.forced() ? (nx < .2 ? "gold" : "red") : typ(nx, c)] || "commune") : "";
  Passives.update();
}

addEventListener("DOMContentLoaded", () => {
  const e = (Date.now() - S.seen) / 1e3; if (e > 10) away(e);
  Passives.build($("bV"), "V"); Passives.build($("bG"), "G"); Spells.init();
  S.g = S.g || { n: 0, t: "norm", need: 0, got: 0 }; if (!(S.g.need > 0)) nextPage(false);
  $("orb").onclick = clickV; $("tome").onclick = clickG; initVeil(); initCursor(); initBook();
  setInterval(tick, 100); setInterval(save, 5000); setInterval(() => !document.hidden && cloudSave(), 6e4);
  if (window.auth && window.onAuthStateChanged) window.onAuthStateChanged(window.auth, u => u && cloudLoad(u));
  addEventListener("pagehide", () => { save(); cloudSave(true); }); document.addEventListener("visibilitychange", () => { if (document.hidden) { save(); cloudSave(true); } });
  window.Clicker = { state: () => S, calc: Passives.calc, save, fE, fN };   // API pour spells / cloud (étapes suivantes)
});
