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
    ["evo4", "Météore de l'Académie", "P", "V", 0, "Tous les 100 clics : gains d'Éther et de clic ×2 pendant 15 s (ne se cumule pas avec lui-même)."],
    ["enc1", "Charme-Personne", "P", "G", 0, "−10% de coût en Sagesse des automatisations."],
    ["enc2", "Suggestion", "P", "G", 0, "+15% de vitesse des Scribes."],
    ["enc3", "Domination d'Esprit", "A", "X", 120, "Toutes les automatisations ×2 pendant 30 s."],
    ["enc4", "Mot de Pouvoir : Obéissance", "P", "G", 0, "Sagesse +20 % en permanence."],
    ["ill1", "Lumières Dansantes", "P", "G", 0, "+5% de chance de pages rares."],
    ["ill2", "Image Miroir", "A", "V", 45, "Le prochain clic du Voile compte ×5."],
    ["ill3", "Mot de Divertissement", "P", "G", 0, "Pages rares : lecture +25% · sceau d'Illusion +5 s."],
    ["ill4", "Voile d'Illusion Majeure", "A", "G", 180, "Page Dorée illusoire : Sagesse ×12 pendant quelques secondes."],
    ["nec1", "Faucheur de Tome", "P", "G", 0, "Sagesse +3 % en permanence."],
    ["nec2", "Invocation de Squelette Scribe", "P", "G", 0, "Un scribe spectral : 2 % de tes pages/s (au moins 0,5 page/s), actif hors ligne."],
    ["nec3", "Transmutation Vitale", "A", "X", 300, "Convertit 10% de la Sagesse en Éther Pur."],
    ["nec4", "Encre Cramoisie", "P", "G", 0, "La Page Nécrotique rapporte ×6 au lieu de ×4."],
    ["abj1", "Bouclier d'Éther", "P", "V", 0, "Limite de clics/s relevée au Voile et au Grimoire : 5 → 10 (Abjuration rang 1-2) → 15 (rang 3-4)."],
    ["abj2", "Glyphe de Warding", "P", "X", 0, "Gains hors ligne plafonnés à 10 h au lieu de 8 h."],
    ["abj3", "Disjonction de Mordenkainen", "A", "V", 60, "Nettoie instantanément la surchauffe."],
    ["abj4", "Sanctuaire Absolu", "P", "X", 0, "−15% de recharge des sorts actifs."],
    ["div1", "Augure", "P", "G", 0, "Aperçu de la rareté de la prochaine page."],
    ["div2", "Vision du Passé", "P", "G", 0, "+20 % de Sagesse, d'Éther et de micro-fragments hors ligne."],
    ["div3", "Prescience", "A", "G", 150, "Les 5 prochaines pages sont rares."],
    ["div4", "Vision de l'Avenir", "P", "X", 0, "−25% de temps d'étude des cours."],
    ["tra1", "Alchimie Mineure", "P", "X", 0, "20 % de la Sagesse produite devient de l'Éther (aussi hors ligne). +15 % de micro-fragments."],
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
  const IC = (d, z = 16, sw = 2) => "<svg class='ic' viewBox='0 0 24 24' width='" + z + "' height='" + z + "' fill='none' stroke='currentColor' stroke-width='" + sw + "' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>" + d + "</svg>";
  const ICON = {
    minus: IC("<circle cx='12' cy='12' r='9'/><path d='M8 12h8'/>", 18), play: IC("<path d='M7 5l12 7-12 7z' fill='currentColor' stroke-width='1.2'/>", 14), save: IC("<path d='M5 4h11l3 3v13H5z'/><path d='M8 4v5h7V4M8 20v-6h8v6'/>", 14),
    edit: IC("<path d='M4 20l4-1 11-11-3-3L5 16z'/><path d='M14 6l3 3'/>", 14), name: IC("<path d='M4 7h16M4 12h10M4 17h6'/>", 14), trash: IC("<path d='M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13M10 11v6M14 11v6'/>", 14),
    hourglass: IC("<path d='M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9'/>", 20, 1.8), cross: IC("<path d='M6 6l12 12M18 6L6 18'/>", 18),
    coin: IC("<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5v9M14.6 9.6c-.4-.9-1.4-1.4-2.6-1.4-1.5 0-2.5.7-2.5 1.8 0 2.7 5.2 1.3 5.2 4 0 1.1-1.1 1.8-2.7 1.8-1.2 0-2.2-.5-2.6-1.5'/>", 20, 1.6)
  };
  const ft = s => { s = Math.max(0, Math.ceil(s)); return s >= 3600 ? Math.floor(s / 3600) + "h" + String(Math.floor(s % 3600 / 60)).padStart(2, "0") : Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };

  const sp = () => S.sp || (S.sp = Prog.emptySp());
  const lvl = k => SP.filter(s => s.k === k && sp().learned[s.id]).length;
  const nSlots = () => Prog.slots(sp());   // v2.a3.6 : emplacements par panneau = rang débloqué par examen (1 → 4 ; l'ancien « école la plus faible » a disparu)
  const eqIds = () => [...sp().eq.V, ...sp().eq.G].filter(Boolean), has = id => eqIds().includes(id);

  // ---- Modificateurs (passifs équipés + effets temporaires) : valeurs « base / spécialité » dans clicker/effects.js (pur, testé) ----
  const sch = k => Fx.sf(sp(), k);                                                        // facteur de spécialité de l'école k : 1 = choisie · 0,5 = seconde · 0 = autre
  let ml = [], dirty = 1, fxs = [], mirror = 0, presc = 0, clicks = 0, pp = "V", si = 0, lastAct = 0, lastEffort = 0, ed = null, immune = 0;   // lastAct = action récente (Taxe) ; lastEffort = tout appui (fragments d'effort) ; mirror = charges d'Image Miroir ; immune = fin de l'immunité de surchauffe (abj3)
  const rebuild = () => { ml = []; eqIds().forEach(id => ml.push(...Fx.PM(id, sch(byId[id].k), { lvl: lvl("abj"), paliers: CPS_PALIERS, cpsG: CPS_GRIMOIRE }))); };
  const mod = (k, d) => { if (dirty) { dirty = 0; rebuild(); } return Fx.mod(ml, fxs, Date.now(), k, d); };
  const fx = (m, s, tag) => Fx.addFx(fxs, m, s, Date.now(), tag);                          // un effet déjà actif (même tag) est rafraîchi, jamais empilé

  // ---- Sorts actifs (paramètres = effects.js : base ou spécialité selon l'école choisie) ----
  const A = id => Fx.ACT(id, sch(byId[id].k), { buffDur: M("buffDur", 0) });
  const ACT = {
    evo1: () => { const a = A("evo1"), c = Passives.calc(), g = a.imp * c.clickV * M("click", 1) * (a.crit ? c.critMul : 1); S.eth += g; Stats.add("eth", g); Stats.add("imp", a.imp); },
    evo2: () => { const a = A("evo2"), c = Passives.calc(), g = a.secs * c.ethPS + a.clicks * c.clickV; S.eth += g; Stats.add("eth", g); },
    evo3: () => { const a = A("evo3"); fx([["famil", "+", a.imp]], a.dur, "evo3"); },
    enc3: () => { const a = A("enc3"); fx([["ether", "*", 2], ["scribe", "*", 2]], a.dur, "enc3"); },
    ill2: () => { mirror = A("ill2").charges; },
    ill4: () => { const a = A("ill4"); fx([["sg", "*", a.mult]], a.dur, "ill4"); },
    nec3: () => { const a = A("nec3"), x = S.sg * a.frac; S.sg -= x; S.eth += x * a.ratio; Stats.add("eth", x * a.ratio); },
    abj3: () => { const a = A("abj3"); heat = 0; hot = 0; if (a.immune > 0) immune = Date.now() + a.immune * 1e3; },
    div3: () => { presc = A("div3").pages; },
    tra2: () => { const a = A("tra2"); fx([["pylon", "*", a.mult]], a.dur, "tra2"); },
    tra3: () => { const a = A("tra3"); fx([["ether", "*", a.mult], ["click", "*", a.mult]], a.dur, "tra3"); },
    con3: () => {
      const n = Date.now(), a = A("con3"), L = eqIds().filter(id => byId[id].t === "A" && id !== "con3").map(id => [id, (sp().cd[id] || 0) - n]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]).slice(0, a.n);
      if (!L.length) return false; L.forEach(x => { sp().cd[x[0]] = 0; });
    },
    con4: () => { const a = A("con4"); fx([["ether", "*", a.mult], ["click", "*", a.mult], ["sg", "*", a.mult]], a.dur, "con4"); }
  };
  const cast = (s, p) => {
    const n = Date.now(); lastAct = lastEffort = n;
    if (n < (sp().pen || 0)) { sfx("deny"); toast("Taxe en cours — sorts actifs bloqués " + Math.ceil((sp().pen - n) / 1e3) + " s"); return; }
    if (n < (sp().cd[s.id] || 0)) { sfx("deny"); return; }
    if (ACT[s.id]() === false) { toast("Aucun sort en recharge à réinitialiser"); return; }
    { const t = sp().tut || (sp().tut = Prog.norm(sp()).tut); t.cast = 1; t.castIds[s.id] = 1; }                       // conditions d'examen (tutoriel)
    Stats.add("cast", 1); Stats.addIn("cast", s.id, 1); Stats.ms("cast");
    sp().cd[s.id] = n + Fx.cdOf(s.id, s.cd, sch(s.k)) * 1e3 * mod("cd", 1); const ix = SCH.findIndex(x => x[0] === s.k); sfx(s.k === "evo" ? "zap" : s.k === "nec" ? "rumble" : "chime", 1 + ix * .09);
    if (window.schoolFx) schoolFx(s.k, p, s);
    const sl = document.querySelector(".sl[data-id='" + s.id + "']"); if (sl) { sl.classList.add("cast"); setTimeout(() => sl.classList.remove("cast"), 450); }
    save(); if (window.cloudSave) cloudSave();
    const pane = document.querySelector(p === "V" ? ".voile" : ".grimoire"); pane.classList.add("wave"); setTimeout(() => pane.classList.remove("wave"), 700);
  };
  const onClick = () => { lastAct = lastEffort = Date.now(); let m = 1; if (mirror > 0) { mirror--; m = A("ill2").mult; } if (has("evo4")) { const e = Fx.ACT("evo4", sch("evo")); if (++clicks % e.every === 0) fx([["ether", "*", 2], ["click", "*", 2]], e.dur, "evo4"); } return m; };
  const force = () => presc > 0 && (presc--, true), forced = () => presc, touch = () => { lastAct = lastEffort = Date.now(); }, effort = () => { lastEffort = Date.now(); }, active = () => Date.now() - lastEffort < 1e4;

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
    b.style.setProperty("--p", (r > 0 ? 1 - Math.min(1, r / (Fx.cdOf(s.id, s.cd, sch(s.k)) * 1e3 * mod("cd", 1))) : 1) * 360 + "deg");      // angle ÉCOULÉ : l'ombre se retire dans le sens des aiguilles d'une montre depuis 12 h (§18.1)
    b.querySelector("b").textContent = r > 0 && r <= 9e3 ? Math.ceil(r / 1e3) : "";          // chiffres : 9 dernières secondes
  });

  // ---- Taxe d'adaptation (§15, v2.a3.10) : changer des sorts juste après un effort. Détection par ENSEMBLE de sorts (ordre et déplacements ignorés) : seuls les sorts réellement RETIRÉS ou AJOUTÉS comptent.
  // Barème et gratuités : Prog.taxe (progress.js, testé). La clé de sauvegarde `sp().pen` (blocage des sorts actifs) est conservée telle quelle. ----
  const TAXE_LOG = window.TAXE_LOG = [];                                           // JOURNAL DE DIAGNOSTIC TEMPORAIRE (à retirer avec la démo) : cause de chaque demande de Taxe, pour trouver le bug « demandée alors que je n'ai rien touché »
  const fdur = s => { s = Math.max(1, Math.ceil(s)); return s >= 60 ? Math.floor(s / 60) + " min" + (s % 60 ? " " + (s % 60) + " s" : "") : s + " s"; };
  const nm = ids => ids.length ? ids.map(i => byId[i].n).join(", ") : "—";
  const taxe = (fn, before, after, src) => {
    const now = Date.now(), ago = now - lastAct, removed = before.filter(x => after.indexOf(x) < 0), added = after.filter(x => before.indexOf(x) < 0), q = Prog.taxe(removed, added, ago);
    const rec = { t: new Date(now).toTimeString().slice(0, 8), src: src || "?", ago: Math.round(ago / 100) / 10, removed, added, free: q.free, why: q.free ? q.why : "taxe", S: q.S }; TAXE_LOG.push(rec); if (TAXE_LOG.length > 30) TAXE_LOG.shift(); console.info("[Taxe]", JSON.stringify(rec));
    if (q.free) return fn();
    const ce = Math.ceil(q.eth), cs = Math.ceil(q.sg), tm = Math.ceil(q.time), g = $("gbtns"); g.innerHTML = "";
    $("gtxt").innerHTML = "Tu retires : <b>" + nm(removed) + "</b><br>Tu ajoutes : <b>" + nm(added) + "</b><br>Ta dernière action date de " + Math.round(ago / 1e3) + " s : <b>" + (q.mul < 1 ? "demi-tarif" : "plein tarif") + "</b>. Choisis comment régler la taxe.";
    const add = (h, f, ok) => {
      const d = document.createElement("div"); d.className = "ps" + (ok ? "" : " off"); d.innerHTML = h;
      d.onclick = () => { if (!ok) return; $("gate").hidden = true; f(); fn(); }; g.append(d);
    };
    add("<i class='psi psi-g'>" + ICON.coin + "</i><div><b>Payer " + fEh(ce) + " + " + fN(cs) + " Sg</b><small>Éther ET Sagesse ensemble</small></div>", () => { S.eth -= ce; S.sg -= cs; Stats.add("taxe", 1); Stats.add("taxeP", 1); Stats.ms("taxe"); }, S.eth >= ce && S.sg >= cs);
    add("<i class='psi psi-b'>" + ICON.hourglass + "</i><div><b>Attendre : sorts actifs bloqués " + fdur(tm) + "</b><small>Les passifs restent actifs</small></div>", () => { sp().pen = Math.max(sp().pen || 0, Date.now() + tm * 1e3); Stats.add("taxe", 1); Stats.add("taxeT", 1); Stats.ms("taxe"); }, true);
    const x = document.createElement("div"); x.className = "ps"; x.innerHTML = "<i class='psi psi-x'>" + ICON.cross + "</i><div><b>Annuler</b><small>Garder mon équipement actuel</small></div>"; x.onclick = () => { $("gate").hidden = true; }; g.append(x);
    Stats.add("taxeAsk", 1); $("gate").hidden = false;
  };

  // ---- Sélecteur de sorts (équipement live OU pré-construction d'un deck : ed) ----
  const eq = () => ed || sp().eq, lk = (p, i) => !ed && sp().lock[p + i];
  const inT = id => { const E = eq(); return E.V.includes(id) || E.G.includes(id); };
  // ---- Recherche et filtres de sorts (v2.a3.16) : mot-clé (nom, effet, école, rang, actif/passif, hors ligne) + type + école. Partagés par le sélecteur et la palette des decks. ----
  const OFFL = new Set(["enc2", "enc4", "nec1", "nec2", "abj2", "div2", "tra4", "con2"]);        // passifs qui produisent aussi hors ligne (étiquette informative)
  const nz = s => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");     // sans accents ni casse
  const PNAME = { V: "voile", G: "grimoire", X: "voile grimoire" }, HAY = {};
  const hay = s => HAY[s.id] || (HAY[s.id] = nz([s.n, s.d, SCH.find(x => x[0] === s.k)[1], s.t === "A" ? "actif" : "passif", PNAME[s.pn], OFFL.has(s.id) ? "hors ligne" : "", "rang " + s.r].join(" ")));
  const newF = () => ({ q: "", t: "all", k: [] });
  let pkF = newF(), dkF = newF();
  const spOk = (s, f) => (f.t === "all" || (f.t === "A" && s.t === "A") || (f.t === "P" && s.t === "P") || (f.t === "O" && OFFL.has(s.id))) && (!f.k.length || f.k.indexOf(s.k) >= 0) && (!f.q || nz(f.q).split(/\s+/).filter(Boolean).every(w => hay(s).indexOf(w) >= 0));
  const fOn = f => !!(f.q || f.t !== "all" || f.k.length);
  const fbar = f => "<div class='spf'><label class='spf-s'>" + IC("<circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/>", 16, 2) + "<input type='search' class='spf-q' placeholder='Rechercher un sort, un effet…' value='" + f.q.replace(/'/g, "&#39;") + "' aria-label='Rechercher un sort' autocomplete='off'></label>" +
    "<div class='spf-c' role='group' aria-label='Type de sort'>" + [["all", "Tous"], ["A", "Actifs"], ["P", "Passifs"], ["O", "Hors ligne"]].map(x => "<button data-t='" + x[0] + "' class='" + (f.t === x[0] ? "on" : "") + "'>" + x[1] + "</button>").join("") + "</div>" +
    "<div class='spf-k' role='group' aria-label='École'>" + SCH.map(x => "<button data-k='" + x[0] + "' class='psi" + (f.k.indexOf(x[0]) >= 0 ? " on" : "") + "' style='--h:" + x[2] + "' title='" + x[1] + "' aria-label='" + x[1] + "'>" + gl(x[0], 15) + "</button>").join("") + "</div><div class='spf-n'></div></div>";
  const fbind = (root, f, change) => {                                  // lie la barre : `change()` redessine la liste (la barre elle-même n'est pas reconstruite : la saisie garde le focus)
    const q = root.querySelector(".spf-q"); q.oninput = () => { f.q = q.value; change(); };
    root.querySelectorAll(".spf-c button").forEach(b => b.onclick = () => { f.t = b.dataset.t; root.querySelectorAll(".spf-c button").forEach(x => x.classList.toggle("on", x === b)); change(); });
    root.querySelectorAll(".spf-k button").forEach(b => b.onclick = () => { const i = f.k.indexOf(b.dataset.k); if (i >= 0) f.k.splice(i, 1); else f.k.push(b.dataset.k); b.classList.toggle("on", i < 0); change(); });
  };
  const fcount = (root, shown, total) => { const n = root.querySelector(".spf-n"); if (n) n.textContent = shown === total ? total + " sorts" : shown + " / " + total + " sorts"; };
  const pfBuild = () => { const r = $("pfilt"); r.innerHTML = fbar(pkF); fbind(r, pkF, pickR); };
  const pick = p => { ed = null; pp = p; if (si >= nSlots()) si = 0; $("pick").hidden = false; pfBuild(); pickR(); };
  const edit = (d, p) => { ed = d; pp = p; si = 0; $("pick").hidden = false; pfBuild(); pickR(); };
  const closePick = () => { $("pick").hidden = true; ed = null; if (!$("dk").hidden) dkR(); };
  const equip = id => {
    const E = eq(), L = sp().lock;
    if (lk(pp, si)) return toast("Emplacement verrouillé");
    if (id && !ed && ["V", "G"].some(p => E[p].some((x, i) => x === id && L[p + i] && !(p === pp && i === si)))) return toast("Sort verrouillé dans un autre emplacement");
    const run = () => {
      if (id) for (const p of ["V", "G"]) E[p].forEach((x, i) => { if (x === id) E[p][i] = null; });
      E[pp][si] = id; if (!ed) { dirty = 1; bars(); Stats.add("chg", 1); if (id) sp().tut.fill[pp + si] = 1; } pickR(); save(); if (window.Academy) Academy.refresh();
    };
    if (ed) return run();                                                    // pré-construction d'un deck : jamais de Taxe
    const V = E.V.slice(), G = E.G.slice(), PP = { V, G }; if (id) for (const q of ["V", "G"]) PP[q].forEach((x, i) => { if (x === id) PP[q][i] = null; }); PP[pp][si] = id;
    taxe(run, eqIds(), [...V, ...G].filter(Boolean), "equip");               // remplacer / retirer : seuls les sorts réellement retirés ou ajoutés comptent
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
    mk("<i class='psi psi-x'>" + ICON.minus + "</i><div><b>Retirer le sort</b><small>Vide l'emplacement sélectionné</small></div>", () => equip(null));
    const base = SP.filter(s => L[s.id] && (s.pn === pp || s.pn === "X")), shown = base.filter(s => spOk(s, pkF)); fcount($("pfilt"), shown.length, base.length);
    shown.forEach(s => {
      const d = mk("<i class='psi' style='--h:" + SCH.find(x => x[0] === s.k)[2] + "'>" + gl(s.k, 20) + "</i><div><b>" + s.n + "</b> <span class='ps-tg " + (s.t === "A" ? "act" : "pas") + "'>" + (s.t === "A" ? "Actif · Recharge " + Math.round(Fx.cdOf(s.id, s.cd, sch(s.k))) + " s" : "Passif") + "</span><small>" + s.d + "</small></div>", () => equip(s.id));
      if (inT(s.id)) d.classList.add("eq");
    });
    if (list.children.length === 1) list.insertAdjacentHTML("beforeend", "<div class='hint'>" + (base.length ? "Aucun sort ne correspond à ta recherche." : "Aucun sort appris pour ce panneau — inscris-toi à l'Amphithéâtre.") + "</div>");
  };

  // ---- Decks nommés (Voile / Grimoire / Hybride) : équiper, mettre à jour, pré-construire, renommer, supprimer ----
  const D = () => sp().decks || (sp().decks = []), sides = d => d.t === "H" ? ["V", "G"] : [d.t], TN = { H: "Hybride", V: "Voile", G: "Grimoire" };
  const snap = (d) => sides(d).forEach(p => { d[p] = Array.from({ length: nSlots() }, (_, i) => sp().eq[p][i] || null); });
  const applyDeck = d => {
    const n = nSlots(), L = sp().learned, E = sp().eq, N = { V: E.V.slice(), G: E.G.slice() };
    sides(d).forEach(p => { for (let i = 0; i < n; i++) { if (sp().lock[p + i]) continue; const id = d[p][i]; N[p][i] = id && L[id] ? id : null; } });
    N.G.forEach((id, i) => { if (id && N.V.includes(id) && !sp().lock["G" + i]) N.G[i] = null; });      // pas de doublon (Voile prioritaire)
    taxe(() => { sp().eq = N; dirty = 1; bars(); Stats.add("chgDeck", 1); sp().tut.equip = 1; ["V", "G"].forEach(q => N[q].forEach((x, i) => { if (x) sp().tut.fill[q + i] = 1; })); save(); toast("Deck « " + d.name + " » équipé"); }, eqIds(), [...N.V, ...N.G].filter(Boolean), "deck");
  };
  // ---- Decks v2.a3.15 : une LISTE de cartes (aperçu visuel, « Équiper » en un geste) puis un ÉDITEUR : on touche un emplacement, puis un sort de la palette. Tout s'enregistre au fil de l'eau. ----
  let dkI = -1, dkP = "V", dkS = 0;                                  // deck ouvert (-1 = liste), panneau et emplacement sélectionnés
  const hn = k => SCH.find(x => x[0] === k)[2];
  const dkBadge = (id, sel) => id ? "<i class='psi" + (sel ? " sel" : "") + "' style='--h:" + hn(byId[id].k) + "' title='" + byId[id].n + "'>" + gl(byId[id].k, 20) + "</i>" : "<i class='psi psi-e" + (sel ? " sel" : "") + "'>" + IC("<path d='M12 6v12M6 12h12'/>", 14, 2) + "</i>";
  const dkSame = d => sides(d).every(p => Array.from({ length: nSlots() }, (_, i) => (d[p][i] || null) === (sp().eq[p][i] || null)).every(Boolean));
  const dkHead = (t, back) => "<div class='phead'>" + (back ? "<button class='dk-back' id='dkBack' aria-label='Retour à mes decks'>" + IC("<path d='M15 5l-7 7 7 7'/>", 16, 2.4) + "<span>Mes decks</span></button>" : "<b>" + t + "</b>") + "<button id='dkclose' aria-label='Fermer'>" + ICON.cross + "</button></div>";
  const dkClose = () => { $("dk").hidden = true; dkI = -1; };
  const dkR = () => { if (dkI >= 0 && !D()[dkI]) dkI = -1; (dkI < 0 ? dkList : dkEdit)(); const c = $("dkclose"); if (c) c.onclick = dkClose; };
  const dkList = () => {
    const el = $("dkbody"), n = nSlots(); let h = dkHead("Mes decks") + "<p class='dk-lead'>Un deck est un équipement de sorts prêt à l'emploi. Crée-en jusqu'à 8 et passe de l'un à l'autre d'un seul geste.</p><div class='dk-grid'>";
    D().forEach((d, i) => {
      const on = dkSame(d), rows = sides(d).map(p => "<div class='dkc-r'><u>" + (p === "V" ? "Voile" : "Grimoire") + "</u>" + Array.from({ length: n }, (_, k) => dkBadge(d[p][k] || null)).join("") + "</div>").join("");
      h += "<div class='dkc" + (on ? " on" : "") + "' data-i='" + i + "' tabindex='0' role='button' aria-label='Modifier le deck " + d.name.replace(/'/g, "’") + "'><div class='dkc-h'><b>" + d.name.replace(/</g, "&lt;") + "</b><em>" + TN[d.t] + "</em></div>" + rows +
        "<div class='dkc-f'>" + (on ? "<span class='dkc-eq'>" + IC("<path d='M5 12.5l4.5 4.5L19 7'/>", 14, 2.6) + "Équipé</span>" : "<button class='dkb pri' data-eq='" + i + "'>" + ICON.play + "<span>Équiper</span></button>") + "<span class='dkc-ed'>Modifier " + IC("<path d='M9 5l7 7-7 7'/>", 14, 2.2) + "</span></div></div>";
    });
    if (D().length < 8) h += "<button class='dkc dkc-new' id='dkNew'><i class='dkc-plus'>" + IC("<path d='M12 5v14M5 12h14'/>", 22, 2.2) + "</i><b>Nouveau deck</b><small>Part de ton équipement actuel</small></button>";
    h += "</div>" + (D().length ? "" : "<p class='dk-empty'>Aucun deck pour l'instant. Touche « Nouveau deck » : il se remplit avec ce que tu as équipé, tu n'as plus qu'à le nommer et le retoucher.</p>") + "<p class='dk-foot'>Équiper un deck juste après une action peut déclencher la Taxe d'adaptation.</p>";
    el.innerHTML = h;
    el.querySelectorAll(".dkc[data-i]").forEach(c => { c.onclick = () => { dkI = +c.dataset.i; dkP = sides(D()[dkI])[0]; dkS = 0; dkR(); }; c.onkeydown = e => { if (e.key === "Enter") c.click(); }; });
    el.querySelectorAll("[data-eq]").forEach(b => b.onclick = e => { e.stopPropagation(); applyDeck(D()[+b.dataset.eq]); setTimeout(dkR, 60); });
    const nw = $("dkNew"); if (nw) nw.onclick = () => { const d = { name: "Deck " + (D().length + 1), t: "H", V: [], G: [] }; snap(d); D().push(d); sp().tut.deck = 1; Stats.add("deckN", 1); Stats.ms("deck"); dkI = D().length - 1; dkP = "V"; dkS = 0; save(); dkR(); const nm = $("dkName"); if (nm) { nm.focus(); nm.select(); } };
  };
  const dkEdit = () => {
    const d = D()[dkI], n = nSlots(), el = $("dkbody"), sd = sides(d); if (sd.indexOf(dkP) < 0) dkP = sd[0]; if (dkS >= n) dkS = 0;
    const rows = sd.map(p => "<div class='dke-r'><u>" + (p === "V" ? "Voile d'Éther" : "Grimoire") + "</u><div class='dke-s'>" + Array.from({ length: n }, (_, k) => "<button class='dke-sl' data-p='" + p + "' data-s='" + k + "' aria-label='Emplacement " + (k + 1) + "'>" + dkBadge(d[p][k] || null, p === dkP && k === dkS) + "</button>").join("") + "</div></div>").join("");
    const used = new Set([...d.V, ...d.G].filter(Boolean)), cur = d[dkP][dkS] || null;
    const palAll = SP.filter(s => sp().learned[s.id] && (s.pn === dkP || s.pn === "X"));
    const palHtml = () => { const sh = palAll.filter(s => spOk(s, dkF)); return sh.map(s => "<button class='dkp-t" + (used.has(s.id) ? " used" : "") + (s.id === cur ? " cur" : "") + "' data-id='" + s.id + "' title='" + s.n.replace(/'/g, "’") + "'>" + dkBadge(s.id) + "<b>" + s.n + "</b><span class='ps-tg " + (s.t === "A" ? "act" : "pas") + "'>" + (s.t === "A" ? "Actif" : "Passif") + "</span></button>").join("") || (palAll.length ? "<p class='dk-empty'>Aucun sort ne correspond. <button class='dke-clear' id='dkFRst'>Réinitialiser les filtres</button></p>" : "<p class='dk-empty'>Aucun sort appris pour ce panneau : inscris-toi aux cours de l'Amphithéâtre.</p>"); };
    el.innerHTML = dkHead("", true) +
      "<div class='dke-top'><input id='dkName' maxlength='20' value='" + d.name.replace(/'/g, "&#39;") + "' aria-label='Nom du deck'><div class='dke-seg' role='group' aria-label='Type de deck'>" + ["H", "V", "G"].map(t => "<button data-t='" + t + "' class='" + (d.t === t ? "on" : "") + "'>" + TN[t] + "</button>").join("") + "</div></div>" +
      "<div class='dke-slots'>" + rows + "</div>" +
      "<div class='dke-pal'><div class='dke-pt'>Emplacement <b>" + (dkS + 1) + "</b> · " + (dkP === "V" ? "Voile d'Éther" : "Grimoire") + (cur ? " <button class='dke-clear' id='dkClear'>Vider</button>" : "") + "</div><div id='dkpf'>" + fbar(dkF) + "</div><div class='dkp-g' id='dkpg'>" + palHtml() + "</div></div>" +
      "<div class='dke-act'><button class='dkb pri' id='dkEq'>" + ICON.play + "<span>" + (dkSame(d) ? "Équipé" : "Équiper ce deck") + "</span></button><button class='dkb' id='dkCopy'>" + ICON.save + "<span>Copier mon équipement actuel</span></button><button class='dkb dng' id='dkDel'>" + ICON.trash + "<span>Supprimer</span></button></div>";
    $("dkBack").onclick = () => { dkI = -1; dkR(); };
    const nm = $("dkName"); nm.oninput = () => { d.name = nm.value.slice(0, 20); }; nm.onchange = nm.onblur = () => { d.name = (nm.value.trim() || d.name).slice(0, 20); save(); };
    el.querySelectorAll(".dke-seg button").forEach(b => b.onclick = () => { d.t = b.dataset.t; ["V", "G"].forEach(p => { if (!d[p]) d[p] = []; }); if (sides(d).indexOf(dkP) < 0) { dkP = sides(d)[0]; dkS = 0; } save(); dkR(); });
    el.querySelectorAll(".dke-sl").forEach(b => b.onclick = () => { dkP = b.dataset.p; dkS = +b.dataset.s; dkR(); });
    const bindPal = () => { fcount($("dkpf"), palAll.filter(s => spOk(s, dkF)).length, palAll.length); const fr = $("dkFRst"); if (fr) fr.onclick = () => { dkF.q = ""; dkF.t = "all"; dkF.k = []; dkR(); }; el.querySelectorAll(".dkp-t").forEach(b => b.onclick = () => place(b.dataset.id)); };
    const place = id => {                                                              // place le sort (jamais deux fois dans le deck), puis passe à l'emplacement vide suivant
 ["V", "G"].forEach(p => { d[p] = (d[p] || []).map(x => x === id ? null : x); }); d[dkP][dkS] = id;
      const order = []; sides(d).forEach(p => { for (let k = 0; k < n; k++) order.push([p, k]); }); const at = order.findIndex(x => x[0] === dkP && x[1] === dkS), nx = order.slice(at + 1).concat(order.slice(0, at)).find(x => !d[x[0]][x[1]]);
      if (nx) { dkP = nx[0]; dkS = nx[1]; } save(); dkR();
    };
    fbind($("dkpf"), dkF, () => { $("dkpg").innerHTML = palHtml(); bindPal(); }); bindPal();
    const cl = $("dkClear"); if (cl) cl.onclick = () => { d[dkP][dkS] = null; save(); dkR(); };
    $("dkEq").onclick = () => { applyDeck(d); setTimeout(dkR, 60); }; $("dkCopy").onclick = () => { snap(d); save(); dkR(); toast("Équipement copié dans « " + d.name + " »"); };
    const del = $("dkDel"); del.onclick = () => {                                     // double appui (3 s)
      if (!del.classList.contains("conf")) { del.classList.add("conf"); del.querySelector("span").textContent = "Confirmer ?"; setTimeout(() => { if (del.isConnected) { del.classList.remove("conf"); del.querySelector("span").textContent = "Supprimer"; } }, 3000); return; }
      D().splice(dkI, 1); dkI = -1; save(); dkR();
    };
  };
  const dkInit = () => {
    $("dkopen").onclick = () => { dkI = -1; $("dk").hidden = false; dkR(); };
    $("dk").onclick = e => { if (e.target.id === "dk") dkClose(); };
  };

  // ---- Amphithéâtre (règles ; l'interface = clicker/academy.js) ----
  // Cours : un seul à la fois (jamais pendant un examen), rang apprenable ≤ rang débloqué (CONCEPTION_SORTS.md §3). Durée × mod("study") (div4) ; les examens, eux, ne sont pas réduits.
  const quote = s => { const m = Prog.schoolMul(sp(), s.k), st = mod("study", 1); return { price: Math.ceil(COST[s.r - 1] * m), time: TIME[s.r - 1] * m * st, basePrice: COST[s.r - 1], baseTime: TIME[s.r - 1] * st, mul: m }; };
  const learn = s => {
    const L = sp().learned, q = quote(s), c = q.price;
    if (L[s.id]) return toast("Déjà maîtrisé");
    if (sp().exam) return toast("Un examen est en cours");
    if (sp().course) return toast("Un cours est déjà en cours");
    if (s.r > (sp().rank | 0 || 1)) return toast("Réussis d'abord l'examen du rang " + (s.r - 1));
    if (S.sg < c) return toast("Sagesse insuffisante");
    const n = Date.now(); S.sg -= c; sp().course = { id: s.id, t0: n, end: n + q.time * 1e3 }; save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.refresh();
  };
  const chooseSchool = k => {                                   // choix DÉFINITIF (hors dernier recours) ; acquitte la proposition « spe » ; le facteur de chaque sort est recalculé
    if (!Prog.chooseSchool(sp(), k, Date.now())) return false;
    Prog.ack(S, "spe:" + (S.spV || 2)); dirty = 1; Stats.add("schoolPick", 1); Stats.ms("school"); Stats.snap("school"); bars(); save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.refresh(); return true;
  };
  const chooseSchool2 = k => {                                   // seconde spécialité (récompense de l'examen 4) : agit à 50 %
    if (!Prog.chooseSchool2(sp(), k, Date.now())) return false;
    Prog.ack(S, "spe2:" + (S.spV || 2)); dirty = 1; Stats.add("school2Pick", 1); Stats.ms("school2"); bars(); save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.refresh(); return true;
  };
  const resetLearning = () => {                                  // dernier recours : sorts/rang/examens/école à zéro, spV+1, rien n'est remboursé
    Prog.resetLearning(S); fxs = []; mirror = presc = clicks = 0; immune = 0; dirty = 1; Stats.add("reset", 1); Stats.ms("reset"); init(); save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.refresh();
  };
  const examInfo = n => { Stats.flush(); const st = S.st || {}; return { conds: Prog.conds(sp(), st, n), can: Prog.canExam(sp(), st, S.sg, n, S.lock || 0, Date.now()), price: Prog.EX.price[n - 1], dur: Prog.EX.dur[n - 1], learned: Prog.doneAt(sp(), n) }; };
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
    if (ex) { dirty = 1; Stats.add("exam", 1); Stats.ms("exam" + ex); Stats.snap("exam" + ex); bars(); save(); if (window.cloudSave) cloudSave(true); if (window.Academy) Academy.examDone(ex); }
    { const b = mod("burn", 0); if (b > 0) { const x = Math.min(S.sg, b * Passives.calc().sgPS * dt); S.sg -= x; S.eth += x * 20; Stats.add("eth", x * 20); } }
    fxs = fxs.filter(f => f.u > n); sp().fx = fxs; sp().st = [mirror, presc, clicks]; tickBars(n); if (window.Academy) Academy.tick(n);
  };
  // ---- Raccourcis clavier (§18.2, secret du jeu, PC seulement) : Voile = touches 1-5, Grimoire = 6-9 puis 0 (event.code : AZERTY et QWERTY, Maj toléré) ; comme un appui sur l'emplacement ; compte comme effort ----
  let kbd = 0;
  const OVR = ["intro", "pick", "dk", "gate", "acEx", "acInfo", "acCele", "acSpe", "acRst", "acRev", "acDip", "acCht"];
  const keys = () => addEventListener("keydown", e => {
    if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || !matchMedia("(pointer:fine)").matches) return;
    const t = e.target, k = Fx.slotKey(e.code); if (!k || (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable))) return;
    if (OVR.some(id => { const x = document.getElementById(id); return x && !x.hidden; })) return;
    const b = document.querySelectorAll("#bar" + k.p + " .sl")[k.i]; if (!b) return; e.preventDefault(); effort(); b.click();
  });
  const init = () => {
    if (!kbd) { kbd = 1; keys(); }
    const o = sp(); fxs = (o.fx || []).filter(f => f.u > Date.now()); [mirror, presc, clicks] = o.st || [0, 0, 0];   // effets actifs persistants
    bars(); dkInit(); if (window.Academy) Academy.init();
    document.querySelectorAll(".gear[data-p]").forEach(g => g.onclick = () => pick(g.dataset.p));
    $("pclose").onclick = closePick; $("pick").onclick = e => { if (e.target.id === "pick") closePick(); };
  };
  return { glyph: gl, hue, cast, SCH, mod, init, tick, onClick, force, forced, touch, effort, active, has, learn, SP, applyDeck, D, taxe, sp, byId, examInfo, startExam, COST, TIME, ft, quote, chooseSchool, chooseSchool2, resetLearning, OFFL, sch, invalidate: () => { dirty = 1; }, immune: () => Date.now() < immune, augure: () => has("div1") ? Fx.augure(sch("div")) : 0 };
})();
