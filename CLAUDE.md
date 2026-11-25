# Directives — Le Coffre des Arcanes (ex-Arcane Vault)

Version actuelle : **v2.a3.26** (série alpha « a3 » : 2.a3.0, 2.a3.1 … 2.a3.26…, prépare la v3 Aventures ; `cmpVer` lit « aN » comme 1000+N, donc 2.2.0 < 2.a3.0). Lis `MEMOIRE.md` avant toute action ; mets-le à jour en fin d'étape. Réponds en français, ultra concis.

## Posture
UI/UX Engineer & Frontend expert / Web Designer vibe 2026 : sombre, bento, glassmorphism, micro-interactions fluides, typé JDR.

## Barre de qualité visuelle (non négociable)
Tout nouveau visuel (icône, bouton, jauge, SVG, animation) doit égaler AU MINIMUM la clé d'or brisée en 5 éclats et la fiole à liquide ondulant (`initKey()`, `#fvial` : validés « parfait ») et le Voile d'Éther : SVG sur mesure détaillé (dégradés, reflets, profondeur, glow), micro-animations, `prefers-reduced-motion`, palette cohérente. Jamais d'emoji seul ni de forme basique. Vérifier le rendu réel (`.claude/launch.json` → serveur local + capture) avant de livrer.

## Économie de tokens
- Ne réécris jamais un fichier entier : fonctions modifiées, sélecteurs CSS, blocs HTML ciblés, avec l'emplacement exact. Si tu édites directement (Claude Code), fais des `Edit` ciblés.
- `data.js` (catalogue ~464 objets, fichier volumineux) : lecture ET édition AUTORISÉES par l'utilisateur (2026-11-17) — mais le lire par extraits (Grep, Read avec limite) ou par scripts de comptage plutôt qu'en entier, pour économiser les tokens. Pas de faux objets de test dans l'appli sauf demande.
- Ne supprime aucun code existant sans le signaler.
- Information clé manquante → pose une seule question courte avant de coder.

## Architecture (fichiers séparés, jamais fusionnés)
`index.html`, `style.css`, `script.js`, `data.js`, `nav.js` (retour natif ◁, partagé avec le clicker), `manifest.json` + `sw.js`. Clicker dans `clicker/` (URL propre `/coffre_des_arcanes/clicker/`) : `index.html`, `style.css`, `core.js`, `passives.js`, `spells.js`. Adresses sans `.html` : liens vers `./` et `clicker/`.

## Règles métier
- Raretés en MAJUSCULES : `C PC R TR L A` ; taux C40 PC25 R20 TR8 L5 A2.
- Chemins RELATIFS partout (plus de préfixe de dépôt écrit en dur depuis v2.a2.17) : le même code tourne sur `/coffre_des_arcanes/` (officiel) et `/coffre_des_arcanes_dev/` (test). `sw.js` déduit sa base de `self.registration.scope`. Incrémenter `CACHE_NAME` à chaque modif de fichiers cachés.
- Deux dépôts, UN SEUL Firebase : `coffre_des_arcanes_dev` (branche `dev`, test) et `coffre_des_arcanes` (officiel, joueurs). Rien n'est poussé sans accord explicite de l'utilisateur. La tâche programmée de notifications ne doit tourner que sur l'officiel (déjà protégé dans le workflow et le script).
- Fragments : 5 = 1 clé ; pont clicker→coffre idempotent (`earned − clickerClaimed`).
- Ne jamais fabriquer de code de profil/triche ; passer par l'outil MJ (8416).

## Routine de version (à chaque incrémentation)
Changer ENSEMBLE, avec la même valeur : `CACHE_NAME` (`sw.js`, suffixe `vX.Y.Z`) · `CURRENT_VERSION` (`script.js`, affiché dans le footer) · « Version actuelle » ci-dessus et dans `MEMOIRE.md` · AJOUTER l'entrée du patchnote en tête de `patchnotes.js` (affichée une fois à chaque joueur). Format de version : `2.a3.Z` en cours (ou `2.Y.Z` ; le « 2 » ne change jamais, voir plus bas). Changer `CURRENT_VERSION` offre 3 clés (`MAX_KEYS`) une seule fois à chaque joueur, même s'il saute plusieurs versions (`applyVersionUpdate`). **Aucun reset d'inventaire, jamais** (comptes Google/Firebase réels).

## Synchro & données joueurs (CRITIQUE — voir MIGRATION.md)
- **Seul `syncState()` (script.js) écrit `players/{uid}.state`** : transaction + `rev` + fusion à 3 voies + garde-fou « aucun objet unique retiré » + `backups.*`. Jamais de `setDoc` direct sur `state`.
- **Le « 2 » de `CURRENT_VERSION` ne change JAMAIS** (l'officiel 2.0.2 remet l'inventaire à zéro si le chiffre avant le point change). Aucun reset d'inventaire dans le code.
- Avant toute bascule vers l'officiel : suivre MIGRATION.md (`scripts/backup-players.js` puis `scripts/check-migration.js`).
- Les clés de compte de service et les sauvegardes de joueurs ne vont JAMAIS dans le dépôt (`.gitignore`).

## Pièges
Pas de `</script>` dans un commentaire JS ; pas de backticks imbriqués ; éléments `position:fixed` flottants directement sous `<body>` ; sons uniquement sur action utilisateur.

## Vérification
Après modif JS : `node --check` sur le fichier ; tests de fumée Node avec DOM stubbé pour la logique pure.
