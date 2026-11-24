// Tests de fumée Node : clicker/effects.js (mod(), away(), valeurs base/spécialité des 32 sorts §11). Lancer : node scripts/tests/effects.test.js
const assert = require("assert"), F = require("../../clicker/effects.js");
let n = 0; const ok = (c, m) => { assert(c, m); n++; }, near = (a, b, m) => { assert(Math.abs(a - b) < 1e-9, m + " (" + a + " ≠ " + b + ")"); n++; };
const ctx = { lvl: 1, paliers: [5, 10, 15], cpsG: 10 };
const pv = (id, f, k, c) => { const m = F.PM(id, f, c || ctx).find(x => x[0] === k); return m ? m[2] : undefined; };

// 1. Passifs : base (f=0) puis spécialité (f=1) — valeurs du §11
[["enc1", "sgCost", .9, .85], ["enc1", "ethCost", 1, .85], ["enc2", "scribe", 1.15, 1.25], ["enc4", "sg", 1.2, 1.3], ["ill1", "rare", 1.05, 1.12], ["ill3", "buffDur", 5, 8], ["nec1", "sg", 1.03, 1.10], ["nec2", "ghost", .02, .04], ["nec4", "redX", 2, 3],
 ["abj2", "offlineCap", 2, 4], ["abj4", "cd", .85, .78], ["div2", "offlineSg", 1.2, 1.3], ["div2", "offlineEth", 1.2, 1.3], ["div2", "fragOff", 1.2, 1.3], ["div4", "study", .75, .65], ["tra1", "burn", .2, .1], ["tra1", "frag", 1.15, 1.15],
 ["tra4", "ether", 1.25, 1.35], ["tra4", "scribe", 1.25, 1.35], ["tra4", "frag", 1.25, 1.35], ["tra4", "bldG", 1, 1.35], ["con1", "ethCost", .95, .92], ["con1", "sgCost", .95, .92], ["con2", "famil", 1, 2]]
  .forEach(([id, k, a, b]) => { near(pv(id, 0, k), a, id + " " + k + " base"); near(pv(id, 1, k), b, id + " " + k + " spé"); near(pv(id, .5, k), id === "con2" ? 1 : a + (b - a) * .5, id + " " + k + " double spé"); });
// abj1 : palier selon le niveau appris ; Grimoire = max(10, Voile) ; spé +2 sur les deux
near(pv("abj1", 0, "cps"), 10, "abj1 rang 1-2 : Voile 10"); near(pv("abj1", 0, "cpsG"), 10, "abj1 : Grimoire 10");
near(pv("abj1", 0, "cps", { ...ctx, lvl: 3 }), 15, "abj1 rang 3-4 : Voile 15"); near(pv("abj1", 0, "cpsG", { ...ctx, lvl: 3 }), 15, "abj1 : Grimoire aligné sur le Voile (15)");
near(pv("abj1", 1, "cps"), 12, "abj1 spé Voile +2"); near(pv("abj1", 1, "cpsG"), 12, "abj1 spé Grimoire +2");
ok(F.PM("evo1", 1).length === 0 && F.PM("zzz", 1).length === 0, "sorts sans passif");

// 2. Actifs : base / spécialité
const A = (id, f, c) => F.ACT(id, f, c);
near(A("evo1", 0).imp, 10, "evo1 base"); near(A("evo1", 1).imp, 15, "evo1 spé"); near(A("evo1", 0).cd, 20, "evo1 cd"); near(A("evo1", 1).cd, 15, "evo1 cd spé"); ok(!A("evo1", 0).crit && A("evo1", 1).crit, "evo1 : critique seulement en spé");
near(A("evo2", 1).secs, 45, "evo2 spé"); near(A("evo2", 1).clicks, 30, "evo2 clics"); near(A("evo3", 1).dur, 14, "evo3 dur"); near(A("evo3", 1).cd, 70, "evo3 cd"); ok(A("evo4", 0).every === 100 && A("evo4", 1).every === 70 && A("evo4", 1).dur === 20, "evo4 : 100 clics/15 s → 70 clics/20 s");
near(A("enc3", 1).dur, 40, "enc3 dur"); near(A("enc3", 1).cd, 95, "enc3 cd"); ok(A("ill2", 0).charges === 1 && A("ill2", 1).charges === 2 && A("ill2", 1).mult === 7 && A("ill2", .5).charges === 1, "ill2 : ×5/1 charge → ×7/2 charges");
near(A("ill4", 0, { buffDur: 5 }).dur, 13, "ill4 base : 8 + 5 s"); near(A("ill4", 1, { buffDur: 5 }).dur, 19.5, "ill4 spé : +50 %"); near(A("ill4", 1).mult, 15, "ill4 ×15");
near(A("nec3", 0).frac, .1, "nec3 base 10 %"); near(A("nec3", 1).frac, .05, "nec3 spé 5 %"); near(A("abj3", 1).cd, 40, "abj3 cd"); near(A("abj3", 1).immune, 5, "abj3 immunité"); near(A("abj3", 0).immune, 0, "abj3 sans immunité");
ok(A("div3", 0).pages === 5 && A("div3", 1).pages === 7 && A("div3", 1).cd === 120, "div3 : 5 → 7 pages"); ok(A("tra2", 1).mult === 4 && A("tra2", 1).dur === 40, "tra2 ×4/40 s"); ok(A("tra3", 1).dur === 20 && A("tra3", 1).cd === 95, "tra3 20 s/95 s");
ok(A("con3", 0).n === 1 && A("con3", 1).n === 2 && A("con3", 1).cd === 190, "con3 : 1 → 2 sorts, 190 s"); near(A("con4", 1).dur, 14, "con4 14 s"); ok(F.augure(0) === 1 && F.augure(1) === 2, "div1 : 1 → 2 pages");
ok(F.cdOf("evo1", 20, 1) === 15 && F.cdOf("passif", 77, 1) === 77, "cdOf");
ok(F.sf({ school: "evo" }, "evo") === 1 && F.sf({ school: "evo", school2: "abj" }, "abj") === .5 && F.sf({ school: "evo" }, "abj") === 0 && F.sf(null, "evo") === 0, "facteur de spécialité");

