// Tests de fumée Node : clicker/stats.js (fusion cloud, accumulateur, jalons, journaliers). Lancer : node scripts/tests/stats.test.js
const assert = require("assert"), L = require("../../clicker/stats.js");
const day = t => new Date(t).toISOString().slice(0, 10);
let T = Date.UTC(2026, 10, 24, 12, 0, 0), S = {};
const mk = (s = S) => L.make({ get: () => s, dayKey: t => day(t == null ? T : t), now: () => T, src: () => ({ e: 1 }) });
let n = 0; const ok = (c, m) => { assert(c, m); n++; };

// 1. Accumulateur + journaliers + sous-clés
let st = mk(); st.add("eth", 10.123); st.add("eth", 5); st.addIn("cast", "evo1", 2); st.add("clV", 1); st.flush();
ok(S.st.eth === 15.12 && S.sd[day(T)].eth === 15.12, "eth cumulé + journalier");
ok(S.st.cast.evo1 === 2 && !S.sd[day(T)].cast, "sous-clé hors journalier");
ok(S.st.cheat.try === 0 && S.stv === 1, "clés de triche à 0 + version");

// 2. Fusion : chacun plus haut sur des clés différentes, jalon le plus ancien, instantanés sans doublon
const A = { st: { eth: 100, sg: 5, cast: { a: 3 } }, rec: { x: 2 }, ms: { m1: { ts: 200, act: 9 } }, sd: { "2026-11-23": { eth: 7 } }, snap: [{ ts: 1, tag: "w" }] };
const B = { st: { eth: 50, sg: 80, cast: { a: 1, b: 4 } }, rec: { x: 9, y: 1 }, ms: { m1: { ts: 100, act: 4 }, m2: { ts: 5, act: 1 } }, sd: { "2026-11-23": { eth: 9, sg: 1 }, "2020-01-01": { eth: 1 } }, snap: [{ ts: 1, tag: "w" }, { ts: 2, tag: "ms:m1" }] };
const M = L.merge(A, B, "2026-07-01");
ok(M.st.eth === 100 && M.st.sg === 80 && M.st.cast.a === 3 && M.st.cast.b === 4, "max par clé (récursif)");
ok(M.rec.x === 9 && M.rec.y === 1, "records max");
ok(M.ms.m1.ts === 100 && M.ms.m2.ts === 5, "jalon le plus ancien");
ok(M.sd["2026-11-23"].eth === 9 && M.sd["2026-11-23"].sg === 1 && !M.sd["2020-01-01"], "journaliers max + purge > 120 j");
ok(M.snap.length === 2, "instantanés : union sans doublon");
ok(JSON.stringify(A).includes('"eth":100') && A.st.eth === 100 && B.ms.m1.ts === 100, "fusion pure (entrées intactes)");

// 3. Cas cloud : sans stats (ancien client), local vide, deux côtés vides
ok(L.merge({}, B).st.sg === 80 && L.merge(A, {}).st.eth === 100 && Object.keys(L.merge({}, {}).st).length === 0, "cloud/local sans stats");
ok(L.merge(undefined, null).snap.length === 0, "entrées nulles");
ok(L.merge({ st: { v: "x" } }, { st: { v: NaN } }).st.v === 0, "valeurs non numériques -> 0");

// 4. mergeFrom : local plus haut qu'un cloud ancien ne régresse pas ; cloud plus haut est repris
S = { st: { eth: 500 }, sd: {} }; st = mk(S); st.mergeFrom(S, { st: { eth: 100, sg: 7 } });
ok(S.st.eth === 500 && S.st.sg === 7 && S.st.cheat.try === 0, "mergeFrom : max des deux");
S = { eth: 1 }; st = mk(S); st.mergeFrom(S, { st: { eth: 3 }, ms: { a: { ts: 1, act: 0 } } });
ok(S.st.eth === 3 && S.ms.a.ts === 1, "mergeFrom : S sans stats");

// 5. Accumulateur en attente est versé avant la fusion
S = { st: { eth: 10 } }; st = mk(S); st.add("eth", 5); st.mergeFrom(S, { st: { eth: 12 } });
ok(S.st.eth === 15, "pending flushé avant fusion (15 > 12)");

// 6. Jalons + instantanés + plafond
S = {}; st = mk(S); st.add("act", 42); st.ms("click"); st.ms("click"); ok(S.ms.click.act === 42 && S.snap.length === 1, "jalon unique + snap + act");
for (let i = 0; i < 80; i++) { T += 1000; st.snap("t" + i); } ok(S.snap.length === 60, "plafond d'instantanés");

// 7. Débit sur 3 s et tick (records, seuils, hebdo, rollover de jour)
S = {}; T = Date.UTC(2026, 10, 24, 12, 0, 0); st = mk(S);
for (let i = 0; i < 30; i++) { T += 100; st.click("V"); }                      // 10 clics/s pendant 3 s
ok(Math.abs(S.rec.cps3V - 10) < 0.5, "record cps3V ≈ 10 (" + S.rec.cps3V + ")");
S.st.eth = 2e6; for (let i = 0; i < 12; i++) { T += 100; st.tick(0.1, true, 50, 9); }
ok(S.ms.ether1mL && !S.ms.ether1L && S.rec.ethPSmax === 50 && S.st.act > 0 && S.ms.click, "seuil 1 mL, records, jeu actif");
ok(S.snap.some(e => e.tag === "w"), "instantané hebdo");
const d1 = Object.keys(S.sd).length; T += 864e5; st.add("clV", 1); st.flush(); ok(Object.keys(S.sd).length === d1 + 1, "nouveau bucket au changement de jour");
T += 130 * 864e5; st.add("clV", 1); st.flush(); ok(!S.sd["2026-11-24"], "bucket de plus de 120 j purgé");

// 8. Performance du chemin chaud
const t0 = process.hrtime.bigint(); for (let i = 0; i < 1e6; i++) st.add("eth", 1.5); const ms = Number(process.hrtime.bigint() - t0) / 1e6;
ok(ms < 200, "1 M d'add() en " + ms.toFixed(0) + " ms");
console.log("stats.test.js : " + n + " vérifications OK");
