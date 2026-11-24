"use strict";
// Effets des sorts (v2.a3.7) — LOGIQUE PURE (aucun DOM, aucun S) : testée par scripts/tests/effects.test.js (mod() et away()).
// Chaque sort a une valeur « base » et une valeur « spécialité » (CONCEPTION_SORTS.md §11). Le facteur f d'un sort vaut :
//   1 = école choisie · 0,5 = seconde école (double spé, rang 5) · 0 = autre école ; valeur = base + (spécialité − base) × f.
// Règle Q7 : AUCUN plafond global de cumul, mais un effet ne se cumule JAMAIS avec lui-même (un lancer pendant son effet RAFRAÎCHIT son minuteur).
const FxLib = (() => {
  const L = (a, b, f) => a + (b - a) * f;
  const sf = (sp, k) => sp && sp.school === k ? 1 : sp && sp.school2 === k ? .5 : 0;
  // ---- Passifs équipés → liste de modificateurs [clé, op, valeur] (op : « * » multiplie · « + » ajoute · « = » plancher). ctx = { lvl: niveau appris d'Abjuration, paliers: CPS_PALIERS, cpsG: limite de base du Grimoire }
  const PM = {
    enc1: f => [["sgCost", "*", L(.9, .85, f)], ["ethCost", "*", L(1, .85, f)]],
    enc2: f => [["scribe", "*", L(1.15, 1.25, f)]],
    enc4: f => [["sg", "*", L(1.2, 1.3, f)]],
    ill1: f => [["rare", "*", L(1.05, 1.12, f)]],
    ill3: f => [["buffDur", "+", L(5, 8, f)]],
    nec1: f => [["sg", "*", L(1.03, 1.10, f)]],
    nec2: f => [["ghost", "+", L(.02, .04, f)]],                                  // part des pages/s des Lutins (plancher 0,5 page/s dans calc)
    nec4: f => [["redX", "+", L(2, 3, f)]],
    abj1: (f, c) => { const p = c.paliers[Math.min(2, Math.ceil(c.lvl / 2))] + L(0, 2, f); return [["cps", "=", p], ["cpsG", "=", Math.max(c.cpsG, c.paliers[Math.min(2, Math.ceil(c.lvl / 2))]) + L(0, 2, f)]]; },
    abj2: f => [["offlineCap", "+", L(2, 4, f)]],
    abj4: f => [["cd", "*", L(.85, .78, f)]],
    div2: f => [["offlineSg", "*", L(1.2, 1.3, f)], ["offlineEth", "*", L(1.2, 1.3, f)], ["fragOff", "*", L(1.2, 1.3, f)]],
    div4: f => [["study", "*", L(.75, .65, f)]],
    tra1: f => [["frag", "*", 1.15], ["burn", "+", L(.2, .1, f)]],                // brûle une part de la Sagesse produite → Éther ×20 (en ligne ET hors ligne)
    tra4: f => [["ether", "*", L(1.25, 1.35, f)], ["scribe", "*", L(1.25, 1.35, f)], ["frag", "*", L(1.25, 1.35, f)], ["bldG", "*", L(1, 1.35, f)]],
    con1: f => [["ethCost", "*", L(.95, .92, f)], ["sgCost", "*", L(.95, .92, f)]],
    con2: f => [["famil", "+", Math.floor(L(1, 2, f))]]
  };
  const pm = (id, f, ctx) => PM[id] ? PM[id](f, ctx || { lvl: 1, paliers: [5, 10, 15], cpsG: 10 }) : [];
  // ---- Actifs (et paramètres d'evo4) : valeurs à l'instant du lancer
  const ACT = {
    evo1: f => ({ cd: L(20, 15, f), imp: L(10, 15, f), crit: f > 0 }),           // spé : « suit le critique » (espérance de critique de la Boussole)
    evo2: f => ({ cd: 60, secs: L(30, 45, f), clicks: L(20, 30, f) }),
    evo3: f => ({ cd: L(90, 70, f), dur: L(10, 14, f), imp: L(10, 14, f) }),
    evo4: f => ({ every: Math.round(L(100, 70, f)), dur: L(15, 20, f) }),
    enc3: f => ({ cd: L(120, 95, f), dur: L(30, 40, f) }),
    ill2: f => ({ cd: 45, mult: L(5, 7, f), charges: Math.floor(L(1, 2, f)) }),
    ill4: (f, c) => ({ cd: 180, mult: L(12, 15, f), dur: (8 + ((c && c.buffDur) || 0)) * L(1, 1.5, f) }),
    nec3: f => ({ cd: 300, frac: L(.1, .05, f), ratio: 20 }),
    abj3: f => ({ cd: L(60, 40, f), immune: L(0, 5, f) }),
    div3: f => ({ cd: L(150, 120, f), pages: Math.round(L(5, 7, f)) }),
    tra2: f => ({ cd: 90, mult: L(3, 4, f), dur: L(30, 40, f) }),
    tra3: f => ({ cd: L(120, 95, f), mult: 5, dur: L(15, 20, f) }),
    con3: f => ({ cd: L(240, 190, f), n: Math.floor(L(1, 2, f)) }),
    con4: f => ({ cd: 300, mult: 3, dur: L(10, 14, f) })
  };
  const act = (id, f, c) => ACT[id] ? ACT[id](f, c) : {};
  const cdOf = (id, base, f) => ACT[id] ? ACT[id](f).cd : base;
  const augure = f => Math.max(1, Math.floor(L(1, 2, f)));                       // div1 : nombre de pages annoncées
  // ---- Évaluation : passifs + effets temporaires encore actifs (fxs = [{m, u, tag}])
  const ap = (r, m) => m[1] === "*" ? r * m[2] : m[1] === "+" ? r + m[2] : Math.max(r, m[2]);
  const mod = (ml, fxs, now, k, d) => { let r = d; for (const m of ml) if (m[0] === k) r = ap(r, m); for (const e of fxs) if (e.u > now) for (const m of e.m) if (m[0] === k) r = ap(r, m); return r; };
  // Ajoute un effet temporaire ; s'il est déjà actif (même tag), on RAFRAÎCHIT son minuteur au lieu de l'empiler (evo4 « se cumulait avec lui-même »).
  const addFx = (fxs, m, secs, now, tag) => {
    if (tag) { const e = fxs.find(x => x.tag === tag && x.u > now); if (e) { e.u = Math.max(e.u, now + secs * 1e3); e.m = m; return e; } }
    const e = { m, u: now + secs * 1e3, tag }; fxs.push(e); return e;
  };
  // ---- Hors ligne (une tranche) : M(clé, défaut) lit les modificateurs ; c = calc() (ethPS, sgPS). Renvoie les gains et le temps retenu (plafonné par offlineCap en heures).
  const awayRaw = (c, sec, M) => {                                       // une tranche de `sec` secondes, SANS plafond (le plafond est appliqué par l'appelant)
    sec = Math.max(0, sec);
    const e0 = c.ethPS * sec * M("offlineEth", 1), s0 = c.sgPS * sec * M("offlineSg", 1), burn = Math.min(s0, s0 * Math.min(1, M("burn", 0)));
    return { sec, eth: e0 + burn * 20, sg: s0 - burn, burn, micro: sec * M("fragOff", 1) };
  };
  const away = (c, sec, M) => awayRaw(c, Math.min(sec, M("offlineCap", 8) * 3600), M);
  // ---- Préparation hors ligne (§16) : un sort qui agit hors ligne et vient d'être équipé n'est « chargé » qu'après un délai, mesuré entre son DERNIER changement et le départ.
  // ★ RÉGLAGE : 0–3 min → 60 min · 3–5 → 20 · 5–10 → 8 · 10–15 → 3 · 15 min et + → 0. Le délai ne coupe QUE les gains du sort changé, et il est plafonné par la durée d'absence (pas de dette).
  const loadDelay = agoMs => agoMs < 180e3 ? 3600 : agoMs < 300e3 ? 1200 : agoMs < 600e3 ? 480 : agoMs < 900e3 ? 180 : 0;
  // Somme par tranches : `loads` = [{id, delay (s)}] ; `slice(excludedIds, lenSec)` renvoie un objet de nombres ; un sort est exclu tant que le temps écoulé < son délai.
  const awaySlices = (total, loads, slice) => {
    total = Math.max(0, total); const cuts = [...new Set(loads.map(l => Math.min(l.delay, total)).filter(d => d > 0 && d < total))].sort((a, b) => a - b), out = {};
    [0, ...cuts].forEach((t0, i, all) => { const t1 = i + 1 < all.length ? all[i + 1] : total, r = slice(loads.filter(l => l.delay > t0).map(l => l.id), t1 - t0); for (const k in r) out[k] = (out[k] || 0) + r[k]; });
    return out;
  };
  // ---- Activation des sorts d'achat (§17) : enc1 et con1 restent INACTIFS après leur équipement (10 min ; 5 min en spécialité). Retirés puis remis : on repart de zéro.
  const ACTIV = { enc1: [600, 300], con1: [600, 300] };
  const activ = (id, f) => ACTIV[id] ? L(ACTIV[id][0], ACTIV[id][1], f) : 0;
  // ---- Surchauffe, OPTION A (§5.1) : capacité réduite selon la limite de clics/s. Chaque clic = +10 de chaleur, la chaleur retombe de (limite × 10)/s, surchauffe dès que la chaleur atteint la CAPACITÉ.
  // ★ RÉGLAGE : [limite minimale, capacité] — limite 5 → 100 (inchangé pour les joueurs normaux) · 10 → 70 · 15 → 50 (une limite de 12 en spécialité = palier 10).
  // OPTION B (gardée en commentaire, §5.1) : gain croissant, chaleur += 10 × (cps réels / limite) par clic ; pénalise les rafales, mais coûteux sur vieux téléphones si mal optimisé.
  const CAP = [[15, 50], [10, 70], [0, 100]];
  const cap = limit => { for (const [l, c] of CAP) if (limit >= l) return c; return 100; };
  const slotKey = code => { const m = /^Digit(\d)$/.exec(code || ""); if (!m) return null; const d = +m[1]; return d >= 1 && d <= 5 ? { p: "V", i: d - 1 } : d >= 6 ? { p: "G", i: d - 6 } : d === 0 ? { p: "G", i: 4 } : null; };   // Voile 1-5, Grimoire 6-9 puis 0 (event.code : AZERTY et QWERTY)
  return { L, sf, cap, CAP, slotKey, awayRaw, loadDelay, awaySlices, activ, PM: pm, ACT: act, cdOf, augure, mod, addFx, away, ap };
})();
const Fx = FxLib;
if (typeof module !== "undefined") module.exports = FxLib;
