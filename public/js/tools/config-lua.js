'use strict';
// Générateur de points pour config Lua : positions nommées → Config.Locations, ox_target, qb-target, PolyZone, peds, markers.
Forge.register({
  id: 'coords-config',
  cat: 'scripts',
  name: 'Points & zones (config Lua)',
  desc: 'Liste de positions (x, y, z, heading) transformée en Config.Locations, zones ox_target / qb-target / PolyZone, peds ou markers.',
  tags: ['coords', 'coordonnées', 'vector4', 'config', 'ox_target', 'qb-target', 'polyzone', 'boxzone', 'ped', 'marker', 'drawmarker', 'zone'],
  icon: 'layers',
  mount(root, F) {
    const PT = { name: '', label: '', x: 0, y: 0, z: 0, h: 0 };
    const DEF = {
      points: [{ name: 'shop_1', label: 'Supérette Strawberry', x: 25.7, y: -1347.3, z: 29.49, h: 270 }, { name: 'shop_2', label: 'Supérette Vinewood', x: 373.87, y: 325.89, z: 103.57, h: 255 }],
      tab: 'config', varName: 'Config.Locations', length: 1.5, width: 1.5, height: 2.0, radius: 1.5, debug: false,
      icon: 'fa-solid fa-hand', tLabel: 'Interagir', event: '', eventType: 'client', distance: 2.0,
      model: 's_m_y_shop_mask', scenario: 'WORLD_HUMAN_STAND_IMPATIENT', zMinus: true,
      mType: 1, mColor: '#ff7a18', mAlpha: 150, mSize: 1.0, drawDist: 20, useDist: 1.5, help: 'Appuie sur ~INPUT_CONTEXT~ pour interagir', paste: '',
    };
    const s = F.clone(DEF);
    const normPt = (p) => { const o = { ...PT }; for (const k of Object.keys(PT)) if (p && p[k] != null) o[k] = typeof PT[k] === 'number' ? (p[k] !== '' && Number.isFinite(+p[k]) ? +p[k] : 0) : String(p[k]); return o; };

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
      <div class="panel"><div class="panel-head"><h3>Points <span class="muted small p-count"></span></h3><button class="btn sm" data-a="add">${F.icon('plus')}Ajouter</button></div>
        <div class="p-table"></div></div>
      <div class="split">
        <div class="stack">
          <div class="panel"><div class="panel-head"><h3>Coller des positions</h3></div>
            <p class="muted small" style="margin-bottom:10px"><code>vector4(x, y, z, h)</code>, <code>vector3(...)</code>, <code>{ x = .., y = .., z = .., w = .. }</code>, JSON ou <code>x, y, z, h</code> — une par ligne, le texte avant (ou <code>-- nom</code>) sert de label.</p>
            <div class="f-paste"></div>
            <div class="row" style="margin-top:10px"><button class="btn primary sm" data-a="paste">${F.icon('upload')}Ajouter ces points</button><span class="muted small p-msg"></span></div></div>
          <div class="panel"><div class="panel-head"><h3>Zones & interaction</h3></div><div class="grid-fields f-zone"></div></div>
          <div class="panel"><div class="panel-head"><h3>Ped</h3></div><div class="grid-fields f-ped"></div></div>
          <div class="panel"><div class="panel-head"><h3>Marker</h3></div><div class="grid-fields f-marker"></div></div>
        </div>
        <div class="stack sticky res"></div>
      </div></div>`));

    const COLS = [['name', 'Nom (id)', 'text', 100], ['label', 'Label', 'text', 140], ['x', 'X', 'number', 80], ['y', 'Y', 'number', 80], ['z', 'Z', 'number', 66], ['h', 'Heading', 'number', 60]];
    const tbox = F.$('.p-table', root);
    const drawTable = () => {
      F.$('.p-count', root).textContent = `(${s.points.length})`;
      tbox.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr>${COLS.map((c) => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${s.points.map((p, i) => `<tr data-i="${i}">${COLS.map(([k, , t, w]) => `<td><input data-k="${k}" ${t === 'number' ? 'type="number" step="any"' : ''} value="${F.esc(p[k])}" style="min-width:${w}px"></td>`).join('')}
        <td class="actions"><button class="btn sm ghost" data-a="dup" title="Dupliquer">${F.icon('copy')}</button><button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></td></tr>`).join('')
        || `<tr><td colspan="${COLS.length + 1}" class="empty">Aucun point : ajoute-en un ou colle des positions</td></tr>`}</tbody></table></div>`;
    };
    tbox.addEventListener('input', (e) => {
      const k = e.target.dataset.k, tr = e.target.closest('tr[data-i]');
      if (!k || !tr) return;
      s.points[tr.dataset.i][k] = typeof PT[k] === 'number' ? Number(e.target.value) || 0 : e.target.value;
      render();
    });

    const refreshers = [];
    const fields = (sel, defs, cb = () => render()) => refreshers.push(F.fields(F.$(sel, root), defs, s, cb));
    fields('.f-paste', [{ key: 'paste', label: 'Positions', type: 'textarea', rows: 4, wide: true, placeholder: 'Banque: vector4(150.26, -1040.2, 29.37, 340.0)\n-1037.7, -2737.8, 20.1, 330.0 -- Aéroport' }], () => {});
    fields('.f-zone', [
      { key: 'varName', label: 'Nom de la table', placeholder: 'Config.Locations' },
      { key: 'debug', label: 'debug (affiche les zones)', type: 'checkbox' },
      { key: 'length', label: 'Longueur (box)', type: 'number', step: 0.1 }, { key: 'width', label: 'Largeur (box)', type: 'number', step: 0.1 },
      { key: 'height', label: 'Hauteur (box)', type: 'number', step: 0.1 }, { key: 'radius', label: 'Rayon (sphère / cercle)', type: 'number', step: 0.1 },
      { key: 'tLabel', label: 'Texte de l’option', placeholder: 'Interagir' }, { key: 'icon', label: 'Icône Font Awesome', placeholder: 'fa-solid fa-hand' },
      { key: 'event', label: 'Événement déclenché (facultatif)', placeholder: 'monscript:open' },
      { key: 'eventType', label: 'Type d’événement', type: 'select', options: [['client', 'client'], ['server', 'server']] },
      { key: 'distance', label: 'Distance d’interaction', type: 'number', step: 0.1 },
    ]);
    fields('.f-ped', [
      { key: 'model', label: 'Modèle', placeholder: 's_m_y_cop_01' }, { key: 'scenario', label: 'Scénario (facultatif)', placeholder: 'WORLD_HUMAN_CLIPBOARD' },
      { key: 'zMinus', label: 'z − 1 (positions relevées sur le joueur)', type: 'checkbox', wide: true },
    ]);
    fields('.f-marker', [
      { key: 'mType', label: 'Type de marker', type: 'number', min: 0, max: 43, step: 1, hint: '1 = cylindre, 2 = flèche, 20 = chevron, 27 = cercle au sol' },
      { key: 'mColor', label: 'Couleur', type: 'color' }, { key: 'mAlpha', label: 'Opacité (0-255)', type: 'number', min: 0, max: 255, step: 1 },
      { key: 'mSize', label: 'Taille', type: 'number', step: 0.1 }, { key: 'drawDist', label: 'Distance d’affichage', type: 'number', step: 1 },
      { key: 'useDist', label: 'Distance d’action', type: 'number', step: 0.1 }, { key: 'help', label: 'Texte d’aide', wide: true },
    ]);

    /* --------------------------------- sorties --------------------------------- */
    const L = F.luaStr, n = (v) => F.short(v, true);
    const v3 = (p, dz = 0) => `vec3(${n(p.x)}, ${n(p.y)}, ${n(p.z + dz)})`;
    const v4 = (p) => `vector4(${n(p.x)}, ${n(p.y)}, ${n(p.z)}, ${n(p.h)})`;
    const id = (p, i) => F.slug(p.name || p.label, '_') || 'point_' + (i + 1);
    const tbl = () => (/^[A-Za-z_]\w*(\.[A-Za-z_]\w*)?$/.test(s.varName.trim()) ? s.varName.trim() : 'Config.Locations');
    const head = () => (tbl().includes('.') ? `${tbl().split('.')[0]} = ${tbl().split('.')[0]} or {}\n` : 'local ');
    const pts = () => s.points;
    const action = (pad) => {
      if (!s.event.trim()) return `${pad}onSelect = function(data)\n${pad}    -- ton code ici (data.coords, data.zone…)\n${pad}end,`;
      return `${pad}${s.eventType === 'server' ? 'serverEvent' : 'event'} = ${L(s.event.trim())},`;
    };
    const oxOpt = (p, i) => `    options = {\n        {\n            name = ${L(id(p, i))},\n            icon = ${L(s.icon)},\n            label = ${L(s.tLabel || p.label)},\n            distance = ${n(s.distance)},\n${action('            ')}\n        },\n    },`;
    const qbOpts = (p) => `{\n    options = {\n        {\n${s.event.trim() ? `            type = ${L(s.eventType)},\n            event = ${L(s.event.trim())},` : '            action = function(entity)\n                -- ton code ici\n            end,'}\n            icon = ${L(s.icon)},\n            label = ${L(s.tLabel || p.label)},\n        },\n    },\n    distance = ${n(s.distance)},\n}`;
    const cmt = (p) => (p.label ? `-- ${p.label.replace(/\n/g, ' ')}\n` : '');
    const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c || '') || [, 'ff7a18']; const v = parseInt(m[1], 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
    const OUTS = {
      config: ['Config', 'config.lua', () => `${head()}${tbl()} = {\n${pts().map((p, i) => `    { name = ${L(id(p, i))}, label = ${L(p.label)}, coords = ${v4(p)} },`).join('\n')}\n}\n`],
      oxbox: ['ox_target box', 'client.lua', () => pts().map((p, i) => `${cmt(p)}exports.ox_target:addBoxZone({\n    name = ${L(id(p, i))},\n    coords = ${v3(p)},\n    size = vec3(${n(s.length)}, ${n(s.width)}, ${n(s.height)}),\n    rotation = ${n(p.h)},\n    debug = ${s.debug},\n${oxOpt(p, i)}\n})`).join('\n\n') + '\n'],
      oxsphere: ['ox_target sphère', 'client.lua', () => pts().map((p, i) => `${cmt(p)}exports.ox_target:addSphereZone({\n    name = ${L(id(p, i))},\n    coords = ${v3(p)},\n    radius = ${n(s.radius)},\n    debug = ${s.debug},\n${oxOpt(p, i)}\n})`).join('\n\n') + '\n'],
      qbbox: ['qb-target box', 'client.lua', () => pts().map((p, i) => `${cmt(p)}exports['qb-target']:AddBoxZone(${L(id(p, i))}, vector3(${n(p.x)}, ${n(p.y)}, ${n(p.z)}), ${n(s.length)}, ${n(s.width)}, {\n    name = ${L(id(p, i))},\n    heading = ${n(p.h)},\n    debugPoly = ${s.debug},\n    minZ = ${n(p.z - 1)},\n    maxZ = ${n(p.z - 1 + s.height)},\n}, ${qbOpts(p)})`).join('\n\n') + '\n'],
      qbcircle: ['qb-target cercle', 'client.lua', () => pts().map((p, i) => `${cmt(p)}exports['qb-target']:AddCircleZone(${L(id(p, i))}, vector3(${n(p.x)}, ${n(p.y)}, ${n(p.z)}), ${n(s.radius)}, {\n    name = ${L(id(p, i))},\n    debugPoly = ${s.debug},\n    useZ = true,\n}, ${qbOpts(p)})`).join('\n\n') + '\n'],
      poly: ['PolyZone', 'client.lua', () => `-- fxmanifest : client_scripts { '@PolyZone/client.lua', '@PolyZone/BoxZone.lua', ... }\n\n` + pts().map((p, i) => `${cmt(p)}local ${id(p, i).replace(/^(\d)/, '_$1')}Zone = BoxZone:Create(vector3(${n(p.x)}, ${n(p.y)}, ${n(p.z)}), ${n(s.length)}, ${n(s.width)}, {\n    name = ${L(id(p, i))},\n    heading = ${n(p.h)},\n    minZ = ${n(p.z - 1)},\n    maxZ = ${n(p.z - 1 + s.height)},\n    debugPoly = ${s.debug},\n})\n\n${id(p, i).replace(/^(\d)/, '_$1')}Zone:onPlayerInOut(function(isPointInside)\n    if isPointInside then\n        -- le joueur entre dans la zone\n    else\n        -- le joueur sort de la zone\n    end\nend)`).join('\n\n') + '\n'],
      peds: ['Peds', 'client.lua', () => `local peds = {}\nlocal points = {\n${pts().map((p) => `    ${v4(p)}, ${p.label ? '-- ' + p.label.replace(/\n/g, ' ') : ''}`.trimEnd()).join('\n')}\n}\n
CreateThread(function()
    local model = joaat(${L(s.model || 's_m_y_cop_01')})
    RequestModel(model)
    while not HasModelLoaded(model) do Wait(0) end
    for _, c in ipairs(points) do
        local ped = CreatePed(4, model, c.x, c.y, c.z${s.zMinus ? ' - 1.0' : ''}, c.w, false, true)
        FreezeEntityPosition(ped, true)
        SetEntityInvincible(ped, true)
        SetBlockingOfNonTemporaryEvents(ped, true)
${s.scenario.trim() ? `        TaskStartScenarioInPlace(ped, ${L(s.scenario.trim())}, 0, true)\n` : ''}        peds[#peds + 1] = ped
    end
    SetModelAsNoLongerNeeded(model)
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    for _, ped in ipairs(peds) do
        if DoesEntityExist(ped) then DeleteEntity(ped) end
    end
end)
`],
      markers: ['Markers', 'client.lua', () => { const [r, g, b] = hex(s.mColor); return `local markers = {
${pts().map((p, i) => `    { name = ${L(id(p, i))}, label = ${L(p.label)}, coords = vector3(${n(p.x)}, ${n(p.y)}, ${n(p.z)}) },`).join('\n')}
}

local function helpText(text)
    BeginTextCommandDisplayHelp('STRING')
    AddTextComponentSubstringPlayerName(text)
    EndTextCommandDisplayHelp(0, false, true, -1)
end

CreateThread(function()
    while true do
        local sleep = 1000
        local pos = GetEntityCoords(PlayerPedId())
        for _, m in ipairs(markers) do
            local dist = #(pos - m.coords)
            if dist < ${n(s.drawDist)} then
                sleep = 0
                DrawMarker(${Math.trunc(s.mType)}, m.coords.x, m.coords.y, m.coords.z - 0.98, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, ${n(s.mSize)}, ${n(s.mSize)}, ${n(s.mSize * 0.5)}, ${r}, ${g}, ${b}, ${Math.max(0, Math.min(255, Math.trunc(s.mAlpha)))}, false, true, 2, false, nil, nil, false)
                if dist < ${n(s.useDist)} then
                    helpText(${L(s.help)})
                    if IsControlJustReleased(0, 38) then -- touche E
${s.event.trim() ? `                        ${s.eventType === 'server' ? 'TriggerServerEvent' : 'TriggerEvent'}(${L(s.event.trim())}, m.name)` : '                        -- ton code ici (m.name, m.label)'}
                    end
                end
            end
        end
        Wait(sleep)
    end
end)
`; }],
    };
    const res = F.$('.res', root);
    const out = F.output({ title: '', filename: () => OUTS[s.tab][1], lang: 'lua' });
    const note = F.h('<div class="stack"></div>');
    const tabs = F.tabs(Object.entries(OUTS).map(([k, o]) => ({ id: k, label: o[0] })), (k) => { s.tab = k; render(); });
    tabs.el.style.flexWrap = 'wrap';
    res.append(tabs.el, note, out.el);
    const NOTES = {
      oxbox: 'Nécessite ox_target. Les zones sont créées au chargement du fichier client.', oxsphere: 'Nécessite ox_target.',
      qbbox: 'Nécessite qb-target. minZ/maxZ partent de z − 1 sur la hauteur choisie.', qbcircle: 'Nécessite qb-target.',
      poly: 'Nécessite PolyZone (ajoute les deux imports dans le fxmanifest).', peds: 'Code client. Le heading de chaque point oriente le ped.',
    };
    function render() {
      const o = OUTS[s.tab] || OUTS.config;
      out.set(pts().length ? o[2]() : '-- Aucun point'); out.setTitle(o[1]);
      const w = [];
      if (NOTES[s.tab]) w.push(['', NOTES[s.tab]]);
      const ids = pts().map(id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
      if (dup.length) w.push(['warn', `Noms en double : ${[...new Set(dup)].join(', ')} (les zones doivent avoir un nom unique)`]);
      if (pts().some((p) => !p.x && !p.y)) w.push(['warn', 'Certains points sont en 0, 0.']);
      note.innerHTML = w.map(([c, x]) => `<div class="note ${c}">${F.esc(x)}</div>`).join('');
    }

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, tr = b.closest('tr[data-i]');
      if (a === 'add') s.points.push({ ...PT, name: 'point_' + (s.points.length + 1), label: 'Nouveau point' });
      else if (a === 'dup' && tr) { const p = s.points[tr.dataset.i]; s.points.splice(+tr.dataset.i + 1, 0, { ...p, name: p.name + '_2' }); }
      else if (a === 'del' && tr) s.points.splice(+tr.dataset.i, 1);
      else if (a === 'paste') {
        const list = parseCoords(s.paste || '');
        if (!list.length) { F.$('.p-msg', root).textContent = ''; return F.toast('Aucune position reconnue', 'error'); }
        list.forEach((p) => { const k = s.points.length + 1; s.points.push(normPt({ ...p, name: F.slug(p.label, '_') || 'point_' + k, label: p.label || 'Point ' + k })); });
        F.$('.p-msg', root).textContent = `${list.length} point(s) ajouté(s)`;
      } else return;
      drawTable(); render();
    });

    drawTable(); tabs.select(s.tab);
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v || {});
        s.points = Array.isArray(s.points) ? s.points.filter((p) => p && typeof p === 'object').map(normPt) : [];
        for (const k of ['length', 'width', 'height', 'radius', 'distance', 'mType', 'mAlpha', 'mSize', 'drawDist', 'useDist']) s[k] = Number.isFinite(+s[k]) ? +s[k] : DEF[k];
        for (const k of ['varName', 'icon', 'tLabel', 'event', 'model', 'scenario', 'help', 'mColor', 'paste']) s[k] = String(s[k] ?? DEF[k]);
        if (!OUTS[s.tab]) s.tab = 'config';
        refreshers.forEach((r) => r.refresh()); drawTable(); tabs.select(s.tab);
      },
    };
  },
});
