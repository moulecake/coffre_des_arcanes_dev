// Tests de fumée Node : clicker/progress.js (rangs, examens, migration spV, fusion cloud). Lancer : node scripts/tests/progress.test.js
const assert = require("assert"), P = require("../../clicker/progress.js");
let n = 0; const ok = (c, m) => { assert(c, m); n++; }, eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); n++; };
const ids = []; ["evo", "enc", "ill", "nec", "abj", "div", "tra", "con"].forEach(k => [1, 2, 3, 4].forEach(r => ids.push(k + r)));
const learnAll = (sp, upTo) => ids.filter(i => +i[3] <= upTo).forEach(i => { sp.learned[i] = 1; });
const oldState = () => ({ eth: 5e6, sg: 4e9, b: { anc: 12, lut: 7 }, g: { n: 900 }, fr: { earned: 30 }, seen: 1000, sp: { learned: Object.fromEntries(ids.map(i => [i, 1])), eq: { V: ["evo1"], G: ["enc2"] }, lock: {}, cd: {}, course: null, decks: [{ name: "x" }] }, st: { eth: 7e6 } });

// 1. Migration : seul S.sp est remis à zéro (§21.2)
let S = oldState(); ok(P.migrate(S) === true, "ancien état migré");
ok(S.spV === 2 && Object.keys(S.sp.learned).length === 0 && S.sp.rank === 1 && S.sp.decks.length === 0 && S.sp.eq.V.length === 0, "sp remis à zéro");
ok(S.eth === 5e6 && S.sg === 4e9 && S.b.anc === 12 && S.g.n === 900 && S.fr.earned === 30 && S.st.eth === 7e6, "bâtiments, Éther, Sagesse, pages, fragments, stats intacts");
ok(Array.isArray(S.pend) && Array.isArray(S.pdone), "pend/pdone créés");
S.sp.learned.evo1 = 1; ok(P.migrate(S) === false && S.sp.learned.evo1 === 1, "déjà migré : rien ne bouge");
const nu = {}; ok(P.migrate(nu) === true && nu.spV === 2, "compte neuf");
const half = { spV: 2, sp: { learned: { abj1: 1 } } }; P.migrate(half); ok(half.sp.rank === 1 && half.sp.tut.fill && half.sp.exDone, "sp incomplet complété sans perte");

// 2. Score : le terme sorts n'est compté que si les spV sont égaux (§21.3)
const L2 = { spV: 2, b: { anc: 5 }, sp: { learned: {} } }, R1 = { b: { anc: 5 }, sp: { learned: Object.fromEntries(ids.map(i => [i, 1])) } };
ok(P.score(R1, L2) === P.score(L2, R1), "spV différents : sorts ignorés des deux côtés");
ok(P.score(R1, { ...L2, spV: 1 }) > P.score({ ...L2, spV: 1 }, R1), "spV égaux : sorts comptés");
ok(P.score({ spV: 2, sp: { learned: {}, exDone: { 1: 5 } } }, { spV: 2, sp: { learned: {} } }) > 0, "examens validés comptent");

