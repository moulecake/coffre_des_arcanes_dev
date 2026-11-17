# MEMOIRE — Le Coffre des Arcanes (ex-Arcane Vault) + Clicker

> Handoff pour le Claude qui continue le dev. À lire en premier, à mettre à jour à la fin de chaque étape.
> Dernière mise à jour : 2026-11-16. **Version : v2.a2.10** (code à jour = dossier de travail, pas le zip de handoff). Langue de travail : français. Utilisateur : MJ de JDR D&D, non-dev, colle les blocs à la main.

## ⏰ RAPPELS (à traiter par Claude dès qu'on est à la date)
- **À partir du 2026-11-24** : supprimer le correctif temporaire des raretés dans `script.js` (bloc `TEMP_RARITY_FIX` + sa branche dans `unpackInventory`, voir le commentaire « À SUPPRIMER APRÈS LE 2026-11-24 ») après avoir demandé à l'utilisateur si tous les alphatesteurs ont rechargé depuis la correction C/PC de `data.js`. Rappeler aussi : supprimer le bloc `#sync-modal` commenté dans `index.html` et décider du repli `players` du classement (à retirer une fois les règles Firestore resserrées).

## 0. Points à trancher AVANT de coder
1. Sprint 4 : plafond passif fixé à 25 clés/jour (défauts validés 2026-11-16).
2. `pageshow` : aucun appel à `claimClickerFragments` sur cet événement dans `script.js` (prévu au §5) ; à ajouter ou à abandonner.
3. Règles Firestore non vues ; `saveState()` écrit au cloud à chaque appel (debounce ?).
_Résolu 2026-11-16 : préfixe = `/coffre_des_arcanes/` ; manifest avec icônes 192/512 ; patch `claimClickerFragments` appliqué ; `sw.js` cache le clicker (v2.a2.10) ; bug `inv-btn` parasite retiré de `loadGameDataFromCloud`._

## 1. Fichiers du projet
| Fichier | Rôle | Règle |
|---|---|---|
| `index.html` | Structure + Firebase module (SDK via CDN) + sidebar, modales, footer légal | blocs ciblés seulement |
| `style.css` | Design global | idem |
| `script.js` (v2.a2.10) | Logique Coffre (~1300 l.) | idem |
| `data.js` | 464 objets `const loots = ["Nom\|Lien\|Type\|Rareté", ...]` | **NE JAMAIS LIRE NI MODIFIER** |
| `manifest.json`, `sw.js` | PWA | chemins absolus, cf. §0 |
| `clicker/` | `index.html, style.css, core.js, passives.js, spells.js` (URL `/coffre_des_arcanes/clicker/`, déplacé v2.a2.10 ; pas de MEMOIRE clicker séparée, tout est ici §6) | 5 fichiers Coffre jamais fusionnés ; clicker séparé |

## 2. Règles de l'utilisateur (non négociables)
- Persona : UI Engineer / Web Designer vibe 2026 — dark, bento, glassmorphism, micro-interactions.
- **Ultra concis.** Ne jamais réécrire un fichier entier : fonctions modifiées / sélecteurs / blocs HTML ciblés, avec « remplace X par Y ».
- Ne rien supprimer du code existant sans le dire ; l'utilisateur a déjà dû rappeler cela.
- Pas de faux objets de test sauf demande.
- Raretés STRICTEMENT majuscules : `C PC R TR L A`. Taux : C40 / PC25 / R20 / TR8 / L5 / A2.
- Info clé manquante → pause et question (une seule, courte).
- Lire ce fichier au début, le mettre à jour à la fin de chaque étape.
- **Refusé et à refuser** : fabriquer un code de profil/triche (`AV1-…`) avec des objets. Proposer l'outil MJ à la place.