// 3. mod() : les multiplicateurs de sorts différents s'empilent (×30), un même sort jamais
const now = 1e6; let fxs = [];
F.addFx(fxs, [["ether", "*", 5], ["click", "*", 5]], 15, now, "tra3");           // tra3 ×5
F.addFx(fxs, [["ether", "*", 3], ["click", "*", 3], ["sg", "*", 3]], 10, now, "con4");   // con4 ×3
F.addFx(fxs, [["ether", "*", 2], ["click", "*", 2]], 15, now, "evo4");           // evo4 ×2
ok(F.mod([], fxs, now, "ether", 1) === 30 && F.mod([], fxs, now, "click", 1) === 30, "empilement ×30 conservé (tra3 × con4 × evo4)");
F.addFx(fxs, [["ether", "*", 2], ["click", "*", 2]], 15, now + 5e3, "evo4");     // evo4 se redéclenche pendant son effet
ok(fxs.filter(e => e.tag === "evo4").length === 1 && F.mod([], fxs, now + 5e3, "ether", 1) === 30, "evo4 ne s'auto-cumule plus (toujours ×30, pas ×60)");
ok(fxs.find(e => e.tag === "evo4").u === now + 5e3 + 15e3, "…et son minuteur est rafraîchi");
ok(F.mod([], fxs, now + 12e3, "ether", 1) === 10, "con4 expiré à 10 s : tra3 ×5 × evo4 ×2");
ok(F.mod([], fxs, now + 40e3, "ether", 1) === 1, "tout expiré");
F.addFx(fxs, [["ether", "*", 2]], 15, now + 40e3, "evo4"); ok(fxs.filter(e => e.tag === "evo4").length === 2 || fxs.filter(e => e.tag === "evo4" && e.u > now + 40e3).length === 1, "un effet expiré se relance normalement");
// passifs + temporaires : tra4 ×1,25 × enc3 ×2
const ml = F.PM("tra4", 0); fxs = []; F.addFx(fxs, [["ether", "*", 2]], 30, now, "enc3"); near(F.mod(ml, fxs, now, "ether", 1), 2.5, "tra4 × enc3");
ok(F.mod([["cps", "=", 10]], [], now, "cps", 5) === 10 && F.mod([["cps", "=", 3]], [], now, "cps", 5) === 5, "« = » est un plancher");

// 4. away() : tranche unique
const c = { ethPS: 100, sgPS: 50 }, M0 = (k, d) => d, mk = o => (k, d) => (k in o ? o[k] : d);
let r = F.away(c, 3600, M0); near(r.eth, 360000, "1 h d'Éther"); near(r.sg, 180000, "1 h de Sagesse"); ok(r.burn === 0 && r.sec === 3600 && r.micro === 3600, "sans sorts");
r = F.away(c, 20 * 3600, M0); ok(r.sec === 8 * 3600, "plafond 8 h");
r = F.away(c, 20 * 3600, mk({ offlineCap: 10 })); ok(r.sec === 10 * 3600, "abj2 : plafond 10 h"); r = F.away(c, 20 * 3600, mk({ offlineCap: 12 })); ok(r.sec === 12 * 3600, "abj2 spé : 12 h");
r = F.away(c, 3600, mk({ offlineSg: 1.2, offlineEth: 1.2, fragOff: 1.2 })); near(r.eth, 432000, "div2 : l'Éther hors ligne est boosté"); near(r.sg, 216000, "div2 : Sagesse +20 %"); near(r.micro, 4320, "div2 : fragments +20 %");
r = F.away(c, 3600, mk({ burn: .2 })); near(r.burn, 36000, "tra1 : 20 % de la Sagesse brûlée"); near(r.sg, 144000, "tra1 : Sagesse restante"); near(r.eth, 360000 + 36000 * 20, "tra1 : Éther ×20 hors ligne");
r = F.away(c, 3600, mk({ burn: .1 })); near(r.burn, 18000, "tra1 spé : 10 %");
r = F.away(c, 3600, mk({ burn: .2, offlineSg: 1.2 })); near(r.burn, 43200, "tra1 brûle la Sagesse hors ligne boostée");
r = F.away(c, 0, M0); ok(r.eth === 0 && r.sg === 0, "durée nulle"); r = F.away({ ethPS: 0, sgPS: 0 }, 1e5, M0); ok(r.eth === 0 && r.sg === 0, "aucune production");

