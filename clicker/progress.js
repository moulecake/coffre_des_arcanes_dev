"use strict";
// Progression des sorts (v2.a3.6) — LOGIQUE PURE (aucun accès DOM/Firebase) : testée par scripts/tests/progress.test.js.
// Rangs débloqués par examens, marqueur de version d'apprentissage `S.spV` (CONCEPTION_SORTS.md §3, §19.2, §21, §23.3).
//   S.spV   : 2 = système à rangs ; absent/1 = ancien système (4 sorts par école). Au 1er chargement avec ce code : seul S.sp est remis à zéro.
//   S.sp    : { learned, eq, lock, cd, course, decks, rank, exam:{n,end}|null, exDone:{n:ts}, tut:{fill,cast,castIds,deck,equip} }
//   S.pend / S.pdone : célébrations en attente (union à la fusion cloud) / déjà vues ; effectif = pend sans pdone.
const ProgLib = (() => {
  const SPV = 2;
  // ★ RÉGLAGES (CONCEPTION_SORTS.md §3.4) — prix en Sagesse, temps en secondes, seuils CUMULÉS (statistiques à vie : Éther en nL).
  const COST = [2e5, 8e6, 8e7, 3e8], TIME = [30, 300, 1800, 10800];
  const EX = { price: [2e6, 8e7, 8e8, 3e9], dur: [120, 1200, 7200, 28800], eth: [1e6, 5e7, 3e8, 1e9], sg: [1e3, 2e8, 2e9, 1e10], open: 3, rankMax: 4 };   // open = examens jouables (le 4 est scellé)
  const emptySp = () => ({ learned: {}, eq: { V: [], G: [] }, lock: {}, cd: {}, course: null, decks: [], rank: 1, exam: null, exDone: {}, tut: { fill: {}, cast: 0, castIds: {}, deck: 0, equip: 0 } });
  const isO = v => v && typeof v === "object" && !Array.isArray(v), V = X => (X && X.spV) || 1, clone = v => JSON.parse(JSON.stringify(v == null ? null : v));
  function norm(sp) {                                  // complète un S.sp incomplet (idempotent) ; ne touche à aucun sort appris
    if (!isO(sp)) return emptySp();
    const e = emptySp(); for (const k of Object.keys(e)) if (sp[k] == null) sp[k] = e[k];
    if (!isO(sp.tut)) sp.tut = e.tut; ["fill", "castIds"].forEach(k => { if (!isO(sp.tut[k])) sp.tut[k] = {}; }); sp.tut.cast = sp.tut.cast | 0; sp.tut.deck = sp.tut.deck | 0; sp.tut.equip = sp.tut.equip | 0;
    if (!isO(sp.eq)) sp.eq = { V: [], G: [] }; if (!Array.isArray(sp.eq.V)) sp.eq.V = []; if (!Array.isArray(sp.eq.G)) sp.eq.G = [];
    if (!isO(sp.exDone)) sp.exDone = {}; if (!Array.isArray(sp.decks)) sp.decks = []; sp.rank = Math.max(1, Math.min(EX.rankMax + 1, sp.rank | 0));
    return sp;
  }
  // Migration locale (avant tout cloud) : SEUL S.sp (sorts appris, équipement, decks, cours, verrous) est remis à zéro. Bâtiments, Éther, Sagesse, fragments, stats : intacts.
  function migrate(S) {
    if (V(S) >= SPV) { S.sp = norm(S.sp); if (!Array.isArray(S.pend)) S.pend = []; if (!Array.isArray(S.pdone)) S.pdone = []; return false; }
    S.sp = emptySp(); S.spV = SPV; S.pend = []; S.pdone = []; return true;
  }
  // Score d'avancement : le terme « sorts appris + examens » n'est compté que si les DEUX états ont la même version d'apprentissage.
  function score(X, Y) {
    if (!X) return 0;
    const b = Object.values(X.b || {}).reduce((a, v) => a + (v || 0), 0), same = !Y || V(X) === V(Y);
    const sp = same && X.sp ? Object.keys(X.sp.learned || {}).length * 1e5 + Object.keys(X.sp.exDone || {}).length * 1e6 : 0;
    return b * 1000 + sp + ((X.g && X.g.n) || 0) * 10 + ((X.fr && X.fr.earned) || 0) * 1000;
  }
  // Choix de la base lors du chargement cloud (même règle qu'avant, avec le score tenant compte de spV) : 'cloud' | 'reset' (compte étranger sans sauvegarde) | 'local'.
  function decide(L, R, foreign) {
    const lp = foreign ? -1 : score(L, R), cp = R ? score(R, L) : -1;
    if (R && (cp > lp || (cp === lp && ((R.seen || 0) > ((L && L.seen) || 0))))) return "cloud";
    return foreign ? "reset" : "local";
  }
  const union = (a, b, key) => { const o = [], seen = new Set(); [].concat(Array.isArray(a) ? a : [], Array.isArray(b) ? b : []).forEach(e => { const k = key(e); if (k != null && !seen.has(k)) { seen.add(k); o.push(e); } }); return o; };
  const mergePend = (a, b) => union(a, b, e => e && e.k), mergeDone = (a, b) => union(a, b, e => typeof e === "string" ? e : null);
  const adopt = (S, X) => { S.sp = norm(clone(X.sp)); S.spV = V(X); S.pend = clone(X.pend || []); S.pdone = clone(X.pdone || []); };
  // Après le choix de la base : applique la règle « la version d'apprentissage la plus haute gagne pour sp/spV/pend/pdone » (§21.4), sinon union des célébrations.
  // L = état local d'avant remplacement (null si compte étranger), R = état cloud (ou null). Renvoie true si S.sp a été remplacé.
  function fixSp(S, L, R) {
    if (!R && !L) return false;
    const lv = L ? V(L) : 0, rv = R ? V(R) : 0;
    if (rv > lv) { adopt(S, R); return true; }
    if (lv > rv) { const same = L === S; if (!same) adopt(S, L); return !same; }
    S.pend = mergePend(L && L.pend, R && R.pend); S.pdone = mergeDone(L && L.pdone, R && R.pdone); S.sp = norm(S.sp);
    return false;
  }
  const pending = S => { const d = new Set(S.pdone || []); return (S.pend || []).filter(e => e && !d.has(e.k)); };
  const ack = (S, k) => { if (!Array.isArray(S.pdone)) S.pdone = []; if (!S.pdone.includes(k)) S.pdone.push(k); };
  // Règles
  const slots = sp => Math.max(1, Math.min(EX.rankMax, (sp && sp.rank) | 0 || 1));
  const rankOf = id => +id[3], doneAt = (sp, r) => Object.keys(sp.learned || {}).filter(id => rankOf(id) === r).length;
  const canLearn = (sp, r) => r <= (sp.rank | 0 || 1) && !sp.course && !sp.exam;
  const FILL = [["V0", "G0"], ["V0", "V1", "G0", "G1"]];
  // Conditions d'un examen : [{id, ok, kind, have?, need?}] ; `st` = statistiques à vie (S.st). L'examen 4 est scellé.
  function conds(sp, st, n) {
    const t = sp.tut || {}, f = t.fill || {}, e = +(st && st.eth) || 0, g = +(st && st.sg) || 0, o = [];
    if (n >= 4) return [];
    if (n <= 2) o.push({ id: "fill", ok: FILL[n - 1].every(k => f[k]) });
    if (n === 1) o.push({ id: "cast", ok: !!t.cast });
    if (n === 2) o.push({ id: "deck", ok: !!t.deck });
    if (n === 3) o.push({ id: "equip", ok: !!t.equip }, { id: "cast3", ok: Object.keys(t.castIds || {}).length >= 3, have: Object.keys(t.castIds || {}).length, need: 3 });
    o.push({ id: "eth", ok: e >= EX.eth[n - 1], have: e, need: EX.eth[n - 1] }, { id: "sg", ok: g >= EX.sg[n - 1], have: g, need: EX.sg[n - 1] });
    return o;
  }
  // Peut-on s'inscrire à l'examen n ? → { ok, why }
  function canExam(sp, st, wallet, n) {
    if (n > EX.open) return { ok: false, why: "sealed" };
    if ((sp.rank | 0 || 1) !== n) return { ok: false, why: n > (sp.rank | 0 || 1) ? "future" : "done" };
    if (sp.exam) return { ok: false, why: "busy" };
    if (sp.course) return { ok: false, why: "course" };
    if (doneAt(sp, n) < 8) return { ok: false, why: "spells" };
    if (!conds(sp, st, n).every(c => c.ok)) return { ok: false, why: "conds" };
    if (wallet < EX.price[n - 1]) return { ok: false, why: "poor" };
    return { ok: true };
  }
  function startExam(sp, now, n) { sp.exam = { n, end: now + EX.dur[n - 1] * 1e3 }; }
  // Fin d'un examen (en ligne ou hors ligne) : rang +1, célébration en attente. Renvoie le numéro d'examen validé ou 0.
  function finishExam(S, now) {
    const sp = S.sp; if (!sp || !sp.exam || now < sp.exam.end) return 0;
    const n = sp.exam.n; sp.exDone[n] = sp.exam.end; sp.rank = Math.max(sp.rank | 0 || 1, n + 1); sp.exam = null;
    if (!Array.isArray(S.pend)) S.pend = []; S.pend = mergePend(S.pend, [{ k: "exam:" + n, t: "exam", n, ts: sp.exDone[n] }]); return n;
  }
  return { SPV, COST, TIME, EX, emptySp, norm, migrate, score, decide, fixSp, mergePend, mergeDone, pending, ack, slots, doneAt, canLearn, conds, canExam, startExam, finishExam };
})();
const Prog = ProgLib;
if (typeof module !== "undefined") module.exports = ProgLib;
