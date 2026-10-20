'use strict';
// Générateur de tenues : composants + props par tenue, homme et femme → Config.Uniforms (ESX), Config.Outfits (qb-clothing) ou Lua natif.
Forge.register({
  id: 'outfits',
  cat: 'vetements',
  name: 'Générateur de tenues',
  desc: 'Tenues de job (par grade) composant par composant, homme et femme : export ESX skinchanger, qb-clothing ou Lua natif.',
  tags: ['vetements', 'tenue', 'outfit', 'uniforme', 'esx', 'qbcore', 'qb-clothing', 'skinchanger', 'job', 'SetPedComponentVariation'],
  icon: 'briefcase',
  mount(root, F) {
    // [clé, type (c = composant, p = prop), id GTA, libellé, ESX skinchanger (_1/_2 ou arms/arms_2), qb-clothing]
    const SLOTS = [
      ['c1', 'c', 1, 'Masque', 'mask', 'mask'], ['c2', 'c', 2, 'Cheveux', 'hair', 'hair'], ['c3', 'c', 3, 'Torse / bras', 'arms', 'arms'],
      ['c4', 'c', 4, 'Jambes', 'pants', 'pants'], ['c5', 'c', 5, 'Sac', 'bags', 'bag'], ['c6', 'c', 6, 'Chaussures', 'shoes', 'shoes'],
      ['c7', 'c', 7, 'Accessoire (cou)', 'chain', 'accessory'], ['c8', 'c', 8, 'Sous-haut', 'tshirt', 't-shirt'], ['c9', 'c', 9, 'Gilet pare-balles', 'bproof', 'vest'],
      ['c10', 'c', 10, 'Décals', 'decals', 'decals'], ['c11', 'c', 11, 'Haut', 'torso', 'torso2'],
      ['p0', 'p', 0, 'Chapeau / casque', 'helmet', 'hat'], ['p1', 'p', 1, 'Lunettes', 'glasses', 'glass'], ['p2', 'p', 2, 'Oreilles', 'ears', 'ear'],
      ['p6', 'p', 6, 'Montre', 'watches', 'watch'], ['p7', 'p', 7, 'Bracelet', 'bracelets', 'bracelet'],
    ];
    const esxKeys = (sl) => (sl[4] === 'arms' ? ['arms', 'arms_2'] : [sl[4] + '_1', sl[4] + '_2']);
    const mk = (o) => Object.fromEntries(Object.entries(o).map(([k, [d, t]]) => [k, { d, t }]));
    // Exemple : tenue « recruit » de esx_policejob.
    const sample = () => ({ id: F.uid(), key: 'recruit', label: 'Recrue', grades: '0',
      male: mk({ c8: [59, 1], c11: [55, 0], c10: [0, 0], c3: [41, 0], c4: [25, 0], c6: [25, 0], p0: [46, 0], c7: [0, 0], p2: [2, 0] }),
      female: mk({ c8: [36, 1], c11: [48, 0], c10: [0, 0], c3: [44, 0], c4: [34, 0], c6: [27, 0], p0: [45, 0], c7: [0, 0], p2: [2, 0] }) });
    const DEF = { esxVar: 'Config.Uniforms', qbJob: 'police', luaFn: 'ApplyOutfit', outfits: [], cur: 0, g: 'male' };
    const s = { ...F.clone(DEF), outfits: [sample()] };

    root.append(F.h(`<div class="split wide-left">
      <div class="stack">
        <div class="panel stack">
          <div class="panel-head"><h3>Tenues</h3><button class="btn sm" data-a="add">${F.icon('plus')}Nouvelle</button><button class="btn sm ghost" data-a="dup">${F.icon('copy')}Dupliquer</button><button class="btn sm ghost danger" data-a="del">${F.icon('trash')}</button></div>
          <div class="row of-list"></div>
          <div class="grid-fields of-meta"></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Vêtements</h3><span class="g-tabs"></span><button class="btn sm ghost" data-a="copyg" title="Copier les numéros vers l'autre genre">Copier vers <span class="other-g"></span></button></div>
          <div class="note small">Laisse « Modèle » vide pour ne pas toucher à cet élément. Pour les props, <b>-1</b> = retirer (pas de chapeau, pas de lunettes…). Les numéros sont ceux du jeu (menu vêtements, vMenu…).</div>
          <div class="table-wrap"><table class="table"><thead><tr><th>Élément</th><th>ID</th><th>Modèle</th><th>Texture</th><th class="small">ESX / QB</th></tr></thead><tbody class="of-slots"></tbody></table></div>
          <details><summary class="small muted" style="cursor:pointer">Importer une tenue existante (ESX ou qb-clothing)</summary>
            <div class="stack" style="margin-top:10px"><textarea class="of-import" rows="5" spellcheck="false" placeholder="tshirt_1 = 15, tshirt_2 = 0, torso_1 = 55, arms = 41 …&#10;ou  ['pants'] = { item = 24, texture = 0 }, …"></textarea>
            <div class="row"><button class="btn sm" data-a="import">Importer dans la tenue / genre affichés</button></div></div></details>
        </div>
      </div>
      <div class="stack sticky">
        <div class="row"><span class="out-tabs"></span></div>
        <div class="panel"><div class="grid-fields of-opts"></div></div>
        <div class="of-out"></div>
        <div class="note of-help"></div>
      </div></div>`));
    const $ = (q) => F.$(q, root);
    const out = F.output({ title: 'config.lua', filename: () => fileName(), lang: 'lua' });
    $('.of-out').append(out.el);
    let fmt = 'esx';
    const cur = () => s.outfits[s.cur] || s.outfits[0];

    let fMeta;
    const mountMeta = () => {
      $('.of-meta').innerHTML = '';
      fMeta = F.fields($('.of-meta'), [
        { key: 'key', label: 'Identifiant', placeholder: 'recruit', hint: 'Clé de la tenue dans Config.Uniforms (ESX) et Lua natif.' },
        { key: 'label', label: 'Nom affiché', placeholder: 'Recrue', hint: 'outfitLabel dans qb-clothing.' },
        { key: 'grades', label: 'Grades (qb-clothing)', placeholder: '0, 1, 2' },
      ], cur(), () => { renderList(); renderOut(); });
    };
    const fOpts = F.fields($('.of-opts'), [
      { key: 'esxVar', label: 'Variable ESX', placeholder: 'Config.Uniforms' },
      { key: 'qbJob', label: 'Job (qb-clothing)', placeholder: 'police' },
      { key: 'luaFn', label: 'Fonction Lua', placeholder: 'ApplyOutfit' },
    ], s, () => renderOut());
    const gTabs = F.tabs([{ id: 'male', label: 'Homme' }, { id: 'female', label: 'Femme' }], (id) => { s.g = id; renderSlots(); });
    $('.g-tabs').append(gTabs.el);
    const oTabs = F.tabs([{ id: 'esx', label: 'ESX' }, { id: 'qb', label: 'QBCore' }, { id: 'lua', label: 'Lua natif' }], (id) => { fmt = id; renderOut(); });
    $('.out-tabs').append(oTabs.el);

    /* -------------------------------- rendu -------------------------------- */
    const renderList = () => {
      $('.of-list').innerHTML = s.outfits.map((o, i) => `<button class="chip${i === s.cur ? ' on' : ''}" data-i="${i}">${F.esc(o.label || o.key || 'tenue ' + (i + 1))}</button>`).join('');
    };
    const num = (v) => (v === '' || v == null || !Number.isFinite(+v) ? null : Math.trunc(+v));
    function renderSlots() {
      const data = cur()[s.g] || (cur()[s.g] = {});
      $('.other-g').textContent = s.g === 'male' ? 'femme' : 'homme';
      $('.of-slots').innerHTML = SLOTS.map((sl) => { const v = data[sl[0]] || {}; return `<tr data-k="${sl[0]}">
        <td>${sl[3]}</td><td><span class="chip" style="white-space:nowrap">${sl[1] === 'p' ? 'prop ' : ''}${sl[2]}</span></td>
        <td><input type="number" step="1" min="${sl[1] === 'p' ? -1 : 0}" data-f="d" value="${v.d ?? ''}" placeholder="—" style="width:90px"></td>
        <td><input type="number" step="1" min="0" data-f="t" value="${v.t ?? 0}" style="width:80px"></td>
        <td class="small muted"><code>${esxKeys(sl)[0]}</code> · <code>${sl[5]}</code></td></tr>`; }).join('');
    }
    // éléments renseignés pour un genre : [[slot, d, t]]
    const filled = (o, g) => SLOTS.map((sl) => [sl, num(o[g]?.[sl[0]]?.d), num(o[g]?.[sl[0]]?.t) ?? 0]).filter(([, d]) => d != null);
    const key = (o, i) => F.slug(o.key) || 'tenue_' + (i + 1);
    const luaKey = (k) => (/^[a-z_][a-z0-9_]*$/.test(k) ? k : `[${F.luaStr(k)}]`);
    const grades = (o) => String(o.grades || '').split(/[\s,;]+/).map((x) => parseInt(x, 10)).filter(Number.isFinite);
    const fileName = () => ({ esx: 'config_uniforms.lua', qb: 'config_outfits.lua', lua: 'outfits.lua' })[fmt];

    const inline = (a) => (a.length ? `{ ${a.join(', ')} }` : '{}');
    const list = (lines, pad) => (lines.length ? `{\n${lines.join('\n')}\n${pad}}` : '{}');
    function esx() {
      const g = (o, gk) => { const f = filled(o, gk); if (!f.length) return '\t\t' + gk + ' = {},'; return `\t\t${gk} = {\n${f.map(([sl, d, t]) => { const [a, b] = esxKeys(sl); return `\t\t\t${a} = ${d}, ${b} = ${t},`; }).join('\n')}\n\t\t},`; };
      return `${s.esxVar || 'Config.Uniforms'} = {\n${s.outfits.map((o, i) => `\t${luaKey(key(o, i))} = { -- ${o.label || ''}\n${g(o, 'male')}\n${g(o, 'female')}\n\t},`).join('\n')}\n}\n\n-- Exemple d'utilisation (client) :\n-- ESX.TriggerServerCallback('esx_skin:getPlayerSkin', function(skin)\n--     local u = ${s.esxVar || 'Config.Uniforms'}.${key(s.outfits[0] || {}, 0)}\n--     TriggerEvent('skinchanger:loadClothes', skin, skin.sex == 0 and u.male or u.female)\n-- end)\n`;
    }
    function qb() {
      const g = (gk) => s.outfits.map((o, i) => `\t\t\t[${i + 1}] = {\n\t\t\t\toutfitLabel = ${F.luaStr(o.label || o.key || 'Tenue ' + (i + 1))},\n\t\t\t\toutfitData = ${list(filled(o, gk).map(([sl, d, t]) => `\t\t\t\t\t[${F.luaStr(sl[5])}] = { item = ${d}, texture = ${t} },`), '\t\t\t\t')},\n\t\t\t\tgrades = ${inline(grades(o))},\n\t\t\t},`).join('\n');
      return `Config.Outfits = {\n\t[${F.luaStr(F.slug(s.qbJob) || 'police')}] = {\n\t\t['male'] = {\n${g('male')}\n\t\t},\n\t\t['female'] = {\n${g('female')}\n\t\t},\n\t},\n}\n`;
    }
    function lua() {
      const g = (o, gk) => { const f = filled(o, gk), c = f.filter(([sl]) => sl[1] === 'c'), p = f.filter(([sl]) => sl[1] === 'p');
        return `\t\t${gk} = {\n\t\t\tcomponents = ${inline(c.map(([sl, d, t]) => `[${sl[2]}] = { ${d}, ${t} }`))},\n\t\t\tprops = ${inline(p.map(([sl, d, t]) => `[${sl[2]}] = { ${d}, ${t} }`))},\n\t\t},`; };
      const fn = /^[A-Za-z_][A-Za-z0-9_]*$/.test(s.luaFn) ? s.luaFn : 'ApplyOutfit';
      return `-- Composants : 1 masque, 2 cheveux, 3 torse/bras, 4 jambes, 5 sac, 6 chaussures, 7 accessoire, 8 sous-haut, 9 gilet, 10 décals, 11 haut
-- Props : 0 chapeau, 1 lunettes, 2 oreilles, 6 montre, 7 bracelet (-1 = retirer)
local Outfits = {
${s.outfits.map((o, i) => `\t[${F.luaStr(key(o, i))}] = { -- ${o.label || ''}\n${g(o, 'male')}\n${g(o, 'female')}\n\t},`).join('\n')}
}

--- Applique une tenue au ped (homme ou femme détecté par le modèle freemode).
function ${fn}(name, ped)
\tped = ped or PlayerPedId()
\tlocal outfit = Outfits[name]
\tif not outfit then return false end
\tlocal data = GetEntityModel(ped) == \`mp_f_freemode_01\` and outfit.female or outfit.male
\tfor id, v in pairs(data.components) do
\t\tSetPedComponentVariation(ped, id, v[1], v[2], 0)
\tend
\tfor id, v in pairs(data.props) do
\t\tif v[1] < 0 then ClearPedProp(ped, id) else SetPedPropIndex(ped, id, v[1], v[2], true) end
\tend
\treturn true
end

-- Exemple : ${fn}('${key(s.outfits[0] || {}, 0)}')
`;
    }
    const HELP = {
      esx: 'Format <code>skinchanger</code> d’ESX (esx_policejob, esx_ambulancejob…) : <code>tshirt</code>=8, <code>torso</code>=11, <code>decals</code>=10, <code>arms</code>=3, <code>pants</code>=4, <code>shoes</code>=6, <code>mask</code>=1, <code>bproof</code>=9, <code>chain</code>=7, <code>bags</code>=5, props <code>helmet</code>=0, <code>glasses</code>=1, <code>ears</code>=2, <code>watches</code>=6, <code>bracelets</code>=7.',
      qb: 'À coller dans <code>qb-clothing/config.lua</code> (une table par job, les tenues sont numérotées à partir de 1). Clés : <code>t-shirt</code>=8, <code>torso2</code>=11, <code>arms</code>=3, <code>pants</code>=4, <code>shoes</code>=6, <code>vest</code>=9, <code>bag</code>=5, <code>accessory</code>=7, <code>decals</code>=10, <code>mask</code>=1, props <code>hat</code>=0, <code>glass</code>=1, <code>ear</code>=2, <code>watch</code>=6, <code>bracelet</code>=7.',
      lua: 'Script client autonome (natives <code>SetPedComponentVariation</code> / <code>SetPedPropIndex</code> / <code>ClearPedProp</code>) : marche avec n’importe quel framework, mais n’enregistre pas le skin du joueur.',
    };
    function renderOut() {
      out.setTitle(fileName());
      out.set(fmt === 'esx' ? esx() : fmt === 'qb' ? qb() : lua());
      $('.of-help').innerHTML = HELP[fmt];
    }
    const renderAll = () => { if (s.cur >= s.outfits.length) s.cur = 0; mountMeta(); renderList(); gTabs.select(s.g); renderOut(); };

    /* ------------------------------ actions ------------------------------ */
    $('.of-slots').addEventListener('input', (e) => {
      const tr = e.target.closest('tr'), f = e.target.dataset.f;
      if (!tr || !f) return;
      const data = cur()[s.g], k = tr.dataset.k, v = num(e.target.value);
      data[k] = { ...(data[k] || { d: null, t: 0 }), [f]: f === 't' ? (v ?? 0) : v };
      renderOut();
    });
    function importText(txt) {
      const data = cur()[s.g];
      let n = 0;
      for (const sl of SLOTS) {
        const [a, b] = esxKeys(sl);
        const ma = txt.match(new RegExp(`(?:^|[^a-z_])${a}\\s*=\\s*(-?\\d+)`)), mb = txt.match(new RegExp(`(?:^|[^a-z_])${b}\\s*=\\s*(-?\\d+)`));
        const mq = txt.match(new RegExp(`\\[\\s*["']${sl[5].replace('-', '\\-')}["']\\s*\\]\\s*=\\s*\\{([^}]*)\\}`));
        if (ma) { data[sl[0]] = { d: +ma[1], t: mb ? +mb[1] : 0 }; n++; }
        else if (mq) { const it = mq[1].match(/item\s*=\s*(-?\d+)/), tx = mq[1].match(/texture\s*=\s*(-?\d+)/); if (it) { data[sl[0]] = { d: +it[1], t: tx ? Math.max(0, +tx[1]) : 0 }; n++; } }
      }
      return n;
    }
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.of-list [data-i]');
      if (chip) { s.cur = +chip.dataset.i; return renderAll(); }
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'add') { s.outfits.push({ id: F.uid(), key: 'tenue_' + (s.outfits.length + 1), label: 'Tenue ' + (s.outfits.length + 1), grades: '', male: {}, female: {} }); s.cur = s.outfits.length - 1; }
      else if (a === 'dup') { const c = F.clone(cur()); c.id = F.uid(); c.key = (c.key || 'tenue') + '_copie'; c.label = (c.label || '') + ' (copie)'; s.outfits.splice(s.cur + 1, 0, c); s.cur++; }
      else if (a === 'del') { if (s.outfits.length <= 1) return F.toast('Il faut garder au moins une tenue', 'error'); if (!confirm(`Supprimer la tenue « ${cur().label || cur().key} » ?`)) return; s.outfits.splice(s.cur, 1); s.cur = Math.max(0, s.cur - 1); }
      else if (a === 'copyg') { const o = s.g === 'male' ? 'female' : 'male'; if (Object.keys(cur()[o] || {}).length && !confirm('Remplacer les numéros de l’autre genre ? (les numéros homme et femme sont généralement différents)')) return; cur()[o] = F.clone(cur()[s.g]); F.toast('Copié vers ' + (o === 'male' ? 'homme' : 'femme')); return; }
      else if (a === 'import') { const n = importText($('.of-import').value); if (!n) return F.toast('Rien de reconnu : colle des lignes ESX (tshirt_1 = 15) ou qb-clothing ([\'pants\'] = { item = 24, texture = 0 })', 'error'); F.toast(`${n} élément(s) importé(s)`); $('.of-import').value = ''; renderSlots(); renderOut(); return; }
      else return;
      renderAll();
    });

    oTabs.select('esx');
    renderAll();
    return {
      getState: () => F.clone(s),
      setState(v) {
        const d = { ...F.clone(DEF), ...(v || {}) };
        const clean = (x) => Object.fromEntries(Object.entries(x && typeof x === 'object' ? x : {}).filter(([k]) => SLOTS.some((sl) => sl[0] === k)).map(([k, o]) => [k, { d: num(o?.d), t: num(o?.t) ?? 0 }]));
        d.outfits = (Array.isArray(d.outfits) && d.outfits.length ? d.outfits : [sample()]).map((o) => ({ id: o.id || F.uid(), key: String(o.key ?? ''), label: String(o.label ?? ''), grades: String(o.grades ?? ''), male: clean(o.male), female: clean(o.female) }));
        d.g = d.g === 'female' ? 'female' : 'male';
        d.cur = Math.min(Math.max(0, parseInt(d.cur, 10) || 0), d.outfits.length - 1);
        Object.assign(s, d);
        fOpts.refresh();
        renderAll();
      },
    };
  },
});
