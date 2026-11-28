// ============================================================
// CANAL : « live » (officiel, joueurs) ou « ptu » (test public, dépôt dev, localhost…). Chargé EN PREMIER (script classique, non différé).
// Même code sur les deux dépôts : le canal se déduit de l'ADRESSE, sans rien changer à la bascule vers l'officiel.
//  - live  = github.io/coffre_des_arcanes/…  (et rien d'autre)
//  - ptu   = tout le reste (coffre_des_arcanes_dev, localhost, copie, fork) → ne peut JAMAIS écrire dans les données live.
// Domaine personnalisé un jour ? Ajouter son nom dans LIVE_HOSTS ci-dessous (sinon l'appli passerait en PTU : données live intactes, mais thème orange).
// ============================================================
(function () {
  'use strict';
  var LIVE_HOSTS = [{ host: 'moulecake.github.io', path: /^\/coffre_des_arcanes\// }];
  var h = location.hostname, p = location.pathname;
  var live = LIVE_HOSTS.some(function (x) { return x.host === h && x.path.test(p); });
  var ptu = !live;
  var LS = ptu ? 'ptu-' : '';

  // stockage local : clés préfixées en PTU (même origine que le live = même localStorage, donc jamais de clé commune)
  function lsk(k) { return LS + k; }
  function ownKey(k) { return ptu ? k.indexOf('ptu-') === 0 : (k.indexOf('arcane-') === 0 || k.indexOf('coffre-') === 0); }
  // efface UNIQUEMENT les clés du canal courant (l'ancien localStorage.clear() aurait aussi vidé l'autre version)
  function clearLocal() { try { Object.keys(localStorage).filter(ownKey).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {} }
  // Firestore : collections préfixées en PTU
  function col(name) { return ptu ? 'ptu_' + name : name; }

  // GARDE-FOU : en PTU, toute écriture Firestore hors ptu_* est refusée (setDoc, updateDoc, deleteDoc, transactions).
  function checkWrite(ref) {
    if (!ptu) return;
    var path = ref && ref.path ? String(ref.path) : '';
    if (path.indexOf('ptu_') !== 0) throw new Error('[PTU] écriture refusée hors ptu_* : ' + path);
  }
  function wrapFirestore(f) {
    var o = {}; Object.keys(f).forEach(function (k) { o[k] = f[k]; });
    if (f.setDoc) o.setDoc = function (r) { checkWrite(r); return f.setDoc.apply(null, arguments); };
    if (f.updateDoc) o.updateDoc = function (r) { checkWrite(r); return f.updateDoc.apply(null, arguments); };
    if (f.deleteDoc) o.deleteDoc = function (r) { checkWrite(r); return f.deleteDoc.apply(null, arguments); };
    if (f.runTransaction) o.runTransaction = function (db, fn, opt) {
      return f.runTransaction(db, function (tx) {
        return fn({
          get: function (r) { return tx.get(r); },
          set: function (r) { checkWrite(r); return tx.set.apply(tx, arguments); },
          update: function (r) { checkWrite(r); return tx.update.apply(tx, arguments); },
          delete: function (r) { checkWrite(r); return tx.delete.apply(tx, arguments); }
        });
      }, opt);
    };
    return o;
  }

  window.CHANNEL = { name: live ? 'live' : 'ptu', live: live, ptu: ptu, lsk: lsk, col: col, clearLocal: clearLocal, wrapFirestore: wrapFirestore, checkWrite: checkWrite };
  // ÉPOQUE DU PTU (v2.a3.36) : l'augmenter efface, au 1er passage de chaque testeur, ses données PTU LOCALES (clés « ptu-* » seulement, jamais le live).
  // Sert quand la base PTU a été vidée : sans ça, l'ancienne sauvegarde locale du testeur serait renvoyée dans la nouvelle base à la réouverture.
  var PTU_EPOCH = 2;
  if (ptu) { try { if (localStorage.getItem('ptu-epoch') !== String(PTU_EPOCH)) { clearLocal(); localStorage.setItem('ptu-epoch', String(PTU_EPOCH)); } } catch (e) {} }
  // PTU FERMÉ (v2.a3.36) : en ligne, toute page du PTU (Coffre, Clicker) est redirigée vers ferme.html. En local (localhost) le jeu reste utilisable pour développer.
  // À LA RÉOUVERTURE : passer PTU_FERME à false (voir MEMOIRE.md « PTU fermé »). Sans effet sur le live (la condition exige le canal PTU).
  var PTU_FERME = true;
  var local = ['localhost', '127.0.0.1', '[::1]'].indexOf(h) >= 0;
  if (ptu && PTU_FERME && !local && !/\/ferme\.html$/.test(p)) {
    try { var me = document.currentScript && document.currentScript.src; location.replace(new URL('ferme.html', me || location.href).href); } catch (e) {}
  }

  if (ptu) {
    document.documentElement.classList.add('ptu');                                    // thème orange « Légendaire » + badge (style.css)
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', '#2a1204');
    try { if (document.title && document.title.indexOf('[PTU]') !== 0) document.title = '[PTU] ' + document.title; } catch (e) {}
  }
})();
