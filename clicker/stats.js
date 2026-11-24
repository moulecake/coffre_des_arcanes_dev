"use strict";
// Statistiques de jeu (v2.a3.4) — aucune interface : on COLLECTE tôt, on ne peut pas reconstituer l'historique après coup (voir CONCEPTION_SORTS.md §10).
// Données dans S : st (compteurs à vie) · rec (records) · ms (jalons datés) · sd (journaliers, 120 j) · snap (instantanés) · stv (version du schéma).
// Fusion cloud : max par clé (compteurs, records, journaliers) ; jalon = le PLUS ANCIEN ; instantanés = union. Jamais de perte, mais deux appareils
// qui jouent en parallèle ne s'additionnent pas (limite connue). Écriture : tout en mémoire (accumulateur), versé dans S une fois par seconde et à chaque save().
const StatsLib = (() => {
  const RET = 120, SNAP_MAX = 60, WEEK = 6048e5;
  const DAY = new Set(["eth", "sg", "pg", "clV", "clG", "cast", "act", "off", "frA", "frP", "taxe", "exam"]);   // sous-ensemble tenu par jour (quêtes/défis)
  const CHEAT = ["try", "win", "caught", "none", "mini", "miniBonusSum", "spellsLost"];                              // §24 : créés à 0, sans fonctionnalité pour l'instant
  const TH = [["eth", 1e6, "ether1mL"], ["eth", 1e9, "ether1L"], ["sg", 1e3, "sg1e3"], ["sg", 1e6, "sg1e6"], ["sg", 1e9, "sg1e9"], ["sg", 1e12, "sg1e12"]];   // 1 mL = 1e6 nL
  const num = v => typeof v === "number" && isFinite(v) ? v : 0, isO = v => v && typeof v === "object" && !Array.isArray(v);
  const r2 = v => Math.round(v * 100) / 100;
  const mergeNum = (a, b) => {                         // max par clé, récursif (objets de nombres)
    const o = {}; a = isO(a) ? a : {}; b = isO(b) ? b : {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = isO(a[k]) || isO(b[k]) ? mergeNum(a[k], b[k]) : Math.max(num(a[k]), num(b[k]));
    return o;
  };
  function merge(a, b, cutoff) {                       // fonction PURE : renvoie de nouveaux objets, n'altère ni a ni b
    a = a || {}; b = b || {};
    const ms = {}; for (const k of new Set([...Object.keys(isO(a.ms) ? a.ms : {}), ...Object.keys(isO(b.ms) ? b.ms : {})])) {
      const x = a.ms && a.ms[k], y = b.ms && b.ms[k]; ms[k] = x && y ? (num(x.ts) <= num(y.ts) ? x : y) : (x || y);   // le plus ancien gagne
    }
    const sd = mergeNum(a.sd, b.sd); if (cutoff) for (const d of Object.keys(sd)) if (d < cutoff) delete sd[d];
    const seen = new Set(), snap = [];
    [].concat(Array.isArray(a.snap) ? a.snap : [], Array.isArray(b.snap) ? b.snap : []).forEach(e => { const id = e && e.ts + "|" + e.tag; if (e && !seen.has(id)) { seen.add(id); snap.push(e); } });
    snap.sort((x, y) => x.ts - y.ts);
    return { st: mergeNum(a.st, b.st), rec: mergeNum(a.rec, b.rec), ms, sd, snap: snap.slice(-SNAP_MAX) };
  }
  const pick = s => ({ st: s && s.st, rec: s && s.rec, ms: s && s.ms, sd: s && s.sd, snap: s && s.snap });
  function make(cfg) {
    const acc = {}; let t1 = 0, dk = "", ring = { V: [], G: [] }, hasS = null;
    const now = () => cfg.now ? cfg.now() : Date.now();
    const ensure = s => {                              // crée / complète les structures (idempotent)
      if (!isO(s.st)) s.st = {}; if (!isO(s.rec)) s.rec = {}; if (!isO(s.ms)) s.ms = {}; if (!isO(s.sd)) s.sd = {}; if (!Array.isArray(s.snap)) s.snap = [];
      if (!isO(s.st.cheat)) s.st.cheat = {}; CHEAT.forEach(k => { if (typeof s.st.cheat[k] !== "number") s.st.cheat[k] = 0; });
      if (typeof s.st.exam !== "number") s.st.exam = 0; s.stv = 1; return s;
    };
    const add = (k, v) => { acc[k] = (acc[k] || 0) + v; };                    // chemin chaud : une seule addition
    const addIn = (g, k, v) => { const n = g + "." + k; acc[n] = (acc[n] || 0) + v; };
    const flush = () => {
      const s = cfg.get(); if (!s) return; ensure(s); const d = cfg.dayKey(), first = d !== dk; dk = d;
      const D = s.sd[d] || (s.sd[d] = {});
      for (const k in acc) {
        const v = acc[k]; if (!v) continue; acc[k] = 0; const i = k.indexOf(".");
        if (i < 0) { s.st[k] = r2(num(s.st[k]) + v); if (DAY.has(k)) D[k] = r2(num(D[k]) + v); }
        else { const g = k.slice(0, i), kk = k.slice(i + 1), o = isO(s.st[g]) ? s.st[g] : (s.st[g] = {}); o[kk] = r2(num(o[kk]) + v); }
      }
      if (first) { const cut = cfg.dayKey(now() - RET * 864e5); for (const x of Object.keys(s.sd)) if (x < cut) delete s.sd[x]; }
    };
    const max = (k, v) => { const s = cfg.get(); if (!s) return; ensure(s); if (v > num(s.rec[k])) s.rec[k] = r2(v); };
    const snap = tag => {
      const s = cfg.get(); if (!s || !cfg.src) return; ensure(s); flush();
      s.snap.push(Object.assign({ ts: now(), tag, act: num(s.st.act) }, cfg.src())); if (s.snap.length > SNAP_MAX) s.snap.splice(0, s.snap.length - SNAP_MAX);
    };
    const ms = key => {                                // jalon : première fois seulement, horodatage + secondes de jeu actif
      const s = cfg.get(); if (!s || (s.ms && s.ms[key])) return; ensure(s); flush();
      s.ms[key] = { ts: now(), act: num(s.st.act) }; snap("ms:" + key);
    };
    const click = p => {                               // clic physique : compteur + débit sur 3 s (record par panneau)
      add(p === "V" ? "clV" : "clG", 1); ms("click"); const n = now(), r = ring[p]; r.push(n); while (r.length && n - r[0] > 3e3) r.shift(); if (r.length > 64) r.shift();
      if (r.length > 5) max("cps3" + p, r.length / 3);
    };
    const tick = (dt, active, ethPS, sgPS) => {        // appelé à chaque tick (10/s) : travail réel 1 fois par seconde
      t1 += dt; if (t1 < 1) return; const sec = t1; t1 = 0;
      if (active) add("act", sec); flush();
      const s = cfg.get(); if (!s) return;
      max("ethPSmax", ethPS); max("sgPSmax", sgPS);
      if (cfg.mul) { const m = cfg.mul(); max("mulE", m[0]); max("mulC", m[1]); max("mulS", m[2]); max("mulV", m[0] * m[1]); }
      for (const [k, v, id] of TH) if (!s.ms[id] && num(s.st[k]) >= v) ms(id);
      let lw = 0; for (const e of s.snap) if (e.tag === "w" && e.ts > lw) lw = e.ts;
      if (now() - lw > WEEK && num(s.st.act) > 0) snap("w");
    };
    const mergeFrom = (s, o) => {                      // fusionne les stats de `o` DANS `s` (cloud ↔ local)
      flush(); const m = merge(pick(s), pick(o), cfg.dayKey(now() - RET * 864e5)); Object.assign(s, m); ensure(s); return s;
    };
    return { add, addIn, flush, max, ms, snap, click, tick, mergeFrom, pick, ensure, cfg };
  }
  return { make, merge, pick, mergeNum, TH, DAY, CHEAT };
})();
const Stats = typeof module !== "undefined" ? null : StatsLib.make({
  get: () => S, dayKey: t => t == null ? dayKey() : new Date(t - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10), now: () => Date.now(),
  mul: () => [Spells.mod("ether", 1), Spells.mod("click", 1), Spells.mod("sg", 1)],
  src: () => { const c = Passives.calc(), q = (S.sp && S.sp.eq) || {}; return { e: c.ethPS, g: c.sgPS, b: Object.assign({}, S.b), q: { V: (q.V || []).slice(), G: (q.G || []).slice() } }; }
});
if (typeof module !== "undefined") module.exports = StatsLib;
