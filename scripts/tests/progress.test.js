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
sp.rank = 5; ok(P.slots(sp) === 4, "plafond 4 emplacements en 2.a3.6");
sp = P.emptySp(); sp.course = { id: "evo1", end: 1 }; ok(!P.canLearn(sp, 1), "un seul cours à la fois");
sp = P.emptySp(); sp.exam = { n: 1, end: 1 }; ok(!P.canLearn(sp, 1), "pas de cours pendant un examen");

// 6. Conditions et inscription
const st0 = { eth: 0, sg: 0 }, stOk = { eth: 1e6, sg: 1e3 };
sp = P.emptySp(); learnAll(sp, 1); sp.school = "evo"; ok(P.canExam(sp, st0, 1e9, 1).why === "conds", "examen 1 : conditions manquantes");
sp.tut.fill = { V0: 1, G0: 1 }; sp.tut.cast = 1; ok(P.canExam(sp, { eth: 999999, sg: 1e3 }, 1e9, 1).why === "conds", "Éther juste sous le seuil");
ok(P.canExam(sp, stOk, 1.9e6, 1).why === "poor", "Sagesse insuffisante pour les frais (2 M)");
ok(P.canExam(sp, stOk, 2e6, 1).ok === true, "examen 1 possible");
let sp2 = P.emptySp(); learnAll(sp2, 1); sp2.school = "evo"; delete sp2.learned.con1; sp2.tut.fill = { V0: 1, G0: 1 }; sp2.tut.cast = 1; ok(P.canExam(sp2, stOk, 1e9, 1).why === "spells", "7 sorts sur 8 : refusé");
ok(P.canExam(sp, stOk, 1e9, 2).why === "future" && P.canExam(sp, stOk, 1e9, 4).why === "sealed", "futur / scellé");
sp.exam = { n: 1, end: 9 }; ok(P.canExam(sp, stOk, 1e9, 1).why === "busy", "examen en cours");
eq(P.conds(P.emptySp(), st0, 4), [], "examen 4 sans conditions (scellé)");
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
eq(P.pending(S).map(e => e.k), ["exam:1"], "célébration en attente"); ok(P.slots(S.sp) === 2, "2 emplacements");
ok(P.finishExam(S, 9e9) === 0 && S.pend.length === 1, "idempotent");

// 8. Prix et temps
ok(P.COST.join() === "200000,8000000,80000000,300000000" && P.TIME.join() === "30,300,1800,10800", "table de prix §3.4");
ok(P.EX.price.join() === "2000000,80000000,800000000,3000000000" && P.EX.durOrig.join() === "120,1200,7200,28800" && P.EX.dur.length === 4, "examens §3.4 (durées d'origine ; EX.dur = 1 min en test)");
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
