'use strict';
// Éditeur handling.meta : import (fichier ou texte), plusieurs véhicules, tous les champs CHandlingData par sections, export indenté.
Forge.register({
  id: 'handling',
  cat: 'vehicules',
  name: 'Éditeur handling.meta',
  desc: 'Importe ou crée un handling.meta et règle masse, moteur, freins, adhérence, suspension et dégâts champ par champ.',
  tags: ['handling', 'meta', 'chandlingdata', 'vitesse', 'drift', 'suspension', 'traction', 'moteur'],
  icon: 'gauge',
  mount(root, F) {
    const X = F.xml;
    // [balise, type, libellé, aide] — f : décimal, i : entier, s : texte, v : vecteur x/y/z, a : AIHandling
    const SECTIONS = [
      ['Masse', [
        ['handlingName', 's', 'Nom du handling', 'Identifiant du handling (en MAJUSCULES). Doit être identique au <handlingId> du vehicles.meta.'],
        ['fMass', 'f', 'Masse (kg)', 'Masse du véhicule en kg : joue sur l’inertie et sur qui « gagne » lors d’une collision.'],
        ['fInitialDragCoeff', 'f', 'Traînée aéro', 'Résistance de l’air : plus haut = la voiture plafonne plus tôt à haute vitesse.'],
        ['fPercentSubmerged', 'f', '% immergé pour flotter', 'Pourcentage de la hauteur du véhicule qui doit être sous l’eau avant qu’il ne flotte / coule (85 en général).'],
        ['vecCentreOfMassOffset', 'v', 'Centre de masse', 'Décalage du centre de gravité en mètres (X gauche/droite, Y avant/arrière, Z haut/bas). Z négatif = plus stable.'],
        ['vecInertiaMultiplier', 'v', 'Inertie', 'Multiplicateur d’inertie de rotation par axe : plus haut = tourne / bascule plus lentement.'],
      ]],
      ['Transmission', [
        ['fDriveBiasFront', 'f', 'Répartition motrice avant', '0.0 = propulsion (roues arrière), 1.0 = traction (roues avant), entre les deux = 4 roues motrices.'],
        ['nInitialDriveGears', 'i', 'Nombre de rapports', 'Nombre de rapports de boîte en marche avant.'],
        ['fInitialDriveForce', 'f', 'Force moteur', 'Puissance / accélération. Voitures de sport ≈ 0.30 à 0.40 ; 1.0 = énorme.'],
        ['fDriveInertia', 'f', 'Inertie moteur', 'Vitesse à laquelle le moteur prend ses tours (1.0 par défaut ; plus haut = plus nerveux).'],
        ['fClutchChangeRateScaleUpShift', 'f', 'Passage montant', 'Rapidité des passages de rapport vers le haut (plus haut = plus rapide).'],
        ['fClutchChangeRateScaleDownShift', 'f', 'Passage descendant', 'Rapidité des rétrogradages (plus haut = plus rapide).'],
        ['fInitialDriveMaxFlatVel', 'f', 'Vitesse max (rupteur)', 'Vitesse au rupteur sur le dernier rapport, sur le plat. Vitesse réelle approx. = valeur × 1.32 km/h (× 0.82 mph).'],
      ]],
      ['Freins', [
        ['fBrakeForce', 'f', 'Force de freinage', 'Puissance des freins (≈ 0.5 à 1.0 ; plus haut = s’arrête plus vite).'],
        ['fBrakeBiasFront', 'f', 'Répartition avant', 'Répartition du freinage : 0.0 = arrière, 1.0 = avant, 0.5 = équilibré (≈ 0.6 sur une voiture).'],
        ['fHandBrakeForce', 'f', 'Frein à main', 'Puissance du frein à main (plus haut = bloque plus fort l’arrière).'],
      ]],
      ['Direction / Traction', [
        ['fSteeringLock', 'f', 'Angle de braquage (°)', 'Angle maximal des roues avant en degrés (≈ 35 à 45 pour une voiture ; plus pour le drift).'],
        ['fTractionCurveMax', 'f', 'Adhérence max', 'Grip maximal des pneus en virage. Plus haut = colle plus à la route.'],
        ['fTractionCurveMin', 'f', 'Adhérence en glisse', 'Grip quand les pneus patinent / glissent. Écart faible avec le max = glisse plus progressive.'],
        ['fTractionCurveLateral', 'f', 'Courbe latérale (°)', 'Forme de la courbe d’adhérence latérale, en degrés (≈ 22.5 pour une voiture).'],
        ['fTractionSpringDeltaMax', 'f', 'Hauteur perte de grip', 'Distance au-dessus du sol (m) à partir de laquelle la roue perd l’adhérence.'],
        ['fLowSpeedTractionLossMult', 'f', 'Patinage au démarrage', 'Perte d’adhérence à basse vitesse (burn au démarrage). 0 = aucune, 1 = normal.'],
        ['fCamberStiffnesss', 'f', 'Rigidité carrossage', 'Tenue du carrossage en virage (souvent 0). Le nom avec 3 « s » est l’orthographe officielle du jeu.'],
        ['fTractionBiasFront', 'f', 'Répartition du grip avant', 'Répartition de l’adhérence : 0.5 = équilibré, moins = plus de grip à l’arrière, plus = plus à l’avant.'],
        ['fTractionLossMult', 'f', 'Perte de grip hors route', 'Perte d’adhérence sur terre / herbe / sol mouillé (1.0 = normal, plus bas = mieux en tout-terrain).'],
      ]],
      ['Suspension', [
        ['fSuspensionForce', 'f', 'Raideur', 'Raideur des ressorts : plus haut = suspension plus ferme.'],
        ['fSuspensionCompDamp', 'f', 'Amorti compression', 'Amortissement quand la suspension s’écrase.'],
        ['fSuspensionReboundDamp', 'f', 'Amorti détente', 'Amortissement quand la suspension se détend.'],
        ['fSuspensionUpperLimit', 'f', 'Débattement haut (m)', 'Course maximale de la roue vers le haut.'],
        ['fSuspensionLowerLimit', 'f', 'Débattement bas (m)', 'Course maximale de la roue vers le bas (valeur négative).'],
        ['fSuspensionRaise', 'f', 'Rehausse (m)', 'Monte (positif) ou abaisse (négatif) la caisse.'],
        ['fSuspensionBiasFront', 'f', 'Répartition avant', 'Répartition de la raideur : plus de 0.5 = avant plus ferme.'],
        ['fAntiRollBarForce', 'f', 'Barre anti-roulis', 'Force de la barre anti-roulis : plus haut = la caisse penche moins en virage.'],
        ['fAntiRollBarBiasFront', 'f', 'Répartition anti-roulis', 'Répartition de la barre anti-roulis entre l’avant (0) et l’arrière (1).'],
        ['fRollCentreHeightFront', 'f', 'Centre de roulis avant (m)', 'Hauteur du centre de roulis avant : plus haut = moins de roulis.'],
        ['fRollCentreHeightRear', 'f', 'Centre de roulis arrière (m)', 'Hauteur du centre de roulis arrière : plus haut = moins de roulis.'],
      ]],
      ['Dégâts', [
        ['fCollisionDamageMult', 'f', 'Dégâts collision', 'Multiplicateur des dégâts reçus lors des chocs.'],
        ['fWeaponDamageMult', 'f', 'Dégâts armes', 'Multiplicateur des dégâts reçus par balles / explosions.'],
        ['fDeformationDamageMult', 'f', 'Déformation', 'Multiplicateur de déformation visuelle de la carrosserie.'],
        ['fEngineDamageMult', 'f', 'Dégâts moteur', 'Multiplicateur des dégâts subis par le moteur.'],
        ['fPetrolTankVolume', 'f', 'Réservoir (L)', 'Volume du réservoir : l’essence fuit quand il est touché.'],
        ['fOilVolume', 'f', 'Huile', 'Volume d’huile (fumée quand le moteur est abîmé).'],
      ]],
      ['Divers', [
        ['fSeatOffsetDistX', 'f', 'Décalage siège X', 'Décalage latéral du siège conducteur (m).'],
        ['fSeatOffsetDistY', 'f', 'Décalage siège Y', 'Décalage avant / arrière du siège conducteur (m).'],
        ['fSeatOffsetDistZ', 'f', 'Décalage siège Z', 'Décalage vertical du siège conducteur (m).'],
        ['nMonetaryValue', 'i', 'Valeur ($)', 'Valeur du véhicule pour le jeu (sans effet sur le prix en concession FiveM).'],
        ['strModelFlags', 's', 'strModelFlags', 'Flags du modèle, en hexadécimal (ex. 440010).'],
        ['strHandlingFlags', 's', 'strHandlingFlags', 'Flags de comportement, en hexadécimal (ex. 20000).'],
        ['strDamageFlags', 's', 'strDamageFlags', 'Flags de dégâts, en hexadécimal (ex. 0).'],
        ['AIHandling', 'a', 'Conduite de l’IA', 'Style de conduite des PNJ au volant de ce véhicule.'],
      ]],
    ];
    const FIELDS = SECTIONS.flatMap(([, l]) => l);
    const FMAP = Object.fromEntries(FIELDS.map((f) => [f[0], f]));
    const AI = ['AVERAGE', 'SPORTS_CAR', 'TRUCK', 'CRAP'];
    const ITEM = `<Item type="CHandlingData">
      <handlingName>MYCAR</handlingName><fMass value="1450.000000" /><fInitialDragCoeff value="8.500000" /><fPercentSubmerged value="85.000000" />
      <vecCentreOfMassOffset x="0.000000" y="0.000000" z="-0.050000" /><vecInertiaMultiplier x="1.000000" y="1.300000" z="1.500000" />
      <fDriveBiasFront value="0.000000" /><nInitialDriveGears value="6" /><fInitialDriveForce value="0.330000" /><fDriveInertia value="1.000000" />
      <fClutchChangeRateScaleUpShift value="3.500000" /><fClutchChangeRateScaleDownShift value="3.500000" /><fInitialDriveMaxFlatVel value="158.000000" />
      <fBrakeForce value="1.000000" /><fBrakeBiasFront value="0.600000" /><fHandBrakeForce value="0.700000" /><fSteeringLock value="40.000000" />
      <fTractionCurveMax value="2.550000" /><fTractionCurveMin value="2.200000" /><fTractionCurveLateral value="22.500000" /><fTractionSpringDeltaMax value="0.150000" />
      <fLowSpeedTractionLossMult value="1.000000" /><fCamberStiffnesss value="0.000000" /><fTractionBiasFront value="0.480000" /><fTractionLossMult value="1.000000" />
      <fSuspensionForce value="2.800000" /><fSuspensionCompDamp value="1.400000" /><fSuspensionReboundDamp value="2.300000" /><fSuspensionUpperLimit value="0.100000" />
      <fSuspensionLowerLimit value="-0.120000" /><fSuspensionRaise value="0.000000" /><fSuspensionBiasFront value="0.500000" /><fAntiRollBarForce value="0.800000" />
      <fAntiRollBarBiasFront value="0.600000" /><fRollCentreHeightFront value="0.200000" /><fRollCentreHeightRear value="0.200000" />
      <fCollisionDamageMult value="1.000000" /><fWeaponDamageMult value="1.000000" /><fDeformationDamageMult value="0.700000" /><fEngineDamageMult value="1.500000" />
      <fPetrolTankVolume value="65.000000" /><fOilVolume value="5.000000" /><fSeatOffsetDistX value="0.000000" /><fSeatOffsetDistY value="0.000000" /><fSeatOffsetDistZ value="0.000000" />
      <nMonetaryValue value="150000" /><strModelFlags>440010</strModelFlags><strHandlingFlags>20000</strHandlingFlags><strDamageFlags>0</strDamageFlags><AIHandling>SPORTS_CAR</AIHandling>
      <SubHandlingData><Item type="CCarHandlingData"><fBackEndPopUpCarImpulseMult value="0.100000" /><fBackEndPopUpBuildingImpulseMult value="0.030000" /><fBackEndPopUpMaxDeltaSpeed value="0.600000" /></Item><Item type="NULL" /><Item type="NULL" /></SubHandlingData>
    </Item>`;
    const PRESETS = [
      ['Vitesse +10 %', { fInitialDriveMaxFlatVel: 1.1, fInitialDriveForce: 1.05 }],
      ['Accélération +10 %', { fInitialDriveForce: 1.1 }],
      ['Grip +10 %', { fTractionCurveMax: 1.1, fTractionCurveMin: 1.1 }],
      ['Freins +20 %', { fBrakeForce: 1.2 }],
      ['Plus lourd +20 %', { fMass: 1.2 }],
      ['Plus léger −15 %', { fMass: 0.85 }],
      ['Résistant (dégâts ÷2)', { fCollisionDamageMult: 0.5, fDeformationDamageMult: 0.5, fEngineDamageMult: 0.5 }],
      ['Abaisser −3 cm', { fSuspensionRaise: (v) => v - 0.03 }],
      ['Drift (base)', { fDriveBiasFront: () => 0, fSteeringLock: () => 58, fTractionCurveMax: 0.8, fTractionCurveMin: 0.85, fTractionCurveLateral: () => 25, fLowSpeedTractionLossMult: () => 0.4, fTractionBiasFront: () => 0.52 }],
    ];

    let doc, sel = 0, vals = {}, refreshers = [];
    const items = (d = doc) => [...d.getElementsByTagName('Item')].filter((e) => e.getAttribute('type') === 'CHandlingData');
    const cur = () => items()[sel];
    const newDoc = () => X.parse(`<?xml version="1.0" encoding="UTF-8"?><CHandlingDataMgr><HandlingData>${ITEM}</HandlingData></CHandlingDataMgr>`);
    const freshItem = () => doc.importNode(X.parse(ITEM).documentElement, true);
    const nameOf = (it) => X.val(it, 'handlingName') || '(sans nom)';

    root.append(F.h(`<div class="stack">
      <div class="panel stack">
        <div class="panel-head"><h3>Fichier handling.meta</h3><span class="muted small cnt"></span>
          <button class="btn sm" data-a="import">${F.icon('upload')}Importer</button>
          <button class="btn sm ghost" data-a="paste">Coller du texte</button>
          <button class="btn sm ghost" data-a="reset">Nouveau fichier</button></div>
        <div class="row"><select class="veh" style="max-width:300px" aria-label="Véhicule"></select>
          <button class="btn sm" data-a="add">${F.icon('plus')}Ajouter</button>
          <button class="btn sm ghost" data-a="dup">${F.icon('copy')}Dupliquer</button>
          <button class="btn sm ghost danger" data-a="del">${F.icon('trash')}Supprimer</button></div>
        <div class="paste" hidden><div class="stack"><textarea rows="8" placeholder="Colle ici le contenu d’un handling.meta…" spellcheck="false"></textarea>
          <div class="row"><button class="btn sm primary" data-a="load">Charger ce texte</button><span class="muted small">Les balises inconnues sont conservées à l’export.</span></div></div></div>
        <div class="drop small">Dépose un fichier <b>handling.meta</b> ici (ou clique « Importer »)</div>
        <div class="msg"></div>
      </div>
      <div class="split wide-left">
        <div class="stack secs"></div>
        <div class="stack sticky side">
          <div class="panel"><div class="panel-head"><h3>Préréglages rapides</h3><span class="muted small">sur le véhicule affiché</span></div><div class="row presets"></div></div>
        </div>
      </div></div>`));
    const out = F.output({ title: 'handling.meta', filename: 'handling.meta', lang: 'xml' });
    F.$('.side', root).append(out.el);
    F.$('.presets', root).innerHTML = PRESETS.map(([l], i) => `<button class="chip" data-p="${i}">${F.esc(l)}</button>`).join('');
    const selEl = F.$('.veh', root), msg = F.$('.msg', root);

    const renderOut = F.debounce(() => out.set(X.pretty(doc)), 200);
    const readVals = (it) => {
      const o = {};
      for (const [k, t] of FIELDS) {
        const el = X.kid(it, k);
        if (t === 'v') for (const a of 'xyz') o[`${k}.${a}`] = el ? Number(el.getAttribute(a)) || 0 : 0;
        else if (t === 'f' || t === 'i') o[k] = el ? Number(el.getAttribute('value')) || 0 : 0;
        else o[k] = el ? el.textContent.trim() : '';
      }
      return o;
    };
    // Écrit une valeur dans le DOM XML ; crée la balise à sa place habituelle si elle manque.
    const setVal = (it, key, v) => {
      const [k, axis] = key.split('.'), t = FMAP[k][1];
      let el = X.kid(it, k);
      if (!el) {
        el = doc.createElement(k);
        if (t === 'v') 'xyz'.split('').forEach((a) => el.setAttribute(a, F.num(0)));
        const order = FIELDS.map((f) => f[0]);
        const next = order.slice(order.indexOf(k) + 1).map((n) => X.kid(it, n)).find(Boolean) || X.kid(it, 'SubHandlingData');
        it.insertBefore(el, next || null);
      }
      if (t === 'v') el.setAttribute(axis, F.num(v));
      else if (t === 'f') el.setAttribute('value', F.num(v));
      else if (t === 'i') el.setAttribute('value', String(Math.round(Number(v) || 0)));
      else el.textContent = String(v).trim();
    };
    const speed = () => { const v = vals.fInitialDriveMaxFlatVel; return `≈ ${Math.round(v * 1.32)} km/h · ${Math.round(v * 0.82)} mph (approx.)`; };

    const renderList = () => {
      const list = items();
      selEl.innerHTML = list.map((it, i) => `<option value="${i}">${F.esc(nameOf(it))}</option>`).join('');
      selEl.value = sel;
      F.$('.cnt', root).textContent = `${list.length} véhicule${list.length > 1 ? 's' : ''}`;
      const names = list.map(nameOf), dups = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
      msg.innerHTML = dups.length ? `<div class="note warn">Nom de handling en double : ${dups.map(F.esc).join(', ')}. Chaque handlingName doit être unique.</div>` : '';
    };
    const renderForm = () => {
      const it = cur(), secs = F.$('.secs', root);
      secs.innerHTML = ''; refreshers = [];
      vals = readVals(it);
      for (const [title, list] of SECTIONS) {
        const p = F.h(`<div class="panel"><div class="panel-head"><h3>${F.esc(title)}</h3></div><div class="grid-fields"></div></div>`);
        const defs = list.flatMap(([k, t, label, hint]) => {
          const h = `${k} — ${hint}`;
          if (t === 'v') return 'xyz'.split('').map((a) => ({ key: `${k}.${a}`, label: `${label} ${a.toUpperCase()}`, type: 'number', hint: h }));
          if (t === 'a') return [{ key: k, label, type: 'select', options: AI.includes(vals[k]) || !vals[k] ? AI : [...AI, vals[k]], hint: h }];
          return [{ key: k, label, type: t === 's' ? 'text' : 'number', step: t === 'i' ? 1 : 'any', hint: h }];
        });
        const grid = F.$('.grid-fields', p);
        refreshers.push(F.fields(grid, defs, vals, (key, v) => {
          setVal(it, key, v);
          if (key === 'handlingName') { renderList(); }
          if (key === 'fInitialDriveMaxFlatVel') F.$('.spd', root).textContent = speed();
          renderOut();
        }).refresh);
        const i = defs.findIndex((d) => d.key === 'fInitialDriveMaxFlatVel');
        if (i >= 0) F.$$('.field', grid)[i].append(F.h(`<span class="muted small spd">${speed()}</span>`));
        secs.append(p);
      }
    };
    const renderAll = () => { sel = Math.min(Math.max(0, sel), items().length - 1); renderList(); renderForm(); out.set(X.pretty(doc)); };

    const load = (text) => {
      const d = X.parse(text);
      const n = items(d).length;
      if (!n) throw new Error('Aucun <Item type="CHandlingData"> trouvé : est-ce bien un handling.meta ?');
      // Uniformise les nombres connus au format du jeu (1500.0 → 1500.000000), sans toucher au reste.
      for (const it of items(d)) for (const [k, t] of FIELDS) {
        const el = X.kid(it, k);
        if (el && (t === 'f' || t === 'v')) for (const a of t === 'v' ? ['x', 'y', 'z'] : ['value']) { const v = el.getAttribute(a); if (v != null && v.trim() !== '' && Number.isFinite(Number(v))) el.setAttribute(a, F.num(v)); }
      }
      doc = d; sel = 0; renderAll();
      return n;
    };
    const tryLoad = (text, label) => {
      try { const n = load(text); F.toast(`${label} : ${n} véhicule${n > 1 ? 's' : ''} chargé${n > 1 ? 's' : ''}`); return true; }
      catch (e) { F.toast(e.message, 'error'); msg.innerHTML = `<div class="note error">${F.esc(e.message)}</div>`; return false; }
    };
    const importFiles = async (files) => { if (files[0]) tryLoad(await F.readText(files[0]), files[0].name); };
    F.dropZone(F.$('.drop', root), importFiles);
    F.$('.drop', root).onclick = () => F.pickFiles({ accept: '.meta,.xml,.txt' }).then(importFiles);

    root.addEventListener('click', (e) => {
      const p = e.target.closest('[data-p]');
      if (p) {
        const it = cur();
        for (const [k, m] of Object.entries(PRESETS[p.dataset.p][1])) { vals[k] = Math.round((typeof m === 'function' ? m(vals[k]) : vals[k] * m) * 1e6) / 1e6; setVal(it, k, vals[k]); }
        refreshers.forEach((r) => r()); F.$('.spd', root).textContent = speed(); renderOut();
        return F.toast(`Préréglage « ${PRESETS[p.dataset.p][0]} » appliqué à ${nameOf(it)}`);
      }
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a, list = items();
      if (a === 'import') F.pickFiles({ accept: '.meta,.xml,.txt' }).then(importFiles);
      else if (a === 'paste') { const box = F.$('.paste', root); box.hidden = !box.hidden; if (!box.hidden) F.$('textarea', box).focus(); }
      else if (a === 'load') { const ta = F.$('.paste textarea', root); if (ta.value.trim() && tryLoad(ta.value, 'Texte')) { ta.value = ''; F.$('.paste', root).hidden = true; } }
      else if (a === 'reset') { if (confirm('Repartir d’un fichier vide (un véhicule par défaut) ?')) { doc = newDoc(); sel = 0; renderAll(); } }
      else if (a === 'add' || a === 'dup') {
        const src = cur(), it = a === 'add' ? freshItem() : src.cloneNode(true);
        let base = (a === 'add' ? 'NEWCAR' : nameOf(src)).replace(/\d+$/, ''), n = 2;
        while (list.some((x) => nameOf(x) === base + n)) n++;
        X.kid(it, 'handlingName').textContent = base + n;
        src.parentNode.insertBefore(it, src.nextSibling);
        sel += 1; renderAll();
      } else if (a === 'del') {
        if (list.length < 2) return F.toast('Il faut garder au moins un véhicule', 'error');
        if (!confirm(`Supprimer ${nameOf(cur())} du fichier ?`)) return;
        cur().remove(); renderAll();
      }
    });
    selEl.onchange = () => { sel = Number(selEl.value); renderForm(); };

    doc = newDoc(); renderAll();
    return {
      getState: () => ({ xml: X.pretty(doc), sel }),
      setState(s) {
        s = s || {};
        try { if (s.xml) load(s.xml); else doc = newDoc(); } catch { doc = newDoc(); }
        sel = Number(s.sel) || 0; renderAll();
      },
    };
  },
});
