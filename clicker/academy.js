"use strict";
// L'Académie des Arcanes (ex-Amphithéâtre, v2.a3.6) — INTERFACE : grille des sorts (écoles × rangs), fiche d'un sort, fenêtre d'EXAMEN, « pli de l'Académie » (célébration en attente).
// Les RÈGLES sont dans clicker/progress.js (pures) et clicker/spells.js (learn, startExam, examInfo). DA = maquettes/sorts.html (classes préfixées ac-).
window.Academy = (() => {
  const $ = id => document.getElementById(id), sp = () => Spells.sp(), SCH = Spells.SCH, byId = Spells.byId, gl = Spells.glyph;
  const rk = () => sp().rank | 0 || 1, ROM = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
  const OFFL = Spells.OFFL;                                                                  // passifs qui produisent aussi hors ligne (liste unique, dans spells.js)
  const PN = { V: "Voile", G: "Grimoire", X: "Voile & Grimoire" };
  const ic = {
    chest: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M3 11V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2z' fill='rgba(212,175,55,.25)' stroke='#f5d98a' stroke-width='1.5' stroke-linejoin='round'/><rect x='3' y='11' width='18' height='8' rx='2' fill='rgba(139,92,246,.25)' stroke='#f5d98a' stroke-width='1.5'/><rect x='10' y='9.5' width='4' height='4' rx='1' fill='#f5d98a'/></svg>",
    ok: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 12l5 5L20 6'/></svg>",
    lock: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='5' y='11' width='14' height='10' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/></svg>"
  };
  const MOT = { evo: "feu · éclairs", enc: "fils · charmes", ill: "miroirs · éclats", nec: "brume · os", abj: "bouclier · runes", div: "œil · étoiles", tra: "alchimie · or", con: "portails · cercles" };
  const TITRE = { evo: "ÉVOCATEUR", enc: "ENCHANTEUR", ill: "ILLUSIONNISTE", nec: "NÉCROMANCIEN", abj: "ABJURATEUR", div: "DEVIN", tra: "TRANSMUTATEUR", con: "CONJURATEUR" };
  const TAG = { evo: "La flamme obéit à qui ose la nommer.", enc: "Les volontés plient devant la tienne.", ill: "Ce que tu montres n'est jamais ce qui est.", nec: "La mort n'est qu'un outil de plus.", abj: "Rien ne passe sans ton accord.", div: "Tu as déjà lu la fin de l'histoire.", tra: "Tout devient ce que tu désires.", con: "Les portes s'ouvrent quand tu appelles." };
  const SPE = {   // bonus RÉELS de la spécialité (valeurs = clicker/effects.js, §11)
    evo1: "Projectile Magique : 15 impulsions au lieu de 10, recharge 15 s, et le critique s'applique", evo2: "Orbe Lumineux : 45 s d'Éther et 30 clics au lieu de 30 s et 20", evo3: "Boule de Feu Arcanique : 14 s à 14 impulsions/s, recharge 70 s", evo4: "Météore de l'Académie : dès 70 clics, ×2 pendant 20 s",
    enc1: "Charme-Personne : −15 % de coût, aussi sur les bâtiments d'Éther", enc2: "Suggestion : +25 % de vitesse des Scribes", enc3: "Domination d'Esprit : 40 s, recharge 95 s", enc4: "Mot de Pouvoir : Obéissance : ×1,3 de Sagesse",
    ill1: "Lumières Dansantes : +12 % de pages rares", ill2: "Image Miroir : ×7, avec 2 charges", ill3: "Mot de Divertissement : +8 s de durée", ill4: "Voile d'Illusion Majeure : ×15, durée +50 %",
    nec1: "Faucheur de Tome : ×1,10 de Sagesse", nec2: "Invocation de Squelette Scribe : 4 % de tes pages/s", nec3: "Transmutation Vitale : ne consomme que 5 % de la Sagesse", nec4: "Encre Cramoisie : Page Nécrotique ×7",
    abj1: "Bouclier d'Éther : +2 clics/s au Voile et au Grimoire", abj2: "Glyphe de Warding : hors ligne plafonné à 12 h", abj3: "Disjonction de Mordenkainen : recharge 40 s et 5 s d'immunité", abj4: "Sanctuaire Absolu : −22 % de recharge",
    div1: "Augure : tu vois les 2 prochaines pages", div2: "Vision du Passé : +30 %, Éther hors ligne inclus", div3: "Prescience : 7 pages rares, recharge 120 s", div4: "Vision de l'Avenir : −35 % de temps de cours",
    tra1: "Alchimie Mineure : ne brûle que 10 % de la Sagesse", tra2: "Fonte des Runes : ×4 pendant 40 s", tra3: "Transmutation de Plomb en Or : 20 s, recharge 95 s", tra4: "Philosophie de la Matière : ×1,35, Bougie et Homoncule inclus",
    con1: "Portail Mineur : −8 % de coût", con2: "Invocation de Familier : 2 familiers", con3: "Cercle de Téléportation : remet 2 sorts à zéro, recharge 190 s", con4: "Invocation d'Avatar Arcanique : 14 s de pleine puissance",
    evo5: "Chaîne d'Éclairs : 28 s, 2 impulsions par clic, recharge 120 s", enc5: "Sceau de Prospérité : −30 % de coût pendant 40 s, recharge 140 s", ill5: "Double Reflet : ×7, recharge 95 s",
    nec5: "Légion de Squelettes : +5 % de tes pages/s", abj5: "Égide Totale : pause de surchauffe −65 %", div5: "Veillée Prophétique : +5 h de plafond hors ligne et Éther +30 %", tra5: "Pierre Philosophale : rendement ×30 au lieu de ×20", con5: "Pacte d'Exemption : Taxe −65 %"
  };
  let speMode = 1, miniDead = false, cg = { init: 0, vis: 0, hide: 0, next: 0 }, dipClose = null, navDone = 0, selK = null, snooze = new Set(), uid = 0, sel = null, exN = 0, last = {}, tEx = 0, celOpen = 0, onCele = null;
  const EYE = "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'><path d='M2 12c4-7 16-7 20 0-4 7-16 7-20 0z'/><circle cx='12' cy='12' r='3' fill='currentColor'/></svg>";
  const tfmt = s => s < 60 ? Math.round(s) + " s" : s < 3600 ? Math.round(s / 60) + " min" : (s / 3600) % 1 ? (s / 3600).toFixed(1).replace(".", ",") + " h" : s / 3600 + " h";
  const clock = s => { s = Math.max(0, Math.ceil(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), q = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(q).padStart(2, "0"); };
  const set = (id, txt) => { const e = $(id); if (e && last[id] !== txt) { last[id] = txt; e.textContent = txt; } };

  // Médaillon d'école : anneau de runes tournant, orbe en dégradé, reflets, glyphe lumineux (même dessin que la maquette)
  function med(k) {
    const s = SCH.find(x => x[0] === k), h = s[2], i = ++uid;
    const ticks = Array.from({ length: 24 }, (_, n) => { const a = n * 15 * Math.PI / 180, r1 = 52, r2 = n % 3 ? 55.5 : 58; return "<path d='M" + (60 + Math.sin(a) * r1).toFixed(1) + " " + (60 - Math.cos(a) * r1).toFixed(1) + "L" + (60 + Math.sin(a) * r2).toFixed(1) + " " + (60 - Math.cos(a) * r2).toFixed(1) + "' stroke='hsl(" + h + " 80% 72%)' stroke-opacity='" + (n % 3 ? .45 : .9) + "' stroke-width='" + (n % 3 ? 1 : 1.6) + "' stroke-linecap='round'/>"; }).join("");
    return "<svg class='ac-med' viewBox='0 0 120 120' aria-hidden='true'><defs><radialGradient id='aco" + i + "' cx='35%' cy='28%' r='80%'><stop offset='0' stop-color='hsl(" + h + " 95% 82%)'/><stop offset='.38' stop-color='hsl(" + h + " 80% 52%)'/><stop offset='1' stop-color='hsl(" + h + " 70% 12%)'/></radialGradient>" +
      "<linearGradient id='acr" + i + "' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fde68a'/><stop offset='.5' stop-color='#d4af37'/><stop offset='1' stop-color='#78531a'/></linearGradient><filter id='acb" + i + "' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='3'/></filter></defs>" +
      "<circle cx='60' cy='60' r='52' fill='hsl(" + h + " 90% 55%)' opacity='.25' filter='url(#acb" + i + ")'/><g class='ac-ringrot'>" + ticks + "</g><circle cx='60' cy='60' r='47' fill='none' stroke='url(#acr" + i + ")' stroke-width='2.4'/>" +
      "<circle cx='60' cy='60' r='43' fill='url(#aco" + i + ")' stroke='hsl(" + h + " 90% 80%)' stroke-opacity='.5'/><path d='M26 46a36 36 0 0 1 58-14' fill='none' stroke='#fff' stroke-opacity='.5' stroke-width='3' stroke-linecap='round'/><ellipse cx='42' cy='38' rx='11' ry='6' fill='#fff' opacity='.22' transform='rotate(-30 42 38)'/>" +
      "<g transform='translate(34 34) scale(2.17)' fill='none' stroke='hsl(" + h + " 100% 88%)' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' filter='url(#acb" + i + ")' opacity='.9'>" + s[3] + "</g><g transform='translate(34 34) scale(2.17)' fill='none' stroke='#fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>" + s[3] + "</g></svg>";
  }
  // Sceau officiel de l'Académie : bord dentelé, texte circulaire, rubans
  function seal(n) {
    const i = ++uid; let p = ""; for (let a = 0; a < 36; a++) { const t = a * 10 * Math.PI / 180, t2 = (a * 10 + 5) * Math.PI / 180; p += (a ? "L" : "M") + (50 + Math.sin(t) * 47).toFixed(1) + " " + (50 - Math.cos(t) * 47).toFixed(1) + "L" + (50 + Math.sin(t2) * 43).toFixed(1) + " " + (50 - Math.cos(t2) * 43).toFixed(1); } p += "Z";
    return "<svg viewBox='0 0 100 132' class='ac-seal' aria-hidden='true'><defs><radialGradient id='acsa" + i + "' cx='35%' cy='30%'><stop offset='0' stop-color='#fde68a'/><stop offset='.55' stop-color='#d4af37'/><stop offset='1' stop-color='#6b4710'/></radialGradient><path id='acsp" + i + "' d='M50 50m-32.5 0a32.5 32.5 0 1 1 65 0a32.5 32.5 0 1 1-65 0'/></defs>" +
      "<path d='M31 86l-10 42 15-9 9 11 6-40z' fill='#7f1d1d'/><path d='M69 86l10 42-15-9-9 11-6-40z' fill='#b91c1c'/><path d='M31 86l-10 42 15-9' fill='none' stroke='#fecaca' stroke-opacity='.3'/>" +
      "<path d='" + p + "' fill='url(#acsa" + i + ")' stroke='#fde68a' stroke-opacity='.7'/><circle cx='50' cy='50' r='39' fill='none' stroke='#5b3d0f' stroke-opacity='.7' stroke-width='1.2'/>" +
      "<text font-family='Cinzel,serif' font-size='5.6' font-weight='900' fill='#3b2a0a' letter-spacing='1.1'><textPath href='#acsp" + i + "'>ACADÉMIE DES ARCANES ✦ EXAMEN ✦ " + (ROM[n] || "") + " ✦</textPath></text>" +
      "<circle cx='50' cy='50' r='23' fill='#3b2a0a' fill-opacity='.16' stroke='#5b3d0f' stroke-opacity='.6'/><path d='M30 62c-8-6-8-18-2-26M70 62c8-6 8-18 2-26' fill='none' stroke='#5b3d0f' stroke-opacity='.55' stroke-width='2' stroke-linecap='round'/>" +
      "<text x='50' y='61' text-anchor='middle' font-family='Cinzel,serif' font-weight='900' font-size='28' fill='#3b2a0a'>" + n + "</text><ellipse cx='38' cy='30' rx='12' ry='5' fill='#fff' opacity='.28' transform='rotate(-30 38 30)'/></svg>";
  }

  const tone = (f0, f1, d, v = .08, type = "sawtooth") => { if (!SOUND) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(t + d); } catch (e) {} };
  const tension = (sec) => { if (!SOUND) return null; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = "sawtooth"; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(260, t + sec); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.06, t + sec * .9); o.connect(g); g.connect(ac.destination); o.start(); return () => { try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(.0001, ac.currentTime, .03); o.stop(ac.currentTime + .15); } catch (e) {} }; } catch (e) { return null; } };   // grondement qui monte tant qu'on maintient
  const hold = (btn, ms, done, snd) => {                                    // appui maintenu (souris, doigt, Espace/Entrée) : barre qui se remplit, `done` à 100 %
    let raf = 0, t0 = 0, off = null; const stop = () => { cancelAnimationFrame(raf); raf = 0; t0 = 0; btn.style.setProperty("--p", 0); if (off) { off(); off = null; } };
    const step = t => { if (!t0) t0 = t; const p = Math.min(100, (t - t0) / ms * 100); btn.style.setProperty("--p", p); if (p >= 100) { raf = 0; if (off) { off(); off = null; } done(); return; } raf = requestAnimationFrame(step); };
    const start = e => { e.preventDefault(); stop(); if (snd) off = tension(ms / 1e3); raf = requestAnimationFrame(step); };
    btn.addEventListener("pointerdown", start); ["pointerup", "pointerleave", "pointercancel"].forEach(ev => btn.addEventListener(ev, stop));
    btn.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) start(e); }); btn.addEventListener("keyup", stop);
  };
  const buzz2 = p => { try { if (readPrefs().vibe !== false && navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  // Médaille d'examen en miniature (même famille que le sceau de l'Académie) : or = à passer, vert = validé, grise = verrouillé
  const chipMedal = (n, st) => {
    const i = ++uid, c = st === "done" ? ["#a7f3d0", "#10b981", "#065f46"] : st === "cur" ? ["#fde68a", "#d4af37", "#6b4710"] : ["#94a3b8", "#475569", "#1e293b"]; let p = ""; for (let a = 0; a < 16; a++) { const t = a * 22.5 * Math.PI / 180, t2 = (a * 22.5 + 11.25) * Math.PI / 180; p += (a ? "L" : "M") + (20 + Math.sin(t) * 18.5).toFixed(1) + " " + (20 - Math.cos(t) * 18.5).toFixed(1) + "L" + (20 + Math.sin(t2) * 16.5).toFixed(1) + " " + (20 - Math.cos(t2) * 16.5).toFixed(1); }
    return "<svg class='ac-cm' viewBox='0 0 40 40' aria-hidden='true'><defs><radialGradient id='accm" + i + "' cx='35%' cy='30%'><stop offset='0' stop-color='" + c[0] + "'/><stop offset='.6' stop-color='" + c[1] + "'/><stop offset='1' stop-color='" + c[2] + "'/></radialGradient></defs><path d='" + p + "Z' fill='url(#accm" + i + ")' stroke='" + c[0] + "' stroke-opacity='.6' stroke-width='.8'/><circle cx='20' cy='20' r='12' fill='none' stroke='" + c[2] + "' stroke-opacity='.55'/>" +
      (st === "done" ? "<path d='M13.5 20.5l4.2 4.2 8.8-9.4' fill='none' stroke='#052e1b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/>" : st === "cur" || st === "fut" && false ? "" : "") + (st === "done" ? "" : "<text x='20' y='25.5' text-anchor='middle' font-family='Cinzel,serif' font-weight='900' font-size='15' fill='" + (st === "cur" ? "#3b2a0a" : "#0f172a") + "'>" + n + "</text>") + (st === "fut" || st === "seal" ? "<rect x='25' y='25' width='11' height='9' rx='2' fill='#0f172a' stroke='" + c[0] + "' stroke-width='1.2'/><path d='M27.5 25v-2.5a3 3 0 0 1 6 0V25' fill='none' stroke='" + c[0] + "' stroke-width='1.3'/>" : "") + "</svg>";
  };

  // ---------- Barre du haut : rang, Sagesse, cours / examen en cours, pli de l'Académie, puces d'examens ----------
  const top = () => {
    const R = rk(), c = sp().course, ex = sp().exam, pend = Prog.pending(S).length;
    const chips = Array.from({ length: Math.max(4, R) }, (_, i) => i + 1).map(n => {                                  // tuiles : médaille + état ; l'examen À PASSER est doré, avec sa progression, et pulse quand il est prêt
      const done = n < R, cur = n === R, k8 = Prog.doneAt(sp(), n), ready = cur && k8 === 8 && !ex, sealed = n > Prog.EX.open, run = !!ex && ex.n === n, st = done ? "done" : sealed ? "seal" : cur ? "cur" : "fut";
      const sub = done ? "Validé" : sealed ? "Bientôt" : run ? "Épreuve en cours" : cur ? (ready ? "Prêt à passer" : k8 + " / 8 sorts appris") : "Rang " + n + " à ouvrir";
      return "<button class='ac-ch " + st + (ready ? " ready" : "") + "' data-n='" + n + "'>" + chipMedal(n, st) + "<span class='ac-cht'><b>EXAMEN " + ROM[n] + "</b><small>" + sub + "</small>" + (cur && !run ? "<i class='ac-chb'><u style='width:" + Math.round(k8 / 8 * 100) + "%'></u></i>" : "") + "</span></button>";
    }).join("");
    const sc = sp().school, scd = sc && SCH.find(x => x[0] === sc);
    const sc2 = sp().school2, sd2 = sc2 && SCH.find(x => x[0] === sc2), can2 = sc && !sc2 && sp().exDone[4];
    $("acTop").innerHTML = "<div class='ac-bar'><div class='ac-rank'><span>RANG</span><b>" + ROM[R] + "</b></div><div class='ac-wal'><span>Sagesse disponible</span><b id='acW'>" + fN(S.sg) + "</b></div></div>" +
      "<button class='ac-spe" + (sc ? " set" : "") + "' id='acSpeB' " + (sc ? "style='--h:" + scd[2] + "'" : "") + ">" + (sc ? med(sc) + "<span><small>SPÉCIALITÉ" + (sd2 ? " · + " + sd2[1].toUpperCase() + " (50 %)" : "") + "</small><b>" + scd[1].toUpperCase() + "</b></span>" : "<span><small>Aucune école choisie</small><b>CHOISIR MA SPÉCIALITÉ</b></span>") + "</button>" + (can2 ? "<button class='ac-spe' id='acSpe2B'><span><small>Récompense de l'examen IV</small><b>CHOISIR MA SECONDE ÉCOLE</b></span></button>" : "") +
      (pend ? "<button class='ac-pli' id='acPli'>" + ic.ok.replace("<svg", "<svg width='16' height='16'") + "<span>Un pli de l'Académie t'attend</span></button>" : "") +
      "<div class='ac-run' id='acRun' " + (c || ex ? "" : "hidden") + "></div><div class='ac-chips'>" + chips + "</div>";
    last = {}; $("acTop").querySelectorAll(".ac-chips button").forEach(b => b.onclick = () => openExam(+b.dataset.n)); const rn = $("acRun"); if (rn) rn.onclick = () => { if (ex) openExam(ex.n); else if (c) { sel = c.id; grid(); detail(); } };
    const pl = $("acPli"); if (pl) pl.onclick = () => { snooze.clear(); celebrate(true); }; $("acSpeB").onclick = () => openSpe(); const s2 = $("acSpe2B"); if (s2) s2.onclick = () => openSpe(2);
  };

  // ---------- Grille : 8 écoles × rangs (rang suivant grisé, au-delà masqué, rang 5 = « ??? ») ----------
  const grid = () => {
    const R = rk(), maxR = Math.min(6, R + 1), L = sp().learned, c = sp().course; let h = "<tr><th></th>" + Array.from({ length: maxR }, (_, r) => "<th>RANG " + (r + 1) + "</th>").join("") + "</tr>";
    SCH.forEach(s => {
      h += "<tr><td class='ac-sch'><div class='ac-sn' style='--h:" + s[2] + "'>" + med(s[0]) + "<div>" + s[1].toUpperCase() + (sp().school === s[0] ? "<em>Spécialité</em>" : "") + "</div></div></td>";
      for (let r = 0; r < maxR; r++) {
        if (r === 5) { h += "<td><div class='ac-t ac-mystery' style='--h:" + s[2] + "'>???</div></td>"; continue; }
        const x = byId[s[0] + (r + 1)], lock = r + 1 > R, done = !!L[x.id], lng = !!c && c.id === x.id, inner = gl(s[0], 26) + "<span class='ac-ty'>" + (x.t === "A" ? "ACTIF" : "") + "</span>" + (lock ? "" : "<span class='ac-nm'>" + x.n + "</span>");
        h += "<td><button class='ac-t" + (lock ? " locked" : "") + (done ? " learned" : "") + (lng ? " learning" : "") + (sel === x.id ? " sel" : "") + "' style='--h:" + s[2] + "' data-id='" + x.id + "' aria-label='" + (lock ? "Sort verrouillé" : x.n) + "'><span class='ac-in dull'>" + inner + "</span><span class='ac-in lit' style='clip-path:inset(0 " + (done ? 0 : 100) + "% 0 0)'>" + inner + "</span><span class='ac-ck'>" + ic.ok + "</span>" + (lock ? "<span class='ac-lk'>" + ic.lock + "</span>" : "") + "</button></td>";
      }
      h += "</tr>";
    });
    $("acGr").innerHTML = h; $("acGr").querySelectorAll("button.ac-t").forEach(b => b.onclick = () => { sel = b.dataset.id; grid(); detail(); }); last = {}; paint(Date.now());
  };

  // ---------- Fiche du sort sélectionné ----------
  const detail = () => {
    const el = $("acDt"); if (!sel) { el.innerHTML = "<div class='ac-hint'>Touche un sort pour voir son effet, son prix et la durée du cours.</div>"; return; }
    const s = byId[sel], k = s.k, sc = SCH.find(x => x[0] === k), R = rk(), L = sp().learned, c = sp().course, ex = sp().exam;
    const lock = s.r > R, done = !!L[s.id], lng = !!c && c.id === s.id, q = Spells.quote(s), price = q.price, time = q.time, busy = (!!c && !lng) || !!ex, poor = S.sg < price;
    const tags = "<span class='ac-tg " + (s.t === "A" ? "act" : OFFL.has(s.id) ? "off" : "on") + "'>" + (s.t === "A" ? "Actif" : OFFL.has(s.id) ? "Passif · hors ligne" : "Passif · en ligne") + "</span><span class='ac-tg'>" + PN[s.pn] + "</span><span class='ac-tg'>Rang " + s.r + "</span>";
    const btn = done ? "<button class='ac-learn' disabled>APPRIS ✓</button>" : lock ? "<button class='ac-learn' disabled>VERROUILLÉ</button>" : lng ? "<button class='ac-learn' disabled>COURS EN COURS</button>" :
      "<button class='ac-learn' id='acL' " + (busy || poor ? "disabled" : "") + ">" + (ex ? "EXAMEN EN COURS" : busy ? "UN COURS EST DÉJÀ EN COURS" : poor ? "SAGESSE INSUFFISANTE" : "APPRENDRE") + "<small>" + (q.mul < 1 ? "<s>" + fN(q.basePrice) + " Sg · " + tfmt(q.baseTime) + "</s><br>" + fN(price) + " Sg · " + tfmt(time) + " (−" + String(+((1 - q.mul) * 100).toFixed(1)).replace(".", ",") + " %)" : fN(price) + " Sg · " + tfmt(time)) + "</small></button>";
    const name = lock ? s.n.replace(/./g, (ch, i) => i < 2 ? ch : "·") : s.n;
    el.style.setProperty("--h", sc[2]);
    el.innerHTML = "<div class='ac-ico' style='color:hsl(" + sc[2] + " 80% 68%)'><span class='d'>" + gl(k, 62) + "</span><span class='l' id='acIcl' style='clip-path:inset(0 " + (done ? 0 : 100) + "% 0 0)'>" + gl(k, 62) + "</span></div>" +
      "<div><h4 style='color:hsl(" + sc[2] + " 80% 72%)'>" + name + "</h4><div class='ac-tags'>" + tags + "</div><p>" + (lock ? "Réussis l'examen du rang " + R + " pour accéder à ce rang." : (window.Lex ? Lex.mark(s.d) : s.d)) + "</p>" + (lock ? "" : "<div class='ac-spl" + (sp().school === k || sp().school2 === k ? " on" : "") + "'>" + (sp().school === k ? "★ Spécialité : " : sp().school2 === k ? "½ Seconde spécialité (50 %) : " : "Bonus de spécialité (si " + sc[1] + " est ton école) : ") + (SPE[s.id].indexOf(s.n + " : ") === 0 ? SPE[s.id].slice(s.n.length + 3) : SPE[s.id]) + "</div>") +
      (lng ? "<div class='ac-clock' id='acClk'></div>" : lock || done ? "" : "<div class='ac-clock off'>Durée du cours : " + tfmt(time) + "</div>") + "</div>" + btn;
    const b = $("acL"); if (b) b.onclick = () => Spells.learn(s); last = {}; paint(Date.now());
  };

  // ---------- Fenêtre d'examen ----------
  const CT = {
    spe: ["Choisir ta spécialité", "Au premier examen, tu t'engages auprès d'une école. Ce choix est définitif : elle réduit de 25 % le prix et le temps de ses cours et renforce chacun de ses sorts."],
    fill1: ["Un sort dans chaque emplacement", "Place un sort dans ton emplacement du Voile ET dans celui du Grimoire (peu importe lequel). C'est ainsi que tu prépares ton équipement."],
    fill2: ["Tous les emplacements remplis", "Remplis au moins une fois chacun de tes 2 emplacements du Voile et de tes 2 du Grimoire."],
    cast: ["Avoir lancé un sort actif", "Lance au moins une fois un sort actif depuis un emplacement, au Voile ou au Grimoire."],
    deck: ["Avoir créé un deck", "Dans l'Académie des Arcanes, enregistre ton équipement dans un deck nommé (bouton « Mes Decks »)."],
    equip: ["Avoir équipé un deck", "Équipe un de tes decks depuis le menu Decks."],
    cast3: ["3 sorts actifs différents lancés", "Lance au moins 3 sorts actifs différents."],
    deck4: ["Un deck complet", "Enregistre un deck dont TOUS les emplacements sont remplis : 4 au Voile et 4 au Grimoire (bouton « Mes Decks »)."],
    deck5: ["Un deck complet (5 + 5)", "Enregistre un deck dont TOUS les emplacements sont remplis : 5 au Voile et 5 au Grimoire (bouton « Mes Decks »)."],
    cast5: ["5 sorts actifs différents lancés", "Lance au moins 5 sorts actifs différents."],
    ov: ["Avoir déclenché une surchauffe", "Frappe le Voile trop vite, au-delà de sa limite de clics par seconde, jusqu'à la surchauffe. C'est le meilleur moyen d'apprendre à la maîtriser."]
  };
  const ctext = (c, n) => c.id === "eth" ? [fE(c.need) + " d'Éther cumulé", "Total d'Éther gagné depuis le début : " + fE(c.need) + ". Touche le compteur d'Éther pour voir la valeur exacte."] :
    c.id === "sg" ? [fN(c.need) + " Sagesse cumulées", "Total de Sagesse gagnée depuis le début : " + fN(c.need) + ". Les pages lues et tes bâtiments la produisent."] : CT[c.id === "fill" ? "fill" + n : c.id];
  // Recommencer à zéro (v2.a3.27) : fenêtre d'explication + appui maintenu 3 s → core.js resetAllProgress()
  const openRst = () => { $("acRst").hidden = false; }, closeRst = () => { $("acRst").hidden = true; };
  const exam = () => {
    const n = exN, R = rk(), body = $("acExB"), ex = sp().exam, info = Spells.examInfo(n), future = n > R, done = n < R, sealed = n > Prog.EX.open && !future, running = !!ex && ex.n === n;
    const pips = SCH.map(s => { const o = !!sp().learned[s[0] + n]; return "<span class='ac-pip" + (o ? "" : " off") + "' title='" + s[1] + "' style='color:hsl(" + s[2] + " 80% 65%);border-color:hsl(" + s[2] + " 70% 55%/.6)'>" + gl(s[0], 13) + "</span>"; }).join("");
    let h = "<div class='ac-exh'>" + seal(n) + "<div><div class='ac-acad'>ACADÉMIE DES ARCANES · SESSION D'EXAMENS</div><h3>EXAMEN DU RANG " + n + "</h3>" + (future ? "<div class='ac-sub'>Les sorts du rang " + n + " ne sont pas encore tous accessibles.</div>" : "<div class='ac-pips'>" + pips + "</div><div class='ac-sub'>" + info.learned + " / 8 sorts du rang " + n + " appris</div>") + "</div></div>";
    if (future || sealed) h += "<div class='ac-blurc'><div class='ac-fake'>" + [1, 2, 3, 4].map(() => "<div class='ac-cd'><span class='st'>" + ic.ok + "</span><div><b>Objectif secret de l'examen</b><small>Description de l'objectif</small></div><span class='ac-info'>i</span></div>").join("") + "</div><div class='ac-veil'>" + ic.lock + "<b>" + (sealed ? "Bientôt" : "Des objectifs t'attendent") + "</b><span>" + (sealed ? "Cet examen s'ouvrira avec les sorts du rang " + n + "." : "Ils se dévoileront à l'ouverture de ce rang.") + "</span></div></div>";
    else if (!done) {
      const firstNo = info.conds.findIndex(c => !c.ok);
      h += "<div class='ac-conds'>" + info.conds.map((c, i) => { const t = ctext(c, n), pct = c.ok ? 100 : c.need ? Math.round(Math.min(1, c.have / c.need) * 100) : 0;
        return "<div class='ac-cd" + (c.ok ? " ok" : i === firstNo ? " wait" : "") + "'><span class='st'>" + ic.ok + "</span><div><b>" + t[0] + "</b>" + (c.need ? "<div class='bar'><i style='width:" + pct + "%'></i></div>" : c.id === "spe" && !c.ok ? "<small><button class='ac-mini' id='acSpeGo'>Choisir mon école</button></small>" : "<small>" + (c.ok ? "Validé" : "En attente de validation") + "</small>") + "</div><button class='ac-info' data-i='" + i + "' aria-label='Que faut-il faire ?'>i</button></div>"; }).join("") + "</div>";
    } else h += "<div class='ac-res'><b>RANG " + (n + 1) + " DÉBLOQUÉ</b><div>Un emplacement de plus au Voile et au Grimoire · les sorts du rang " + (n + 1) + " sont étudiables.</div></div>";
    const why = info.can.why, unread = done && Prog.pending(S).some(e => e.k === Prog.examKey(S, n));          // examen validé dont le pli n'a pas encore été lu
    h += "<div class='ac-pay'><div class='ac-wallet'><span>Sagesse disponible</span><b>" + fN(S.sg) + " <small>Sg</small></b></div><div class='ac-r'><span>Frais d'inscription</span><b>" + fN(info.price) + " Sg</b></div><div class='ac-r'><span>Durée de l'examen<br><small>se poursuit hors ligne</small></span><b>" + tfmt(info.dur) + "</b></div>";
    if (running) { const ch = ex.ch || {}, gh = n >= Prog.CHEAT.first && !ch.over && (ch.tries | 0) < Prog.CHEAT.tries;          // bulle secrète : jamais expliquée
      h += "<div class='ac-runb'><div class='ac-tb' id='acTb'><div class='ac-ring' id='acRing'><span id='acRt'></span></div>" + (gh ? "<button class='ac-gb' id='acGhost' aria-label='Tricher'>" + EYE + "</button>" : "") + "</div><div>Épreuve en cours…<br><small>Tu peux fermer le jeu : elle continue.</small></div></div>"; }
    else h += "<button class='ac-go" + (unread ? " ac-pulse" : "") + "' id='acGo' " + (info.can.ok || unread ? "" : "disabled") + ">" + (unread ? "LIRE LE RÉSULTAT" : done ? "EXAMEN VALIDÉ ✓" : sealed ? "BIENTÔT" : future ? "RANG VERROUILLÉ" : why === "locked" ? "INSCRIPTIONS CLOSES" : "PAYER ET M'INSCRIRE") + "</button>" +
      (done || future || sealed ? "" : "<div class='ac-note'>" + ({ locked: "Tu as été surpris en train de tricher. Tu pourras te réinscrire dans " + tfmt(Math.max(1, Math.ceil(((S.lock || 0) - Date.now()) / 1e3))) + ".", spells: "Apprends d'abord les 8 sorts du rang " + n + ".", conds: "Remplis toutes les conditions pour t'inscrire.", poor: "Sagesse insuffisante pour les frais d'inscription.", busy: "Un examen est déjà en cours.", course: "Termine d'abord ton cours en cours." }[why] || "") + "</div>");
    h += "</div>";
    const row = (c, l, p) => "<div class='ac-row " + c + "'><span>" + l + "</span>" + Array.from({ length: Math.max(4, R) }, (_, i) => "<span class='ac-sl " + (i < R ? "f" : "lock") + (done && i === n ? " new" : "") + "'>" + (i < R ? "✦" : ic.lock) + "</span>").join("") + "</div>";
    if (done) h += "<button class='ac-go sec' id='acRev2'>REVOIR MON DIPLÔME</button>";
    const REW = { 3: "Couleur & halo du coffre + fond aux couleurs de ton école", 6: "Skin de coffre à l'effigie de ton école" };   // gains de Personnalisation (Coffre › Profil › Personnalisation)
    h += "<div class='ac-slots'>" + row("v", "VOILE") + row("g", "GRIMOIRE") + (REW[n] ? "<div class='ac-row k" + (done ? " got" : "") + "'><span>COFFRE</span><em class='ac-rew'>" + ic.chest + "<b>" + REW[n] + "</b></em></div>" : "") + "</div>";
    body.innerHTML = h; last = {};
    { const tb = $("acTb"), gh = $("acGhost"); if (tb && cg.vis) tb.classList.add("g"); if (gh) gh.onclick = openCht; if (!tb) cg.init = 0; }
    body.querySelectorAll(".ac-info[data-i]").forEach(b => b.onclick = () => { const t = ctext(info.conds[+b.dataset.i], n); $("acInfoT").textContent = t[0]; $("acInfoP").textContent = t[1]; $("acInfo").hidden = false; $("acInfoOk").focus(); });
    const sg = $("acSpeGo"); if (sg) sg.onclick = openSpe; const r2 = $("acRev2"); if (r2) r2.onclick = () => diploma(n, null);
    const go = $("acGo"); if (go) go.onclick = () => { if (unread) { closeExam(); snooze.clear(); celebrate(true); return; } const r = Spells.startExam(n); if (r.ok) { tone(220, 110, .25, .09, "triangle"); tone(1500, 700, .12, .04, "square"); buzz2(30); toast("Inscription validée : l'épreuve commence"); } };
  };
  const openExam = n => { exN = n; $("acEx").hidden = false; exam(); const f = $("acExC"); if (f) f.focus(); };
  const closeExam = () => { $("acEx").hidden = true; };

  // ---------- Choix de la spécialité (définitif) ----------
  const speR = () => {
    const m2 = speMode === 2, first = sp().school, done = m2 ? sp().school2 : first, box = $("acSpeB2");
    $("acSpe").querySelector(".phead b").textContent = m2 ? "Choisis ta seconde école" : "Choisis ta spécialité"; $("acSpe").querySelector(".ac-lead").innerHTML = m2 ? "Récompense de l'examen IV : une <b>seconde école</b>. Ses bonus agissent à <b>50 %</b> et ses cours coûtent 12,5 % de moins. Choix définitif." : "À ton premier examen, tu t'engages auprès d'une école. Ce choix est <b>définitif</b> : elle réduit le prix et le temps de ses cours et renforce chacun de ses sorts.";
    const cards = SCH.map(x => "<button class='ac-sc" + (selK === x[0] ? " on" : "") + ((done && done !== x[0]) || (m2 && x[0] === first) ? " dim" : "") + "' data-k='" + x[0] + "' style='--h:" + x[2] + "' " + (done || (m2 && x[0] === first) ? "disabled" : "") + "><div class='ac-motif ac-mo-" + x[0] + "'></div>" + med(x[0]) + "<b>" + x[1].toUpperCase() + "</b><small>" + MOT[x[0]] + "</small></button>").join("");
    const k = done || selK, sc = k && SCH.find(x => x[0] === k); let det;
    if (!k) det = "<div class='ac-sphint'>Touche une école pour voir ce qu'elle t'apporte.<br><small>Rien n'est définitif avant la confirmation maintenue.</small></div>";
    else det = "<div class='ac-sdh'>" + med(k) + "<div><h3>" + sc[1].toUpperCase() + "</h3><div class='ac-ssub'>" + MOT[k] + "</div></div></div><ul>" + [1, 2, 3, 4].map(i => "<li><i>✦</i><span>" + SPE[k + i] + "</span></li>").join("") + "</ul>" +
      "<div class='ac-scom'>" + (m2 ? "<b>Seconde école :</b> bonus à 50 % (moitié des valeurs ci-dessus), −12,5 % de prix et de temps sur ses cours." : "<b>Pour toute école :</b> −25 % de prix et de temps sur ses cours.") + "</div>" +
      (done ? "<div class='ac-sealedtxt'>Spécialisation scellée. Tes cours de " + sc[1] + " coûtent 25 % de moins et durent 25 % de moins, et ses sorts sont renforcés.</div>" :
        "<div class='ac-warn'>" + ic.lock + "<span><b>Choix définitif.</b> Ton école ne pourra plus être changée.</span></div><button class='ac-hold' id='acSeal' style='--h:" + sc[2] + "'><span>MAINTENIR POUR SCELLER</span></button>");
    box.style.setProperty("--h", sc ? sc[2] : 260);
    box.innerHTML = "<div class='ac-cards'>" + cards + "</div><div class='ac-sdet'>" + det + "</div>" +
      (m2 ? "" : "<div class='ac-rstz'><span>Envie de changer d'école ? Seul un nouveau départ le permet.</span><button class='ac-rstb' id='acRstGo'><svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5'/></svg><span>Recommencer à zéro</span></button></div>");   // v2.a3.29 : déplacé ici (avant : lien en bas de l'Académie)
    const rg = $("acRstGo"); if (rg) rg.onclick = openRst;
    box.querySelectorAll(".ac-sc").forEach(b => b.onclick = () => { selK = b.dataset.k; speR(); });
    const sl = $("acSeal"); if (sl) hold(sl, 1200, () => { if (m2) { if (Spells.chooseSchool2(selK)) { const kk = selK; selK = null; $("acSpe").hidden = true; toast("Seconde école scellée : " + SCH.find(x => x[0] === kk)[1] + " (50 %)"); buzz2([60, 40, 90]); tone(523, 1046, .8, .07, "sine"); refresh(); celebrate(); } } else if (Spells.chooseSchool(selK)) { const kk = selK; selK = null; $("acSpe").hidden = true; reveal(kk); } }, true);
  };
  const openSpe = mode => { speMode = mode === 2 ? 2 : 1; snooze.clear(); selK = null; $("acSpe").hidden = false; speR(); };
  const closeSpe = () => { $("acSpe").hidden = true; };
  // Révélation épique (§23.1) : assombrissement, tremblements + vibration, éclair, médaillon, rayons, ondes, titre, phrase d'école. Mouvement réduit = état final direct.
  function reveal(k) {
    const sc = SCH.find(x => x[0] === k), el = $("acRev"), rm = matchMedia("(prefers-reduced-motion: reduce)").matches; el.style.setProperty("--h", sc[2]); el.hidden = false;
    el.innerHTML = "<div class='ac-rbg'></div><div class='ac-rays'></div><div class='ac-rings'><i></i><i></i><i></i></div><div class='ac-rstage'><div class='ac-rvm'>" + med(k) + "</div><div class='ac-rvt'>TU ES " + TITRE[k] + "</div><div class='ac-rvq'>" + TAG[k] + "</div><button class='ac-rvb' id='acRvb'>ENTRER DANS L'ÉCOLE</button></div><div class='ac-flash'></div>";
    const T = [], done = () => { T.forEach(clearTimeout); document.body.classList.remove("ac-shake"); el.className = ""; el.hidden = true; el.innerHTML = ""; refresh(); celebrate(); };
    if (rm) { el.className = "ph2 ph3"; if (window.sfx) sfx("gold"); }
    else {
      el.className = "ph0"; document.body.classList.add("ac-shake"); buzz2([40, 40, 60, 40, 80, 40, 120, 40, 200]); tone(50, 35, 1.3, .16); tone(80, 50, 1.2, .1, "square");
      T.push(setTimeout(() => { el.classList.add("ph1"); tone(900, 200, .5, .1, "triangle"); }, 1300), setTimeout(() => { document.body.classList.remove("ac-shake"); el.classList.add("ph2"); buzz2([200, 60, 300]); tone(523, 1046, 1.4, .07, "sine"); tone(784, 1568, 1.6, .05, "sine"); }, 1500), setTimeout(() => el.classList.add("ph3"), 3800));
    }
    $("acRvb").onclick = done; $("acRvb").focus();
  }

  // ---------- Tricher (§24) : bulle secrète dès l'examen 2 ; 3 tentatives (5 min d'écart) ; mini-jeu « observer le surveillant » (1 par examen) ----------
  const chtBox = () => $("acChtB"), illu = () => Prog.CHEAT.illu * Fx.sf(sp(), "ill");
  const closeCht = () => { $("acCht").hidden = true; miniDead = true; };
  const openCht = () => { if (!sp().exam) return; $("acCht").hidden = false; paintCht(); };
  const updCht = n => {
    const t = $("cTry"), ex = sp().exam; if (!t || !ex) return; const ch = ex.ch, can = Prog.cheatCan(sp(), n), left = Prog.CHEAT.tries - ch.tries;
    set("cTry", can.ok ? "TENTER (" + left + " restante" + (left > 1 ? "s" : "") + ")" : can.why === "wait" ? "PROCHAINE TENTATIVE DANS " + clock(can.left / 1e3) : can.why === "tries" ? "PLUS DE TENTATIVE" : "TRICHE TERMINÉE"); t.disabled = !can.ok;
  };
  const paintCht = msg => {
    const ex = sp().exam; if (!ex) return closeCht(); const ch = ex.ch, o = Prog.cheatOdds(ch.bonus, illu()), b = chtBox(); miniDead = true; b.className = "pbox ac-chtbox";
    b.innerHTML = "<h3>" + EYE + " TRICHER ?</h3><p>Le surveillant est distrait… une feuille glissée, un sort murmuré. Mais l'Académie ne pardonne pas.</p>" +
      "<div class='ac-odds'><div><b class='g'>" + +o.win.toFixed(1) + " %</b><span>Réussir : le temps restant chute de 80 %</span></div><div><b class='r'>" + o.caught + " %</b><span>Être surpris</span></div><div><b>" + +o.none.toFixed(1) + " %</b><span>Rien ne se passe</span></div></div>" +
      "<div class='ac-pen'><b>Si tu es surpris :</b> tu perds 1 sort de ton plus haut rang · tu perds l'examen et repaies l'inscription · réinscription impossible pendant " + tfmt(Prog.CHEAT.lock / 1e3) + ".</div>" + (msg ? "<div class='ac-cmsg'>" + msg + "</div>" : "") +
      "<div class='ac-crow'><button id='cTry'></button><button id='cGame' " + (ch.played ? "disabled" : "") + ">" + (ch.played ? "OBSERVATION FAITE" : "OBSERVER LE SURVEILLANT") + "</button><button id='cOut' class='plain'>RENONCER</button></div><div class='ac-bonus'>Bonus de chance : +" + (ch.bonus + illu()).toFixed(1) + " pt (max +" + Prog.CHEAT.maxBonus + ")</div>";
    $("cOut").onclick = closeCht; $("cTry").onclick = tryCht; $("cGame").onclick = miniGame; last = {}; updCht(Date.now());
  };
  const persist = () => { save(); if (window.cloudSave) cloudSave(true); };
  const tryCht = () => {
    const ex = sp().exam, now = Date.now(); if (!ex) return closeCht(); if (!Prog.cheatCan(sp(), now).ok) return paintCht();
    const ch = ex.ch, odds = Prog.cheatOdds(ch.bonus, illu()); ch.tries++; ch.last = now; Stats.addIn("cheat", "try", 1); Stats.ms("cheatFirst");
    const r = Prog.cheatRoll(Math.random() * 100, odds);
    if (r === "win") { Prog.cheatWin(sp(), now); Stats.addIn("cheat", "win", 1); buzz2([60, 40, 60]); tone(600, 1200, .4, .07, "sine"); toast("Ça a marché… le temps file."); closeCht(); persist(); if (!$("acEx").hidden) exam(); return; }
    if (r === "caught") return caught();
    Stats.addIn("cheat", "none", 1); buzz2(30); tone(200, 120, .15, .04, "triangle"); persist(); paintCht("Rien ne se passe. Le surveillant a jeté un œil dans ta direction…");
  };
  const caught = () => {
    const lost = Prog.cheatCaught(S, Math.random(), Date.now()); Stats.addIn("cheat", "caught", 1); if (lost) Stats.addIn("cheat", "spellsLost", 1);
    buzz2([200, 80, 400]); tone(90, 40, 1, .18, "square"); if (window.sfx) sfx("rumble"); miniDead = true; Spells.invalidate(); persist();
    const b = chtBox(); b.classList.add("bad");
    b.innerHTML = "<h3 style='color:#fb7185'>SURPRIS EN FLAGRANT DÉLIT</h3><p>Le surveillant te retire ta copie. Le jury est formel.</p><ul class='ac-lose'><li>Sort perdu : <b>" + (lost ? byId[lost].n : "—") + "</b></li><li>Examen annulé : frais d'inscription perdus</li><li>Inscriptions closes pendant <b>" + tfmt(Prog.CHEAT.lock / 1e3) + "</b></li></ul><div class='ac-crow'><button id='cOut2'>ACCEPTER LA SANCTION</button></div>";
    $("cOut2").onclick = () => { closeCht(); b.classList.remove("b" + "ad"); Spells.init(); };
  };
  const miniGame = () => {
    const ex = sp().exam; if (!ex || ex.ch.played) return; ex.ch.played = 1; Stats.addIn("cheat", "mini", 1); save();
    const b = chtBox(), M = Prog.CHEAT.mini; let score = 0, speed = M.speed0, w = M.w0, center = 50, gained = 0, dead = false; const t0 = performance.now(); miniDead = false;
    b.innerHTML = "<h3>" + EYE + " OBSERVER LE SURVEILLANT</h3><p>Appuie quand son regard croise ta zone. Chaque réussite te donne +0,5 pt de chance… et la zone rétrécit.</p><div class='ac-track'><div class='ac-zone' id='zn'></div><div class='ac-cur' id='cu'></div></div><div class='ac-crow'><button id='cHit' style='flex:1'>MAINTENANT</button></div><div class='ac-bonus' id='gs'>Série : 0</div>";
    const place = () => { center = 15 + Math.random() * 70; $("zn").style.cssText = "left:" + (center - w / 2) + "%;width:" + w + "%"; }; place();
    const pos = t => { const x = ((t - t0) / 1000 * speed) % 2; return (x < 1 ? x : 2 - x) * 100; };
    const loop = t => { if (dead || miniDead || !$("cu")) return; $("cu").style.left = pos(t) + "%"; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    const end = msg => { dead = true; if (gained) Stats.addIn("cheat", "miniBonusSum", gained); persist(); setTimeout(() => { if (!$("acCht").hidden && sp().exam) paintCht(msg); }, 500); };
    $("cHit").onclick = () => {
      if (dead) return; const x = pos(performance.now());
      if (Math.abs(x - center) <= w / 2) { score++; const g = Math.min(Prog.CHEAT.maxBonus - ex.ch.bonus, M.gain); ex.ch.bonus += g; gained += g; w *= M.shrink; speed *= M.grow; buzz2(15); tone(500 + score * 60, 800 + score * 60, .15, .05, "sine"); $("gs").textContent = "Série : " + score + " · bonus +" + ex.ch.bonus.toFixed(1) + " pt"; if (ex.ch.bonus >= Prog.CHEAT.maxBonus || w < M.minW) end("Tu connais ses habitudes par cœur."); else place(); }
      else { buzz2(80); end("Il t'a vu t'agiter. Série terminée : " + score + "."); }
    };
  };

  // ---------- Pli de l'Académie (célébration en attente, affichée EN PREMIER à l'ouverture du clicker) ----------
  const letter = "<svg class='ac-letter' viewBox='0 0 120 90' aria-hidden='true'><defs><linearGradient id='acl1' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f5e6b8'/><stop offset='1' stop-color='#cfae6a'/></linearGradient><radialGradient id='acl2' cx='35%' cy='30%'><stop offset='0' stop-color='#fca5a5'/><stop offset='.55' stop-color='#b91c1c'/><stop offset='1' stop-color='#5b0f0f'/></radialGradient></defs>" +
    "<rect x='8' y='14' width='104' height='68' rx='5' fill='url(#acl1)' stroke='#8a6a22' stroke-width='1.2'/><path d='M8 18l52 34 52-34' fill='none' stroke='#8a6a22' stroke-width='1.2'/><path d='M8 80l38-30M112 80L74 50' fill='none' stroke='#8a6a22' stroke-opacity='.5'/><circle cx='60' cy='52' r='11' fill='url(#acl2)' stroke='#450a0a' stroke-width='1'/><path d='M60 46l1.8 4 4.2.5-3.1 2.9.8 4.2-3.7-2.1-3.7 2.1.8-4.2-3.1-2.9 4.2-.5z' fill='#fecaca' fill-opacity='.85'/></svg>";
  const buzz = () => { try { if (readPrefs().vibe !== false && navigator.vibrate) navigator.vibrate([40, 50, 90]); } catch (e) {} };
  const celebrate = manual => {
    Prog.proposeSpe2(S, Date.now());                                      // récompense de l'examen IV : seconde école
    const list = Prog.pending(S).filter(e => !snooze.has(e.k)); if (celOpen) return;
    if (!list.length) { const f = onCele; onCele = null; if (f) f(); return; }
    const e = list[0], el = $("acCele"), box = $("acCeleB"); celOpen = 1; el.hidden = false;
    box.innerHTML = "<div class='ac-lt'>" + letter + "<h3>Un pli de l'Académie t'attend</h3><p>Il porte le sceau du Conseil des Examens.</p><button class='ac-go' id='acOpen'>OUVRIR LE PLI</button></div>";
    $("acOpen").focus(); $("acOpen").onclick = () => {
      if (window.sfx && SOUND) sfx("gold"); buzz();
      if (e.t === "spe2") {
        box.innerHTML = "<div class='ac-dip'>" + seal(4) + "<h3>UNE SECONDE VOIE S'OUVRE</h3><p>En réussissant l'examen du rang IV, tu gagnes le droit de t'initier à une <b>seconde école</b> : ses bonus agiront à moitié de leur puissance.</p><button class='ac-go' id='acSpeYes'>CHOISIR MA SECONDE ÉCOLE</button><button class='ac-lite' id='acSpeLater'>Plus tard</button></div>";
        $("acSpeYes").focus(); $("acSpeYes").onclick = () => { celOpen = 0; el.hidden = true; openSpe(2); }; $("acSpeLater").onclick = () => { snooze.add(e.k); celOpen = 0; el.hidden = true; top(); celebrate(); };
        return;
      }
      if (e.t === "spe") {
        box.innerHTML = "<div class='ac-dip'>" + seal(1) + "<h3>L'ACADÉMIE T'INVITE À T'ENGAGER</h3><p>Tu as déjà passé ton premier examen : il est temps de choisir ta <b>spécialité</b>. Une école de magie réduira de 25 % le prix et le temps de ses cours, et renforcera chacun de ses sorts.</p><button class='ac-go' id='acSpeYes'>CHOISIR MON ÉCOLE</button><button class='ac-lite' id='acSpeLater'>Plus tard</button></div>";
        $("acSpeYes").focus(); $("acSpeYes").onclick = () => { celOpen = 0; el.hidden = true; openSpe(); }; $("acSpeLater").onclick = () => { snooze.add(e.k); celOpen = 0; el.hidden = true; top(); celebrate(); };
        return;
      }
      el.hidden = true; diploma(e.n, e);
    };
  };
  // ---------- Diplôme de fin d'examen (§23.2) : parchemin qui se déroule, confettis, sceau qui s'abat, signature à la plume, puis retour à la grille du nouveau rang ----------
  function diploma(n, e) {                                              // e = célébration en attente (null = « revoir mon diplôme », sans acquittement)
    const k = sp().school, sc = k && SCH.find(x => x[0] === k), h = sc ? sc[2] : 45, el = $("acDip"), rm = matchMedia("(prefers-reduced-motion: reduce)").matches, coarse = matchMedia("(pointer:coarse)").matches;
    const cf = rm ? "" : Array.from({ length: coarse ? 36 : 70 }, (_, i) => "<i style='left:" + (Math.random() * 100).toFixed(1) + "%;animation-delay:" + (1.6 + Math.random() * 2.4).toFixed(2) + "s;animation-duration:" + (3 + Math.random() * 3).toFixed(2) + "s;background:hsl(" + (i % 3 ? 45 : h) + " 90% " + (55 + Math.random() * 25).toFixed(0) + "%);width:" + (5 + Math.random() * 7).toFixed(1) + "px;height:" + (8 + Math.random() * 10).toFixed(1) + "px'></i>").join("");
    const nm = (typeof CK !== "undefined" && CK && CK.pseudo) || "le·la candidat·e", T = [];
    el.style.setProperty("--h", h); el.hidden = false; if (e) celOpen = 1;
    el.innerHTML = "<div class='ac-rays ac-gold'></div><div class='ac-confetti'>" + cf + "</div><div class='ac-dwrap'><div class='ac-dpl" + (rm ? " rm" : "") + "'><div class='ac-dcorner tl'></div><div class='ac-dcorner tr'></div><div class='ac-dcorner bl'></div><div class='ac-dcorner br'></div>" +
      "<div class='ac-dh'>ACADÉMIE DES ARCANES</div><div class='ac-dsub'>Collège des Hautes Études Magiques</div><div class='ac-dt1'>DIPLÔME DE RANG " + ROM[n] + "</div><div class='ac-dline'></div>" +
      "<p class='ac-dtx'>Il est certifié que <b class='ac-nm'>" + nm.replace(/</g, "&lt;") + "</b>" + (sc ? ", disciple de l'école de <b style='color:hsl(" + h + " 80% 38%)'>" + sc[1] + "</b>," : "") + " a satisfait avec honneur à l'examen du rang " + n + " et se voit conférer le droit d'accéder aux enseignements supérieurs.</p>" +
      "<div class='ac-dseal'>" + seal(n) + "</div><ul class='ac-unl'><li>✦ Emplacement " + (n + 1) + " au Voile et au Grimoire</li><li>✦ " + (n >= 5 ? "Rang " + (n + 1) + " atteint : ses sorts arrivent bientôt" : "Sorts du rang " + (n + 1) + " désormais étudiables") + "</li>" + (n === 4 ? "<li>✦ Seconde spécialité à choisir (moitié d'efficacité)</li>" : "") + "</ul>" +
      "<div class='ac-sigl'><svg class='ac-sig' viewBox='0 0 240 64' aria-hidden='true'><path d='M8 46c8-32 18-36 22-14 3 15-7 25-11 13 15 7 23-27 35-19 8 6-6 23 4 21 12-2 14-25 26-17 8 6-4 21 6 19 14-2 22-15 34-10 10 4 18 6 32-6M10 56c40-7 120-9 214-2'/></svg><span>Signature du candidat</span></div>" +
      "<button class='ac-dbtn' id='acDbtn'>PARAPHER ET POURSUIVRE</button></div></div>";
    el.scrollTop = 0; buzz2([30, 30, 30]); tone(180, 90, .6, .1);
    if (!rm) T.push(setTimeout(() => { const d = el.querySelector(".ac-dpl"); if (!d) return; d.classList.add("hit"); buzz2([90, 40, 160]); tone(110, 40, .5, .14); tone(660, 1320, .9, .05, "sine"); setTimeout(() => d.classList.remove("hit"), 500); }, 2300));
    const finish = () => {
      T.forEach(clearTimeout); el.hidden = true; el.innerHTML = ""; const was = celOpen; celOpen = 0;
      if (e) { Prog.ack(S, e.k); save(); if (window.cloudSave) cloudSave(true); top(); sel = null; grid(); detail(); const g = $("acGr"); if (g) { g.scrollIntoView({ block: "center", behavior: rm ? "auto" : "smooth" }); const th = g.querySelectorAll("th")[n + 1]; if (th) { th.classList.add("ac-newcol"); setTimeout(() => th.classList.remove("ac-newcol"), 4000); } } toast("Sorts du rang " + (n + 1) + " désormais étudiables"); celebrate(); }
    };
    dipClose = finish;
    $("acDbtn").onclick = () => {                                       // paraphe : la plume suit le tracé (≈ 2 s), froissement de papier, puis retour à la grille
      const b = $("acDbtn"); b.disabled = true; const svg = el.querySelector(".ac-sig"), path = svg.querySelector("path"), L = path.getTotalLength(); path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
      if (rm) { path.style.strokeDashoffset = 0; setTimeout(finish, 600); return; }
      const q = document.createElement("div"); q.className = "ac-quill"; q.innerHTML = "<svg viewBox='0 0 24 24' width='34' height='34'><path d='M3 21L21 3l-5 11z' fill='#d4af37' stroke='#f59e0b' stroke-width='1.2' stroke-linejoin='round'/></svg>"; el.append(q);
      svg.scrollIntoView({ block: "center", behavior: "smooth" }); const D = 2100; let t0 = 0, lastR = 0;
      const step = now => {
        if (!t0) t0 = now + 500; const p = Math.max(0, Math.min(1, (now - t0) / D)), ez = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; path.style.strokeDashoffset = L * (1 - ez);
        const pt = path.getPointAtLength(L * ez), m = svg.getScreenCTM(), x = pt.x * m.a + m.e, y = pt.y * m.d + m.f; q.style.transform = "translate(" + (x - 4) + "px," + (y - 30) + "px) rotate(" + Math.sin(p * 20) * 5 + "deg)";
        if (p > 0 && p < 1 && now - lastR > 230 && window.sfx) { lastR = now; sfx("paper"); }
        if (p < 1) requestAnimationFrame(step); else { buzz2(40); tone(300, 180, .25, .05, "triangle"); setTimeout(() => { q.remove(); finish(); }, 700); }
      };
      requestAnimationFrame(step);
    };
    $("acDbtn").focus({ preventScroll: true });
  }
  const closeCele = () => { $("acCele").hidden = true; celOpen = 0; };

  // ---------- Mise à jour légère (appelée à chaque tick) ----------
  const paint = n => {
    const c = sp().course, ex = sp().exam;
    set("acW", fN(S.sg));
    if (c) { const tot = Math.max(1, c.end - (c.t0 || c.end - 1000)), p = Math.max(0, Math.min(1, (n - (c.t0 || c.end - tot)) / tot)), t = document.querySelector(".ac-t.learning .lit"), il = $("acIcl");
      const cp = "inset(0 " + ((1 - p) * 100).toFixed(1) + "% 0 0)"; if (t && last.cp !== cp) { t.style.clipPath = cp; } if (il && sel === c.id && last.ip !== cp) { il.style.clipPath = cp; last.ip = cp; } last.cp = cp;
      set("acClk", "Reste " + clock((c.end - n) / 1e3) + " · " + Math.round(p * 100) + " %"); }
    const rn = $("acRun"); if (rn) { if (ex) { rn.hidden = false; set("acRun", "Examen du rang " + ex.n + " en cours — " + clock((ex.end - n) / 1e3)); } else if (c) { rn.hidden = false; set("acRun", "Cours en cours : " + byId[c.id].n + " — " + clock((c.end - n) / 1e3)); } else rn.hidden = true; }
    if (ex && !$("acEx").hidden) { const tot = Prog.EX.dur[ex.n - 1] * 1e3, p = Math.max(0, Math.min(1, 1 - (ex.end - n) / tot)), ring = $("acRing"); if (ring) ring.style.setProperty("--p", (p * 100).toFixed(1)); set("acRt", (ex.end - n) >= 36e5 ? ((ex.end - n) / 36e5).toFixed(1) + " h" : Math.max(1, Math.ceil((ex.end - n) / 6e4)) + " min"); }
  };
  const bubble = n => {                                                  // bulle de triche : 1ʳᵉ apparition à 1–2 s, visible 3,2 s, puis revient au hasard 3–10 s plus tard (silencieuse : jamais de son non sollicité)
    const tb = $("acTb"); if (!tb || !$("acGhost")) { cg.init = 0; cg.vis = 0; return; }
    if (!cg.init) { cg.init = 1; cg.vis = 0; cg.next = n + 1000 + Math.random() * 1000; }
    if ($("acCht").hidden) { if (!cg.vis && n >= cg.next) { cg.vis = 1; cg.hide = n + 3200; tb.classList.add("g"); } else if (cg.vis && n >= cg.hide) { cg.vis = 0; cg.next = n + 3000 + Math.random() * 7000; tb.classList.remove("g"); } }
  };
  const tick = n => { paint(n); bubble(n); if (!$("acCht").hidden) updCht(n); if (!$("acEx").hidden && n - tEx > 1000 && !(sp().exam && sp().exam.n === exN)) { tEx = n; exam(); } };
  const refresh = () => { top(); grid(); detail(); if (!$("acEx").hidden) exam(); };
  const init = () => {
    $("acExC").onclick = closeExam; $("acEx").onclick = e => { if (e.target.id === "acEx") closeExam(); };
    $("acSpeC").onclick = closeSpe; $("acSpe").onclick = e => { if (e.target.id === "acSpe") closeSpe(); };
    if ($("acRst") && !$("acRstH").dataset.b) { $("acRstH").dataset.b = 1; $("acRstC").onclick = closeRst; $("acRst").onclick = e => { if (e.target.id === "acRst") closeRst(); }; hold($("acRstH"), 3000, () => { $("acRstH").disabled = true; toast("Remise à zéro…"); window.resetAllProgress(); }); }
    $("acInfoOk").onclick = () => { $("acInfo").hidden = true; }; $("acInfo").onclick = e => { if (e.target.id === "acInfo") $("acInfo").hidden = true; };
    if (typeof Nav !== "undefined" && !navDone) {
      navDone = 1; Nav.add("acInfo", { open: () => !$("acInfo").hidden, close: () => { $("acInfo").hidden = true; } });
      Nav.add("acEx", { open: () => !$("acEx").hidden, close: closeExam });
      Nav.add("acCele", { open: () => !$("acCele").hidden, close: closeCele });
      Nav.add("acSpe", { open: () => !$("acSpe").hidden, close: closeSpe });
      Nav.add("acRst", { open: () => !$("acRst").hidden, close: closeRst });
      Nav.add("acCht", { open: () => !$("acCht").hidden, close: closeCht });
      Nav.add("acDip", { open: () => !$("acDip").hidden, close: () => { if (dipClose) dipClose(); } });
    }
    { const a = Prog.proposeSpe(S, Date.now()), b = Prog.proposeSpe2(S, Date.now()); if (a || b) { save(); if (window.cloudSave) cloudSave(); } }
    refresh();
  };
  const examDone = () => { refresh(); if ($("acEx").hidden) { snooze.clear(); celebrate(); } else toast("Examen terminé — lis le résultat"); };
  return { examDone, init, refresh, tick, celebrate, openExam, celebrating: () => !!celOpen, setAfter: f => { onCele = f; }, openSpe };
})();
