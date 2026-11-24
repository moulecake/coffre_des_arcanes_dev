"use strict";
// Retours visuels des sorts (v2.a3.17) — CONCEPTION_SORTS.md §4.1, §4.2, §13 : barre d'effets actifs, badge « ×N » d'empilement, badges d'emplacements (evo4 63/100, ill2 armé, div3…),
// infobulle « Effet réel », aura d'amplification des panneaux, et BILAN HORS LIGNE détaillé au retour. Lecture seule de l'état : aucune règle de jeu ici.
window.Hud = (() => {
  const $ = id => document.getElementById(id), byId = Spells.byId, SCH = Spells.SCH, hn = k => SCH.find(x => x[0] === k)[2];
  const fr = v => String(+(+v).toFixed(3)).replace(".", ",");
  const KEYL = { sg: "Sagesse", ether: "Éther/s", click: "valeur du clic", scribe: "vitesse des Scribes", pylon: "Pylônes", famil: "familiers", rare: "pages rares", sgCost: "coût en Sagesse", ethCost: "coût en Éther", buffDur: "durée des pages spéciales (s)", offlineCap: "plafond hors ligne (h)", offlineSg: "Sagesse hors ligne", offlineEth: "Éther hors ligne", fragOff: "fragments hors ligne", frag: "micro-fragments", cd: "recharge", study: "durée des cours", redX: "Page Nécrotique (×)", ghost: "scribe spectral (part des pages/s)", burn: "Sagesse brûlée en Éther", bldG: "Bougie et Homoncule", cps: "limite de clics/s (Voile)", cpsG: "limite de clics/s (Grimoire)", passive: "bâtiments passifs", pagesFlat: "pages/s", chain: "impulsions par clic du Voile", pause: "pause de surchauffe (Voile)", taxe: "Taxe d'adaptation", burnOff: "Sagesse brûlée hors ligne", burnX: "rendement de la transmutation" };
  const PCT = { ghost: 1, burn: 1, burnOff: 1 };
  const modTxt = m => { const l = KEYL[m[0]] || m[0], v = m[2]; if (PCT[m[0]]) return l + " : " + fr(v * 100) + " %"; return m[1] === "*" ? l + " ×" + fr(v) : m[1] === "+" ? l + " +" + fr(v) : l + " = " + fr(v); };
  const actTxt = a => [a.cd != null && "recharge " + fr(a.cd) + " s", a.dur != null && "durée " + fr(a.dur) + " s", a.mult != null && "×" + fr(a.mult), a.imp != null && fr(a.imp) + " impulsions", a.secs != null && fr(a.secs) + " s d'Éther", a.clicks != null && fr(a.clicks) + " clics", a.frac != null && fr(a.frac * 100) + " % de la Sagesse", a.charges != null && a.charges + " charge" + (a.charges > 1 ? "s" : ""), a.immune ? "immunité " + fr(a.immune) + " s" : "", a.pages != null && a.pages + " pages", a.n != null && a.n + " sort(s)", a.every != null && "tous les " + a.every + " clics", a.cut != null && fr(a.cut * 100) + " % moins cher"].filter(Boolean).join(" · ");
  // Infobulle d'un emplacement : description + effet RÉEL calculé par les mêmes formules que le jeu (plus de pourcentages flous)
  const title = s => {
    const f = Spells.sch(s.k); let real = "";
    if (s.t === "A") real = actTxt(Fx.ACT(s.id, f, { buffDur: 0 })); else if (s.id === "evo4") real = actTxt(Fx.ACT("evo4", f)); else real = Fx.PM(s.id, f, { lvl: 4, paliers: [5, 10, 15], cpsG: 10 }).map(modTxt).join(" · ");
    const act = Spells.activIn(s.id), spe = f >= 1 ? " ★ spécialité" : f > 0 ? " ½ seconde spécialité" : "";
    return s.n + " — " + s.d + (real ? "\nEffet réel : " + real + spe : "") + (act > 0 ? "\nInactif encore " + Math.ceil(act / 1e3) + " s (recharge d'activation)" : "");
  };
  // ---- Barre d'effets actifs (une par panneau) + pastilles d'état des passifs
  const pill = (cls, h, glyph, txt, sub) => "<span class='fxp " + cls + "' style='--h:" + h + "'>" + (glyph || "") + "<b>" + txt + "</b>" + (sub ? "<em>" + sub + "</em>" : "") + "</span>";
  const gl = (k, z) => Spells.glyph(k, z);
  let cache = { V: "", G: "", amp: "" };
  const mulOf = (fx, key) => { let p = 1; fx.forEach(e => e.m.forEach(m => { if (m[0] === key && m[1] === "*") p *= m[2]; })); return p; };
  const countOf = (fx, key) => fx.filter(e => e.m.some(m => m[0] === key && m[1] === "*")).length;
  const row = (p, st, now) => {
    let h = ""; const stack = [];
    st.fxs.filter(e => { const s = byId[e.tag]; return s && (s.pn === p || s.pn === "X"); }).forEach(e => {
      const s = byId[e.tag], m = e.m.find(x => x[1] === "*") || e.m[0], left = Math.max(0, Math.ceil((e.u - now) / 1e3));
      h += pill("fx", hn(s.k), gl(s.k, 14), s.n.length > 18 ? s.n.slice(0, 17) + "…" : s.n, (m[1] === "*" ? "×" + fr(m[2]) : "+" + fr(m[2])) + " · " + left + " s");
    });
    const key = p === "V" ? "ether" : "sg";
    if (countOf(st.fxs, key) >= 2) stack.push(pill("stack", 45, "", (p === "V" ? "ÉTHER" : "SAGESSE") + " ×" + fr(mulOf(st.fxs, key)), "effets cumulés"));
    if (p === "V" && countOf(st.fxs, "click") >= 2) stack.push(pill("stack", 45, "", "CLICS ×" + fr(mulOf(st.fxs, "click")), "effets cumulés"));
    h = stack.join("") + h;
    if (p === "V" && st.eq.indexOf("evo4") >= 0) { const e = st.evo4; h += pill("pas", hn("evo"), gl("evo", 14), "Météore", (st.clicks % e.every) + " / " + e.every + " clics"); }
    if (p === "V" && st.mirror > 0) h += pill("arm", hn("ill"), gl("ill", 14), "Image Miroir armé", "×" + fr(st.mirrorX) + (st.mirror > 1 ? " · " + st.mirror + " charges" : ""));
    if (p === "G" && st.presc > 0) h += pill("arm", hn("div"), gl("div", 14), "Prescience", st.presc + " page" + (st.presc > 1 ? "s" : "") + " rare" + (st.presc > 1 ? "s" : ""));
    if (st.eq.indexOf("abj1") >= 0) h += pill("pas", hn("abj"), gl("abj", 14), p === "V" ? "Voile" : "Grimoire", fr(p === "V" ? st.cps : st.cpsG) + " clics/s");
    return h;
  };
  const badge = (id, st, now) => {                                      // petit texte sous l'icône d'un emplacement
    const act = Spells.activIn(id); if (act > 0) return Math.ceil(act / 1e3) > 99 ? Math.ceil(act / 6e4) + "′" : Math.ceil(act / 1e3) + "s";
    if (id === "evo4") return (st.clicks % st.evo4.every) + "/" + st.evo4.every;
    if (id === "ill2") return st.mirror > 0 ? "×" + st.mirrorX : "";
    if (id === "div3") return st.presc > 0 ? String(st.presc) : "";
    if (id === "ill1") return "×" + fr(Spells.mod("rare", 1));
    return "";
  };
  const tick = n => {
    const st = Spells.hudState(n);
    ["V", "G"].forEach(p => { const el = $("fx" + p); if (!el) return; const h = row(p, st, n); if (h !== cache[p]) { cache[p] = h; el.innerHTML = h; } });
    document.querySelectorAll(".sl[data-id]").forEach(b => { let g = b.querySelector(".bdg"); if (!g) { g = document.createElement("s"); g.className = "bdg"; b.append(g); } const t = badge(b.dataset.id, st, n); if (g.textContent !== t) { g.textContent = t; b.classList.toggle("has-bdg", !!t); } b.classList.toggle("lockd", Spells.activIn(b.dataset.id) > 0); });
    // aura d'amplification (§13) : anneau doré autour du panneau tant qu'un multiplicateur temporaire est actif
    const aV = Math.max(mulOf(st.fxs, "ether"), mulOf(st.fxs, "click")), aG = mulOf(st.fxs, "sg"), key = aV + "|" + aG;
    if (key !== cache.amp) { cache.amp = key; const pv = document.querySelector(".pane.voile"), pg = document.querySelector(".pane.grimoire"); if (pv) { pv.classList.toggle("amp", aV >= 2); pv.style.setProperty("--amp", Math.min(1, Math.log2(aV) / 5)); } if (pg) { pg.classList.toggle("amp", aG >= 2); pg.style.setProperty("--amp", Math.min(1, Math.log2(aG) / 5)); } }
  };
  // ---- Bilan hors ligne (§4.1) : fenêtre au retour (≥ 60 s d'absence), une ligne par source
  const dur = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + " h " + String(m).padStart(2, "0") : m + " min"; };
  const showAway = cb => {
    const r = window.AWAYR; window.AWAYR = null; if (!r || r.raw < 60 || r.eth + r.sg <= 0) return cb && cb();
    const el = $("acAway"), body = $("acAwayB"); let h = "<div class='phead'><b>Pendant ton absence</b></div><p class='aw-d'>" + dur(r.raw) + (r.raw > r.sec + 1 ? " <span>→ plafonnées à <b>" + dur(r.sec) + "</b> de production</span>" : "") + "</p><div class='aw-l'>";
    const line = (c, ico, lab, val, subs) => h += "<div class='aw-r " + c + "'><i>" + ico + "</i><div><b>" + lab + "</b>" + (subs || []).map(x => "<small>" + x + "</small>").join("") + "</div><span>" + val + "</span></div>";
    const base = r.eth - r.burn * 20, sub = [];
    if (r.mulE > 1.0001) sub.push("Bâtiments et sorts : ×" + fr(r.mulE) + " (+" + fEh(base - base / r.mulE) + ")"); if (r.offE > 1.0001) sub.push("Vision du Passé : ×" + fr(r.offE) + " (+" + fEh(base - base / r.offE) + ")"); if (r.burn > 0) sub.push("Alchimie : " + fEh(r.burn * 20) + " tirés de " + fN(r.burn) + " Sg");
    line("e", "<svg viewBox='0 0 24 24' width='20' height='20'><path d='M12 2.5c3.6 4.2 6.4 7.4 6.4 11.1a6.4 6.4 0 0 1-12.8 0C5.6 9.8 8.4 6.6 12 2.5z' fill='#8b5cf6' stroke='#c4b5fd' stroke-width='1'/></svg>", "Éther", "+" + fEh(r.eth), sub);
    const subS = []; if (r.offS > 1.0001) subS.push("Vision du Passé : ×" + fr(r.offS) + " (+" + fN(r.sg - r.sg / r.offS) + ")"); if (r.burn > 0) subS.push("Alchimie : −" + fN(r.burn) + " Sg convertis en Éther");
    line("s", "<svg viewBox='0 0 24 24' width='20' height='20'><path d='M3 6.5c3-1.8 6-1.8 9 0v13c-3-1.8-6-1.8-9 0zM12 6.5c3-1.8 6-1.8 9 0v13c-3-1.8-6-1.8-9 0z' fill='#f5d98a' stroke='#8a6a1d' stroke-width='1'/></svg>", "Sagesse", "+" + fN(r.sg), subS);
    line("p", "<svg viewBox='0 0 24 24' width='20' height='20'><path d='M5 4h11l3 3v13H5z' fill='#ecd9a8' stroke='#8a6a1d' stroke-width='1'/><path d='M8 10h8M8 13h8M8 16h5' stroke='#8a5a14' stroke-width='1.2'/></svg>", "Pages lues", "≈ " + Math.round(r.pages), ["Les pages spéciales ne se lisent pas hors ligne"]);
    if (r.nf) line("f", "<svg viewBox='0 0 24 24' width='20' height='20'><circle cx='12' cy='15' r='5' fill='#e8c04a' stroke='#6b4a10'/><rect x='10.5' y='3' width='3' height='9' rx='1' fill='#e8c04a' stroke='#6b4a10'/></svg>", "Fragments", "+" + r.nf, ["Quota passif du jour : respecté"]);
    r.done.forEach(t => line("d", "<svg viewBox='0 0 24 24' width='20' height='20'><path d='M5 12.5l4.5 4.5L19 7' fill='none' stroke='#34d399' stroke-width='3' stroke-linecap='round'/></svg>", t, ""));
    h += "</div>";
    if (r.idle.length) h += "<p class='aw-i'><b>Inactifs hors ligne :</b> " + r.idle.map(i => "<span>" + i + "</span>").join("") + "</p>";
    if (r.load.length) h += "<p class='aw-w'><b>Sorts en cours de chargement :</b> " + r.load.join(" · ") + "</p>";
    body.innerHTML = h + "<button class='ac-go' id='acAwayOk'>COMPRIS</button>"; el.hidden = false; $("acAwayOk").focus();
    $("acAwayOk").onclick = () => { el.hidden = true; if (cb) cb(); };
    if (typeof Nav !== "undefined" && !showAway.nav) { showAway.nav = 1; Nav.add("acAway", { open: () => !$("acAway").hidden, close: () => { $("acAway").hidden = true; } }); }
  };
  return { title, tick, showAway, modTxt };
})();
