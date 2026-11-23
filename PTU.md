# PTU — version de test publique (canal « ptu ») vs live

## Principe
Même code sur les deux dépôts. Le canal se déduit de l'adresse (`channel.js`) : **live** = `github.io/coffre_des_arcanes/` uniquement ; **tout le reste = PTU** (dépôt dev, localhost, copie).
| | Live | PTU |
|---|---|---|
| Firestore | `players` `leaderboard` `push` `promo_codes` | `ptu_players` `ptu_leaderboard` `ptu_promo_codes` (jamais `push` : notifications désactivées) |
| localStorage | `arcane-*` `coffre-*` | `ptu-arcane-*` `ptu-coffre-*` (même origine, jamais de clé commune) |
| Cache SW | `arcane-vault-cache-…` | `ptu-arcane-vault-cache-…` (chaque SW ne supprime que ses caches) |
| Thème | violet/bleu | orange « Légendaire » + badge PTU + titre `[PTU]` |

- **Garde-fou** (`channel.js` → `wrapFirestore`) : en PTU, `setDoc` / `updateDoc` / `deleteDoc` / transactions refusent tout chemin hors `ptu_*`. Le PTU ne peut lire le live qu'UNE fois (copie à l'entrée).
- **Entrée** : fenêtre « copier mon live » ou « repartir de zéro ». `PTU_ENTRY_MODE` (`script.js`) : `'ask'` | `'copy'` | `'zero'` impose le choix selon le test voulu. Réinitialisation : Menu › Options › Compte PTU (supprime `ptu_players/{uid}` + `ptu_leaderboard/{uid}` et les clés `ptu-*` ; le live n'est jamais touché).
- **Clicker en PTU** : n'écrit rien tant que le Coffre n'a pas créé le compte PTU.
- **Récompenses** : rien ne repart vers le live ; passer par codes promo / skins (script d'admin plus tard).

## Checklist de bascule dev → officiel (À SUIVRE À LA LETTRE)
1. **Ne PAS copier** `manifest.json` (nom/couleur PTU) ni d'éventuelles icônes PTU : garder ceux de l'officiel.
2. Copier tout le reste (dont `channel.js`, `nav.js`). Aucun réglage de canal à faire : l'adresse suffit.
3. Domaine personnalisé un jour : ajouter son nom dans `LIVE_HOSTS` de `channel.js` (sinon l'appli passerait en PTU : données live intactes mais thème orange).
4. `scripts/backup-players.js` puis `scripts/check-migration.js` (MIGRATION.md) AVANT.

## Règles Firestore — CONSTAT DU 2026-11-23 (à corriger, voir MEMOIRE.md)
Testé avec le compte test : **n'importe quel joueur connecté peut LIRE tous les documents `players` (état complet des inventaires) et ÉCRIRE dans n'importe quelle collection/document, y compris ceux d'un autre uid** (écriture dans `ptu_players/<autre uid>` et dans une collection inconnue : acceptée). Cela permet à un joueur de modifier un autre compte via la console du navigateur.
Proposition (à publier APRÈS relecture des règles actuelles, surtout `promo_codes`, et test avec une sonde) :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function me(uid) { return request.auth != null && request.auth.uid == uid; }
    // Lecture conservée pour l'ancien classement live (lit tout `players`) : à resserrer quand le live n'en dépend plus.
    match /players/{uid} { allow read: if request.auth != null; allow create, update, delete: if me(uid); }
    match /leaderboard/{uid} { allow read: if request.auth != null; allow create, update, delete: if me(uid); }
    match /push/{uid} { allow read, write: if me(uid); }
    match /ptu_players/{uid} { allow read, write: if me(uid); }
    match /ptu_leaderboard/{uid} { allow read: if request.auth != null; allow write: if me(uid); }
    // promo_codes : reprendre la règle EXISTANTE (relire la console) en gardant la logique d'usage unique.
    match /{document=**} { allow read, write: if false; }
  }
}
```
Sauvegarde du 2026-11-23 (avant toute modif des règles) : `..\_sauvegardes-firebase\backup-firestore-2026-11-23-18-19.json` (hors dépôt ; contient des données privées et des jetons : ne jamais l'envoyer en ligne).
