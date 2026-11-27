"use strict";
// Progression des sorts (v2.a3.6) — LOGIQUE PURE (aucun accès DOM/Firebase) : testée par scripts/tests/progress.test.js.
// Rangs débloqués par examens, marqueur de version d'apprentissage `S.spV` (CONCEPTION_SORTS.md §3, §19.2, §21, §23.3).
//   S.spV   : 2 = système à rangs ; absent/1 = ancien système (4 sorts par école). Au 1er chargement avec ce code : seul S.sp est remis à zéro.
//   S.sp    : { learned, eq, lock, cd, course, decks, rank, exam:{n,end}|null, exDone:{n:ts}, tut:{fill,cast,castIds,deck,equip} }
//   S.pend / S.pdone : célébrations en attente (union à la fusion cloud) / déjà vues ; effectif = pend sans pdone.
const ProgLib = (() => {
  const SPV = 2;
  // ★ RÉGLAGES (CONCEPTION_SORTS.md §3.4) — prix en Sagesse, temps en secondes, seuils CUMULÉS (statistiques à vie : Éther en nL).
  const COST = [2e5, 8e6, 8e7, 3e8, 1.2e9], TIME = [30, 300, 1800, 10800, 21600];
  const EX = { price: [2e6, 8e7, 8e8, 3e9, 1.2e10], dur: [120, 1200, 7200, 28800, 43200],   /* durées d'examen d'origine (rétablies en 2.a3.23) */ eth: [1e6, 5e7, 3e8, 1e9, 3e9], sg: [1e3, 2e8, 2e9, 1e10, 4e10], open: 5, rankMax: 5 };   // open = examens jouables (1 à 4 ; le 5 reste scellé jusqu'aux sorts de rang 5) · rang 5 = 5 emplacements · valeurs de l'examen 5 = PLACEHOLDER à calibrer
  const emptySp = () => ({ learned: {}, eq: { V: [], G: [] }, lock: {}, cd: {}, course: null, decks: [], rank: 1, exam: null, exDone: {}, chg: {}, act: {}, school: null, schoolAt: 0, school2: null, tut: { fill: {}, cast: 0, castIds: {}, deck: 0, equip: 0 } });
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
    const rz = Y && (X.rz || 0) > (Y.rz || 0) ? 1e18 : 0;                    // remise à zéro VOLONTAIRE (S.rz) : l'état le plus récemment remis à zéro l'emporte toujours (sinon le cloud, plus avancé, l'annulerait)
    return rz + b * 1000 + sp + ((X.g && X.g.n) || 0) * 10 + ((X.fr && X.fr.earned) || 0) * 1000;
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
    S.lock = Math.max(S.lock || 0, (L && L.lock) || 0, (R && R.lock) || 0);              // verrou de réinscription : la valeur la plus tardive gagne, jamais effaçable par une resynchronisation
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
    if (n >= 6) return [];                                                     // examen 6 : scellé (rang 6 : sorts à venir)
    if (n <= 2) o.push({ id: "fill", ok: FILL[n - 1].every(k => f[k]) });
    if (n === 1) o.push({ id: "cast", ok: !!t.cast });
    if (n === 2) o.push({ id: "deck", ok: !!t.deck });
    if (n === 3) o.push({ id: "equip", ok: !!t.equip }, { id: "cast3", ok: Object.keys(t.castIds || {}).length >= 3, have: Object.keys(t.castIds || {}).length, need: 3 });
    if (n === 5) o.push({ id: "deck5", ok: (sp.decks || []).some(d => [0, 1, 2, 3, 4].every(i => d.V && d.G && d.V[i] && d.G[i])) }, { id: "cast5", ok: Object.keys(t.castIds || {}).length >= 5, have: Object.keys(t.castIds || {}).length, need: 5 });   // PLACEHOLDER (conditions de l'examen 5 à valider) : un deck complet 5 + 5 et 5 sorts actifs différents lancés
    if (n === 4) o.push({ id: "deck4", ok: (sp.decks || []).some(d => [0, 1, 2, 3].every(i => d.V && d.G && d.V[i] && d.G[i])) }, { id: "ov", ok: ((st && st.ovV) | 0) >= 1 });   // un deck COMPLET (4 + 4) · avoir déclenché la surchauffe du Voile (condition « surchauffe » du §3.2, tranchée ici : tutoriel de la mécanique)
    o.push({ id: "eth", ok: e >= EX.eth[n - 1], have: e, need: EX.eth[n - 1] }, { id: "sg", ok: g >= EX.sg[n - 1], have: g, need: EX.sg[n - 1] });
    if (n === 1) o.push({ id: "spe", ok: !!sp.school });                      // v2.a3.7 : choisir sa spécialité pour pouvoir payer l'examen 1
    return o;
  }
  // Peut-on s'inscrire à l'examen n ? → { ok, why }
  function canExam(sp, st, wallet, n, lock, now) {
    if (n > EX.open) return { ok: false, why: "sealed" };
    if ((lock || 0) > (now || Date.now())) return { ok: false, why: "locked" };        // surpris en train de tricher : réinscription bloquée (S.lock, la valeur la plus tardive gagne à la fusion)
    if ((sp.rank | 0 || 1) !== n) return { ok: false, why: n > (sp.rank | 0 || 1) ? "future" : "done" };
    if (sp.exam) return { ok: false, why: "busy" };
    if (sp.course) return { ok: false, why: "course" };
    if (doneAt(sp, n) < 8) return { ok: false, why: "spells" };
    if (!conds(sp, st, n).every(c => c.ok)) return { ok: false, why: "conds" };
    if (wallet < EX.price[n - 1]) return { ok: false, why: "poor" };
    return { ok: true };
  }
  function startExam(sp, now, n) { sp.exam = { n, end: now + EX.dur[n - 1] * 1e3, ch: { tries: 0, last: 0, bonus: 0, played: 0, over: 0 } }; }
  // Fin d'un examen (en ligne ou hors ligne) : rang +1, célébration en attente. Renvoie le numéro d'examen validé ou 0.
  const examKey = (S, n) => "exam:" + n + ":" + V(S);                      // la clé porte la version d'apprentissage : repasser un examen après un dernier recours doit de nouveau célébrer
  function finishExam(S, now) {
    const sp = S.sp; if (!sp || !sp.exam || now < sp.exam.end) return 0;
    const n = sp.exam.n; sp.exDone[n] = sp.exam.end; sp.rank = Math.max(sp.rank | 0 || 1, n + 1); sp.exam = null;
    if (!Array.isArray(S.pend)) S.pend = []; S.pend = mergePend(S.pend, [{ k: examKey(S, n), t: "exam", n, ts: sp.exDone[n] }]); return n;
  }
  // ---- Spécialité d'école (v2.a3.7) : choix DÉFINITIF (sauf réinitialisation totale), −25 % de prix ET de temps sur les cours de l'école, jamais sur les examens ----
  const SCHOOLS = ["evo", "enc", "ill", "nec", "abj", "div", "tra", "con"];
  const chooseSchool = (sp, k, now) => { if (!sp || sp.school || SCHOOLS.indexOf(k) < 0) return false; sp.school = k; sp.schoolAt = now; return true; };
  const schoolMul = (sp, k) => sp && sp.school === k ? .75 : sp && sp.school2 === k ? .875 : 1;     // double spé : la moitié de l'effet
  // Seconde spécialité (v2.a3.16) : récompense de l'examen 4 ; la seconde école agit à 50 % (Fx.sf = 0,5 ; schoolMul = −12,5 %). Choix définitif comme le premier.
  const chooseSchool2 = (sp, k, now) => { if (!sp || !sp.school || sp.school2 || !sp.exDone || !sp.exDone[4] || k === sp.school || SCHOOLS.indexOf(k) < 0) return false; sp.school2 = k; sp.school2At = now; return true; };
  function proposeSpe2(S, now) {
    const sp = S.sp; if (!sp || !sp.school || sp.school2 || !sp.exDone || !sp.exDone[4]) return false;
    const k = "spe2:" + V(S); if (!Array.isArray(S.pend)) S.pend = []; if (!Array.isArray(S.pdone)) S.pdone = [];
    if (S.pdone.includes(k) || S.pend.some(e => e && e.k === k)) return false; S.pend = mergePend(S.pend, [{ k, t: "spe2", ts: now || 0 }]); return true;
  }
  // Dernier recours (§3.3) : sorts, équipement, decks, cours, rang, examens, école et double spé à zéro, SANS remboursement. Bâtiments, Éther, Sagesse, fragments, stats : intacts.
  // Chaque réinitialisation INCRÉMENTE S.spV : la version la plus haute gagne pour sp/pend/pdone (§21) → le cloud n'annule jamais un reset.
  function resetLearning(S) { S.sp = emptySp(); S.spV = V(S) + 1; S.pend = (S.pend || []).filter(e => e && e.t !== "exam" && e.t !== "spe"); if (!Array.isArray(S.pdone)) S.pdone = []; return S.spV; }
  // Joueur ayant déjà validé l'examen 1 sans école : propose le choix UNE fois par version d'apprentissage (célébration en attente « spe:<spV> »). Renvoie true si ajouté.
  function proposeSpe(S, now) {
    const sp = S.sp; if (!sp || sp.school || (sp.rank | 0 || 1) < 2) return false;
    const k = "spe:" + V(S); if (!Array.isArray(S.pend)) S.pend = []; if (!Array.isArray(S.pdone)) S.pdone = [];
    if (S.pdone.includes(k) || S.pend.some(e => e && e.k === k)) return false;
    S.pend = mergePend(S.pend, [{ k, t: "spe", ts: now || 0 }]); return true;
  }
  // ---- Taxe d'adaptation (v2.a3.10, §15.3) : changer des sorts juste après un effort. Base = RANG des sorts, jamais le revenu. ----
  // w = 3^(rang−1) ; S = Σ w des sorts retirés + ajoutés ; temps = 8 s × S^0,85 (plafond 15 min) ; Sagesse = 10 % des PRIX D'APPRENTISSAGE retirés + ajoutés ; Éther = Sagesse × 0,2.
  // Gratuit : aucun sort retiré (emplacement vide rempli / déplacement) ou dernier effort > 45 s ; demi-tarif entre 15 et 45 s ; plein tarif < 15 s. Escalade par fréquence : PRÉVUE, DÉSACTIVÉE (TAXE.esc).
  const TAXE = { esc: false, free: 45e3, full: 15e3, k: 8, p: .85, cap: 900, sg: .1, eth: .2 };
  const taxe = (removed, added, ago) => {
    if (!removed.length) return { free: true, why: "vide" };
    if (ago > TAXE.free) return { free: true, why: "repos" };
    const all = removed.concat(added), mul = ago < TAXE.full ? 1 : .5, S = all.reduce((a, id) => a + 3 ** (rankOf(id) - 1), 0), base = all.reduce((a, id) => a + COST[rankOf(id) - 1], 0) * TAXE.sg;
    return { free: false, mul, S, time: Math.min(TAXE.cap, TAXE.k * Math.pow(S, TAXE.p)) * mul, sg: base * mul, eth: base * TAXE.eth * mul, removed, added };
  };
  // ---- Tricher (v2.a3.11, §24) : disponible dès l'examen 2, pendant l'épreuve. Réussite 5 % (+ bonus du mini-jeu, + école d'Illusion) : le temps restant chute de 80 % ;
  // surpris 10 % : perte d'1 sort du plus haut rang appris, examen annulé (frais perdus), réinscription bloquée 24 h ; sinon rien. 3 tentatives, 5 min d'écart ; une réussite ou une prise met fin à la triche pour cet examen.
  const CHEAT = { first: 2, tries: 3, cd: 300e3, win: 5, caught: 10, cut: .8, lock: 864e5, illu: 3, maxBonus: 5, mini: { w0: 30, shrink: .72, speed0: .9, grow: 1.12, gain: .5, minW: 1.2 } };   // ★ réglages
  const cheatOdds = (bonus, illu) => { const w = CHEAT.win + (bonus || 0) + (illu || 0); return { win: w, caught: CHEAT.caught, none: 100 - w - CHEAT.caught }; };
  const cheatRoll = (r100, odds) => r100 < odds.win ? "win" : r100 < odds.win + odds.caught ? "caught" : "none";
  const cheatCan = (sp, now) => {
    const ex = sp && sp.exam; if (!ex || ex.n < CHEAT.first || now >= ex.end) return { ok: false, why: "none" };
    const ch = ex.ch || (ex.ch = { tries: 0, last: 0, bonus: 0, played: 0, over: 0 }); if (ch.over) return { ok: false, why: "over" }; if (ch.tries >= CHEAT.tries) return { ok: false, why: "tries" };
    if (ch.last && now - ch.last < CHEAT.cd) return { ok: false, why: "wait", left: CHEAT.cd - (now - ch.last) };
    return { ok: true };
  };
  const cheatWin = (sp, now) => { sp.exam.end = now + Math.round((sp.exam.end - now) * (1 - CHEAT.cut)); sp.exam.ch.over = 1; };
  function cheatCaught(S, rand, now) {                                    // retire 1 sort du plus haut rang appris (au hasard), annule l'examen, pose le verrou ; renvoie l'id perdu
    const sp = S.sp, ids = Object.keys(sp.learned), top = ids.reduce((a, i) => Math.max(a, rankOf(i)), 0), pool = ids.filter(i => rankOf(i) === top).sort(), lost = pool.length ? pool[Math.min(pool.length - 1, Math.floor(rand * pool.length))] : null;
    if (lost) { delete sp.learned[lost]; ["V", "G"].forEach(q => { sp.eq[q] = sp.eq[q].map(x => x === lost ? null : x); }); (sp.decks || []).forEach(d => ["V", "G"].forEach(q => { if (d[q]) d[q] = d[q].map(x => x === lost ? null : x); })); }
    sp.exam = null; S.lock = Math.max(S.lock || 0, now + CHEAT.lock);
    S.spV = V(S) + 1;                                                     // la sanction RETIRE de la progression : sans cet incrément, le cloud (plus avancé, il a encore le sort) la ferait annuler à la synchro (§21)
    return lost;
  }
  return { SPV, COST, TIME, EX, examKey, TAXE, taxe, CHEAT, cheatOdds, cheatRoll, cheatCan, cheatWin, cheatCaught, SCHOOLS, chooseSchool, chooseSchool2, proposeSpe2, schoolMul, resetLearning, proposeSpe, emptySp, norm, migrate, score, decide, fixSp, mergePend, mergeDone, pending, ack, slots, doneAt, canLearn, conds, canExam, startExam, finishExam };
})();
const Prog = ProgLib;
if (typeof module !== "undefined") module.exports = ProgLib;
