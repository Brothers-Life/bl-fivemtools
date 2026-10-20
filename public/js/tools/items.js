'use strict';
// Générateur et convertisseur d'items d'inventaire : ox_inventory ↔ QBCore ↔ ESX (SQL), import par copier-coller.
Forge.register({
  id: 'items',
  cat: 'scripts',
  name: 'Générateur d’items',
  desc: 'Crée tes items une fois, exporte-les pour ox_inventory, QBCore et ESX (SQL), ou convertis un fichier existant.',
  tags: ['items', 'item', 'inventaire', 'inventory', 'ox_inventory', 'qbcore', 'qb-core', 'esx', 'sql', 'convertisseur', 'shared'],
  icon: 'box',
  mount(root, F) {
    /* ---------- lecture de tables Lua (ox / qb) et d'INSERT SQL (esx) ---------- */
    const luaTokens = (src) => {
      const T = [], n = src.length;
      let i = 0;
      const longStr = (at) => { const m = src.slice(at).match(/^\[(=*)\[/); if (!m) return null; const close = ']' + m[1] + ']', end = src.indexOf(close, at + m[0].length); return { v: src.slice(at + m[0].length, end < 0 ? n : end).replace(/^\n/, ''), next: end < 0 ? n : end + close.length }; };
      while (i < n) {
        const c = src[i];
        if (/\s/.test(c)) { i++; continue; }
        if (src.startsWith('--', i)) { const l = longStr(i + 2); if (l) i = l.next; else { const e = src.indexOf('\n', i); i = e < 0 ? n : e; } continue; }
        if (c === '[' && /^\[=*\[/.test(src.slice(i, i + 10))) { const l = longStr(i); T.push({ t: 's', v: l.v }); i = l.next; continue; }
        if (c === '"' || c === "'" || c === '`') {
          let v = ''; i++;
          while (i < n && src[i] !== c && src[i] !== '\n') {
            if (src[i] === '\\') { const e = src[i + 1]; const d = src.slice(i + 1).match(/^\d{1,3}/); if (d) { v += String.fromCharCode(+d[0]); i += 1 + d[0].length; continue; } v += { n: '\n', t: '\t', r: '\r' }[e] ?? e; i += 2; continue; }
            v += src[i++];
          }
          i++; T.push({ t: 's', v }); continue;
        }
        const num = src.slice(i).match(/^(0x[0-9a-f]+|\d+\.?\d*(e[+-]?\d+)?|\.\d+(e[+-]?\d+)?)/i);
        if (num) { T.push({ t: 'n', v: Number(num[0]) }); i += num[0].length; continue; }
        const id = src.slice(i).match(/^[A-Za-z_]\w*/);
        if (id) { T.push({ t: 'id', v: id[0] }); i += id[0].length; continue; }
        T.push({ t: 'p', v: c }); i++;
      }
      return T;
    };
    const luaParse = (src) => {
      const T = luaTokens(src);
      let p = 0;
      const isP = (k, v) => k && k.t === 'p' && k.v === v;
      const stop = (k) => k.t === 'p' && ',;})]'.includes(k.v);
      const skipExpr = () => {
        let d = 0;
        while (p < T.length) {
          const k = T[p];
          if (d === 0 && stop(k)) return;
          if (k.t === 'p' && '({['.includes(k.v)) d++;
          else if (k.t === 'p' && ')}]'.includes(k.v)) d--;
          else if (k.t === 'id' && /^(function|if|do|repeat)$/.test(k.v)) d++;
          else if (k.t === 'id' && /^(end|until)$/.test(k.v)) d--;
          p++;
        }
      };
      const simple = (v) => { p++; if (p < T.length && !stop(T[p])) { skipExpr(); return undefined; } return v; };
      const value = () => {
        const k = T[p];
        if (!k) return undefined;
        if (isP(k, '{')) return table();
        if (isP(k, '-') && T[p + 1] && T[p + 1].t === 'n') { p++; return simple(-T[p].v); }
        if (k.t === 's' || k.t === 'n') return simple(k.v);
        if (k.t === 'id' && (k.v === 'true' || k.v === 'false')) return simple(k.v === 'true');
        if (k.t === 'id' && k.v === 'nil') return simple(null);
        skipExpr(); return undefined;
      };
      const table = () => {
        p++;
        const o = {};
        let idx = 1;
        while (p < T.length && !isP(T[p], '}')) {
          let key;
          if (isP(T[p], '[')) { p++; key = value(); if (isP(T[p], ']')) p++; if (isP(T[p], '=')) p++; }
          else if (T[p].t === 'id' && isP(T[p + 1], '=') && !isP(T[p + 2], '=')) { key = T[p].v; p += 2; }
          else key = idx++;
          const start = p, v = value();
          if (key != null && v !== undefined) o[key] = v;
          if (isP(T[p], ',') || isP(T[p], ';')) p++;
          else if (p === start && !isP(T[p], '}')) p++;
        }
        p++;
        return o;
      };
      const roots = [];
      while (p < T.length) {
        if (isP(T[p], '{')) roots.push(table());
        else if (isP(T[p], '[') && T[p + 1] && T[p + 1].t === 's' && isP(T[p + 2], ']') && isP(T[p + 3], '=') && isP(T[p + 4], '{')) { const k = T[p + 1].v; p += 4; roots.push({ [k]: table() }); }
        else if (T[p].t === 'id' && isP(T[p + 1], '=') && isP(T[p + 2], '{')) { const k = T[p].v; p += 2; roots.push({ [k]: table() }); }
        else p++;
      }
      return roots;
    };
    const sqlInserts = (src) => {
      const out = [], re = /INSERT\s+(?:IGNORE\s+)?INTO\s+`?(\w+)`?\s*(?:\(([^)]*)\))?\s*VALUES\s*/gi;
      let m;
      while ((m = re.exec(src))) {
        const cols = m[2] ? m[2].split(',').map((c) => c.trim().replace(/[`"]/g, '').toLowerCase()) : null, rows = [];
        let i = re.lastIndex;
        const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
        for (;;) {
          ws(); if (src[i] !== '(') break; i++;
          const row = [];
          for (;;) {
            ws();
            if (src[i] === "'" || src[i] === '"') {
              const q = src[i++]; let v = '';
              while (i < src.length) {
                if (src[i] === '\\') { v += { n: '\n', t: '\t', 0: '' }[src[i + 1]] ?? src[i + 1]; i += 2; continue; }
                if (src[i] === q) { if (src[i + 1] === q) { v += q; i += 2; continue; } i++; break; }
                v += src[i++];
              }
              row.push(v);
            } else { const w = src.slice(i).match(/^[^,)]*/)[0]; i += w.length; const t = w.trim(); row.push(/^null$/i.test(t) ? null : t !== '' && Number.isFinite(+t) ? +t : t); }
            ws();
            if (src[i] === ',') { i++; continue; }
            if (src[i] === ')') i++;
            break;
          }
          rows.push(row); ws();
          if (src[i] === ',') { i++; continue; }
          break;
        }
        out.push({ table: m[1].toLowerCase(), cols, rows });
        re.lastIndex = Math.max(i, re.lastIndex);
      }
      return out;
    };

    /* ---------------------------------- état ---------------------------------- */
    const ITEM = { name: '', label: '', weight: 100, type: 'item', stack: true, close: true, useable: false, unique: false, image: '', ammo: '', description: '' };
    const DEF = {
      items: [
        { ...ITEM, name: 'burger', label: 'Burger', weight: 220, useable: true, description: 'Un bon burger bien gras' },
        { ...ITEM, name: 'water', label: 'Bouteille d’eau', weight: 500, useable: true },
        { ...ITEM, name: 'phone', label: 'Téléphone', weight: 190, stack: false, unique: true, useable: true },
      ],
      tab: 'ox', wrap: false, qbStyle: 'new', esxUnit: 'kg', esxMode: 'ignore', rare: false, canRemove: true, importText: '',
    };
    const s = F.clone(DEF);
    const norm = (it) => {
      const o = { ...ITEM };
      for (const k of Object.keys(ITEM)) if (it && it[k] != null) o[k] = typeof ITEM[k] === 'boolean' ? !!it[k] : typeof ITEM[k] === 'number' ? (it[k] !== '' && Number.isFinite(+it[k]) ? +it[k] : ITEM[k]) : String(it[k]);
      if (o.type !== 'weapon') o.type = 'item';
      return o;
    };

    root.append(F.h(`<div class="stack">
      <div class="panel"><div class="panel-head"><h3>Items <span class="muted small it-count"></span></h3>
        <button class="btn sm" data-a="add">${F.icon('plus')}Ajouter un item</button></div>
        <div class="it-table"></div>
        <p class="muted small" style="margin-top:10px">Poids en grammes (ox_inventory et QBCore). « Unique » (QBCore) = non empilable (ox_inventory) : les deux cases sont liées.</p></div>
      <div class="split">
        <div class="stack">
          <div class="panel"><div class="panel-head"><h3>Importer / convertir</h3></div>
            <p class="muted small" style="margin-bottom:10px">Colle un bloc <b>ox_inventory</b> (data/items.lua ou weapons.lua), <b>QBCore</b> (shared/items.lua, ancien ou nouveau format), un <b>INSERT INTO items</b> ESX, ou des lignes <code>nom;label;poids</code>.</p>
            <div class="f-import"></div>
            <div class="row" style="margin-top:10px"><button class="btn primary sm" data-a="imp-add">${F.icon('upload')}Ajouter / fusionner</button><button class="btn sm" data-a="imp-rep">Remplacer la liste</button><span class="muted small imp-msg"></span></div></div>
          <div class="panel"><div class="panel-head"><h3>Options d’export</h3></div><div class="grid-fields f-opts"></div></div>
        </div>
        <div class="stack sticky res"></div>
      </div></div>`));

    /* ------------------------------ tableau d'items ------------------------------ */
    const COLS = [
      { key: 'name', label: 'Nom technique', w: 120, ph: 'burger' }, { key: 'label', label: 'Label', w: 130 },
      { key: 'weight', label: 'Poids (g)', type: 'number', w: 70 }, { key: 'type', label: 'Type', type: 'select', options: ['item', 'weapon'] },
      { key: 'stack', label: 'Stack', type: 'check' }, { key: 'close', label: 'Fermer', type: 'check' }, { key: 'useable', label: 'Utilisable', type: 'check' }, { key: 'unique', label: 'Unique', type: 'check' },
      { key: 'image', label: 'Image', w: 110, ph: 'nom.png' }, { key: 'ammo', label: 'Munition', w: 100, ph: 'armes' }, { key: 'description', label: 'Description', w: 180 },
    ];
    const tableBox = F.$('.it-table', root);
    const cell = (c, v, r) => {
      if (c.type === 'check') return `<input type="checkbox" data-k="${c.key}"${v ? ' checked' : ''}>`;
      if (c.type === 'select') return `<select data-k="${c.key}" style="min-width:86px">${c.options.map((o) => `<option${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
      const ph = c.key === 'image' ? (r.name ? r.name + '.png' : '') : c.key === 'ammo' ? (r.type === 'weapon' ? 'AMMO_PISTOL' : '') : c.ph || '';
      return `<input ${c.type === 'number' ? 'type="number" step="any" min="0"' : ''} data-k="${c.key}" value="${F.esc(v)}" placeholder="${F.esc(ph)}" style="min-width:${c.w || 60}px">`;
    };
    const drawTable = () => {
      F.$('.it-count', root).textContent = `(${s.items.length})`;
      tableBox.innerHTML = `<div class="table-wrap"><table class="table"><thead><tr>${COLS.map((c) => `<th>${c.label}</th>`).join('')}<th></th></tr></thead><tbody>${s.items.map((r, i) => `<tr data-i="${i}">${COLS.map((c) => `<td>${cell(c, r[c.key], r)}</td>`).join('')}
        <td class="actions"><button class="btn sm ghost" data-a="dup" title="Dupliquer">${F.icon('copy')}</button><button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></td></tr>`).join('')
        || `<tr><td colspan="${COLS.length + 1}" class="empty">Aucun item : ajoute-en un ou importe une liste</td></tr>`}</tbody></table></div>`;
    };
    const onCell = (e) => {
      const k = e.target.dataset.k, tr = e.target.closest('tr[data-i]');
      if (!k || !tr) return;
      const it = s.items[tr.dataset.i], el = e.target;
      it[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) || 0 : el.value;
      if (k === 'unique' && it.unique) it.stack = false;
      if (k === 'stack' && it.stack) it.unique = false;
      if (k === 'type' && it.type === 'weapon') { it.unique = true; it.stack = false; }
      if (['unique', 'stack', 'type', 'name'].includes(k) && e.type === 'change') drawTable();
      render();
    };
    tableBox.addEventListener('input', onCell);
    tableBox.addEventListener('change', onCell);

    /* --------------------------------- import --------------------------------- */
    const refreshers = [F.fields(F.$('.f-import', root), [{ key: 'importText', label: 'Texte à importer', type: 'textarea', rows: 7, wide: true, placeholder: "['burger'] = { label = 'Burger', weight = 220, stack = true, close = true },\n-- ou\nburger = { name = 'burger', label = 'Burger', weight = 220, type = 'item', ... },\n-- ou\nINSERT INTO items (name, label, weight) VALUES ('burger', 'Burger', 1);" }], s)];
    const fromLua = (name, o) => {
      const qb = ['shouldClose', 'useable', 'unique', 'type', 'image', 'ammotype'].some((k) => k in o) && !('stack' in o) && !('client' in o);
      const weapon = o.type === 'weapon' || /^weapon_/i.test(name);
      if (qb) return { name, label: o.label, weight: o.weight, type: weapon ? 'weapon' : 'item', unique: !!o.unique, stack: !o.unique, close: o.shouldClose !== false, useable: !!o.useable, image: o.image === name + '.png' ? '' : o.image, ammo: o.ammotype, description: o.description };
      const c = o.client && typeof o.client === 'object' ? o.client : {};
      const stack = weapon ? false : o.stack !== false;
      return { name, label: o.label, weight: o.weight, type: weapon ? 'weapon' : 'item', stack, unique: !stack, close: o.close !== false, useable: !!(o.consume != null || c.export || c.event || c.status || c.usetime || c.anim || o.server), image: c.image && c.image !== name + '.png' ? c.image : '', ammo: o.ammoname, description: o.description };
    };
    const parseImport = (txt) => {
      const sql = sqlInserts(txt).filter((q) => /items?$/.test(q.table));
      if (sql.length) {
        const mult = s.esxUnit === 'kg' ? 1000 : 1, list = [];
        for (const q of sql) {
          const cols = q.cols || ['name', 'label', 'weight', 'rare', 'can_remove'];
          for (const r of q.rows) { const o = Object.fromEntries(cols.map((c, i) => [c, r[i]])); if (o.name) list.push({ name: o.name, label: o.label || o.name, weight: Math.round((Number(o.weight) || 0) * mult) }); }
        }
        return { list, fmt: 'SQL ESX' };
      }
      const roots = luaParse(txt), list = [];
      const walk = (o, key, depth) => {
        if (!o || typeof o !== 'object' || depth > 6) return;
        const name = typeof o.name === 'string' ? o.name : typeof key === 'string' && !/^\d+$/.test(key) ? key : null;
        if (name && typeof o.label === 'string') { list.push(fromLua(name, o)); return; }
        for (const [k, v] of Object.entries(o)) walk(v, k, depth + 1);
      };
      roots.forEach((r) => walk(r, null, 0));
      if (list.length) return { list, fmt: 'Lua' };
      for (const l of txt.split(/\r?\n/)) {
        const p = l.split(/[;\t,|]/).map((x) => x.trim());
        if (/^[\w-]+$/.test(p[0] || '')) list.push({ name: p[0], label: p[1] || p[0], weight: Number(p[2]) || ITEM.weight });
      }
      return { list, fmt: 'lignes' };
    };
    const doImport = (replace) => {
      try {
        const { list, fmt } = parseImport(s.importText || '');
        if (!list.length) { F.$('.imp-msg', root).textContent = ''; return F.toast('Aucun item reconnu dans ce texte', 'error'); }
        const items = list.map(norm);
        if (replace) s.items = items;
        else for (const it of items) { const i = s.items.findIndex((x) => x.name === it.name); if (i >= 0) s.items[i] = it; else s.items.push(it); }
        F.$('.imp-msg', root).textContent = `${items.length} item(s) importé(s) — format ${fmt}`;
        drawTable(); render();
      } catch (e) { F.toast('Import impossible : ' + e.message, 'error'); }
    };

    /* --------------------------------- exports --------------------------------- */
    refreshers.push(F.fields(F.$('.f-opts', root), [
      { key: 'wrap', label: 'Fichier complet (table englobante)', type: 'checkbox', wide: true, hint: 'Sinon : seulement les entrées, à coller dans le fichier existant.' },
      { key: 'qbStyle', label: 'Format QBCore', type: 'select', options: [['new', "Nouveau (name = 'x')"], ['old', "Ancien (['name'] = 'x')"]] },
      { key: 'esxUnit', label: 'Poids ESX', type: 'select', options: [['kg', 'kg (÷ 1000, ESX par défaut)'], ['g', 'grammes (tel quel)']], hint: 'ESX legacy compte les poids en unités entières (Config.MaxWeight = 24 par défaut). Sert aussi à l’import SQL.' },
      { key: 'esxMode', label: 'Requête ESX', type: 'select', options: [['insert', 'INSERT'], ['ignore', 'INSERT IGNORE (ignore les doublons)'], ['update', 'ON DUPLICATE KEY UPDATE']] },
      { key: 'rare', label: 'ESX : rare', type: 'checkbox' },
      { key: 'canRemove', label: 'ESX : can_remove', type: 'checkbox' },
    ], s, () => render()));

    const valid = () => s.items.filter((it) => it.name.trim());
    const L = F.luaStr, N = (n) => F.short(Math.max(0, Number(n) || 0));
    const ind = (txt, wrap) => (wrap ? txt.replace(/^(?=.)/gm, '    ') : txt);
    function oxOut() {
      const items = valid().filter((it) => it.type !== 'weapon');
      const entry = (it) => {
        const f = [`label = ${L(it.label || it.name)}`, `weight = ${N(it.weight)}`, `stack = ${it.stack && !it.unique}`, `close = ${it.close}`];
        if (it.description) f.push(`description = ${L(it.description)}`);
        if (it.image && it.image !== it.name + '.png') f.push(`client = { image = ${L(it.image)} }`);
        return `[${L(it.name.trim())}] = {\n${f.map((x) => '    ' + x + ',').join('\n')}\n},`;
      };
      const txt = items.length ? (s.wrap ? '-- ox_inventory/data/items.lua\nreturn {\n' : '-- À coller dans ox_inventory/data/items.lua\n') + ind(items.map(entry).join('\n\n'), s.wrap) + (s.wrap ? '\n}\n' : '\n') : '';
      return txt || '-- Aucun item (les armes sont dans le bloc weapons.lua)';
    }
    function oxWeapons() {
      const w = valid().filter((it) => it.type === 'weapon').map((it) => `[${L(it.name.trim().toUpperCase())}] = {\n    label = ${L(it.label || it.name)},\n    weight = ${N(it.weight)},\n    durability = 0.1,${it.ammo ? `\n    ammoname = ${L(it.ammo)},` : ''}\n},`);
      return w.length ? `-- À coller dans ox_inventory/data/weapons.lua, table Weapons\n${w.join('\n\n')}\n` : '';
    }
    function qbOut() {
      const k = (key) => (s.qbStyle === 'old' ? `[${L(key)}]` : key);
      const entry = (it) => {
        const w = it.type === 'weapon', name = w ? it.name.trim().toLowerCase() : it.name.trim();
        const f = [[k('name'), L(name)], [k('label'), L(it.label || name)], [k('weight'), N(it.weight)], [k('type'), L(it.type)]];
        if (w) f.push([k('ammotype'), it.ammo ? L(it.ammo) : 'nil']);
        f.push([k('image'), L(it.image || name + '.png')], [k('unique'), String(w || it.unique || !it.stack)], [k('useable'), String(it.useable)]);
        if (!w) f.push([k('shouldClose'), String(it.close)], [k('combinable'), 'nil']);
        f.push([k('description'), L(it.description)]);
        return `[${L(name)}] = { ${f.map(([a, b]) => `${a} = ${b}`).join(', ')} },`;
      };
      const body = valid().map(entry).join('\n');
      if (!body) return '-- Aucun item';
      return s.wrap ? `-- qb-core/shared/items.lua\nQBShared = QBShared or {}\nQBShared.Items = {\n${ind(body, true)}\n}\n` : `-- À coller dans qb-core/shared/items.lua (table QBShared.Items)\n${body}\n`;
    }
    function esxOut() {
      const items = valid().filter((it) => it.type !== 'weapon');
      if (!items.length) return '-- Aucun item (les armes ne sont pas des items sous ESX)';
      const w = (g) => (s.esxUnit === 'kg' ? (g > 0 ? Math.max(1, Math.round(g / 1000)) : 0) : Math.round(g));
      const rows = items.map((it) => `  (${F.sqlStr(it.name.trim())}, ${F.sqlStr(it.label || it.name)}, ${w(Number(it.weight) || 0)}, ${s.rare ? 1 : 0}, ${s.canRemove ? 1 : 0})`);
      let q = `-- ESX legacy : table items (name, label, weight, rare, can_remove)\nINSERT${s.esxMode === 'ignore' ? ' IGNORE' : ''} INTO \`items\` (\`name\`, \`label\`, \`weight\`, \`rare\`, \`can_remove\`) VALUES\n${rows.join(',\n')}`;
      if (s.esxMode === 'update') q += '\nON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `weight` = VALUES(`weight`), `rare` = VALUES(`rare`), `can_remove` = VALUES(`can_remove`)';
      return q + ';\n';
    }
    const OUTS = {
      ox: { label: 'ox_inventory', file: 'items.lua', lang: 'lua', fn: oxOut },
      qb: { label: 'QBCore', file: 'items.lua', lang: 'lua', fn: qbOut },
      esx: { label: 'ESX (SQL)', file: 'items.sql', lang: 'sql', fn: esxOut },
    };
    const res = F.$('.res', root);
    const out = F.output({ title: '', filename: () => OUTS[s.tab].file, lang: 'lua' });
    const out2 = F.output({ title: 'weapons.lua', filename: 'weapons.lua', lang: 'lua' });
    const warnBox = F.h('<div class="stack"></div>');
    const tabs = F.tabs(Object.entries(OUTS).map(([id, o]) => ({ id, label: o.label })), (id) => { s.tab = id; render(); });
    res.append(tabs.el, warnBox, out.el, out2.el);

    function warnings() {
      const w = [], names = valid().map((it) => it.name.trim()), dup = names.filter((n, i) => names.indexOf(n) !== i);
      if (dup.length) w.push(`Noms en double : ${[...new Set(dup)].join(', ')}`);
      const bad = names.filter((n) => !/^[A-Za-z0-9_-]+$/.test(n));
      if (bad.length) w.push(`Caractères à éviter dans : ${bad.join(', ')} (lettres, chiffres, _ et - seulement)`);
      if (s.items.length !== names.length) w.push('Les lignes sans nom technique sont ignorées.');
      if (s.tab === 'esx' && s.esxUnit === 'kg' && valid().some((it) => it.weight > 0 && it.weight < 500)) w.push('Poids ESX en kg : les items de moins de 500 g sont arrondis à 1.');
      if (s.tab !== 'esx' && valid().some((it) => it.type === 'weapon' && it.ammo)) w.push('Munitions : les noms diffèrent selon l’inventaire (ox : ammo-9, QBCore : AMMO_PISTOL), vérifie la colonne « Munition ».');
      if (s.tab === 'esx' && valid().some((it) => it.type === 'weapon')) w.push('ESX : les armes (type weapon) ne vont pas dans la table items, elles sont ignorées.');
      if (s.tab === 'ox' && valid().some((it) => it.useable)) w.push('ox_inventory : « utilisable » n’a pas de champ dédié ; ajoute client.export / consume ou ESX.RegisterUsableItem selon ton script.');
      return w;
    }
    function render() {
      const o = OUTS[s.tab] || OUTS.ox;
      out.set(o.fn());
      out.setTitle(o.file);
      F.$('pre', out.el).className = 'code lang-' + o.lang;
      const wp = s.tab === 'ox' ? oxWeapons() : '';
      out2.set(wp); out2.el.hidden = !wp;
      warnBox.innerHTML = warnings().map((x) => `<div class="note warn">${F.esc(x)}</div>`).join('');
    }

    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const tr = b.closest('tr[data-i]'), a = b.dataset.a;
      if (a === 'add') s.items.push({ ...ITEM, name: 'item_' + (s.items.length + 1), label: 'Nouvel item' });
      else if (a === 'dup' && tr) { const it = s.items[tr.dataset.i]; s.items.splice(+tr.dataset.i + 1, 0, { ...it, name: it.name + '_copie' }); }
      else if (a === 'del' && tr) s.items.splice(+tr.dataset.i, 1);
      else if (a === 'imp-add' || a === 'imp-rep') return doImport(a === 'imp-rep');
      else return;
      drawTable(); render();
    });

    drawTable(); tabs.select(s.tab);
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v || {});
        s.items = Array.isArray(s.items) ? s.items.filter((x) => x && typeof x === 'object').map(norm) : [];
        if (!OUTS[s.tab]) s.tab = 'ox';
        refreshers.forEach((r) => r.refresh()); drawTable(); tabs.select(s.tab);
      },
    };
  },
});
