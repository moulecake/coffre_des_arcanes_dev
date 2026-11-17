---
description: Contrôle rapide de cohérence du projet avant livraison
---
Vérifie sans rien modifier, puis liste uniquement les écarts :
- `node --check` sur `script.js` et `clicker/*.js`.
- Raretés : uniquement `C PC R TR L A` en majuscules dans scripts et CSS.
- Chemins : `manifest.json` (`start_url`, `scope`), `sw.js` et `navigator.serviceWorker.register` utilisent le même préfixe de dépôt.
- `sw.js` : le cache liste tous les fichiers servis (clicker inclus) et son nom de cache a été incrémenté si les fichiers ont changé.
- Aucun `</script>` dans un commentaire JS ; aucun backtick imbriqué.
- `data.js` non modifié (`git diff --stat data.js` vide).
- Versions : `CACHE_NAME` (`sw.js`) et `CURRENT_VERSION` (`script.js`) portent le même numéro, identique à « Version actuelle » de `CLAUDE.md`.
