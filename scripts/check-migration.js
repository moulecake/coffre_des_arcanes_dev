'use strict';
// VÉRIFIE LA MIGRATION sur les VRAIES données, sans rien écrire : applique le code de conversion de script.js à chaque joueur d'une sauvegarde
// (scripts/backup-players.js) et signale toute perte possible. À lancer AVANT de pousser vers l'officiel.
// Usage : node scripts/check-migration.js <backup-players-....json> [chemin/data.js]      (data.js par défaut : ../data.js — c'est TON data.js qui est lu, localement)
// Il n'affiche que des COMPTEURS (jamais de noms d'objets ni de pseudos).
const fs = require('fs'), path = require('path');
const [dumpPath, dataPath = path.join(__dirname, '..', 'data.js')] = process.argv.slice(2);
if (!dumpPath) { console.error('Usage : node scripts/check-migration.js <backup-players.json> [data.js]'); process.exit(1); }
const src = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8').split('\r\n').join('\n');
const i1 = src.indexOf('const LOOT_ID'), i2 = src.indexOf('// ============================================================\n// SYNCHRONISATION SÛRE');
if (i1 < 0 || i2 < 0) { console.error('Structure de script.js inattendue : vérification impossible.'); process.exit(2); }
const loots = new Function(fs.readFileSync(dataPath, 'utf8') + ';return loots;')();
const api = new Function('loots', src.slice(i1, i2) + ';return { packInventory, unpackInventory, LOOT_ID, LOOT_BY_ID };')(loots);
const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8')), players = dump.players || dump;
const sum = o => Object.keys(o).reduce((a, k) => a + (o[k] > 0 ? o[k] : 0), 0), uniq = o => Object.keys(o).filter(k => o[k] > 0).length;
const sameCounts = (a, b) => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]])) === JSON.stringify(Object.keys(b).sort().map(k => [k, b[k]]));
console.log(`data.js : ${loots.length} objets · identifiants compactables : ${Object.keys(api.LOOT_BY_ID).length}`);
const T = { joueurs: 0, vides: 0, copiesAvant: 0, copiesApres: 0, uniquesAvant: 0, uniquesApres: 0, reetiquetes: 0, inconnus: 0, clesLonguesRestantes: 0 }, problems = [];
for (const [uid, doc] of Object.entries(players)) {
  const raw = doc && doc.state && doc.state.inventory; T.joueurs++;
  if (!raw || !Object.keys(raw).length) { T.vides++; continue; }
  const before = sum(raw), ub = uniq(raw), un = api.unpackInventory(raw), packed = api.packInventory(un), re = api.unpackInventory(packed);
  const after = sum(un), ua = uniq(un), unknown = Object.keys(un).filter(k => k.includes('|#|Objet inconnu|')).length, longLeft = Object.keys(packed).filter(k => k.includes('|')).length;
  T.copiesAvant += before; T.copiesApres += after; T.uniquesAvant += ub; T.uniquesApres += ua; T.inconnus += unknown; T.clesLonguesRestantes += longLeft; T.reetiquetes += Math.max(0, ub - ua);
  const why = [];
  if (!sameCounts(un, re)) why.push('aller-retour compact ≠ original');
  if (after < before) why.push(`copies ${before} → ${after} (perte)`);
  if (unknown) why.push(`${unknown} objet(s) inconnu(s) de data.js`);
  if (why.length) problems.push(`  joueur ${uid.slice(0, 6)}… : ${why.join(' ; ')}`);
}
console.log(`joueurs : ${T.joueurs} (${T.vides} sans inventaire)`);
console.log(`copies d'objets : ${T.copiesAvant} → ${T.copiesApres}   ·   objets uniques : ${T.uniquesAvant} → ${T.uniquesApres} (fusions de raretés : ${T.reetiquetes})`);
console.log(`objets inconnus de data.js : ${T.inconnus}   ·   clés longues conservées (non compactables) : ${T.clesLonguesRestantes}`);
if (problems.length) { console.log('\nÀ EXAMINER :'); problems.slice(0, 30).forEach(l => console.log(l)); if (problems.length > 30) console.log(`  … et ${problems.length - 30} autre(s)`); }
const loss = T.copiesApres < T.copiesAvant;
console.log(loss ? '\n❌ PERTE POSSIBLE : ne pas déployer avant d\'avoir compris.' : problems.length ? '\n⚠ Aucune perte de copies, mais des points à examiner (ci-dessus).' : '\n✅ Migration sans perte sur tous les joueurs.');
process.exit(loss ? 1 : 0);
