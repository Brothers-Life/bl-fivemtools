'use strict';
// Noms de véhicules : liste modèle / nom / marque / prix / catégorie → AddTextEntry, liste de concession Lua, SQL ESX, QBCore.
Forge.register({
  id: 'vehicle-names',
  cat: 'vehicules',
  name: 'Noms & liste de concession',
  desc: 'Une liste de véhicules → noms affichés (AddTextEntry), config de concession Lua, SQL ESX et QBShared.Vehicles QBCore.',
  tags: ['noms', 'addtextentry', 'vehicle_names', 'concession', 'esx', 'qbcore', 'sql', 'prix', 'gxt'],
  icon: 'tag',
  mount(root, F) {
    const CATS = ['compacts', 'sedans', 'suvs', 'coupes', 'muscle', 'sportsclassics', 'sports', 'super', 'motorcycles', 'offroad', 'industrial', 'utility', 'vans', 'cycles', 'boats', 'helicopters', 'planes', 'service', 'emergency', 'military', 'commercial'];
    const QBTYPE = { motorcycles: 'bike', cycles: 'bike', boats: 'boat', helicopters: 'heli', planes: 'plane' };
    const row = (o = {}) => ({ model: '', label: '', brand: '', gameName: '', price: 0, category: 'sports', ...o });
    const DEF = {
      rows: [row({ model: 'rs6avant', label: 'RS6 Avant', brand: 'Audi', price: 185000, category: 'sports' }), row({ model: 'm4f82', label: 'M4 Competition', brand: 'BMW', price: 160000, category: 'coupes' })],
      tab: 'lua', thread: true, shop: 'pdm', qbNew: false, esxCats: false, varName: 'Config.Vehicles',
    };
    const s = F.clone(DEF);
    const game = (r) => (r.gameName.trim() || r.model.trim()).toUpperCase();
    const brandKey = (b) => F.slug(b).replace(/[_-]/g, '').toUpperCase();
    const valid = () => s.rows.filter((r) => r.model.trim());
    const price = (r) => Math.max(0, Math.round(Number(r.price) || 0));

    root.append(F.h(`<div class="split wide-left vn"><style>.vn .table th,.vn .table td{padding:7px 6px}.vn .table th:first-child,.vn .table td:first-child{padding-left:12px}</style>
      <div class="stack">
        <div class="panel stack">
          <div class="panel-head"><h3>Véhicules</h3><span class="muted small cnt"></span><button class="btn sm" data-a="add">${F.icon('plus')}Ligne</button></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>Modèle (spawn)</th><th>Nom affiché</th><th>Marque</th><th>Prix</th><th>Catégorie</th><th></th></tr></thead><tbody class="rows"></tbody></table></div>
          <datalist id="vn-cats">${CATS.map((c) => `<option value="${c}">`).join('')}</datalist>
          <p class="muted small">Le nom affiché est lié au <b>gameName</b> du vehicles.meta (par défaut le modèle en majuscules). S’il est différent, écris <code>modele:GAMENAME</code> dans la colonne modèle.</p>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Coller une liste</h3><span class="muted small">une ligne par véhicule : modèle ; nom ; marque ; prix ; catégorie</span></div>
          <textarea rows="5" class="bulk" spellcheck="false" placeholder="adder;Adder;Truffade;1000000;super&#10;sultan,Sultan,Karin,45000,sports"></textarea>
          <div class="row"><button class="btn sm primary" data-a="bulk">Ajouter à la liste</button><button class="btn sm ghost" data-a="replace">Remplacer la liste</button><span class="muted small">séparateurs acceptés : ; , ou tabulation</span></div>
        </div>
      </div>
      <div class="stack sticky side">
        <div class="tabsbox"></div>
        <div class="panel"><div class="grid-fields opts"></div></div>
      </div></div>`));
    const out = F.output({ title: '', filename: () => FORMATS[s.tab].file, lang: 'lua' });
    F.$('.side', root).append(out.el);

    // ---------- formats ----------
    const FORMATS = {
      lua: { label: 'vehicle_names.lua', file: 'vehicle_names.lua', build() {
        const seen = new Set(), lines = [];
        for (const r of valid()) {
          const k = game(r);
          if (r.label.trim() && !seen.has(k)) { seen.add(k); lines.push(`AddTextEntry(${F.luaStr(k)}, ${F.luaStr(r.label.trim())})`); }
          const b = brandKey(r.brand);
          if (b && !seen.has(b)) { seen.add(b); lines.push(`AddTextEntry(${F.luaStr(b)}, ${F.luaStr(r.brand.trim())}) -- marque : doit correspondre au vehicleMakeName`); }
        }
        const head = '-- Noms affichés des véhicules (client_script dans le fxmanifest)\n';
        return head + (s.thread ? `Citizen.CreateThread(function()\n${lines.map((l) => '    ' + l).join('\n')}\nend)\n` : lines.join('\n') + '\n');
      } },
      shop: { label: 'Concession (Lua)', file: 'vehicles.lua', build() {
        return `${s.varName || 'Config.Vehicles'} = {\n${valid().map((r) => `    { model = ${F.luaStr(r.model.trim())}, label = ${F.luaStr(r.label.trim() || r.model.trim())}, price = ${price(r)}, category = ${F.luaStr(r.category.trim())} },`).join('\n')}\n}\n`;
      } },
      esx: { label: 'ESX (SQL)', file: 'vehicles.sql', build() {
        const rows = valid();
        let sql = '-- ESX : table `vehicles` (name, model, price, category)\n';
        if (s.esxCats) {
          const cats = [...new Set(rows.map((r) => r.category.trim()).filter(Boolean))];
          if (cats.length) sql += `INSERT IGNORE INTO \`vehicle_categories\` (\`name\`, \`label\`) VALUES\n${cats.map((c) => `  (${F.sqlStr(c)}, ${F.sqlStr(c.charAt(0).toUpperCase() + c.slice(1))})`).join(',\n')};\n\n`;
        }
        if (rows.length) sql += `INSERT INTO \`vehicles\` (\`name\`, \`model\`, \`price\`, \`category\`) VALUES\n${rows.map((r) => `  (${F.sqlStr(r.label.trim() || r.model.trim())}, ${F.sqlStr(r.model.trim())}, ${price(r)}, ${F.sqlStr(r.category.trim())})`).join(',\n')};\n`;
        return sql;
      } },
      qb: { label: 'QBCore', file: 'vehicles.lua', build() {
        const rows = valid();
        if (s.qbNew) return `-- qb-core/shared/vehicles.lua (format récent : liste)\n${rows.map((r) => `    { model = ${F.luaStr(r.model.trim())}, name = ${F.luaStr(r.label.trim() || r.model.trim())}, brand = ${F.luaStr(r.brand.trim())}, price = ${price(r)}, category = ${F.luaStr(r.category.trim())}, type = ${F.luaStr(QBTYPE[r.category.trim()] || 'automobile')}, shop = ${F.luaStr(s.shop)} },`).join('\n')}\n`;
        return `-- À coller dans QBShared.Vehicles (qb-core/shared/vehicles.lua)\n${rows.map((r) => { const m = r.model.trim(); return `    [${F.luaStr(m)}] = {\n        ['name'] = ${F.luaStr(r.label.trim() || m)},\n        ['brand'] = ${F.luaStr(r.brand.trim())},\n        ['model'] = ${F.luaStr(m)},\n        ['price'] = ${price(r)},\n        ['category'] = ${F.luaStr(r.category.trim())},\n        ['hash'] = \`${m.replace(/`/g, '')}\`,\n        ['shop'] = ${F.luaStr(s.shop)},\n    },`; }).join('\n')}\n`;
      } },
    };
    const OPTS = {
      lua: [{ key: 'thread', label: 'Dans un Citizen.CreateThread', type: 'checkbox', wide: true }],
      shop: [{ key: 'varName', label: 'Nom de la table', hint: 'Ex. Config.Vehicles, Config.Shop.Vehicles…' }],
      esx: [{ key: 'esxCats', label: 'Ajouter aussi les catégories (vehicle_categories)', type: 'checkbox', wide: true }],
      qb: [{ key: 'qbNew', label: 'Format récent (liste avec type)', type: 'checkbox', wide: true }, { key: 'shop', label: 'shop', hint: 'Concession où le véhicule est vendu (pdm, luxury, boats, air…).' }],
    };
    const render = () => {
      // « modele:GAMENAME » → gameName séparé
      for (const r of s.rows) { const m = r.model.match(/^([^:]+):(.+)$/); if (m) { r.model = m[1].trim(); r.gameName = m[2].trim(); } }
      const f = FORMATS[s.tab];
      out.setTitle(f.file); out.set(f.build());
      F.$('.cnt', root).textContent = `${valid().length} véhicule${valid().length > 1 ? 's' : ''}`;
    };
    const renderOpts = () => { const box = F.$('.opts', root); box.innerHTML = ''; F.fields(box, OPTS[s.tab], s, render); };
    const renderRows = () => {
      F.$('.rows', root).innerHTML = s.rows.map((r, i) => `<tr data-i="${i}">
        <td><input data-k="model" style="min-width:100px" value="${F.esc(r.gameName ? `${r.model}:${r.gameName}` : r.model)}" placeholder="adder" spellcheck="false"></td>
        <td><input data-k="label" style="min-width:110px" value="${F.esc(r.label)}" placeholder="Adder"></td>
        <td><input data-k="brand" style="min-width:80px" value="${F.esc(r.brand)}" placeholder="Truffade"></td>
        <td><input data-k="price" type="number" min="0" step="1" value="${price(r)}" style="width:90px"></td>
        <td><input data-k="category" list="vn-cats" value="${F.esc(r.category)}" style="min-width:100px"></td>
        <td class="actions"><button class="btn sm ghost danger" data-del="${i}" title="Supprimer">${F.icon('x')}</button></td></tr>`).join('')
        || '<tr><td colspan="6" class="empty">Aucun véhicule : ajoute une ligne ou colle une liste.</td></tr>';
    };
    const tabs = F.tabs(Object.entries(FORMATS).map(([id, f]) => ({ id, label: f.label })), (id) => { s.tab = id; renderOpts(); render(); });
    F.$('.tabsbox', root).append(tabs.el);

    F.$('.rows', root).addEventListener('input', (e) => {
      const k = e.target.dataset.k, r = s.rows[e.target.closest('tr').dataset.i];
      if (k === 'model') { const m = e.target.value.match(/^([^:]*):(.*)$/); r.model = (m ? m[1] : e.target.value).trim(); r.gameName = m ? m[2].trim() : ''; }
      else r[k] = k === 'price' ? Number(e.target.value) || 0 : e.target.value;
      render();
    });
    const parseBulk = (text) => text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
      const c = l.split(l.includes('\t') ? '\t' : l.includes(';') ? ';' : ',').map((x) => x.trim());
      return row({ model: c[0], label: c[1] || '', brand: c[2] || '', price: Number(String(c[3] || '0').replace(/[\s$€]/g, '')) || 0, category: c[4] || 'sports' });
    }).filter((r) => r.model);
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.del != null) { s.rows.splice(Number(b.dataset.del), 1); renderRows(); render(); }
      else if (b.dataset.a === 'add') { s.rows.push(row()); renderRows(); render(); F.$$('.rows tr:last-child input', root)[0]?.focus(); }
      else if (b.dataset.a === 'bulk' || b.dataset.a === 'replace') {
        const ta = F.$('.bulk', root), list = parseBulk(ta.value);
        if (!list.length) return F.toast('Aucune ligne reconnue (format : modèle ; nom ; marque ; prix ; catégorie)', 'error');
        s.rows = b.dataset.a === 'replace' ? list : [...s.rows.filter((r) => r.model.trim()), ...list];
        ta.value = ''; renderRows(); render(); F.toast(`${list.length} véhicule${list.length > 1 ? 's' : ''} ajouté${list.length > 1 ? 's' : ''}`);
      }
    });

    renderRows(); tabs.select(s.tab);
    return {
      getState: () => F.clone(s),
      setState(v) {
        v = v || {};
        Object.assign(s, F.clone(DEF), v);
        s.rows = Array.isArray(v.rows) ? v.rows.map((r) => row({ ...r, gameName: String(r.gameName || ''), price: Number(r.price) || 0 })) : F.clone(DEF.rows);
        if (!FORMATS[s.tab]) s.tab = 'lua';
        renderRows(); tabs.select(s.tab);
      },
    };
  },
});