## 3. Coffre — fonctionnement
- Constantes (`script.js`) : `CURRENT_VERSION="2.a2.3"`, `MAX_KEYS=3` (dépassable via fragments), `REGEN_MS=4h`, `FRAGS_PER_KEY=5`, `LSKEY='arcane-vault'`.
- Versioning : tout changement de `CURRENT_VERSION` offre `MAX_KEYS` clés UNE fois par joueur (`applyVersionUpdate`, appelée après fusion local/cloud, `Math.max` : jamais de clés retirées). **Plus aucun reset d'inventaire** (décision 2026-11-17, comptes Firebase réels). Bug corrigé : `Number('a2')` = NaN rechargeait les clés à chaque chargement.
- État : `{version, pseudo, keys, lastRegen, inventory{lootStr:count}, fragments, activeTrade, lastTradeNonce, processedNonces, clickerClaimed, mjAdded}`. Clé d'inventaire = ligne complète de loot ; la rareté affichée vient de `actualRarity` (cascade de repli quand une rareté est vide — a causé « PC affiché R »).
- Tirage : rareté d'abord (table ci-dessus), puis objet au hasard dans cette rareté.
- Profil : pseudo persistant. Export/import `AV1-` + Base64 (`btoa(unescape(encodeURIComponent(json)))`), anti-rollback via `lastTradeNonce`. Inspection par code (lecture seule) séparée du bouton d'écrasement.
- Troc asynchrone `AV-TRD-…` en 2 étapes : donneur perd A → receveur choisit B et reçoit un code `B-XXXX` → donneur valide et reçoit B. Annuler = perte des deux (voulu). Sélecteur de troc : `c>=1`, `refreshTradeSelect()` appelé dans `openSidebar`.
- Sidebar : accordéon « 🔮 Pactes & Grimoires » avec verrouillage anti-softlock ; `.locked` ne doit pas bloquer le re-clic sur l'en-tête ; le cadenas ne doit **jamais** ouvrir le MJ (garde `sidebar.contains(e.target)`) ; sidebar `overflow-y:auto` avec scrollbar discrète.
- MJ : code **8416** (5 clics rapides sur logo / bouton inventaire) → reset clés, forcer prochain drop L, `mjAddItem` (utiliser `parseInt(raw.trim())`, comparer à `display.length`).
- Audio Web Audio procédural (`playClickSound`, `playRevealSound`) + `navigator.vibrate`.
- Footer légal micro + modale unique (mentions, confidentialité, accessibilité).