// 3. Les 4 cas du §21.7 : décision de base + fixSp
const fix = (L, R, foreign) => { const base = P.decide(L, R, foreign), S = base === "cloud" ? JSON.parse(JSON.stringify(R)) : JSON.parse(JSON.stringify(L)); const snap = foreign ? null : JSON.parse(JSON.stringify(L)); const ch = P.fixSp(S, snap, R); return { base, S, ch }; };
// a) local 0 sort spV2, cloud 32 sorts spV1 (cloud plus avancé en bâtiments) -> local gagne sp, le reste suit le cloud
let loc = { spV: 2, seen: 10, b: { anc: 1 }, sp: P.emptySp(), pend: [], pdone: [] }, cl = oldState(); cl.b = { anc: 50 };
let r = fix(loc, cl); ok(r.base === "cloud" && Object.keys(r.S.sp.learned).length === 0 && r.S.spV === 2 && r.S.b.anc === 50, "a) local gagne sp ; bâtiments du cloud conservés");
// a') cloud moins avancé -> local reste la base
cl.b = { anc: 0 }; cl.g = { n: 0 }; cl.fr = { earned: 0 }; r = fix(loc, cl); ok(r.base === "local" && Object.keys(r.S.sp.learned).length === 0 && r.S.spV === 2, "a') local base, sp local");
// b) inverse : local ancien (spV1, 32 sorts) / cloud spV2 (0 sort) -> le cloud gagne sp
loc = oldState(); loc.seen = 5; cl = { spV: 2, seen: 9, b: { anc: 1 }, sp: P.emptySp(), pend: [{ k: "exam:1", n: 1 }], pdone: [] };
r = fix(loc, cl); ok(Object.keys(r.S.sp.learned).length === 0 && r.S.spV === 2 && r.S.pend.length === 1 && r.ch === true, "b) cloud spV2 gagne sp même si le local a 32 sorts");
// c) mêmes versions : le plus avancé gagne (sorts comptés)
loc = { spV: 2, seen: 1, b: {}, sp: P.emptySp() }; loc.sp.learned.evo1 = 1; cl = { spV: 2, seen: 2, b: {}, sp: P.emptySp() };
r = fix(loc, cl); ok(r.base === "local" && r.S.sp.learned.evo1 === 1, "c) mêmes spV : l'état avec un sort appris gagne");
cl.sp.learned = { evo1: 1, enc1: 1 }; r = fix(loc, cl); ok(r.base === "cloud" && Object.keys(r.S.sp.learned).length === 2, "c') cloud plus avancé gagne");
// d) cloud sans spV (ancien client) et local migré : local garde son sp
loc = { spV: 2, seen: 3, b: { anc: 2 }, sp: P.emptySp() }; loc.sp.learned.abj1 = 1; cl = { seen: 99, b: { anc: 2 }, sp: { learned: Object.fromEntries(ids.map(i => [i, 1])) } };
r = fix(loc, cl); ok(Object.keys(r.S.sp.learned).join() === "abj1" && r.S.spV === 2, "d) cloud sans spV : l'apprentissage local est conservé");
// e) compte étranger : on repart d'un état neuf migré
const fresh = {}; P.migrate(fresh); r = fix(fresh, cl, true); ok(r.base === "cloud" || r.base === "reset", "e) étranger"); 
ok(P.decide(fresh, null, true) === "reset" && P.decide(loc, null, false) === "local", "e') sans sauvegarde cloud");

// 4. Célébrations : union sans résurrection
const pa = [{ k: "exam:1", n: 1 }], pb = [{ k: "exam:1", n: 1 }, { k: "exam:2", n: 2 }];
eq(P.mergePend(pa, pb).map(e => e.k), ["exam:1", "exam:2"], "union pend");
let SS = { pend: pb, pdone: ["exam:1"] }; eq(P.pending(SS).map(e => e.k), ["exam:2"], "pending = pend − pdone");
const other = { pend: pa, pdone: [] }; P.fixSp(SS, { ...SS, spV: 2, sp: P.emptySp() }, { ...other, spV: 2, sp: P.emptySp() }); SS.sp = SS.sp || P.emptySp();
ok(P.pending(SS).map(e => e.k).join() === "exam:2", "pdone fusionné : exam:1 ne ressuscite pas");
P.ack(SS, "exam:2"); ok(P.pending(SS).length === 0, "ack");

// 5. Rangs, emplacements, apprentissage
let sp = P.emptySp(); ok(P.slots(sp) === 1 && P.canLearn(sp, 1) && !P.canLearn(sp, 2), "rang 1 : 1 emplacement, rang 2 grisé");
sp.rank = 3; ok(P.slots(sp) === 3 && P.canLearn(sp, 3) && !P.canLearn(sp, 4), "rang 3");
sp.rank = 5; ok(P.slots(sp) === 5, "rang 5 : 5 emplacements"); sp.rank = 6; ok(P.slots(sp) === 5, "plafond 5 emplacements");
sp = P.emptySp(); sp.course = { id: "evo1", end: 1 }; ok(!P.canLearn(sp, 1), "un seul cours à la fois");
sp = P.emptySp(); sp.exam = { n: 1, end: 1 }; ok(!P.canLearn(sp, 1), "pas de cours pendant un examen");

