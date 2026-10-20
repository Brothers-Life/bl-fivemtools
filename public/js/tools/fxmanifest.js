'use strict';
// Générateur de fxmanifest.lua (scripts, NUI, data_file, loadscreen…) + squelette de ressource en .zip.
Forge.register({
  id: 'fxmanifest',
  cat: 'scripts',
  name: 'Générateur fxmanifest.lua',
  desc: 'fxmanifest complet (scripts, NUI, dépendances, data_file, loadscreen) et squelette de ressource prêt à zipper.',
  tags: ['fxmanifest', 'manifest', 'ressource', 'resource', 'lua54', 'nui', 'ui_page', 'data_file', 'escrow', 'loadscreen', 'squelette'],
  icon: 'file',
  mount(root, F) {
    const DATA_TYPES = ['HANDLING_FILE', 'VEHICLE_METADATA_FILE', 'CARCOLS_FILE', 'VEHICLE_VARIATION_FILE', 'VEHICLE_LAYOUTS_FILE', 'DLC_ITYP_REQUEST',
      'WEAPONINFO_FILE', 'WEAPON_METADATA_FILE', 'WEAPON_ANIMATIONS_FILE', 'PED_METADATA_FILE', 'CONTENT_UNLOCKING_META_FILE', 'DLCTEXT_FILE',
      'AUDIO_GAMEDATA', 'AUDIO_SOUNDDATA', 'AUDIO_WAVEPACK', 'AUDIO_SYNTHDATA', 'SCALEFORM_DLC_FILE', 'TIMECYCLEMOD_FILE', 'GTXD_PARENTING_DATA', 'EXPLOSION_INFO_FILE'];
    const PRESETS = [
      { list: 'shared', path: '@ox_lib/init.lua', label: 'ox_lib', dep: 'ox_lib' },
      { list: 'shared', path: '@es_extended/imports.lua', label: 'ESX imports', dep: 'es_extended' },
      { list: 'shared', path: '@qb-core/shared/locale.lua', label: 'QBCore locale', dep: 'qb-core' },
      { list: 'server', path: '@oxmysql/lib/MySQL.lua', label: 'oxmysql', dep: 'oxmysql' },
    ];
    const DEF = {
      resource: 'ma_ressource', fx: 'cerulean', gta5: true, rdr3: false, lua54: true,
      author: '', description: '', version: '1.0.0',
      shared: 'config.lua', client: 'client/main.lua', server: 'server/main.lua',
      nui: false, uiPage: 'html/index.html', files: '',
      deps: '', provide: '', dataFiles: [], dataInFiles: true,
      map: false, escrow: '', loadscreen: false, lsPage: 'html/index.html', lsShutdown: false, lsCursor: false,
    };
    const s = F.clone(DEF);
    const lines = (t) => String(t || '').split(/[\r\n,]+/).map((l) => l.trim().replace(/^['"]|['"],?$/g, '')).filter(Boolean);
    const uniq = (a) => [...new Set(a)];

    root.append(F.h(`<div class="split">
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Ressource</h3></div><div class="grid-fields f-meta"></div></div>
        <div class="panel"><div class="panel-head"><h3>Scripts</h3><span class="muted small">un chemin par ligne, globs autorisés (<code>client/*.lua</code>, <code>**/*.lua</code>)</span></div>
          <div class="row fx-presets" style="margin-bottom:12px"></div><div class="grid-fields f-scripts"></div></div>
        <div class="panel"><div class="panel-head"><h3>Interface NUI & fichiers</h3></div><div class="grid-fields f-nui"></div></div>
        <div class="panel"><div class="panel-head"><h3>data_file</h3><button class="btn sm" data-a="add-df">${F.icon('plus')}Ajouter</button></div>
          <div class="df"></div><div class="grid-fields f-df" style="margin-top:12px"></div></div>
        <div class="panel"><div class="panel-head"><h3>Dépendances & divers</h3></div><div class="grid-fields f-misc"></div></div>
      </div>
      <div class="stack sticky res">
        <div class="row"><button class="btn primary" data-a="zip">${F.icon('download')}Ressource de base (.zip)</button><span class="muted small">fxmanifest + fichiers listés avec un contenu de départ</span></div>
        <div class="warn-box"></div>
      </div></div>`));
    const out = F.output({ title: 'fxmanifest.lua', filename: 'fxmanifest.lua', lang: 'lua' });
    F.$('.res', root).append(out.el);

    const refreshers = [];
    const fields = (sel, defs) => refreshers.push(F.fields(F.$(sel, root), defs, s, render));
    fields('.f-meta', [
      { key: 'resource', label: 'Nom de la ressource (dossier)', placeholder: 'ma_ressource' },
      { key: 'fx', label: 'fx_version', type: 'select', options: [['cerulean', 'cerulean (actuel)'], ['bodacious', 'bodacious'], ['adamant', 'adamant']] },
      { key: 'version', label: 'Version', placeholder: '1.0.0' },
      { key: 'author', label: 'Auteur', placeholder: 'Brothers Life' },
      { key: 'description', label: 'Description', wide: true },
      { key: 'gta5', label: 'GTA V (gta5)', type: 'checkbox' },
      { key: 'rdr3', label: 'RedM (rdr3)', type: 'checkbox' },
      { key: 'lua54', label: "lua54 'yes'", type: 'checkbox', hint: 'Active Lua 5.4 (recommandé, requis par ox_lib).' },
    ]);
    fields('.f-scripts', [
      { key: 'shared', label: 'shared_scripts', type: 'textarea', rows: 3, wide: true },
      { key: 'client', label: 'client_scripts', type: 'textarea', rows: 3, wide: true },
      { key: 'server', label: 'server_scripts', type: 'textarea', rows: 3, wide: true },
    ]);
    fields('.f-nui', [
      { key: 'nui', label: 'Interface NUI (ui_page)', type: 'checkbox' },
      { key: 'uiPage', label: 'ui_page', placeholder: 'html/index.html' },
      { key: 'files', label: 'files (NUI, metas, images…)', type: 'textarea', rows: 4, wide: true, hint: 'Tous les fichiers chargés côté client hors scripts : NUI, .meta, images…' },
      { key: 'loadscreen', label: 'Écran de chargement (loadscreen)', type: 'checkbox' },
      { key: 'lsPage', label: 'loadscreen', placeholder: 'html/index.html' },
      { key: 'lsShutdown', label: "loadscreen_manual_shutdown 'yes'", type: 'checkbox', hint: 'L’écran reste affiché jusqu’à ShutdownLoadingScreenNui() côté client.' },
      { key: 'lsCursor', label: "loadscreen_cursor 'yes'", type: 'checkbox' },
    ]);
    fields('.f-df', [{ key: 'dataInFiles', label: 'Ajouter automatiquement les chemins data_file à files', type: 'checkbox', wide: true }]);
    fields('.f-misc', [
      { key: 'deps', label: 'dependencies', type: 'textarea', rows: 3, placeholder: 'oxmysql\nox_lib\n/onesync', hint: 'Ressources requises, ou contraintes comme /server:7290, /onesync.' },
      { key: 'provide', label: 'provide', type: 'textarea', rows: 3, placeholder: 'mysql-async', hint: 'Cette ressource remplace une autre (compatibilité).' },
      { key: 'escrow', label: 'escrow_ignore', type: 'textarea', rows: 3, placeholder: 'config.lua\nlocales/*.lua', hint: 'Fichiers laissés lisibles quand la ressource est protégée par Tebex/Escrow.' },
      { key: 'map', label: "this_is_a_map 'yes'", type: 'checkbox', hint: 'Pour une ressource de map (ymap/ytyp en stream).' },
    ]);

    // Presets d'imports courants (cases à cocher rapides).
    const presetBox = F.$('.fx-presets', root);
    const drawPresets = () => {
      presetBox.innerHTML = PRESETS.map((p, i) => `<button class="chip${lines(s[p.list]).includes(p.path) ? ' on' : ''}" data-p="${i}" title="${F.esc(p.list + '_scripts : ' + p.path)}">${F.esc(p.label)}</button>`).join('');
    };
    presetBox.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const p = PRESETS[b.dataset.p], cur = lines(s[p.list]);
      const has = cur.includes(p.path);
      s[p.list] = (has ? cur.filter((l) => l !== p.path) : [p.path, ...cur]).join('\n');
      const deps = lines(s.deps);
      if (!has && !deps.includes(p.dep)) s.deps = [...deps, p.dep].join('\n');
      if (has) s.deps = deps.filter((d) => d !== p.dep).join('\n');
      refreshers.forEach((r) => r.refresh()); render();
    });

    // Table des data_file.
    const dfBox = F.$('.df', root);
    const drawDf = () => {
      dfBox.innerHTML = s.dataFiles.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Type</th><th>Chemin</th><th></th></tr></thead><tbody>${s.dataFiles.map((d, i) => `<tr data-i="${i}">
        <td><select data-k="type" style="min-width:200px">${uniq([...DATA_TYPES, d.type]).map((t) => `<option${t === d.type ? ' selected' : ''}>${F.esc(t)}</option>`).join('')}</select></td>
        <td><input data-k="path" value="${F.esc(d.path)}" placeholder="data/handling.meta" style="min-width:160px"></td>
        <td class="actions"><button class="btn sm ghost" data-a="dup" title="Dupliquer">${F.icon('copy')}</button><button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty small">Aucun data_file (metas véhicules, armes, audio…)</div>';
    };
    dfBox.addEventListener('input', (e) => { const k = e.target.dataset.k, tr = e.target.closest('tr'); if (k && tr) { s.dataFiles[tr.dataset.i][k] = e.target.value; render(); } });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, tr = b.closest('tr[data-i]');
      if (a === 'add-df') s.dataFiles.push({ type: 'HANDLING_FILE', path: 'data/handling.meta' });
      else if (a === 'dup' && tr) s.dataFiles.splice(+tr.dataset.i + 1, 0, { ...s.dataFiles[tr.dataset.i] });
      else if (a === 'del' && tr) s.dataFiles.splice(+tr.dataset.i, 1);
      else if (a === 'zip') return makeZip();
      else return;
      drawDf(); render();
    });

    const allFiles = () => uniq([...lines(s.files), ...(s.dataInFiles ? s.dataFiles.map((d) => d.path.trim()).filter(Boolean) : [])]);
    const block = (key, arr) => (arr.length ? `${key} {\n${arr.map((l) => `    ${F.luaStr(l)},`).join('\n')}\n}\n` : '');

    function build() {
      const games = [s.gta5 && 'gta5', s.rdr3 && 'rdr3'].filter(Boolean);
      const L = [`fx_version ${F.luaStr(s.fx)}`];
      if (games.length === 1) L.push(`game ${F.luaStr(games[0])}`);
      else if (games.length) L.push(`games { ${games.map(F.luaStr).join(', ')} }`);
      if (s.rdr3) L.push("rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'");
      if (s.lua54) L.push("lua54 'yes'");
      L.push('');
      if (s.resource) L.push(`name ${F.luaStr(s.resource)}`);
      if (s.author) L.push(`author ${F.luaStr(s.author)}`);
      if (s.description) L.push(`description ${F.luaStr(s.description)}`);
      if (s.version) L.push(`version ${F.luaStr(s.version)}`);
      if (s.map) L.push("this_is_a_map 'yes'");
      let txt = L.join('\n').replace(/\n+$/, '') + '\n\n';
      const parts = [block('shared_scripts', lines(s.shared)), block('client_scripts', lines(s.client)), block('server_scripts', lines(s.server))];
      const ui = [];
      if (s.nui && s.uiPage) ui.push(`ui_page ${F.luaStr(s.uiPage)}`);
      if (s.loadscreen && s.lsPage) {
        ui.push(`loadscreen ${F.luaStr(s.lsPage)}`);
        if (s.lsShutdown) ui.push("loadscreen_manual_shutdown 'yes'");
        if (s.lsCursor) ui.push("loadscreen_cursor 'yes'");
      }
      if (ui.length) parts.push(ui.join('\n') + '\n');
      parts.push(block('files', allFiles()));
      const df = s.dataFiles.filter((d) => d.type && d.path.trim()).map((d) => `data_file ${F.luaStr(d.type)} ${F.luaStr(d.path.trim())}`);
      if (df.length) parts.push(df.join('\n') + '\n');
      parts.push(block('dependencies', lines(s.deps)));
      const prov = lines(s.provide);
      if (prov.length) parts.push(prov.map((p) => `provide ${F.luaStr(p)}`).join('\n') + '\n');
      parts.push(block('escrow_ignore', lines(s.escrow)));
      return txt + parts.filter(Boolean).join('\n');
    }

    function warnings() {
      const w = [];
      if (!s.gta5 && !s.rdr3) w.push('Aucun jeu coché : FiveM exige game \'gta5\' (ou rdr3 pour RedM).');
      if (/[^a-zA-Z0-9_-]/.test(s.resource)) w.push('Le nom de ressource ne devrait contenir que lettres, chiffres, _ et -.');
      const f = allFiles();
      if (s.nui && s.uiPage && !f.includes(s.uiPage)) w.push(`ui_page « ${s.uiPage} » n’est pas dans files : la page ne sera pas envoyée aux clients.`);
      if (s.loadscreen && s.lsPage && !f.includes(s.lsPage)) w.push(`loadscreen « ${s.lsPage} » n’est pas dans files.`);
      if (lines(s.shared).concat(lines(s.client), lines(s.server)).some((l) => l.startsWith('@ox_lib')) && !s.lua54) w.push('ox_lib nécessite lua54 \'yes\'.');
      return w;
    }

    function render(key, v) {
      // Cocher NUI / loadscreen remplit files avec une page de départ si la liste est vide.
      if ((key === 'nui' || key === 'loadscreen') && v && !lines(s.files).length) { s.files = 'html/index.html\nhtml/style.css\nhtml/script.js'; refreshers.forEach((r) => r.refresh()); }
      out.set(build());
      out.setTitle(`${s.resource || 'ressource'}/fxmanifest.lua`);
      drawPresets();
      F.$('.warn-box', root).innerHTML = warnings().map((w) => `<div class="note warn">${F.esc(w)}</div>`).join('');
    }

    // Contenus de départ du squelette.
    const tpl = (path) => {
      const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase();
      const res = s.resource || 'ma_ressource';
      const has = (p) => allFiles().includes(p);
      if (/(^|\/)config\.lua$/.test(path)) return "Config = {}\n\nConfig.Debug = false\n";
      if (ext === 'lua' && /(^|\/)client\//.test(path)) return `-- ${res} : côté client\n\nCreateThread(function()\n    if Config and Config.Debug then print('[${res}] client démarré') end\nend)\n${s.nui ? `
local open = false

local function setOpen(state)
    open = state
    SetNuiFocus(state, state)
    SendNUIMessage({ action = state and 'open' or 'close' })
end

RegisterCommand('${res.replace(/[^a-zA-Z0-9_]/g, '_')}', function() setOpen(not open) end, false)

RegisterNUICallback('close', function(_, cb)
    setOpen(false)
    cb('ok')
end)
` : ''}${s.loadscreen && s.lsShutdown ? "\n-- Ferme l'écran de chargement quand le joueur est prêt\nAddEventHandler('playerSpawned', function()\n    ShutdownLoadingScreenNui()\nend)\n" : ''}`;
      if (ext === 'lua' && /(^|\/)server\//.test(path)) return `-- ${res} : côté serveur\n\nAddEventHandler('onResourceStart', function(resource)\n    if resource ~= GetCurrentResourceName() then return end\n    print(('[%s] démarré'):format(resource))\nend)\n`;
      if (ext === 'lua') return `-- ${res} : ${path}\n`;
      if (ext === 'html') return `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<title>${F.esc(res)}</title>\n${['style.css', 'script.js'].map((n) => path.replace(/[^/]+$/, n)).filter(has).map((p, i) => { const rel = p.split('/').pop(); return i === 0 && rel.endsWith('.css') ? `<link rel="stylesheet" href="${rel}">` : `<script src="${rel}" defer></script>`; }).join('\n')}\n</head>\n<body>\n<div id="app" ${s.loadscreen && path === s.lsPage ? '' : 'hidden'}>\n  <h1>${F.esc(res)}</h1>\n</div>\n</body>\n</html>\n`;
      if (ext === 'css') return 'html, body { margin: 0; background: transparent; font-family: sans-serif; color: #fff; }\n#app { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 24px; border-radius: 12px; background: rgba(0, 0, 0, .7); }\n';
      if (ext === 'js') return "const app = document.getElementById('app');\n\nwindow.addEventListener('message', (e) => {\n  if (e.data.action === 'open') app.hidden = false;\n  if (e.data.action === 'close') app.hidden = true;\n});\n\ndocument.addEventListener('keydown', (e) => {\n  if (e.key === 'Escape') fetch(`https://${GetParentResourceName()}/close`, { method: 'POST', body: '{}' });\n});\n";
      if (ext === 'json') return '{}\n';
      if (ext === 'meta' || ext === 'xml') return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- À remplacer par le vrai fichier -->\n';
      return null;
    };
    function makeZip() {
      try {
        const res = F.slug(s.resource, '_') || 'ma_ressource';
        const paths = new Set();
        const add = (p) => {
          if (!p || p.startsWith('@') || p.startsWith('/') || p.includes('..')) return;
          const g = p.match(/^(.*?)\/?\*\*?\/?(?:\*\*\/)?\*?\.([a-z0-9]+)$/i); // client/*.lua → client/main.lua
          if (g) { const dir = g[1] ? g[1] + '/' : ''; if (![...paths].some((x) => x.startsWith(dir) && x.endsWith('.' + g[2]))) paths.add(dir + 'main.' + g[2]); return; }
          if (!p.includes('*')) paths.add(p);
        };
        [...lines(s.shared), ...lines(s.client), ...lines(s.server)].forEach(add);
        if (s.nui) add(s.uiPage);
        if (s.loadscreen) add(s.lsPage);
        allFiles().forEach(add);
        const files = [{ name: `${res}/fxmanifest.lua`, data: build() }];
        for (const p of paths) { const c = tpl(p); if (c != null) files.push({ name: `${res}/${p}`, data: c }); }
        F.download(res + '.zip', F.zip(files));
        F.toast(`${files.length} fichiers dans ${res}.zip`);
      } catch (e) { F.toast('Impossible de créer le zip : ' + e.message, 'error'); }
    }

    drawDf(); render();
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v || {});
        s.dataFiles = Array.isArray(s.dataFiles) ? s.dataFiles.filter((d) => d && typeof d === 'object').map((d) => ({ type: String(d.type || 'HANDLING_FILE'), path: String(d.path || '') })) : [];
        refreshers.forEach((r) => r.refresh()); drawDf(); render();
      },
    };
  },
});
