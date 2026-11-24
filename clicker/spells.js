// Étape 2 : 8 écoles × 4 rangs = 32 sorts · Amphithéâtre (cours payés en Sg, timers réels) · barres de sorts · sélecteur.
// Sorts ÉQUIPÉS : actifs = lancés au clic (CD), passifs = effet permanent. Ils alimentent M(clé, défaut) via Spells.mod.
// Ops : "*" multiplie · "+" ajoute · "=" plancher (max). Clés : click ether passive pylon famil scribe pagesFlat sg rare redX
//       ethCost sgCost buffDur offlineCap offlineSg cps cd study frag fragOff (micro-fragments passifs ; fragOff = hors-ligne seulement)
// ★ RÉGLAGE SURCHAUFFE — clics/s maximum avant surchauffe du Voile : [palier 1, palier 2, palier 3].
//   Palier 1 = de base (sans sort) · Bouclier d'Éther équipé : palier 2 (rangs Abjuration 1-2), palier 3 (rangs 3-4).
//   Chaque clic ajoute 10 de chaleur, la chaleur retombe de (cps × 10)/s : au-delà de ce nombre de clics/s, ça chauffe jusqu'à 100 → surchauffe : pause de (limite) secondes (5 cps → 5 s, 10 → 10 s, 15 → 15 s ; voir `hotMs` dans clicker-core.js).
const CPS_PALIERS = [5, 10, 15];
// ★ RÉGLAGE SÉCURITÉ GRIMOIRE (anti-autoclic) : clics/s maximum sur le Grimoire avant « chaos » ; la pause dure autant de secondes (10 cps → 10 s).
//   Même principe que le Voile : +10 de chaleur par clic, retombe de (cps × 10)/s. Aucun sort ne la modifie pour l'instant.
const CPS_GRIMOIRE = 10;
const Spells = (() => {
  const SCH = [
    ["evo", "Évocation", 25, "<path d='M13 2L4 14h7l-1 8 9-12h-7z'/>"],
    ["enc", "Enchantement", 320, "<circle cx='12' cy='12' r='3'/><circle cx='12' cy='12' r='8'/>"],
    ["ill", "Illusion", 190, "<path d='M4 4l7 5-3 4 4 7M20 4l-7 5 3 4-4 7'/>"],
    ["nec", "Nécromancie", 350, "<path d='M16 3a9 9 0 1 0 5 12A7 7 0 0 1 16 3zM6 20L20 6'/>"],
    ["abj", "Abjuration", 215, "<path d='M12 2l8 5v10l-8 5-8-5V7z'/>"],
    ["div", "Divination", 270, "<circle cx='12' cy='12' r='3'/><path d='M2 12c4-7 16-7 20 0-4 7-16 7-20 0z'/>"],
    ["tra", "Transmutation", 45, "<path d='M6 3h12M6 21h12M7 3c0 6 10 6 10 12v6M17 3c0 6-10 6-10 12v6'/>"],
    ["con", "Conjuration", 150, "<path d='M12 3a9 9 0 1 1-9 9M12 7a5 5 0 1 1-5 5M12 11a1 1 0 1 1-1 1'/>"]
  ];
  // [id, nom, type A/P, panneau V/G/X(les deux), CD s, description]
  const SP = [
    ["evo1", "Projectile Magique", "A", "V", 20, "Libère d'un coup 10 impulsions d'Éther."],
    ["evo2", "Orbe Lumineux", "A", "V", 60, "Burst direct d'Éther Pur."],
    ["evo3", "Boule de Feu Arcanique", "A", "V", 90, "Frénésie d'impulsions automatiques pendant 10 s (≈ 100 impulsions)."],
    ["evo4", "Météore de l'Académie", "P", "V", 0, "Tous les 100 clics : gains d'Éther ×2 pendant 15 s."],
    ["enc1", "Charme-Personne", "P", "G", 0, "−10% de coût en Sagesse des automatisations."],
    ["enc2", "Suggestion", "P", "G", 0, "+15% de vitesse des Scribes."],
    ["enc3", "Domination d'Esprit", "A", "X", 120, "Toutes les automatisations ×2 pendant 30 s."],
    ["enc4", "Mot de Pouvoir : Obéissance", "P", "G", 0, "Les scribes doublent parfois la Sagesse (≈ +20%)."],
    ["ill1", "Lumières Dansantes", "P", "G", 0, "+5% de chance de pages rares."],
    ["ill2", "Image Miroir", "A", "V", 45, "Le prochain clic du Voile compte ×5."],
    ["ill3", "Mot de Divertissement", "P", "G", 0, "Pages rares : lecture +25% · sceau d'Illusion +5 s."],
    ["ill4", "Voile d'Illusion Majeure", "A", "G", 180, "Page Dorée illusoire : Sagesse ×12 pendant quelques secondes."],
    ["nec1", "Faucheur de Tome", "P", "G", 0, "Les pages doublent parfois la Sagesse (≈ +3%)."],
    ["nec2", "Invocation de Squelette Scribe", "P", "G", 0, "Un scribe spectral (0,5 page/s), actif hors-ligne."],
    ["nec3", "Transmutation Vitale", "A", "X", 300, "Convertit 10% de la Sagesse en Éther Pur."],
    ["nec4", "Encre Cramoisie", "P", "G", 0, "La Page Nécrotique rapporte ×6 au lieu de ×4."],
    ["abj1", "Bouclier d'Éther", "P", "V", 0, "Limite de clics/s relevée : 5 → 10 (Abjuration rang 1-2) → 15 (rang 3-4)."],
    ["abj2", "Glyphe de Warding", "P", "X", 0, "Gains hors ligne plafonnés à 10 h au lieu de 8 h."],
    ["abj3", "Disjonction de Mordenkainen", "A", "V", 60, "Nettoie instantanément la surchauffe."],
    ["abj4", "Sanctuaire Absolu", "P", "X", 0, "−15% de recharge des sorts actifs."],
    ["div1", "Augure", "P", "G", 0, "Aperçu de la rareté de la prochaine page."],
    ["div2", "Vision du Passé", "P", "G", 0, "+20% de Sagesse et de micro-fragments hors-ligne."],
    ["div3", "Prescience", "A", "G", 150, "Les 5 prochaines pages sont rares."],
    ["div4", "Vision de l'Avenir", "P", "X", 0, "−25% de temps d'étude des cours."],
    ["tra1", "Alchimie Mineure", "P", "X", 0, "20% de la Sagesse produite devient de l'Éther. +15% de micro-fragments."],
    ["tra2", "Fonte des Runes", "A", "V", 90, "Pylônes ×3 pendant 30 s."],
    ["tra3", "Transmutation de Plomb en Or", "A", "V", 120, "Gains d'Éther ×5 pendant 15 s."],
    ["tra4", "Philosophie de la Matière", "P", "X", 0, "+25% d'efficacité des bâtiments passifs et de micro-fragments."],
    ["con1", "Portail Mineur", "P", "X", 0, "−5% de coût des bâtiments."],
    ["con2", "Invocation de Familier", "P", "V", 0, "Un familier frappe le Voile : 1 impulsion par seconde."],
    ["con3", "Cercle de Téléportation", "A", "X", 240, "Remet à zéro le sort actif au plus long CD équipé."],
    ["con4", "Invocation d'Avatar Arcanique", "A", "X", 300, "Voile et Grimoire à pleine puissance (×3) pendant 10 s."]
  ].map(([id, n, t, pn, cd, d]) => ({ id, k: id.slice(0, 3), r: +id[3], n, t, pn, cd, d }));
  const byId = Object.fromEntries(SP.map(s => [s.id, s])), COST = Prog.COST, TIME = Prog.TIME;     // v2.a3.6 : prix et durées dans clicker/progress.js (★ réglages)
  const hue = k => "hsl(" + SCH.find(s => s[0] === k)[2] + " 75% 68%)";
  const gl = (k, z = 20) => "<svg viewBox='0 0 24 24' width='" + z + "' height='" + z + "' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linejoin='round'>" + SCH.find(s => s[0] === k)[3] + "</svg>";
  const ft = s => { s = Math.max(0, Math.ceil(s)); return s >= 3600 ? Math.floor(s / 3600) + "h" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") : Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  const sp = () => S.sp || (S.sp = Prog.emptySp());
  const lvl = k => SP.filter(s => s.k === k && sp().learned[s.id]).length;
  const nSlots = () => Prog.slots(sp());   // v2.a3.6 : emplacements par panneau = rang débloqué par examen (1 → 4 ; l'ancien « école la plus faible » a disparu)
  const eqIds = () => [...sp().eq.V, ...sp().eq.G].filter(Boolean), has = id => eqIds().includes(id);

  // ---- Modificateurs (passifs équipés + effets temporaires) ----
  const P = (...a) => () => a;
  const PM = {
    enc1: P(["sgCost", "*", .9]), enc2: P(["scribe", "*", 1.15]), enc4: P(["sg", "*", 1.2]), ill1: P(["rare", "*", 1.05]),
    ill3: P(["buffDur", "+", 5]), nec1: P(["sg", "*", 1.03]), nec2: P(["pagesFlat", "+", .5]), nec4: P(["redX", "+", 2]),
    abj1: () => [["cps", "=", CPS_PALIERS[Math.min(2, Math.ceil(lvl("abj") / 2))]]], abj2: P(["offlineCap", "+", 2]), abj4: P(["cd", "*", .85]),
    div2: P(["offlineSg", "*", 1.2], ["fragOff", "*", 1.2]), div4: P(["study", "*", .75]), tra1: P(["frag", "*", 1.15]), tra4: P(["ether", "*", 1.25], ["scribe", "*", 1.25], ["frag", "*", 1.25]),
    con1: P(["ethCost", "*", .95], ["sgCost", "*", .95]), con2: P(["famil", "+", 1])
  };
  let ml = [], dirty = 1, fxs = [], mirror = 0, presc = 0, clicks = 0, pp = "V", si = 0, lastAct = 0, lastEffort = 0, ed = null;   // lastAct = action récente (Taxe) ; lastEffort = tout appui (fragments d'effort)
  const ap = (r, m) => m[1] === "*" ? r * m[2] : m[1] === "+" ? r + m[2] : Math.max(r, m[2]);
  const mod = (k, d) => {
    if (dirty) { dirty = 0; ml = []; eqIds().forEach(id => PM[id] && ml.push(...PM[id]())); }
    const n = Date.now(); let r = d;
    for (const m of ml) if (m[0] === k) r = ap(r, m);
    for (const f of fxs) if (f.u > n) for (const m of f.m) if (m[0] === k) r = ap(r, m);
    return r;
  };
  const fx = (m, s) => fxs.push({ m, u: Date.now() + s * 1e3 });

  // ---- Sorts actifs ----
  const ACT = {
    evo1: () => { const g = 10 * Passives.calc().clickV * M("click", 1); S.eth += g; Stats.add("eth", g); Stats.add("imp", 10); },
    evo2: () => { const c = Passives.calc(), g = 30 * c.ethPS + 20 * c.clickV; S.eth += g; Stats.add("eth", g); },
    evo3: () => fx([["famil", "+", 10]], 10),
    enc3: () => fx([["ether", "*", 2], ["scribe", "*", 2]], 30),
    ill2: () => { mirror = 1; },
    ill4: () => fx([["sg", "*", PG.gold.x]], PG.gold.d + M("buffDur", 0)),
    nec3: () => { const s = S.sg * .1; S.sg -= s; S.eth += s * 20; Stats.add("eth", s * 20); },
    abj3: () => { heat = 0; hot = 0; },
    div3: () => { presc = 5; },
    tra2: () => fx([["pylon", "*", 3]], 30),
    tra3: () => fx([["ether", "*", 5], ["click", "*", 5]], 15),
    con3: () => {
      const n = Date.now(); let b = null, m = 0;
      eqIds().forEach(id => { const r = (sp().cd[id] || 0) - n; if (byId[id].t === "A" && id !== "con3" && r > m) { m = r; b = id; } });
      if (!b) return false; sp().cd[b] = 0;
    },
    con4: () => fx([["ether", "*", 3], ["click", "*", 3], ["sg", "*", 3]], 10)
  };
  const cast = (s, p) => {
    const n = Date.now(); lastAct = lastEffort = n;
    if (n < (sp().pen || 0)) { sfx("deny"); toast("Taxe en cours — sorts actifs bloqués " + Math.ceil((sp().pen - n) / 1e3) + " s"); return; }
    if (n < (sp().cd[s.id] || 0)) { sfx("deny"); return; }
    if (ACT[s.id]() === false) { toast("Aucun sort en recharge à réinitialiser"); return; }
    { const t = sp().tut || (sp().tut = Prog.norm(sp()).tut); t.cast = 1; t.castIds[s.id] = 1; }                       // conditions d'examen (tutoriel)
    Stats.add("cast", 1); Stats.addIn("cast", s.id, 1); Stats.ms("cast");
    sp().cd[s.id] = n + s.cd * 1e3 * mod("cd", 1); const ix = SCH.findIndex(x => x[0] === s.k); sfx(s.k === "evo" ? "zap" : s.k === "nec" ? "rumble" : "chime", 1 + ix * .09);
    if (window.schoolFx) schoolFx(s.k, p, s);
    const sl = document.querySelector(".sl[data-id='" + s.id + "']"); if (sl) { sl.classList.add("cast"); setTimeout(() => sl.classList.remove("cast"), 450); }
    save(); if (window.cloudSave) cloudSave();
    const pane = document.querySelector(p === "V" ? ".voile" : ".grimoire"); pane.classList.add("wave"); setTimeout(() => pane.classList.remove("wave"), 700);
  };
  const onClick = () => { lastAct = lastEffort = Date.now(); let m = 1; if (mirror) { mirror = 0; m = 5; } if (has("evo4") && ++clicks % 100 === 0) fx([["ether", "*", 2], ["click", "*", 2]], 15); return m; };
  const force = () => presc > 0 && (presc--, true), forced = () => presc > 0, touch = () => { lastAct = lastEffort = Date.now(); }, effort = () => { lastEffort = Date.now(); }, active = () => Date.now() - lastEffort < 1e4;

  // ---- Barres de sorts ----
  const bar = p => {
    const el = $("bar" + p), n = nSlots(); el.innerHTML = "";
    for (let i = 0; i < n; i++) {
      const id = sp().eq[p][i], s = id && byId[id], b = document.createElement("button"); let t, lp = 0;
      b.className = "sl" + (sp().lock[p + i] ? " lk" : "") + (s && s.t === "A" ? " act" : "");
      b.title = s ? s.n + " — " + s.d : "Emplacement libre";
      if (s) { b.dataset.id = id; b.style.color = hue(s.k); b.innerHTML = gl(s.k, 22) + "<u></u><b></b>"; } else b.textContent = "✦";
      b.onpointerdown = () => { lp = 0; t = setTimeout(() => { lp = 1; sp().lock[p + i] = !sp().lock[p + i]; save(); bar(p); }, 500); };
      b.onpointerup = b.onpointerleave = () => clearTimeout(t);
      b.onclick = () => { if (lp) { lp = 0; return; } if (!s) return pick(p); if (s.t === "A") cast(s, p); else toast(s.n + " — " + s.d); };
      el.append(b);
    }
  };
  const bars = () => { bar("V"); bar("G"); };
  const tickBars = n => document.querySelectorAll(".sl[data-id]").forEach(b => {
    const s = byId[b.dataset.id], r = (sp().cd[s.id] || 0) - n; b.classList.toggle("pen", n < (sp().pen || 0)); if (s.t !== "A") return;
    b.style.setProperty("--p", (r > 0 ? Math.min(1, r / (s.cd * 1e3 * mod("cd", 1))) : 0) * 360 + "deg");
    b.querySelector("b").textContent = r > 0 && r <= 9e3 ? Math.ceil(r / 1e3) : "";          // chiffres : 9 dernières secondes
  });

  // ---- Taxe (ex-« Gold Sink », nom interne) : changer un sort juste après un effort (< 15 s) = payer ou subir 30 s de blocage des sorts actifs. La clé de sauvegarde `sp().pen` est conservée telle quelle. ----
  const taxe = (fn, change) => {
    if (!change || Date.now() - lastAct > 15e3) return fn();                // hors action / Académie : gratuit
    const c = Passives.calc(), ce = Math.ceil(50 + 90 * c.ethPS), cs = Math.ceil(20 + 90 * c.sgPS), g = $("gbtns"); g.innerHTML = "";
    $("gtxt").textContent = "Tu agis en ce moment : changer ton équipement de sorts maintenant coûte une taxe. Choisis comment la régler.";
    const add = (h, f, ok) => {
      const d = document.createElement("div"); d.className = "ps" + (ok ? "" : " off"); d.innerHTML = h;
      d.onclick = () => { if (!ok) return; $("gate").hidden = true; f(); fn(); }; g.append(d);
    };
    add("<i>💠</i><div><b>Payer " + fE(ce) + "</b></div>", () => { S.eth -= ce; Stats.add("taxe", 1); Stats.add("taxeE", 1); Stats.ms("taxe"); }, S.eth >= ce);
    add("<i>📖</i><div><b>Payer " + fN(cs) + " Sg</b></div>", () => { S.sg -= cs; Stats.add("taxe", 1); Stats.add("taxeS", 1); Stats.ms("taxe"); }, S.sg >= cs);
    add("<i>⏳</i><div><b>Pénalité : sorts actifs bloqués 30 s</b></div>", () => { sp().pen = Date.now() + 3e4; Stats.add("taxe", 1); Stats.add("taxeT", 1); Stats.ms("taxe"); }, true);
    const x = document.createElement("div"); x.className = "ps"; x.innerHTML = "<i>✕</i><div><b>Annuler</b></div>"; x.onclick = () => { $("gate").hidden = true; }; g.append(x);
    Stats.add("taxeAsk", 1); $("gate").hidden = false;
  };

  // ---- Sélecteur de sorts (équipement live OU pré-construction d'un deck : ed) ----
  const eq = () => ed || sp().eq, lk = (p, i) => !ed && sp().lock[p + i];
  const inT = id => { const E = eq(); return E.V.includes(id) || E.G.includes(id); };
  const pick = p => { ed = null; pp = p; if (si >= nSlots()) si = 0; $("pick").hidden = false; pickR(); };
  const edit = (d, p) => { ed = d; pp = p; si = 0; $("pick").hidden = false; pickR(); };
  const closePick = () => { $("pick").hidden = true; ed = null; if (!$("dk").hidden) dkR(); };
  const equip = id => {
    const E = eq(), L = sp().lock;
    if (lk(pp, si)) return toast("Emplacement verrouillé");
    if (id && !ed && ["V", "G"].some(p => E[p].some((x, i) => x === id && L[p + i] && !(p === pp && i === si)))) return toast("Sort verrouillé dans un autre emplacement");
    const run = () => {
      if (id) for (const p of ["V", "G"]) E[p].forEach((x, i) => { if (x === id) E[p][i] = null; });
      E[pp][si] = id; if (!ed) { dirty = 1; bars(); Stats.add("chg", 1); if (id) sp().tut.fill[pp + si] = 1; } pickR(); save(); if (window.Academy) Academy.refresh();
    };
    taxe(run, !ed && !!E[pp][si] && E[pp][si] !== id);                      // remplacer/retirer = changement
  };
  const pickR = () => {
    const L = sp().learned, n = nSlots(), sl = $("pslots"), list = $("plist"), E = eq(); sl.innerHTML = list.innerHTML = "";
    $("ptitle").textContent = (ed ? "Deck « " + ed.name + " » · " : "Sorts · ") + (pp === "V" ? "Voile d'Éther" : "Grimoire");
    for (let i = 0; i < n; i++) {
      const id = E[pp][i], b = document.createElement("button");
      b.className = "sl" + (i === si ? " sel" : "") + (lk(pp, i) ? " lk" : "");
      if (id) { b.style.color = hue(byId[id].k); b.innerHTML = gl(byId[id].k, 22); } else b.textContent = "✦";
      b.onclick = () => { si = i; pickR(); }; sl.append(b);
    }
    const mk = (h, f) => { const d = document.createElement("div"); d.className = "ps"; d.innerHTML = h; d.onclick = f; list.append(d); return d; };
    mk("<i>✕</i><div><b>Retirer le sort</b></div>", () => equip(null));
    SP.filter(s => L[s.id] && (s.pn === pp || s.pn === "X")).forEach(s => {
      const d = mk("<i style='color:" + hue(s.k) + "'>" + gl(s.k) + "</i><div><b>" + s.n + "</b> <em>" + (s.t === "A" ? "Actif · Recharge " + s.cd + " s" : "Passif") + "</em><small>" + s.d + "</small></div>", () => equip(s.id));
      if (inT(s.id)) d.classList.add("eq");
    });
    if (list.children.length === 1) list.insertAdjacentHTML("beforeend", "<div class='hint'>Aucun sort appris pour ce panneau — inscris-toi à l'Amphithéâtre.</div>");
  };

  // ---- Decks nommés (Voile / Grimoire / Hybride) : équiper, mettre à jour, pré-construire, renommer, supprimer ----
  const D = () => sp().decks || (sp().decks = []), sides = d => d.t === "H" ? ["V", "G"] : [d.t], TN = { H: "Hybride", V: "Voile", G: "Grimoire" };
  const snap = (d) => sides(d).forEach(p => { d[p] = Array.from({ length: nSlots() }, (_, i) => sp().eq[p][i] || null); });
  const applyDeck = d => {
    const n = nSlots(), L = sp().learned, E = sp().eq, N = { V: E.V.slice(), G: E.G.slice() };
    sides(d).forEach(p => { for (let i = 0; i < n; i++) { if (sp().lock[p + i]) continue; const id = d[p][i]; N[p][i] = id && L[id] ? id : null; } });
    N.G.forEach((id, i) => { if (id && N.V.includes(id) && !sp().lock["G" + i]) N.G[i] = null; });      // pas de doublon (Voile prioritaire)
    const change = ["V", "G"].some(p => E[p].some((id, i) => id && N[p][i] !== id));
    taxe(() => { sp().eq = N; dirty = 1; bars(); Stats.add("chgDeck", 1); sp().tut.equip = 1; ["V", "G"].forEach(q => N[q].forEach((x, i) => { if (x) sp().tut.fill[q + i] = 1; })); save(); toast("Deck « " + d.name + " » équipé"); }, change);
  };
  const dkR = () => {
    const el = $("dklist"); el.innerHTML = "";
    if (!D().length) el.innerHTML = "<div class='hint'>Aucun deck — crée-en un depuis ton équipement actuel.</div>";
    D().forEach((d, i) => {
      const r = document.createElement("div"), h = document.createElement("div"), nm = document.createElement("b"), a = document.createElement("div"), pv = document.createElement("div");
      r.className = "dk"; h.className = "dkh"; a.className = "dka"; pv.className = "dkp"; nm.textContent = d.name;
      h.append(nm); h.insertAdjacentHTML("beforeend", "<em>" + TN[d.t] + "</em>");
      pv.innerHTML = sides(d).map(p => "<span class='pv'>" + (p === "V" ? "Voile " : "Grimoire ") + (d[p].filter(Boolean).map(id => "<i style='color:" + hue(byId[id].k) + "' title='" + byId[id].n + "'>" + gl(byId[id].k, 16) + "</i>").join("") || "—") + "</span>").join("");
      const bt = (t, f) => { const b = document.createElement("button"); b.className = "dkb"; b.textContent = t; b.onclick = f; a.append(b); };
      bt("▶ Équiper", () => applyDeck(d));
      bt("⟳ Enregistrer l'équipement", () => { snap(d); save(); dkR(); toast("Deck mis à jour"); });
      sides(d).forEach(p => bt("✎ " + (p === "V" ? "Voile" : "Grimoire"), () => edit(d, p)));
      bt("Aa Renommer", () => { const v = (prompt("Nom du deck (20 max) :", d.name) || "").trim().slice(0, 20); if (v) { d.name = v; save(); dkR(); } });
      bt("✕", () => { if (confirm("Supprimer le deck « " + d.name + " » ?")) { D().splice(i, 1); save(); dkR(); } });
      r.append(h, pv, a); el.append(r);
    });
  };
  const dkInit = () => {
    $("dkopen").onclick = () => { $("dk").hidden = false; dkR(); };
    $("dkclose").onclick = () => { $("dk").hidden = true; }; $("dk").onclick = e => { if (e.target.id === "dk") $("dk").hidden = true; };
    $("dkadd").onclick = () => {
      if (D().length >= 8) return toast("8 decks maximum");
      const d = { name: ($("dkname").value.trim() || "Deck " + (D().length + 1)).slice(0, 20), t: $("dkt").value, V: [], G: [] };
      snap(d); D().push(d); sp().tut.deck = 1; Stats.add("deckN", 1); Stats.ms("deck"); $("dkname").value = ""; save(); dkR();
    };
  };

  // ---- Amphithéâtre (règles ; l'interface = clicker/academy.js) ----
  // Cours : un seul à la fois (jamais pendant un examen), rang apprenable ≤ rang débloqué (CONCEPTION_SORTS.md §3). Durée × mod("study") (div4) ; les examens, eux, ne sont pas réduits.
  const learn = s => {
    const L = sp().learned, c = COST[s.r - 1];
    if (L[s.id]) return toast("Déjà maîtrisé");
    if (sp().exam) return toast("Un examen est en cours");
    if (sp().course) return toast("Un cours est déjà en cours");
    if (s.r > (sp().rank | 0 || 1)) return toast("Réussis d'abord l'examen du rang " + (s.r - 1));
    if (S.sg < c) return toast("Sagesse insuffisante");
    const n = Date.now(); S.sg -= c; sp().course = { id: s.id, t0: n, end: n + TIME[s.r - 1] * 1e3 * mod("study", 1) }; save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.refresh();
  };
  const examInfo = n => { Stats.flush(); const st = S.st || {}; return { conds: Prog.conds(sp(), st, n), can: Prog.canExam(sp(), st, S.sg, n), price: Prog.EX.price[n - 1], dur: Prog.EX.dur[n - 1], learned: Prog.doneAt(sp(), n) }; };
  const startExam = n => {                                      // paie les frais, lance le minuteur (timestamp absolu : continue hors ligne)
    const ci = examInfo(n).can; if (!ci.ok) return ci;
    S.sg -= Prog.EX.price[n - 1]; Prog.startExam(sp(), Date.now(), n); Stats.add("examPay", 1); Stats.ms("examStart" + n); save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.refresh(); return ci;
  };

  const tick = (dt, n) => {
    const c = sp().course;
    if (c && n >= c.end) {
      sp().learned[c.id] = 1; sp().course = null; dirty = 1; Stats.add("learn", 1); Stats.ms("learn"); const r = byId[c.id].r; toast("Cours terminé : " + byId[c.id].n);
      if (r === (sp().rank | 0 || 1) && Prog.doneAt(sp(), r) === 8) setTimeout(() => toast("Les 8 sorts du rang " + r + " sont appris : l'examen t'attend"), 2600);
      bars(); save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.refresh();
    }
    const ex = Prog.finishExam(S, n);                                         // examen terminé (même hors ligne : timestamp absolu)
    if (ex) { dirty = 1; Stats.add("exam", 1); Stats.ms("exam" + ex); Stats.snap("exam" + ex); bars(); save(); if (window.cloudSave) cloudSave(true); toast("Examen du rang " + ex + " validé — un pli de l'Académie t'attend"); if (window.Academy) Academy.refresh(); }
    if (has("tra1")) { const x = Math.min(S.sg, .2 * Passives.calc().sgPS * dt); S.sg -= x; S.eth += x * 20; Stats.add("eth", x * 20); }
    fxs = fxs.filter(f => f.u > n); sp().fx = fxs; sp().st = [mirror, presc, clicks]; tickBars(n); if (window.Academy) Academy.tick(n);
  };
  const init = () => {
    const o = sp(); fxs = (o.fx || []).filter(f => f.u > Date.now()); [mirror, presc, clicks] = o.st || [0, 0, 0];   // effets actifs persistants
    bars(); dkInit(); if (window.Academy) Academy.init();
    document.querySelectorAll(".gear[data-p]").forEach(g => g.onclick = () => pick(g.dataset.p));
    $("pclose").onclick = closePick; $("pick").onclick = e => { if (e.target.id === "pick") closePick(); };
  };
  return { glyph: gl, hue, cast, SCH, mod, init, tick, onClick, force, forced, touch, effort, active, has, learn, SP, applyDeck, D, taxe, sp, byId, examInfo, startExam, COST, TIME, ft };
})();