// 6. Conditions et inscription
const st0 = { eth: 0, sg: 0 }, stOk = { eth: 1e6, sg: 1e3 };
sp = P.emptySp(); learnAll(sp, 1); sp.school = "evo"; ok(P.canExam(sp, st0, 1e9, 1).why === "conds", "examen 1 : conditions manquantes");
sp.tut.fill = { V0: 1, G0: 1 }; sp.tut.cast = 1; ok(P.canExam(sp, { eth: 999999, sg: 1e3 }, 1e9, 1).why === "conds", "Éther juste sous le seuil");
ok(P.canExam(sp, stOk, 1.9e6, 1).why === "poor", "Sagesse insuffisante pour les frais (2 M)");
ok(P.canExam(sp, stOk, 2e6, 1).ok === true, "examen 1 possible");
let sp2 = P.emptySp(); learnAll(sp2, 1); sp2.school = "evo"; delete sp2.learned.con1; sp2.tut.fill = { V0: 1, G0: 1 }; sp2.tut.cast = 1; ok(P.canExam(sp2, stOk, 1e9, 1).why === "spells", "7 sorts sur 8 : refusé");
ok(P.canExam(sp, stOk, 1e9, 2).why === "future" && P.canExam(sp, stOk, 1e9, 5).why === "sealed", "futur / scellé (examen 5)");
sp.exam = { n: 1, end: 9 }; ok(P.canExam(sp, stOk, 1e9, 1).why === "busy", "examen en cours");
eq(P.conds(P.emptySp(), st0, 5), [], "examen 5 sans conditions (scellé)");
sp = P.emptySp(); sp.rank = 2; learnAll(sp, 2); sp.tut.fill = { V0: 1, G0: 1, V1: 1, G1: 1 }; sp.tut.deck = 1;
ok(P.canExam(sp, { eth: 5e7, sg: 2e8 }, 8e7, 2).ok === true && P.canExam(sp, { eth: 5e7, sg: 2e8 - 1 }, 8e7, 2).why === "conds", "examen 2 : seuils 50 mL / 2·10⁸");
sp.tut.fill.G1 = 0; ok(P.canExam(sp, { eth: 5e7, sg: 2e8 }, 8e7, 2).why === "conds", "examen 2 : 4 emplacements requis");
sp = P.emptySp(); sp.rank = 3; learnAll(sp, 3); sp.tut.equip = 1; sp.tut.castIds = { a: 1, b: 1 };
ok(P.canExam(sp, { eth: 3e8, sg: 2e9 }, 8e8, 3).why === "conds", "examen 3 : 3 sorts actifs différents"); sp.tut.castIds.c = 1; ok(P.canExam(sp, { eth: 3e8, sg: 2e9 }, 8e8, 3).ok, "examen 3 possible");

// 7. Déroulement : inscription, fin hors ligne, célébration, rang + emplacement
S = { spV: 2, sp: P.emptySp(), pend: [], pdone: [] }; P.startExam(S.sp, 1000, 1);
ok(S.sp.exam.end === 1000 + P.EX.dur[0] * 1e3, "durée examen 1 = EX.dur[0]");
ok(P.finishExam(S, 1000 + P.EX.dur[0] * 1e3 - 1e3) === 0 && S.sp.rank === 1, "pas fini");
ok(P.finishExam(S, 9e9) === 1 && S.sp.rank === 2 && S.sp.exam === null && S.sp.exDone[1] === 1000 + P.EX.dur[0] * 1e3, "fini hors ligne : rang 2");
eq(P.pending(S).map(e => e.k), ["exam:1:2"], "célébration en attente (clé = examen + version d'apprentissage)"); ok(P.slots(S.sp) === 2, "2 emplacements");
ok(P.finishExam(S, 9e9) === 0 && S.pend.length === 1, "idempotent");

// 8. Prix et temps
ok(P.COST.join() === "200000,8000000,80000000,300000000" && P.TIME.join() === "30,300,1800,10800", "table de prix §3.4");
ok(P.EX.price.slice(0, 4).join() === "2000000,80000000,800000000,3000000000" && P.EX.durOrig.slice(0, 4).join() === "120,1200,7200,28800" && P.EX.dur.length === 5, "examens §3.4 (durées d'origine ; EX.dur = 1 min en test ; le 5 = valeurs provisoires)");
console.log("progress.test.js : " + n + " vérifications OK");

