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
**Règles actuelles trouvées dans la console (2026-11-23)** : règle de démarrage `match /{document=**} { allow read, write: if request.time < timestamp.date(2026, 12, 3); }` (ouverte à TOUS, même non connectés) + `push/{uid}` propriétaire. **Le 3 décembre 2026 tout accès client serait refusé : l'appli (live et PTU) cesserait de fonctionner.**
Version corrigée : **`firestore.rules`** (à la racine du dépôt). À coller dans Console › Firestore › Règles › remplacer tout › Publier. Chacun ne lit/écrit que ses documents ; codes promo : lecture d'un code par son identifiant seulement, mise à jour limitée au joueur concerné ; collections inconnues fermées. L'ancienne version des règles est conservée plus bas pour revenir en arrière.
Sauvegarde du 2026-11-23 (avant toute modif des règles) : `..\_sauvegardes-firebase\backup-firestore-2026-11-23-18-19.json` (hors dépôt ; contient des données privées et des jetons : ne jamais l'envoyer en ligne).


### Règles AVANT correction (retour arrière possible)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 12, 3);
    }
    match /push/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
