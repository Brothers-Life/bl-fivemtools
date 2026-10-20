'use strict';
// Générateur de blips : liste éditable (coords, sprite, couleur…) → Config.Blips + boucle client, import de coordonnées en masse.
Forge.register({
  id: 'blips',
  cat: 'scripts',
  name: 'Générateur de blips',
  desc: 'Liste de blips avec sprites et couleurs courants, collage de coordonnées en masse, code client prêt à l’emploi.',
  tags: ['blips', 'blip', 'carte', 'map', 'sprite', 'couleur', 'AddBlipForCoord', 'coords', 'vector3'],
  icon: 'pin',
  mount(root, F) {
    // Sprites courants (id → usage). Liste volontairement limitée aux ids les plus utilisés.
    const SPRITES = [[1, 'Cercle (standard)'], [38, 'Course (drapeau)'], [40, 'Maison / propriété'], [50, 'Garage'], [51, 'Pharmacie'], [52, 'Magasin / supérette'],
      [60, 'Poste de police'], [61, 'Hôpital'], [64, 'Hélicoptère'], [67, 'Fourgon blindé'], [68, 'Dépanneuse'], [71, 'Coiffeur'], [72, 'Los Santos Customs'],
      [73, 'Vêtements'], [75, 'Tatoueur'], [90, 'Aéroport'], [93, 'Bar'], [94, 'Saut en parachute'], [100, 'Lavage auto'], [108, 'Banque'], [109, 'Golf'],
      [110, 'Armurerie'], [121, 'Strip-club'], [122, 'Tennis'], [135, 'Cinéma'], [140, 'Cannabis'], [198, 'Taxi'], [225, 'Voiture'], [226, 'Moto'],
      [318, 'Éboueur / poubelles'], [326, 'Concession auto'], [357, 'Garage / parking'], [361, 'Station-service'], [436, 'Pompiers'], [446, 'Réparation / mécano'],
      [477, 'Camion'], [679, 'Casino']];
    // Couleurs de blip (SetBlipColour) : teinte approximative de l'icône en jeu.
    const COLOURS = [[0, 'Blanc', '#fefefe'], [1, 'Rouge', '#e03232'], [2, 'Vert', '#71cb71'], [3, 'Bleu', '#5db6e5'], [4, 'Blanc', '#f0f0f0'], [5, 'Jaune', '#eec64e'],
      [6, 'Rouge clair', '#c25050'], [7, 'Violet', '#9c6eaf'], [8, 'Rose', '#fe7ac3'], [9, 'Orange clair', '#f5a55d'], [10, 'Marron clair', '#c29767'], [11, 'Vert clair', '#8cc4a3'],
      [12, 'Bleu sarcelle', '#4fa6c6'], [13, 'Mauve', '#b18fca'], [14, 'Violet foncé', '#6b5e8f'], [15, 'Cyan', '#50d0d0'], [16, 'Jaune pâle', '#fcf0be'], [17, 'Orange', '#f69d58'],
      [18, 'Bleu clair', '#5ab4ff'], [19, 'Rose foncé', '#a65e8e'], [20, 'Jaune foncé', '#c8a540'], [21, 'Orange foncé', '#d97f3c'], [22, 'Gris clair', '#8b8b8b'], [23, 'Rose clair', '#f5a6be'],
      [24, 'Vert citron', '#c6dc5b'], [25, 'Vert forêt', '#34613a'], [26, 'Bleu électrique', '#3a64b5'], [27, 'Violet vif', '#ab3db1'], [28, 'Taupe', '#9d8a4d'], [29, 'Bleu foncé', '#2b4c8b'],
      [30, 'Cyan foncé', '#3b9790'], [38, 'Bleu police', '#2c6db8'], [40, 'Gris foncé', '#4c4c4c'], [46, 'Or', '#ecd63b'], [47, 'Orange vif', '#ef9f3c']];
    const DISPLAYS = [[4, '4 — carte + minimap (standard)'], [2, '2 — carte + minimap'], [3, '3 — carte seulement'], [5, '5 — minimap seulement'], [8, '8 — carte + minimap, non sélectionnable'], [0, '0 — caché']];
    const spriteName = (id) => (SPRITES.find((x) => x[0] === +id) || [])[1] || '';
    const colourOf = (id) => COLOURS.find((x) => x[0] === +id);

    const BLIP = { label: '', x: 0, y: 0, z: 0, sprite: 1, colour: 0, scale: 0.8, display: 4, shortRange: true, group: '' };
    const DEF = {
      blips: [
        { ...BLIP, label: 'Commissariat', x: 425.1, y: -979.5, z: 30.7, sprite: 60, colour: 29, group: 'Services publics' },
        { ...BLIP, label: 'Hôpital Pillbox', x: 298.6, y: -584.6, z: 43.3, sprite: 61, colour: 2, group: 'Services publics' },
        { ...BLIP, label: 'Garage central', x: 215.8, y: -810.1, z: 30.7, sprite: 357, colour: 3, group: 'Garages' },
      ],
      varName: 'Config.Blips', tab: 'all', removeOnStop: true, paste: '', pSprite: 1, pColour: 0, pScale: 0.8, pGroup: '', active: 0, spriteQuery: '',
    };
    const s = F.clone(DEF);
    const normBlip = (b) => {
      const o = { ...BLIP };
      for (const k of Object.keys(BLIP)) if (b && b[k] != null) o[k] = typeof BLIP[k] === 'number' ? (b[k] !== '' && Number.isFinite(+b[k]) ? +b[k] : BLIP[k]) : typeof BLIP[k] === 'boolean' ? !!b[k] : String(b[k]);
      return o;
    };

    /* ------------------------- lecture de coordonnées collées ------------------------- */
    const labelOf = (line, before) => {
      const c = line.match(/--\s*(.+)$/); if (c) return c[1].trim();
      const l = line.match(/\b(?:label|name|nom)\s*[=:]\s*(['"])(.*?)\1/i); if (l) return l[2];
      return (before >= 0 ? line.slice(0, before) : '').replace(/\b(coords?|pos|position|vector[34]?|vec[34]?|local|label|name)\b/gi, ' ').replace(/[[\]{}=:'",()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    };
    const parseCoords = (txt) => {
      const out = [], N = '(-?\\d+(?:\\.\\d+)?)';
      const flat = String(txt).replace(/\{[^{}]*\}/g, (m) => m.replace(/\s*\r?\n\s*/g, ' '));
      for (const line of flat.split(/\r?\n/)) {
        const code = line.replace(/--.*$/, '');
        const vecs = [...code.matchAll(/vec(?:tor)?[234]?\s*\(([^)]*)\)/gi)].map((m) => ({ n: m[1].split(',').map((v) => Number(v.trim())), i: m.index })).filter((v) => v.n.length >= 3 && v.n.slice(0, 3).every(Number.isFinite));
        if (vecs.length) { vecs.forEach((v) => out.push({ x: v.n[0], y: v.n[1], z: v.n[2], h: Number.isFinite(v.n[3]) ? v.n[3] : 0, label: labelOf(line, v.i) })); continue; }
        const named = (k) => { const r = code.match(new RegExp(`["'[]?\\b${k}\\b["'\\]]?\\s*[=:]\\s*${N}`, 'i')); return r ? +r[1] : null; };
        const x = named('x'), y = named('y');
        if (x != null && y != null) { out.push({ x, y, z: named('z') ?? 0, h: named('h') ?? named('w') ?? named('heading') ?? 0, label: labelOf(line, code.search(/\{|["'[]?\bx\b["'\]]?\s*[=:]/i)) }); continue; }
        const run = code.match(new RegExp(`${N}\\s*[,;\\s]\\s*${N}\\s*[,;\\s]\\s*${N}(?:\\s*[,;\\s]\\s*${N})?\\s*[,;]?\\s*$`));
        if (run) out.push({ x: +run[1], y: +run[2], z: +run[3], h: run[4] != null ? +run[4] : 0, label: labelOf(line, run.index) });
      }
      return out;
    };

    /* ----------------------------------- UI ----------------------------------- */
    root.append(F.h(`<div class="stack">
      <div class="panel"><div class="panel-head"><h3>Blips <span class="muted small b-count"></span></h3>
        <button class="btn sm" data-a="add">${F.icon('plus')}Ajouter</button></div>
        <div class="b-table"></div>
        <p class="muted small" style="margin-top:8px">Clique un sprite ou une couleur ci-dessous pour l’appliquer à la ligne active (surlignée).</p></div>
      <div class="split">
        <div class="stack">
          <div class="panel"><div class="panel-head"><h3>Sprites courants</h3><input class="sp-q" placeholder="Filtrer (garage, police…)" style="max-width:220px"></div>
            <div class="row sp-list"></div></div>
          <div class="panel"><div class="panel-head"><h3>Couleurs</h3><span class="muted small">teintes approximatives</span></div>
            <div class="row col-list"></div></div>
          <div class="panel"><div class="panel-head"><h3>Coller des coordonnées</h3></div>
            <p class="muted small" style="margin-bottom:10px">Une position par ligne : <code>vector3(...)</code>, <code>vector4(...)</code>, <code>{ x = .., y = .., z = .. }</code>, JSON ou <code>x, y, z</code>. Le texte avant la position (ou un commentaire <code>-- nom</code>) devient le nom.</p>
            <div class="grid-fields f-paste"></div>
            <div class="row" style="margin-top:10px"><button class="btn primary sm" data-a="paste">${F.icon('upload')}Ajouter ces blips</button><span class="muted small p-msg"></span></div></div>
        </div>
        <div class="stack sticky res"><div class="panel grid-fields f-opts"></div></div>
      </div></div>`));

    const COLS = [['label', 'Nom', 'text', 130], ['x', 'X', 'number', 78], ['y', 'Y', 'number', 78], ['z', 'Z', 'number', 64], ['sprite', 'Sprite', 'number', 58],
      ['colour', 'Couleur', 'number', 50], ['scale', 'Échelle', 'number', 56], ['display', 'Display', 'select'], ['shortRange', 'Courte portée', 'check'], ['group', 'Catégorie', 'text', 100]];
    const tbox = F.$('.b-table', root);
    const drawTable = () => {
      F.$('.b-count', root).textContent = `(${s.blips.length})`;
      tbox.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr>${COLS.map((c) => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${s.blips.map((b, i) => `<tr data-i="${i}"${i === s.active ? ' style="background:var(--surface-hover)"' : ''}>${COLS.map(([k, , t, w]) => {
        if (t === 'check') return `<td><input type="checkbox" data-k="${k}"${b[k] ? ' checked' : ''}></td>`;
        if (t === 'select') return `<td><select data-k="${k}" style="min-width:64px">${DISPLAYS.map(([v]) => `<option${v === b[k] ? ' selected' : ''}>${v}</option>`).join('')}</select></td>`;
        let extra = '';
        if (k === 'sprite') extra = `<div class="muted small" style="white-space:nowrap">${F.esc(spriteName(b.sprite))}</div>`;
        if (k === 'colour') { const c = colourOf(b.colour); extra = `<span class="swatch" style="background:${c ? c[2] : 'transparent'};width:14px;height:14px;margin-left:4px" title="${F.esc(c ? c[1] : 'inconnue')}"></span>`; }
        return `<td><div style="display:flex;align-items:center;flex-direction:${k === 'sprite' ? 'column' : 'row'};align-items:${k === 'sprite' ? 'stretch' : 'center'}"><input data-k="${k}" ${t === 'number' ? 'type="number" step="any"' : ''} value="${F.esc(b[k])}" style="min-width:${w}px">${extra}</div></td>`;
      }).join('')}<td class="actions"><button class="btn sm ghost" data-a="dup" title="Dupliquer">${F.icon('copy')}</button><button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></td></tr>`).join('')
        || `<tr><td colspan="${COLS.length + 1}" class="empty">Aucun blip : ajoute-en un ou colle des coordonnées</td></tr>`}</tbody></table></div>`;
    };
    const setActive = (i) => { if (i === s.active) return; s.active = i; F.$$('tr[data-i]', tbox).forEach((tr) => { tr.style.background = +tr.dataset.i === i ? 'var(--surface-hover)' : ''; }); };
    tbox.addEventListener('focusin', (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) setActive(+tr.dataset.i); });
    const onCell = (e) => {
      const k = e.target.dataset.k, tr = e.target.closest('tr[data-i]');
      if (!k || !tr) return;
      const b = s.blips[tr.dataset.i], el = e.target;
      b[k] = el.type === 'checkbox' ? el.checked : typeof BLIP[k] === 'number' ? Number(el.value) || 0 : el.value;
      if (e.type === 'change' && (k === 'sprite' || k === 'colour')) drawTable();
      render();
    };
    tbox.addEventListener('input', onCell);
    tbox.addEventListener('change', onCell);

    const drawSprites = () => {
      const q = s.spriteQuery.trim().toLowerCase();
      F.$('.sp-list', root).innerHTML = SPRITES.filter(([id, n]) => !q || n.toLowerCase().includes(q) || String(id) === q).map(([id, n]) => `<button class="chip" data-sprite="${id}"><b>${id}</b> ${F.esc(n)}</button>`).join('') || '<span class="muted small">Aucun sprite</span>';
    };
    F.$('.col-list', root).innerHTML = COLOURS.map(([id, n, hex]) => `<button class="chip" data-colour="${id}" title="${F.esc(n)} (${hex})"><span class="swatch" style="background:${hex};width:14px;height:14px"></span>${id} ${F.esc(n)}</button>`).join('');
    const spq = F.$('.sp-q', root);
    spq.addEventListener('input', () => { s.spriteQuery = spq.value; drawSprites(); });

    const refreshers = [
      F.fields(F.$('.f-paste', root), [
        { key: 'paste', label: 'Coordonnées', type: 'textarea', rows: 5, wide: true, placeholder: "Garage Pillbox: vector3(215.8, -810.1, 30.7)\n{ x = 425.1, y = -979.5, z = 30.7 } -- Commissariat\n-1037.7, -2737.8, 20.1" },
        { key: 'pSprite', label: 'Sprite', type: 'number', step: 1 }, { key: 'pColour', label: 'Couleur', type: 'number', step: 1 },
        { key: 'pScale', label: 'Échelle', type: 'number', step: 0.1 }, { key: 'pGroup', label: 'Catégorie' },
      ], s),
      F.fields(F.$('.f-opts', root), [
        { key: 'varName', label: 'Nom de la table', placeholder: 'Config.Blips' },
        { key: 'removeOnStop', label: 'Retirer les blips à l’arrêt de la ressource', type: 'checkbox', wide: true },
      ], s, () => render()),
    ];

    /* --------------------------------- sortie --------------------------------- */
    const L = F.luaStr, n = (v) => F.short(v);
    const tbl = () => (/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)?$/.test(s.varName.trim()) ? s.varName.trim() : 'Config.Blips');
    function configOut() {
      const name = tbl(), groups = [];
      for (const b of s.blips) { let g = groups.find((x) => x.name === b.group.trim()); if (!g) groups.push(g = { name: b.group.trim(), list: [] }); g.list.push(b); }
      const body = groups.map((g) => (g.name ? `    -- ${g.name.replace(/\n/g, ' ')}\n` : '') + g.list.map((b) => `    { label = ${L(b.label || 'Blip')}, coords = vector3(${n(b.x)}, ${n(b.y)}, ${n(b.z)}), sprite = ${Math.trunc(b.sprite)}, colour = ${Math.trunc(b.colour)}, scale = ${n(b.scale)}, display = ${Math.trunc(b.display)}, shortRange = ${b.shortRange} },`).join('\n')).join('\n\n');
      const head = name.includes('.') ? `${name.split('.')[0]} = ${name.split('.')[0]} or {}\n` : '';
      return `${head}${name.includes('.') ? '' : 'local '}${name} = {\n${body}\n}\n`;
    }
    function clientOut() {
      return `local createdBlips = {}

CreateThread(function()
    for _, b in ipairs(${tbl()}) do
        local blip = AddBlipForCoord(b.coords.x, b.coords.y, b.coords.z)
        SetBlipSprite(blip, b.sprite)
        SetBlipDisplay(blip, b.display or 4)
        SetBlipScale(blip, b.scale or 0.8)
        SetBlipColour(blip, b.colour or 0)
        SetBlipAsShortRange(blip, b.shortRange ~= false)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(b.label)
        EndTextCommandSetBlipName(blip)
        createdBlips[#createdBlips + 1] = blip
    end
end)
${s.removeOnStop ? `
AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    for _, blip in ipairs(createdBlips) do
        if DoesBlipExist(blip) then RemoveBlip(blip) end
    end
end)
` : ''}`;
    }
    const OUTS = { all: ['Tout-en-un', 'blips.lua', () => `-- Blips (client)\n${configOut()}\n${clientOut()}`], config: ['config.lua', 'config.lua', configOut], client: ['client.lua', 'client.lua', clientOut] };
    const out = F.output({ title: '', filename: () => OUTS[s.tab][1], lang: 'lua' });
    const warnBox = F.h('<div class="stack"></div>');
    const tabs = F.tabs(Object.entries(OUTS).map(([id, o]) => ({ id, label: o[0] })), (id) => { s.tab = id; render(); });
    F.$('.res', root).prepend(tabs.el);
    F.$('.res', root).append(warnBox, out.el);
    function render() {
      const o = OUTS[s.tab] || OUTS.all;
      out.set(o[2]()); out.setTitle(o[1]);
      const w = [];
      if (!/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)?$/.test(s.varName.trim())) w.push('Nom de table invalide : Config.Blips utilisé.');
      if (s.blips.some((b) => !b.x && !b.y)) w.push('Certains blips sont en 0, 0 : pense à renseigner leurs coordonnées.');
      if (s.tab === 'client') w.push(`Le fichier client utilise ${tbl()} : charge config.lua avant (shared_scripts ou client_scripts).`);
      warnBox.innerHTML = w.map((x) => `<div class="note${x.startsWith('Le fichier') ? '' : ' warn'}">${F.esc(x)}</div>`).join('');
    }

    root.addEventListener('click', (e) => {
      const sp = e.target.closest('[data-sprite]'), co = e.target.closest('[data-colour]');
      if (sp || co) {
        const b = s.blips[s.active];
        if (!b) return F.toast('Sélectionne d’abord une ligne du tableau', 'error');
        if (sp) b.sprite = +sp.dataset.sprite; else b.colour = +co.dataset.colour;
        drawTable(); render(); return;
      }
      const btn = e.target.closest('[data-a]'); if (!btn) return;
      const a = btn.dataset.a, tr = btn.closest('tr[data-i]');
      if (a === 'add') { const last = s.blips[s.blips.length - 1]; s.blips.push({ ...BLIP, ...(last ? { sprite: last.sprite, colour: last.colour, scale: last.scale, group: last.group } : {}), label: 'Nouveau blip' }); s.active = s.blips.length - 1; }
      else if (a === 'dup' && tr) { s.blips.splice(+tr.dataset.i + 1, 0, { ...s.blips[tr.dataset.i] }); s.active = +tr.dataset.i + 1; }
      else if (a === 'del' && tr) { s.blips.splice(+tr.dataset.i, 1); s.active = Math.min(s.active, s.blips.length - 1); }
      else if (a === 'paste') {
        const pts = parseCoords(s.paste || '');
        if (!pts.length) { F.$('.p-msg', root).textContent = ''; return F.toast('Aucune coordonnée reconnue', 'error'); }
        pts.forEach((p) => s.blips.push(normBlip({ ...BLIP, label: p.label || `Blip ${s.blips.length + 1}`, x: p.x, y: p.y, z: p.z, sprite: s.pSprite, colour: s.pColour, scale: s.pScale || 0.8, group: s.pGroup })));
        F.$('.p-msg', root).textContent = `${pts.length} blip(s) ajouté(s)`;
      } else return;
      drawTable(); render();
    });

    drawTable(); drawSprites(); tabs.select(s.tab);
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v || {});
        s.blips = Array.isArray(s.blips) ? s.blips.filter((b) => b && typeof b === 'object').map(normBlip) : [];
        if (!OUTS[s.tab]) s.tab = 'all';
        s.active = Math.max(0, Math.trunc(+s.active) || 0);
        spq.value = s.spriteQuery = String(s.spriteQuery || '');
        refreshers.forEach((r) => r.refresh()); drawTable(); drawSprites(); tabs.select(s.tab);
      },
    };
  },
});
