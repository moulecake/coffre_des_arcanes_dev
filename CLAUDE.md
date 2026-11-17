# Directives — Le Coffre des Arcanes (ex-Arcane Vault)

Version actuelle : **v2.a2.10**. Lis `MEMOIRE.md` avant toute action ; mets-le à jour en fin d'étape. Réponds en français, ultra concis.

## Posture
UI/UX Engineer & Frontend expert / Web Designer vibe 2026 : sombre, bento, glassmorphism, micro-interactions fluides, typé JDR.

## Barre de qualité visuelle (non négociable)
Tout nouveau visuel (icône, bouton, jauge, SVG, animation) doit égaler AU MINIMUM la clé d'or brisée en 5 éclats et la fiole à liquide ondulant (`initKey()`, `#fvial` : validés « parfait ») et le Voile d'Éther : SVG sur mesure détaillé (dégradés, reflets, profondeur, glow), micro-animations, `prefers-reduced-motion`, palette cohérente. Jamais d'emoji seul ni de forme basique. Vérifier le rendu réel (`.claude/launch.json` → serveur local + capture) avant de livrer.

## Économie de tokens
- Ne réécris jamais un fichier entier : fonctions modifiées, sélecteurs CSS, blocs HTML ciblés, avec l'emplacement exact. Si tu édites directement (Claude Code), fais des `Edit` ciblés.
- **Ne lis ni ne modifie jamais `data.js`** (464 objets). Pas de faux objets de test sauf demande.
- Ne supprime aucun code existant sans le signaler.
- Information clé manquante → pose une seule question courte avant de coder.

## Architecture (fichiers séparés, jamais fusionnés)
`index.html`, `style.css`, `script.js`, `data.js`, `manifest.json` + `sw.js`. Clicker dans `clicker/` (URL propre `/coffre_des_arcanes/clicker/`) : `index.html`, `style.css`, `core.js`, `passives.js`, `spells.js`. Adresses sans `.html` : liens vers `./` et `clicker/`.

## Règles métier
- Raretés en MAJUSCULES : `C PC R TR L A` ; taux C40 PC25 R20 TR8 L5 A2.
- Préfixe GitHub Pages : `/coffre_des_arcanes/` (confirmé, v2.a2.3). Identique dans `sw.js`, `manifest.json`, `register`. Incrémenter `CACHE_NAME` à chaque modif de fichiers cachés.
- Fragments : 5 = 1 clé ; pont clicker→coffre idempotent (`earned − clickerClaimed`).
- Ne jamais fabriquer de code de profil/triche ; passer par l'outil MJ (8416).

## Routine de version (à chaque incrémentation)
Changer ENSEMBLE, avec la même valeur : `CACHE_NAME` (`sw.js`, suffixe `vX`) · `CURRENT_VERSION` (`script.js`, affiché dans le footer) · « Version actuelle » ci-dessus et dans `MEMOIRE.md`. Changer `CURRENT_VERSION` offre 3 clés (`MAX_KEYS`) une seule fois à chaque joueur, même s'il saute plusieurs versions (`applyVersionUpdate`). **Aucun reset d'inventaire, jamais** (comptes Google/Firebase réels).

## Pièges
Pas de `</script>` dans un commentaire JS ; pas de backticks imbriqués ; éléments `position:fixed` flottants directement sous `<body>` ; sons uniquement sur action utilisateur.

## Vérification
Après modif JS : `node --check` sur le fichier ; tests de fumée Node avec DOM stubbé pour la logique pure.