// ===== v2.a3.7 : spécialité, réinitialisation (spV incrémenté), proposition aux joueurs rang ≥ 2 =====
{
  let m = 0; const ok2 = (c, msg) => { assert(c, msg); n++; m++; };
  // école : choix définitif, −25 % prix/temps de son école seulement
  let sp = P.emptySp(); ok2(sp.school === null && P.chooseSchool(sp, "abj", 5) === true && sp.school === "abj" && sp.schoolAt === 5, "choix d'école");
  ok2(P.chooseSchool(sp, "evo", 6) === false && sp.school === "abj", "choix définitif"); ok2(P.chooseSchool(P.emptySp(), "xxx", 1) === false, "école inconnue refusée");
  ok2(P.schoolMul(sp, "abj") === .75 && P.schoolMul(sp, "evo") === 1 && P.schoolMul({ school: "abj", school2: "evo" }, "evo") === .875, "−25 % (−12,5 % en double spé)");
  // condition « spe » de l'examen 1 uniquement
  sp = P.emptySp(); learnAll(sp, 1); sp.tut.fill = { V0: 1, G0: 1 }; sp.tut.cast = 1; const st1 = { eth: 1e6, sg: 1e3 };
  ok2(P.conds(sp, st1, 1).some(c => c.id === "spe" && !c.ok) && P.canExam(sp, st1, 1e9, 1).why === "conds", "examen 1 : école obligatoire");
  P.chooseSchool(sp, "evo", 1); ok2(P.canExam(sp, st1, 1e9, 1).ok === true, "examen 1 possible avec une école");
  ok2(!P.conds({ ...P.emptySp(), rank: 2 }, st1, 2).some(c => c.id === "spe"), "pas de condition spe à l'examen 2");
  // proposition : rang ≥ 2 sans école, une seule fois, sans résurrection
  let S = { spV: 2, sp: P.emptySp(), pend: [], pdone: [] }; ok2(P.proposeSpe(S, 9) === false, "rang 1 : rien");
  S.sp.rank = 2; ok2(P.proposeSpe(S, 9) === true && P.pending(S).map(e => e.k).join() === "spe:2", "rang 2 sans école : pli proposé"); ok2(P.proposeSpe(S, 9) === false && S.pend.length === 1, "idempotent");
  P.ack(S, "spe:2"); ok2(P.pending(S).length === 0 && P.proposeSpe(S, 9) === false, "acquitté : ne revient pas");
  S.sp.school = "abj"; S.pdone = []; S.pend = []; ok2(P.proposeSpe(S, 9) === false, "école déjà choisie : rien");
  // réinitialisation : spV+1, sp neuf, le reste intact ; deux resets
  S = { spV: 2, eth: 5e6, sg: 4e9, b: { anc: 12 }, st: { eth: 7 }, ms: { click: { ts: 1 } }, sp: P.emptySp(), pend: [{ k: "exam:1", t: "exam", n: 1 }, { k: "spe:2", t: "spe" }, { k: "x", t: "autre" }], pdone: ["exam:0"] };
  S.sp.rank = 3; S.sp.school = "abj"; learnAll(S.sp, 3); S.sp.exDone = { 1: 5, 2: 6 };
  ok2(P.resetLearning(S) === 3 && S.spV === 3, "reset : spV 2 → 3");
  ok2(S.sp.rank === 1 && S.sp.school === null && S.sp.school2 === null && Object.keys(S.sp.learned).length === 0 && Object.keys(S.sp.exDone).length === 0 && S.sp.decks.length === 0 && S.sp.course === null && S.sp.exam === null, "sorts, rang, examens, école, decks, cours à zéro");
  ok2(S.eth === 5e6 && S.sg === 4e9 && S.b.anc === 12 && S.st.eth === 7 && S.ms.click.ts === 1, "bâtiments, Éther, Sagesse, stats conservés (zéro remboursement)");
  eq(S.pend.map(e => e.k), ["x"], "célébrations d'examen / de spécialité périmées retirées"); ok2(P.resetLearning(S) === 4 && S.spV === 4, "second reset : spV 4");
  // §21 avec des resets : la version la plus haute gagne, jamais le « plus avancé »
  const fix2 = (L, R) => { const base = P.decide(L, R, false), X = JSON.parse(JSON.stringify(base === "cloud" ? R : L)); P.fixSp(X, JSON.parse(JSON.stringify(L)), R); return { base, X }; };
  const big = () => { const s = { spV: 2, seen: 1, b: { anc: 9 }, sp: P.emptySp(), pend: [], pdone: [] }; s.sp.rank = 4; learnAll(s.sp, 4); s.sp.school = "evo"; return s; };
  let local = big(); P.resetLearning(local); local.seen = 50; let cloud = big(); cloud.seen = 99;
  let rr = fix2(local, cloud); ok2(Object.keys(rr.X.sp.learned).length === 0 && rr.X.spV === 3 && rr.X.sp.school === null, "reset local (spV 3) contre cloud spV 2 plein de sorts : le reset gagne");
  local = big(); cloud = big(); P.resetLearning(cloud); cloud.seen = 99; local.seen = 50;
  rr = fix2(local, cloud); ok2(Object.keys(rr.X.sp.learned).length === 0 && rr.X.spV === 3, "reset fait sur un autre appareil : le cloud spV 3 arrive et vide le local");
  local = big(); cloud = big(); delete cloud.spV; cloud.seen = 99; P.resetLearning(local);
  rr = fix2(local, cloud); ok2(rr.X.spV === 3 && Object.keys(rr.X.sp.learned).length === 0, "reset puis ancien client (spV absent) : le reset est conservé");
  local = big(); cloud = big(); P.resetLearning(cloud); P.resetLearning(cloud); rr = fix2(local, cloud); ok2(rr.X.spV === 4, "deux resets successifs : spV 4 gagne");
  ok2(P.score(big(), { spV: 3, sp: P.emptySp() }) === P.score({ spV: 2, b: { anc: 9 }, sp: P.emptySp() }, { spV: 3 }), "score : sorts ignorés quand les spV diffèrent");
  console.log("  (+" + m + " vérifications spécialité/reset)");
}