## 4. Firebase
- Projet `coffre-des-arcanes`, Google Auth. Globals exposés par le module de `index.html` : `window.auth, db, doc, setDoc, getDoc, collection, getDocs, onAuthStateChanged, signInWithPopup, signOut`.
- Firestore `players/{uid}` = `{pseudo, state:{…}, clicker:{json, earned, ts}, lastUpdated}` ; écritures `setDoc(..., {merge:true})`. Classement : `getDocs(collection(db,'players'))` (`openLeaderboardModal`).
- Fonctions cloud côté Coffre : `saveState`, `loadState`, `saveGameDataToCloud`, `loadGameDataFromCloud(uid)`.
- ⚠ `saveState()` écrit aussi dans le cloud à chaque appel → risque quota ; envisager debounce.
- Règles de sécurité Firestore : non vues, à vérifier (chaque joueur n'écrit que son doc).

## 5. Pont Coffre ⇄ Clicker (fragments de clés)
- Le clicker gagne des fragments (`S.fr.earned` cumulé) ; le Coffre calcule `d = earned − state.clickerClaimed`, ajoute à `state.fragments`, convertit 5 → 1 clé, sauve, toast. **Idempotent.**
- Patch à coller dans `script.js` : fonction `claimClickerFragments(cloudEarned)` (lit `localStorage['coffre-clicker'].fr.earned`), appelée en fin de `loadState()`, dans `loadGameDataFromCloud` (`docSnap.data().clicker?.earned`) et sur `pageshow`.
- Équilibrage actif : fenêtre d'effort 300 s (`FR_SEC`), 9 fragments/jour (`FR_DAY`) ; 10–15 min de jeu intense ≈ 1–2 fragments.

## 6. Clicker — architecture 
- `clicker/core.js` (~22 Ko) : état `S`, boucle, Voile (orbe SVG liquide/réseau), Grimoire double page (jauge de page `S.g`), Éther/Sagesse, fragments (`fragTick`), hors-ligne `away(sec)` (`M("offlineCap",8)` h), cloud (`cloudSave(force)`, `cloudLoad` : `S.seen` le plus récent gagne, `earned` = max), curseur custom (enfant direct de `<body>`), sons seulement sur action utilisateur.
- `clicker/passives.js` : 6 bâtiments (Ancrage Runique, Pylône de Stase, Boussole Arcanique → Voile/Éther ; Lutin Scribe, Bougie d'Invocation, Homoncule Liseur → Grimoire/Sagesse), coût `base×1.15^n`, paliers ×2 à 10/25/50/100 ; `Passives.calc()` → `{clickV, ethPS, pagesPS, sgPage, sgPS, pageClick, rare}`.
- `clicker/spells.js` : 8 écoles (evo enc ill nec abj div tra con), 32 sorts, Amphithéâtre (75/750/7500/75000 Sg ; 30 s/5 min/30 min/3 h), decks (max 8), Gold Sink (seuil 15 s ; payer 50+90 s Éther ou 20+90 s Sg, sinon pénalité 30 s), hooks `M(key, def)` : click, ether, passive, pylon, famil, scribe, pagesFlat, sg, rare, redX, ethCost, sgCost, buffDur, offlineCap, offlineSg, cps, cd, study.
- Unités : nL→EL (`fE`), suffixes Sagesse (`fN`). Timers = timestamps absolus. LocalStorage `coffre-clicker`.
- UI : `clicker.html` (retour `index.html` « ← Retour au Coffre », bouton « 🗂 Decks », puces `#eth #fr #sg`, `#orb.veil`, `#tome.book`), modales pick/dk/gate z-index 22/23.

## 7. Roadmap
### Sprint 4 — micro-fragments passifs : **CODÉ (v2.a2.10), à tester en jeu**
- `clicker/core.js` : `keysPerDay(ethPS)` (courbe log 1e1→0,1 · 1e6→1 · 1e9→5 · 1e12→12 · 1e15→22 · 1e17→25 ; <10 proportionnel), `fragRate`, `getFr` (reset quotidien today+pday), `microAdd` (100 micro = 1 fragment → `S.fr.earned`, plafond `FR_PCAP`=125/jour, séparé des 9 actifs), `mergeFr` étendu (`micro`, `pday`), `away()` ajoute les micro hors-ligne (plafond `offlineCap`). Sync cloud seulement à chaque fragment entier ; aucun son (toast seul).
- Hooks (`clicker/spells.js`) : `frag` ×1,15 (Alchimie Mineure) et ×1,25 (Philosophie de la Matière) ; `fragOff` ×1,2 (Vision du Passé, hors-ligne seul) ; plafond appliqué après multiplicateurs.
- Visuel (refonte v2.a2.10) : clé d'or VERTICALE (anneau en bas + joyau rouge, panneton en haut) générée par `initKey()` en 5 éclats collés, cassures en zigzag à graine fixe ; éclats `.kp` (0 = anneau+joyau … 4 = panneton, s'allument de bas en haut), fissures `.kcr`. Fiole ronde à long col, liquide dégradé cyan→violet (comme le Voile), 2 vagues animées + bulles, niveau = `#fvL` translateY. Segments = `(state.fragments + non réclamés) % 5` (lu via `cloudLoad`, repli `earned % 5`) ; à 5/5 pulse puis vol vers « ← Retour au Coffre ». Grains Voile→fiole ≤6/s. Étoiles de fond (`initStars`, 80) comme `index.html`. `prefers-reduced-motion` respecté.
- Piège : la classe `.fr` existe déjà (runes volantes) → ne pas la réutiliser ; ids du chip : `fkey fvial fvL fr frs frm` ; classes `.kp .kcr .kgem .fvw .fvb` (ne pas réutiliser `.ks`, ancien).
- À valider : équilibrage réel, rendu mobile (`.res` passe en flex-wrap), et que l'animation de clé ne se déclenche pas à tort au chargement.
### v2.a2.10 — retours utilisateur (2026-11-17)
- Surchauffe : `CPS_PALIERS=[5,10,15]` en tête de `clicker/spells.js` (commentaire ★ éditable) ; base 5 ; Bouclier d'Éther équipé = 10 (Abjuration rang 1-2) ou 15 (rang 3-4) ; chaleur +10/clic, −(cps×10)/s. Texte « Limite : N clics/s » sous la barre.
- Mise en page : `.duo>.pane` en sous-grille (8 rangées communes, `@supports subgrid`) → pastille d'état, barre (`.heat` = `.pgbar` = 8 px), texte, sorts alignés Voile/Grimoire. `#heatTxt` est maintenant une pastille `.buff` ; « Sg lues » → « Runes décryptées ».
- Bouton Decks déplacé dans l'Amphithéâtre (`.amh`, `#dkopen`, SVG éventail de cartes, ancien `.gear.wide` du header supprimé/inutilisé). Bouton Retour = `a.back` avec coffre SVG (couvercle qui s'entrouvre au survol, s'ouvre quand la clé arrive, classe `got`) ; préfixes CSS `cb-` (retour) et `dk-` (decks) — ne pas utiliser `bk-` (livre).
- SW : non enregistré sur localhost/127.0.0.1 (`isLocalDev` dans `script.js`) → plus d'erreur 404 en Live Server ni de cache périmé en dev. L'erreur `ERR_BLOCKED_BY_CLIENT` sur `firestore.googleapis.com/.../Listen/channel ... TYPE=terminate` vient d'un bloqueur de pub/extension : inoffensive, aucune correction.
### v2.a2.10 — nettoyage + slot Soutien (2026-11-17)
- Profil : slot 3 = « Soutien » (même SVG tasse + lien ko-fi que le footer).
- Code mort retiré : `closeSidebar` (accordéon Pactes : DOM absent → TypeError), 3 appels à `refreshTradeSelect()` (fonction inexistante → ReferenceError à chaque ouverture d'inventaire / recyclage), lecture de `state.activeTrade` ; CSS orphelin (`.share-section .share-title .share-warning .inspect-readonly-badge .inspect-overlay-bg #inspect-panel .trade-* .share-btn-trade`). `#sync-modal` (fusion local⇄cloud / import AV1, sans aucun appelant ni fonction) mis EN COMMENTAIRE dans `index.html` ; `.inspect-textarea` et `.share-btn-load` gardés pour lui. Aucune ligne Firebase/Auth touchée.
- Vérifié (test réel) : Bouclier d'Éther équipé rang 1 → limite 10 clics/s ; à 12 clics/s la surchauffe met ~8 s (chaleur = 10 × (cps réels − limite) par s), à 20 clics/s 1,2 s : mécanique correcte mais « molle » près de la limite → à discuter (voir questions ouvertes).
- En attente de décisions : points de rareté A pour le recyclage, format compact d'inventaire Firebase, URL sans .html / dossier clicker/.
### v2.a2.10 — décisions du 2026-11-17
- Surchauffe : pause = limite en secondes (5 cps → 5 s, 10 → 10 s, 15 → 15 s), compte à rebours affiché (`hotMs` dans `clicker/core.js`). Autoclicker réel de l'utilisateur ≈ 9,5 cps (cpstest.org) : au-delà de 15 cps = logiciel/triche.
- Recyclage : `RECYCLE_FRAGS` (script.js) C1 PC2 R3 TR4 L5, **A = 5 provisoire** (les doublons d'Artefact n'existent quasi pas ; à décider plus tard) ; bouton « ♻ +N » ; plusieurs clés possibles d'un coup.
- Inventaire compact : en mémoire clés longues inchangées ; à l'écriture (localStorage + Firestore) id court = paramètre `vf=` du lien (`packInventory` / `unpackInventory` / `serializeState` / `mergeCloudState`). Anciennes clés longues relues = migration auto. id absent/doublon dans data.js → clé longue conservée ; data.js non chargé → aucune conversion. Écriture Firestore par `mergeFields:['state',…]` (REMPLACE `state`, sinon les vieilles clés restent). Le classement décompacte avant de compter. Test : −77 % sur 464 objets synthétiques. Console : `inventoryIdStats()` pour voir combien d'objets sont compactés. (Un script Node lisant data.js a été refusé par le mode auto : respecter, ne pas contourner.)
- Clicker déplacé dans `clicker/` ; `manifest.json` : `id` = ancien start_url (identité PWA inchangée) + `start_url` = `/coffre_des_arcanes/` ; SW met aussi en cache `BASE` et `clicker/` ; `index.html` masqué dans la barre d'adresse (`history.replaceState`). Pas de redirection de l'ancien `clicker.html` (décision utilisateur) : un testeur avec l'ancienne version en cache peut avoir 1 rechargement à faire.
- Pseudo : échappé dans le badge de l'inventaire (`escapeLeaderboardHtml`).
- À FAIRE PLUS TARD : panel MJ → compteur de coffres ouverts depuis le début (ajouter `state.chestsOpened` ; ne compte pas l'historique). Idée soumise, non faite : document public léger `leaderboard/{uid}` (pseudo, uniques, total) pour que le classement ne télécharge plus les `players/*` complets ; règles Firestore à fournir ; debounce des écritures cloud écarté pour l'instant (risque : le cloud écrase le local plus récent au rechargement → il faudrait un horodatage `rev`).
### v2.a2.10 — classement léger, compteur, correctif raretés (2026-11-17)
- `data.js` corrigé par l'utilisateur : les « peu commun » étaient |C, ils sont maintenant |PC. Correctif temporaire dans `unpackInventory` : toute clé longue non canonique dont le `vf=` existe dans data.js est ramenée sur la ligne actuelle, quantités ADDITIONNÉES (jamais perdues), l'ancienne clé disparaît à l'enregistrement suivant. Test Node : 6 cas (C seul, C+PC, C+id, id+PC identique, objet disparu…). Console : `[Correctif raretés] n objet(s)…`.
- `state.chestsOpened` : +1 à chaque ouverture (pas pour les ajouts MJ), enregistré dans `players/{uid}.state` et recopié dans `leaderboard/{uid}.chests`. Affichage dans le panel MJ : plus tard.
- Classement : `leaderboard/{uid}` = `{pseudo, discovered, total, chests, updatedAt}` écrit par `syncLeaderboardDoc()` (à chaque sauvegarde si une valeur change + à la connexion). Lecture : `leaderboard` d'abord, repli sur `players` si vide/illisible (transition : un joueur n'apparaît qu'après sa prochaine connexion).
- **Règles Firestore proposées (à coller dans la console, EN GARDANT les règles `promo_codes` existantes, non vues)** :
```
match /leaderboard/{uid} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null && request.auth.uid == uid
    && request.resource.data.keys().hasOnly(['pseudo','discovered','total','chests','updatedAt'])
    && request.resource.data.pseudo is string && request.resource.data.pseudo.size() <= 30;
}
match /players/{uid} {   // à resserrer SEULEMENT quand tous les testeurs ont la nouvelle version (l'ancien classement lit tout `players`)
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```
- Réenregistrement immédiat (`_repack`, `needsRepack`) : si l'inventaire chargé (local ou cloud) contient des clés longues convertibles, `saveState()` est appelé à la fin du chargement → le document Firestore est nettoyé sans attendre une action du joueur.
- **Testé en réel (compte test Eliéta, connecté dans le panneau navigateur)** : écriture `mergeFields` (0 clé longue dans `players`, champs `clicker`/`pseudo`/`fragments`… intacts), `leaderboard/{uid}` écrit/relu, compteur de coffres (mémoire + players + leaderboard), simulation d'un ancien client qui ré-ajoute une clé longue d'ancienne rareté → fusionnée (1+2=3), nettoyée du cloud ; classement : repli sur `players` OK (9 lignes) car le seul doc `leaderboard` existant est le compte test exclu. Aucune erreur de règles Firestore rencontrée (les règles actuelles autorisent déjà `leaderboard`, à resserrer quand même).
- Test réel Google/Firestore : possible en demandant à l'utilisateur de se connecter lui-même (compte test Eliéta) dans le panneau navigateur de Claude ; Claude ne saisit jamais de mot de passe.
### Étape 5 (restée ouverte)
Fait : lien (bouton ⚡ GRIMOIRE) et cache SW. Reste : équilibrage global, popover de sort sur mobile, polish ; confirmer visuellement UI-B / UI-C (UI-A validé « Super beau »).

## 8. Pièges connus (ne pas répéter)
- `</script>` dans un commentaire JS casse la page.
- Backticks imbriqués → perte de coloration de l'éditeur : concaténer.
- `backdrop-filter` crée un bloc contenant pour `position:fixed` : éléments flottants (curseur) en enfants directs de `<body>`.
- Bug de sélecteur `.gear` : le bouton Decks ouvrait le picker (`.gear[data-p]`).
- Boucle de sons en auto-farm : sons uniquement sur geste utilisateur.
- Pages spéciales du Grimoire instables → système de jauge de page.
- Stale `activeTrade` → faux « contrat déjà en cours » : nettoyer.
- Tests Node : stubber les éléments DOM et définir `T`.

## 9. Historique des décisions
Étapes B (profil), C (code partage Base64), D (troc), accordéon Pactes, refonte troc 2 temps, légal, PWA, Firebase, clicker étapes 1–4 + correctifs, Sprint 3 UI-A/B/C (Voile, Grimoire double page, glyphes, Web Audio).