// 5. Surchauffe option A (§5.1) : capacité selon la limite ; faisabilité humaine
[[5, 100], [9, 100], [10, 70], [12, 70], [14, 70], [15, 50], [17, 50]].forEach(([l, c]) => ok(F.cap(l) === c, "capacité de la limite " + l + " = " + c));
const tOver = (cps, lim) => F.cap(lim) / ((cps - lim) * 10);                  // secondes avant surchauffe (chaleur +10/clic, −lim×10 /s, seuil = capacité)
near(tOver(7, 5), 5, "7 clics/s à la limite 5 : 5 s (inchangé)"); near(tOver(12, 10), 3.5, "12 clics/s à la limite 10 : 3,5 s"); near(tOver(11, 10), 7, "11 clics/s à la limite 10 : 7 s"); near(tOver(20, 15), 1, "20 clics/s à la limite 15 : 1 s");
ok(tOver(9.5, 10) === -7 || 9.5 <= 10, "un humain à ≈ 9,5 clics/s ne surchauffe jamais à la limite 10 (la chaleur ne monte pas)");
// 6. Raccourcis clavier : event.code physique
[["Digit1", "V", 0], ["Digit5", "V", 4], ["Digit6", "G", 0], ["Digit9", "G", 3], ["Digit0", "G", 4]].forEach(([c, p, i]) => { const k = F.slotKey(c); ok(k && k.p === p && k.i === i, c + " → " + p + (i + 1)); });
ok(F.slotKey("KeyA") === null && F.slotKey("Numpad1") === null && F.slotKey(undefined) === null, "autres touches ignorées");

// 7. Préparation hors ligne (§16) : délai de chargement et calcul par tranches
[[0, 3600], [179e3, 3600], [180e3, 1200], [299e3, 1200], [300e3, 480], [599e3, 480], [600e3, 180], [899e3, 180], [900e3, 0], [5e6, 0]].forEach(([ago, d]) => ok(F.loadDelay(ago) === d, "délai pour un changement il y a " + ago / 1000 + " s = " + d + " s"));
const sliceOf = (rate) => (ex, len) => ({ eth: len * (ex.indexOf("a") >= 0 ? rate[0] : rate[1]) });
ok(F.awaySlices(3600, [], sliceOf([1, 2])).eth === 7200, "aucun sort en chargement : une seule tranche");
ok(F.awaySlices(3600, [{ id: "a", delay: 1200 }], sliceOf([1, 2])).eth === 1200 * 1 + 2400 * 2, "un sort chargé après 20 min : 20 min sans lui, 40 min avec");
ok(F.awaySlices(600, [{ id: "a", delay: 3600 }], sliceOf([1, 2])).eth === 600, "absence plus courte que le délai : le sort ne rapporte rien, pas de dette");
ok(F.awaySlices(7200, [{ id: "a", delay: 1200 }, { id: "b", delay: 3600 }], (ex, len) => ({ n: len * (2 - ex.length * .5), t: len })).t === 7200, "deux sorts : les durées des tranches somment la durée totale");
ok(F.awaySlices(7200, [{ id: "a", delay: 1200 }, { id: "b", delay: 3600 }], (ex, len) => ({ n: len * (3 - ex.length) })).n === 1200 * 1 + 2400 * 2 + 3600 * 3, "tranches 0-20 min (2 exclus), 20-60 min (1 exclu), 60-120 min (aucun)");
ok(F.awaySlices(0, [{ id: "a", delay: 60 }], sliceOf([1, 2])).eth === 0 && F.awaySlices(3600, [{ id: "a", delay: 0 }], sliceOf([1, 2])).eth === 7200, "durée nulle / délai nul");
// somme de tranches == calcul direct quand aucun sort n'est exclu (cohérence avec Fx.away)
{ const c = { ethPS: 100, sgPS: 50 }, MM = (k, d) => d; const sl = F.awaySlices(3600, [], (ex, len) => F.awayRaw(c, len, MM)); ok(sl.eth === F.away(c, 3600, MM).eth && sl.sg === F.away(c, 3600, MM).sg, "tranche unique = Fx.away"); }
// 8. Activation des sorts d'achat (§17)
ok(F.activ("enc1", 0) === 600 && F.activ("enc1", 1) === 300 && F.activ("con1", 0) === 600 && F.activ("evo1", 1) === 0, "activation : 10 min (5 min en spé) pour enc1/con1, aucune pour les autres");
console.log("effects.test.js : " + n + " vérifications OK");