// ===== v2.a3.10 : Taxe d'adaptation (§15.3) — barème exact du tableau =====
{
  let m = 0; const ok3 = (c, msg) => { assert(c, msg); n++; m++; }, nr = (a, b, msg, tol = .5) => { assert(Math.abs(a - b) <= tol, msg + " (" + a + " ≠ " + b + ")"); n++; m++; };
  const full = (rm, ad) => P.taxe(rm, ad, 5e3);                      // dernier effort il y a 5 s = plein tarif
  let q = full(["evo1"], ["enc1"]); ok3(!q.free && q.S === 2 && q.mul === 1, "R1↔R1 : S = 2"); nr(q.time, 14.4, "R1 : ≈ 14 s", .1); nr(q.sg, 40e3, "R1 : 40 K Sg", 1); nr(q.eth, 8e3, "Éther = Sagesse × 0,2", 1);
  q = full(["evo2"], ["enc2"]); ok3(q.S === 6, "R2 : S = 6"); nr(q.time, 36.7, "R2 : ≈ 37 s", .2); nr(q.sg, 1.6e6, "R2 : 1,6 M Sg", 1);
  q = full(["evo3"], ["enc3"]); ok3(q.S === 18, "R3 : S = 18"); nr(q.time, 93.4, "R3 : ≈ 1 min 33", .3); nr(q.sg, 16e6, "R3 : 16 M Sg", 1);
  q = full(["evo4"], ["enc4"]); ok3(q.S === 54, "R4 : S = 54"); nr(q.time, 237, "R4 : ≈ 3 min 57", 1); nr(q.sg, 60e6, "R4 : 60 M Sg", 1);
  q = full(["evo4"], ["enc1"]); ok3(q.S === 28, "R4↔R1 : S = 28"); nr(q.time, 136, "R4↔R1 : ≈ 2 min 16", 1); nr(q.sg, 30.02e6, "R4↔R1 : ≈ 30 M Sg", 1e3);
  q = full(["evo2", "enc2", "ill2", "nec2"], ["abj2", "div2", "tra2", "con2"]); ok3(q.S === 24, "deck de 4 sorts R2 changés : S = 24 (4 retirés + 4 ajoutés)"); nr(q.sg, 6.4e6, "deck R2 : 6,4 M Sg (tableau §15.3)", 1);
  const r4 = ["evo4", "enc4", "ill4", "nec4", "abj4", "div4", "tra4", "con4"], r4b = r4.map(x => x + "");
  q = full(r4, r4b); ok3(q.S === 8 * 27 * 2 && q.time === 900, "deck de 8 sorts R4 : plafond 15 min"); nr(q.sg, 480e6, "deck R4 : 480 M Sg", 1);
  // gratuités et demi-tarif
  ok3(P.taxe([], ["evo1"], 1e3).free && P.taxe([], ["evo1"], 1e3).why === "vide", "emplacement vide rempli : gratuit même à chaud");
  ok3(P.taxe(["evo1"], ["enc1"], 46e3).free && P.taxe(["evo1"], ["enc1"], 46e3).why === "repos", "dernier effort > 45 s : gratuit");
  const h = P.taxe(["evo1"], ["enc1"], 30e3), f = P.taxe(["evo1"], ["enc1"], 10e3); ok3(h.mul === .5 && nr(h.time, f.time / 2, "demi-tarif : temps /2", 1e-6) === undefined && Math.abs(h.sg - f.sg / 2) < 1e-6, "15–45 s : demi-tarif (temps et Sagesse)");
  ok3(P.taxe(["evo1"], ["enc1"], 14999).mul === 1 && P.taxe(["evo1"], ["enc1"], 15001).mul === .5 && P.taxe(["evo1"], ["enc1"], 45001).free, "seuils 15 s / 45 s");
  ok3(P.TAXE.esc === false, "escalade par fréquence désactivée");
  console.log("  (+" + m + " vérifications Taxe)");
}

