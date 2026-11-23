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
  const db = admin.firestore(), out = { savedAt: new Date().toISOString(), players: {}, leaderboard: {} };
  for (const name of ['players', 'leaderboard']) {
    const snap = await db.collection(name).get();
    snap.forEach(d => { out[name][d.id] = d.data(); });
    console.log(`${name} : ${snap.size} document(s)`);
  }
  const file = path.join(outDir, `backup-players-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(out));
  console.log(`Sauvegarde écrite : ${file} (${Math.round(fs.statSync(file).size / 1024)} Ko)`);
})().catch(e => { console.error(e); process.exit(1); });
