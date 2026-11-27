'use strict';
// SAUVEGARDE COMPLÈTE des joueurs (lecture seule) → fichier JSON sur TON PC. À lancer AVANT toute bascule vers l'officiel.
// Usage : node scripts/backup-players.js <chemin/vers/compte-de-service.json> [dossier-de-sortie]
// Le fichier produit contient les données privées des joueurs : ne le mets JAMAIS dans le dépôt (déjà ignoré par .gitignore) ni en ligne.
const fs = require('fs'), path = require('path');
const [keyPath, outDir = '.'] = process.argv.slice(2);
if (!keyPath) { console.error('Usage : node scripts/backup-players.js <compte-de-service.json> [dossier-de-sortie]'); process.exit(1); }
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))) });
(async () => {
  const COLS = ['players', 'leaderboard', 'push', 'promo_codes', 'ptu_players', 'ptu_leaderboard', 'ptu_promo_codes'];   // v2.a3.34 : TOUTES les collections (live + PTU)
  const db = admin.firestore(), out = { savedAt: new Date().toISOString() }; COLS.forEach(n => { out[n] = {}; });
  for (const name of COLS) {
    const snap = await db.collection(name).get();
    snap.forEach(d => { out[name][d.id] = d.data(); });
    console.log(`${name} : ${snap.size} document(s)`);
  }
  const file = path.join(outDir, `backup-players-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(`Sauvegarde écrite : ${file} (${Math.round(fs.statSync(file).size / 1024)} Ko)`);
})().catch(e => { console.error(e); process.exit(1); });