// ===== v2.a3.11 : Tricher (§24) =====
{
  let m = 0; const ok4 = (c, msg) => { assert(c, msg); n++; m++; }, nr4 = (a, b, tol, msg) => { assert(Math.abs(a - b) <= tol, msg + " (" + a + " ≠ " + b + ")"); n++; m++; };
  // probabilités par tentative
  let o = P.cheatOdds(0, 0); ok4(o.win === 5 && o.caught === 10 && o.none === 85, "par tentative : 5 / 10 / 85 %");
  o = P.cheatOdds(2, 3); ok4(o.win === 10 && o.none === 80, "bonus +2 et Illusion +3 : 10 % de réussite");
  ok4(P.cheatRoll(4.99, P.cheatOdds(0, 0)) === "win" && P.cheatRoll(5, P.cheatOdds(0, 0)) === "caught" && P.cheatRoll(14.99, P.cheatOdds(0, 0)) === "caught" && P.cheatRoll(15, P.cheatOdds(0, 0)) === "none", "tirage : bornes 5 / 15");
  // 3 tentatives : valeurs analytiques du §24 (13,0 / 25,7 / 61,4 % à bonus 0) + simulation
  const three = (b, rng) => { for (let t = 0; t < 3; t++) { const r = P.cheatRoll(rng() * 100, P.cheatOdds(b, 0)); if (r !== "none") return r; } return "none"; };
  let seed = 12345; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  [[0, 13.0, 25.7, 61.4], [1, 15.2, 25.8, 59.0], [2, 17.7, 25.4, 56.9], [5, 24.3, 24.4, 51.3]].forEach(([b, w, c, nn]) => {
    const c3 = { win: 0, caught: 0, none: 0 }; for (let i = 0; i < 100000; i++) c3[three(b, rng)]++;
    nr4(c3.win / 1000, w, 0.8, "bonus +" + b + " : réussite ≈ " + w + " %"); nr4(c3.caught / 1000, c, 0.8, "bonus +" + b + " : surpris ≈ " + c + " %"); nr4(c3.none / 1000, nn, 1, "bonus +" + b + " : rien ≈ " + nn + " %");
  });
  // disponibilité
  let sp = P.emptySp(); sp.rank = 2; P.startExam(sp, 1000, 2);
  ok4(P.cheatCan(sp, 1500).ok === true, "examen 2 : triche possible"); let sp1 = P.emptySp(); P.startExam(sp1, 1000, 1); ok4(P.cheatCan(sp1, 1500).why === "none", "examen 1 : jamais (tutoriel)");
  ok4(P.cheatCan(sp, sp.exam.end + 1).why === "none" && P.cheatCan(P.emptySp(), 1).why === "none", "hors épreuve : impossible");
  sp.exam.end = 1e9; sp.exam.ch.tries = 1; sp.exam.ch.last = 2000; const w = P.cheatCan(sp, 2000 + 299e3); ok4(w.why === "wait" && w.left === 1e3, "5 min entre deux tentatives"); ok4(P.cheatCan(sp, 2000 + 300e3).ok, "…puis de nouveau possible");
  sp.exam.ch.tries = 3; ok4(P.cheatCan(sp, 1500).why === "tries", "3 tentatives maximum"); sp.exam.ch.tries = 0; sp.exam.ch.over = 1; ok4(P.cheatCan(sp, 1500).why === "over", "réussite/prise : fin de la triche");
  // réussite : le temps restant chute de 80 %
  sp = P.emptySp(); sp.rank = 2; sp.exam = { n: 2, end: 101000, ch: { tries: 0, last: 0, bonus: 0, played: 0, over: 0 } }; P.cheatWin(sp, 1000); ok4(sp.exam.end === 1000 + 100000 * .2 && sp.exam.ch.over === 1, "temps restant −80 %");
  // prise : 1 sort du plus haut rang, examen annulé, verrou 24 h, jamais effaçable
  const S2 = { spV: 2, sp: P.emptySp(), pend: [], pdone: [] }; learnAll(S2.sp, 2); S2.sp.rank = 2; S2.sp.eq = { V: ["evo2", "evo1"], G: ["enc2"] }; S2.sp.decks = [{ name: "d", V: ["evo2"], G: ["enc2"] }]; P.startExam(S2.sp, 0, 2);
  const lost = P.cheatCaught(S2, 0, 5e3); ok4(+lost[3] === 2 && !S2.sp.learned[lost], "perd 1 sort du rang 2 (le plus haut appris)"); ok4(S2.sp.exam === null && S2.lock === 5e3 + 864e5, "examen annulé, verrou 24 h");
  ok4(!S2.sp.eq.V.includes(lost) && !S2.sp.eq.G.includes(lost) && !S2.sp.decks[0].V.includes(lost) && !S2.sp.decks[0].G.includes(lost), "retiré de l'équipement et des decks"); ok4(Object.keys(S2.sp.learned).length === 15, "un seul sort perdu (16 → 15)");
  const l2 = P.cheatCaught({ sp: (() => { const x = P.emptySp(); learnAll(x, 2); return x; })() }, .999, 1); ok4(+l2[3] === 2, "tirage au hasard parmi le rang le plus haut");
  ok4(P.canExam(S2.sp, { eth: 1e12, sg: 1e12 }, 1e12, 2, S2.lock, 6e3).why === "locked", "réinscription bloquée pendant le verrou"); ok4(P.canExam(S2.sp, { eth: 1e12, sg: 1e12 }, 1e12, 2, S2.lock, S2.lock + 1).why !== "locked", "…puis de nouveau possible après 24 h");
  // le verrou survit aux fusions cloud et au dernier recours (max, jamais effacé)
  const loc = { spV: 2, lock: 0, sp: P.emptySp(), pend: [], pdone: [] }, clo = { spV: 2, lock: 9e9, sp: P.emptySp() }; P.fixSp(loc, JSON.parse(JSON.stringify(loc)), clo); ok4(loc.lock === 9e9, "fusion : le verrou le plus tardif gagne");
  const loc2 = { spV: 2, lock: 9e9, sp: P.emptySp() }; P.fixSp(loc2, loc2, { spV: 2, lock: 0, sp: P.emptySp() }); ok4(loc2.lock === 9e9, "un cloud sans verrou ne l'efface pas"); P.resetLearning(loc2); ok4(loc2.lock === 9e9, "le dernier recours ne lève pas le verrou");
  console.log("  (+" + m + " vérifications Triche)");
}

