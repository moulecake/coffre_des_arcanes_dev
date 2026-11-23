// ============================================================
// NAV — bouton « retour » natif (◁ Android / geste iOS) : ferme la fenêtre ouverte au lieu de quitter la page.
// Partagé par le Coffre et le clicker. Chaque fenêtre est déclarée avec Nav.add(nom, {open, close}).
//  - open()  : vrai si la fenêtre est affichée (lu à chaque changement de style/classe/hidden) ;
//  - close() : ferme la fenêtre (la fonction de fermeture EXISTANTE, pas de logique en double).
// Ordre de déclaration = ordre d'empilement quand plusieurs s'ouvrent ensemble (parent d'abord).
// Aucune URL n'est modifiée (history.pushState sans adresse) ; sans fenêtre ouverte, le retour garde son comportement normal.
// ============================================================
const Nav = (() => {
  const reg = [], stack = [], entries = [];           // stack = fenêtres ouvertes ; entries = entrées d'historique poussées (null = fermée hors ordre)
  let silent = 0, queued = false;
  const safe = f => { try { return !!f(); } catch (e) { return false; } };
  const add = (name, o) => { reg.push({ name, open: o.open, close: o.close }); schedule(); };
  // rAF seul est suspendu dans un onglet en arrière-plan : on double avec un court setTimeout (le premier qui passe gagne)
  const schedule = () => { if (queued) return; queued = true; const go = () => { if (!queued) return; queued = false; sync(); }; requestAnimationFrame(go); setTimeout(go, 60); };
  function sync() {
    reg.forEach(r => {
      const on = safe(r.open), at = stack.indexOf(r.name);
      if (on && at < 0) { stack.push(r.name); entries.push(r.name); try { history.pushState({ nav: r.name }, ''); } catch (e) {} }
      else if (!on && at >= 0) {
        stack.splice(at, 1);
        const i = entries.lastIndexOf(r.name);
        if (i === entries.length - 1) { entries.pop(); silent++; history.back(); }   // fermée par le code (✕, fond…) : on retire notre entrée
        else if (i >= 0) entries[i] = null;                                          // fermée hors ordre : entrée neutralisée
      }
    });
  }
  addEventListener('popstate', () => {
    if (silent > 0) { silent--; return; }
    if (!entries.length) return;                      // plus de fenêtre : retour normal du navigateur
    const name = entries.pop(), r = reg.find(x => x.name === name);
    if (name) { const at = stack.indexOf(name); if (at >= 0) stack.splice(at, 1); if (r && safe(r.open)) safe(() => { r.close(); return 1; }); }
    let dead = 0; while (entries.length && entries[entries.length - 1] === null) { entries.pop(); dead++; }
    if (dead) { silent++; history.go(-dead); }        // saute les entrées neutralisées
    sync();                                           // si la fenêtre résiste à la fermeture (étape intermédiaire), on la ré-empile
  });
  const obs = new MutationObserver(schedule);
  const start = () => { obs.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] }); schedule(); };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start); else start();
  // helpers pour déclarer les cas courants (plusieurs éléments de même id tolérés)
  const all = id => Array.from(document.querySelectorAll('[id="' + id + '"]'));
  const shown = id => all(id).some(e => e.style.display && e.style.display !== 'none');
  const hasClass = (id, c) => all(id).some(e => e.classList.contains(c));
  const visible = id => all(id).some(e => !e.hidden);
  return { add, sync, shown, hasClass, visible };
})();
