'use strict';
// ATTRIBUE un objet d'ÉVÈNEMENT (skin de coffre/fond, ex. « beta ») à des joueurs du LIVE (collection `players`). Outil d'administration (compte de service).
// Usage :
//   node scripts/grant-event.js <compte-de-service.json> <evenement> --list                 → liste les candidats (comptes PTU = bêta-testeurs) et leur compte Live, SANS rien écrire
//   node scripts/grant-event.js <compte-de-service.json> <evenement> --apply <uid> [<uid>…]  → écrit, pour CES uid seulement
// Sécurité des données : transaction par joueur ; ajoute l'évènement à `state.events` (union, rien n'est retiré) ET incrémente `state.rev`,
// pour que le jeu de chaque joueur passe en fusion à 3 voies (où `events` est une UNION) au lieu d'écraser le cloud avec sa copie locale.
// Aucune autre donnée n'est modifiée. Sauvegarde conseillée avant (scripts/backup-players.js).
const fs = require('fs');
const [keyPath, ev, mode, ...uids] = process.argv.slice(2);
if (!keyPath || !ev || !['--list', '--apply'].includes(mode)) { console.error('Usage : node scripts/grant-event.js <compte-de-service.json> <evenement> --list | --apply <uid>…'); process.exit(1); }
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))) });
const db = admin.firestore();
(async () => {
  if (mode === '--list') {
    const ptu = await db.collection('ptu_players').get();
    console.log(`Comptes PTU (bêta-testeurs potentiels) : ${ptu.size}`);
    for (const d of ptu.docs) {
      const live = await db.collection('players').doc(d.id).get(), ls = live.exists ? (live.data().state || {}) : null;
      const pseudo = (ls && ls.pseudo) || (d.data().state || {}).pseudo || '(sans pseudo)';
      console.log(`- ${d.id} · ${pseudo} · compte Live : ${live.exists ? 'oui' : 'NON'}${ls && (ls.events || []).includes(ev) ? ` · a déjà « ${ev} »` : ''}`);
    }
    return;
  }
  if (!uids.length) { console.error('Aucun uid donné.'); process.exit(1); }
  for (const uid of uids) {
    const ref = db.collection('players').doc(uid);
    const r = await db.runTransaction(async tx => {
      const snap = await tx.get(ref); if (!snap.exists || !snap.data().state) return 'pas de sauvegarde Live';
      const st = snap.data().state, evs = Array.isArray(st.events) ? st.events : [];
      if (evs.includes(ev)) return 'déjà attribué';
      tx.update(ref, { 'state.events': evs.concat(ev), 'state.rev': (st.rev || 0) + 1 });
      return 'attribué';
    });
    console.log(`- ${uid} : ${r}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