// ===== v2.a3.11 : la sanction de triche ne doit JAMAIS être annulée par le cloud (plus avancé) =====
{
  const big = () => { const s = { spV: 2, seen: 1, b: { anc: 9 }, sp: P.emptySp(), pend: [], pdone: [] }; s.sp.rank = 2; learnAll(s.sp, 2); s.sp.exam = { n: 2, end: 9e12, ch: { tries: 0, last: 0, bonus: 0, played: 0, over: 0 } }; return s; };
  const local = big(), cloud = big(); cloud.seen = 99; const lost = P.cheatCaught(local, 0, 5e3); local.seen = 50;
  assert(local.spV === 3 && lost, "sanction : spV incrémenté"); n++;
  const base = P.decide(local, cloud, false), X = JSON.parse(JSON.stringify(base === "cloud" ? cloud : local)); P.fixSp(X, JSON.parse(JSON.stringify(local)), cloud);
  assert(!X.sp.learned[lost] && Object.keys(X.sp.learned).length === 15 && X.sp.exam === null && X.lock === 5e3 + 864e5, "après synchro : le sort perdu reste perdu, l'examen reste annulé, le verrou reste posé"); n++;
  console.log("  (+2 vérifications sanction de triche / synchro) — total " + n);
}


// ===== v2.a3.16 : examen 4 jouable, rang 5, seconde spécialité =====
{
  let m = 0; const ok5 = (c, msg) => { assert(c, msg); n++; m++; };
  let sp = P.emptySp(); sp.rank = 4; learnAll(sp, 4); sp.school = "evo";
  const big = { eth: 1e9, sg: 1e10, ovV: 1 }; const full = () => ({ name: "d", t: "H", V: ["evo1", "evo2", "evo3", "evo4"], G: ["enc1", "enc2", "enc3", "enc4"] });
  ok5(P.conds(sp, big, 4).map(c => c.id).join() === "deck4,ov,eth,sg", "examen 4 : deck complet, surchauffe, 1 L d'Éther, 10¹⁰ Sagesse");
  ok5(P.canExam(sp, big, 1e12, 4).why === "conds", "examen 4 : sans deck complet");
  sp.decks = [{ name: "x", t: "H", V: ["evo1", "evo2", "evo3", null], G: ["enc1", "enc2", "enc3", "enc4"] }]; ok5(P.canExam(sp, big, 1e12, 4).why === "conds", "deck incomplet (3 + 4) refusé");
  sp.decks = [full()]; ok5(P.canExam(sp, { ...big, ovV: 0 }, 1e12, 4).why === "conds", "sans surchauffe déclenchée : refusé");
  ok5(P.canExam(sp, big, 1e12, 4).ok === true, "examen 4 possible"); ok5(P.canExam(sp, big, 2.9e9, 4).why === "poor", "frais 3 Md de Sagesse");
  ok5(P.canExam(sp, big, 1e12, 5).why === "sealed", "examen 5 scellé");
  // validation de l'examen 4 : rang 5, célébration, seconde spécialité proposée
  const S = { spV: 2, sp, pend: [], pdone: [] }; P.startExam(sp, 0, 4); ok5(P.finishExam(S, 1e9) === 4 && sp.rank === 5 && P.slots(sp) === 5 && sp.exDone[4], "examen 4 validé : rang 5, 5 emplacements");
  ok5(P.proposeSpe2(S, 1) === true && P.pending(S).some(e => e.t === "spe2") && P.proposeSpe2(S, 1) === false, "seconde école proposée une seule fois");
  ok5(P.chooseSchool2(sp, "evo", 5) === false && P.chooseSchool2(sp, "xxx", 5) === false, "ni la même école, ni une inconnue");
  ok5(P.chooseSchool2(sp, "abj", 5) === true && sp.school2 === "abj" && P.chooseSchool2(sp, "div", 6) === false, "seconde école choisie, définitivement");
  ok5(P.schoolMul(sp, "evo") === .75 && P.schoolMul(sp, "abj") === .875 && P.schoolMul(sp, "div") === 1, "−25 % (principale) / −12,5 % (seconde) / 0");
  P.ack(S, S.pend.find(e => e.t === "spe2").k); ok5(P.proposeSpe2(S, 9) === false, "acquittée : ne revient pas");
  const sp0 = P.emptySp(); sp0.school = "evo"; ok5(P.chooseSchool2(sp0, "abj", 1) === false, "interdit avant l'examen 4");
  console.log("  (+" + m + " vérifications examen 4 / seconde spécialité)");
}
