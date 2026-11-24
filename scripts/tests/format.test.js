// Tests de fumée Node : formateurs de nombres du clicker (suffixes français, valeur complète). Lancer : node scripts/tests/format.test.js
const fs = require("fs"), vm = require("vm"), assert = require("assert");
const src = fs.readFileSync(__dirname + "/../../clicker/core.js", "utf8");
const head = src.match(/const U = \[[^\n]*\n[^\n]*\n[^\n]*\n/)[0];               // U/SF, fE, fN
const fmt = src.slice(src.indexOf("// FORMATS-BEGIN"), src.indexOf("// FORMATS-END"));
const ctx = {}; vm.createContext(ctx); vm.runInContext(head + fmt + "\nthis.o={SF,fE,fN,fFull,sciN};", ctx);
const { SF, fE, fN, fFull, sciN } = ctx.o; let n = 0; const eq = (a, b) => { assert.strictEqual(a, b); n++; };
eq(SF.join(","), ",K,M,Md,Bn,Bi,T");
[[999, "999"], [1e3, "1.00K"], [1.5e6, "1.50M"], [1e9, "1.00Md"], [2.5e12, "2.50Bn"], [1e15, "1.00Bi"], [1e18, "1.00T"], [1e21, "1000.00T"], [5, "5.0"]].forEach(([v, r]) => eq(fN(v), r));
eq(fE(999), "999.0 nL"); eq(fE(1e6), "1.00 mL"); eq(fE(1e9), "1.00 L");       // seuil « 1 mL » inchangé
const norm = s => s.replace(/[\u202f\u00a0]/g, " ");
eq(norm(fFull(1234567890, "S")), "1 234 567 890 Sg\n1.23Md\n1,235·10⁹");
eq(norm(fFull(1500000, "E")), "1 500 000 nL\n1.50 mL\n1,5·10⁶");
eq(norm(fFull(12.345, "E", 1)), "12,35 nL /s");
eq(norm(fFull(0, "S")), "0 Sg"); eq(norm(fFull(NaN, "S")), "0 Sg");
eq(sciN(99999.9999), "1·10⁵"); eq(sciN(9999.9), ""); eq(sciN(1e4), "1·10⁴");
console.log("format.test.js : " + n + " vérifications OK");
