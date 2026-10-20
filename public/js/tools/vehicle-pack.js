'use strict';
// Créateur de pack véhicules addon : metas + fichiers stream lus localement → ressource FiveM en .zip (fxmanifest, data_file, noms affichés).
Forge.register({
  id: 'vehicle-pack',
  cat: 'vehicules',
  name: 'Créateur de pack véhicules',
  desc: 'Assemble une ressource FiveM de véhicules addon : metas, fichiers .yft/.ytd, fxmanifest et noms, dans un .zip prêt à l’emploi.',
  tags: ['pack', 'addon', 'ressource', 'fxmanifest', 'data_file', 'stream', 'yft', 'ytd', 'zip'],
  icon: 'box',
  mount(root, F) {
    const X = F.xml;
    // [clé, fichier, data_file, balise racine] — dans l'ordre de chargement conseillé.
    const METAS = [
      ['layouts', 'vehiclelayouts.meta', 'VEHICLE_LAYOUTS_FILE', 'CVehicleMetadataMgr'],
      ['handling', 'handling.meta', 'HANDLING_FILE', 'CHandlingDataMgr'],
      ['vehicles', 'vehicles.meta', 'VEHICLE_METADATA_FILE', 'CVehicleModelInfo__InitDataList'],
      ['carcols', 'carcols.meta', 'CARCOLS_FILE', 'CVehicleModelInfoVarGlobal'],
      ['carvariations', 'carvariations.meta', 'VEHICLE_VARIATION_FILE', 'CVehicleModelInfoVariation'],
    ];
    const STREAM = /\.(yft|ytd|ydr|ydd|ybn|ycd)$/i;
    const MAX = 16 * 1024 * 1024;
    const emptyMetas = () => Object.fromEntries(METAS.map(([k]) => [k, '']));
    const newVeh = (n = 1) => ({ id: F.uid(), model: n > 1 ? 'mycar' + n : 'mycar', label: n > 1 ? '' : 'Ma voiture', brand: '', gameName: '', makeName: '', metas: emptyMetas(), stream: [] });
    const s = { resource: 'mes_vehicules', author: '', version: '1.0.0', layout: 'dossiers', vehicles: [newVeh()] };
    const files = new Map(); // id → [File] (jamais sauvegardés ni envoyés)
    const tabOf = new Map();
    const R = () => F.slug(s.resource, '_') || 'mes_vehicules';
    const brandKey = (b) => F.slug(b).replace(/[_-]/g, ''); // F.slug(x, '') lève une erreur (séparateur vide)
    const mb = (n) => (n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' Ko' : (n / 1048576).toFixed(1) + ' Mo');

    root.append(F.h(`<div class="split wide-left">
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Ressource</h3></div><div class="grid-fields res"></div></div>
        <div class="note">Les fichiers .yft / .ytd sont lus <b>uniquement dans ton navigateur</b> pour créer le .zip : rien n’est envoyé au serveur.
          Ils ne sont pas gardés dans le projet sauvegardé (seulement leurs noms) : après un rechargement, il faudra les ré-ajouter.</div>
        <div class="vehs stack"></div>
        <button class="btn" data-a="add">${F.icon('plus')}Ajouter un véhicule</button>
      </div>
      <div class="stack sticky side">
        <div class="panel stack"><div class="panel-head"><h3>Arborescence</h3><button class="btn primary" data-a="zip">${F.icon('download')}Télécharger le .zip</button></div>
          <div class="warns stack"></div><pre class="code tree" style="max-height:300px"></pre></div>
      </div></div>`));
    const outM = F.output({ title: 'fxmanifest.lua', filename: 'fxmanifest.lua', lang: 'lua' });
    const outN = F.output({ title: 'vehicle_names.lua', filename: 'vehicle_names.lua', lang: 'lua' });
    F.$('.side', root).append(outM.el, outN.el);
    const resRefresh = F.fields(F.$('.res', root), [
      { key: 'resource', label: 'Nom de la ressource', hint: 'Nom du dossier dans resources/ (minuscules, chiffres, _ et -). À mettre dans server.cfg : ensure <nom>.' },
      { key: 'author', label: 'Auteur', placeholder: 'facultatif' },
      { key: 'version', label: 'Version' },
      { key: 'layout', label: 'Organisation des fichiers', type: 'select', options: [['dossiers', 'Un dossier par véhicule'], ['plat', 'Tout à plat (data/, stream/)']], hint: 'Un dossier par véhicule est plus lisible ; à plat, les metas sont préfixés par le nom du modèle.' },
    ], s, () => renderSide()).refresh;

    // ---------- analyse ----------
    const parsed = (v, k) => { const t = v.metas[k]; if (!t.trim()) return null; try { return X.parse(t); } catch (e) { return e; } };
    const detect = (v) => {
      const d = parsed(v, 'vehicles');
      if (!d || d instanceof Error) return {};
      const items = [...d.getElementsByTagName('InitDatas')[0]?.children || []];
      const it = items.find((i) => (X.val(i, 'modelName') || '').toLowerCase() === v.model.toLowerCase()) || items[0];
      return it ? { game: X.val(it, 'gameName') || '', make: X.val(it, 'vehicleMakeName') || '', model: X.val(it, 'modelName') || '' } : {};
    };
    const keys = (v) => { const d = detect(v); return { game: (v.gameName || d.game || v.model).toUpperCase(), make: (v.makeName || d.make || brandKey(v.brand)).toUpperCase() }; };
    const metaPath = (v, file) => (s.layout === 'plat' ? `data/${F.slug(v.model) || 'vehicule'}_${file}` : `data/${F.slug(v.model) || 'vehicule'}/${file}`);
    const streamPath = (v, name) => (s.layout === 'plat' ? `stream/${name}` : `stream/${F.slug(v.model) || 'vehicule'}/${name}`);
    const metaList = () => s.vehicles.flatMap((v) => METAS.filter(([k]) => v.metas[k].trim()).map(([k, file, df]) => ({ v, k, df, path: metaPath(v, file) })));

    const manifest = () => {
      const m = metaList(), byType = METAS.map(([k, , df]) => m.filter((x) => x.k === k).map((x) => `data_file '${df}' '${x.path}'`)).flat();
      return [
        "fx_version 'cerulean'", "game 'gta5'", '',
        s.author.trim() ? `author ${F.luaStr(s.author.trim())}` : null,
        `description ${F.luaStr(`Pack véhicules addon (${s.vehicles.length}) — généré avec BL Forge`)}`,
        `version ${F.luaStr(s.version || '1.0.0')}`, '',
        m.length ? `files {\n${m.map((x) => `    '${x.path}',`).join('\n')}\n}\n` : null,
        ...byType, byType.length ? '' : null,
        "client_script 'vehicle_names.lua'", '',
      ].filter((l) => l !== null).join('\n');
    };
    const names = () => {
      const seen = new Set(), lines = [];
      for (const v of s.vehicles) {
        const k = keys(v);
        if (v.label.trim() && !seen.has(k.game)) { seen.add(k.game); lines.push(`    AddTextEntry(${F.luaStr(k.game)}, ${F.luaStr(v.label.trim())})`); }
        if (v.brand.trim() && k.make && !seen.has(k.make)) { seen.add(k.make); lines.push(`    AddTextEntry(${F.luaStr(k.make)}, ${F.luaStr(v.brand.trim())})`); }
      }
      return `-- Noms affichés des véhicules (clé = gameName / vehicleMakeName du vehicles.meta)\nCitizen.CreateThread(function()\n${lines.join('\n') || '    -- aucun nom défini'}\nend)\n`;
    };
    const allPaths = () => [
      'fxmanifest.lua', 'vehicle_names.lua', ...metaList().map((x) => x.path),
      ...s.vehicles.flatMap((v) => (files.get(v.id) || []).map((f) => streamPath(v, f.name))),
    ];
    const tree = (paths) => {
      const t = {};
      for (const p of paths) p.split('/').reduce((n, part) => (n[part] = n[part] || {}), t);
      const out = [R() + '/'];
      const walk = (n, pre) => {
        const ks = Object.keys(n).sort((a, b) => (Object.keys(n[b]).length > 0) - (Object.keys(n[a]).length > 0) || a.localeCompare(b));
        ks.forEach((k, i) => { const last = i === ks.length - 1, dir = Object.keys(n[k]).length > 0; out.push(`${pre}${last ? '└── ' : '├── '}${k}${dir ? '/' : ''}`); if (dir) walk(n[k], pre + (last ? '    ' : '│   ')); });
      };
      walk(t, '');
      return out.join('\n');
    };
    const warnings = () => {
      const w = [], models = s.vehicles.map((v) => v.model.trim().toLowerCase());
      if (!/^[a-z0-9_-]+$/.test(s.resource)) w.push(['warn', `Le nom de ressource sera « ${R()} » (minuscules, chiffres, _ et - uniquement).`]);
      const dup = [...new Set(models.filter((m, i) => m && models.indexOf(m) !== i))];
      if (dup.length) w.push(['error', `Modèle en double : ${dup.join(', ')}.`]);
      const streamNames = s.vehicles.flatMap((v) => (files.get(v.id) || []).map((f) => streamPath(v, f.name).toLowerCase()));
      const sdup = [...new Set(streamNames.filter((n, i) => streamNames.indexOf(n) !== i))];
      if (sdup.length) w.push(['error', `Fichier stream en double : ${sdup.join(', ')}.`]);
      for (const v of s.vehicles) {
        const n = v.model || '(sans nom)';
        if (!v.model.trim()) w.push(['error', 'Un véhicule n’a pas de nom de modèle.']);
        for (const [k, file, , tag] of METAS) {
          const d = parsed(v, k);
          if (d instanceof Error) w.push(['error', `${n} / ${file} : ${d.message}`]);
          else if (d && d.documentElement.tagName !== tag) w.push(['warn', `${n} / ${file} : la racine est <${d.documentElement.tagName}>, attendu <${tag}>.`]);
        }
        if (!v.metas.vehicles.trim()) w.push(['warn', `${n} : pas de vehicles.meta, le véhicule ne pourra pas apparaître.`]);
        const fl = files.get(v.id) || [];
        const missing = v.stream.filter((x) => !fl.some((f) => f.name === x.name));
        if (missing.length) w.push(['warn', `${n} : ${missing.length} fichier(s) stream à ré-ajouter (${missing.map((x) => x.name).join(', ')}).`]);
        else if (!fl.length) w.push(['warn', `${n} : aucun fichier .yft / .ytd ajouté.`]);
        for (const f of fl) if (f.size > MAX) w.push(['warn', `${f.name} pèse ${mb(f.size)} (> 16 Mo) : FiveM risque d’afficher l’avertissement « oversized asset » et le modèle ou ses textures peuvent ne pas se charger. Réduis les textures.`]);
        const d = detect(v);
        if (d.model && d.model.toLowerCase() !== v.model.toLowerCase()) w.push(['warn', `${n} : le vehicles.meta déclare le modèle « ${d.model} ».`]);
      }
      return w;
    };
    const renderSide = F.debounce(() => {
      outM.set(manifest()); outN.set(names());
      F.$('.tree', root).textContent = tree(allPaths());
      F.$('.warns', root).innerHTML = warnings().map(([t, m]) => `<div class="note ${t}">${F.esc(m)}</div>`).join('');
    }, 150);

    // ---------- véhicules ----------
    const metaStatus = (v, k) => { const d = parsed(v, k); return d instanceof Error ? 'erreur' : d ? '✓' : ''; };
    const renderStream = (v, box) => {
      const fl = files.get(v.id) || [];
      const missing = v.stream.filter((x) => !fl.some((f) => f.name === x.name));
      box.innerHTML = fl.length || missing.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Fichier stream</th><th>Taille</th><th></th></tr></thead><tbody>
        ${fl.map((f, i) => `<tr><td><code>${F.esc(f.name)}</code>${f.size > MAX ? ' <span class="chip" style="color:var(--warn)">&gt; 16 Mo</span>' : ''}</td><td>${mb(f.size)}</td><td class="actions"><button class="btn sm ghost danger" data-rm="${i}">${F.icon('x')}</button></td></tr>`).join('')}
        ${missing.map((x) => `<tr><td><code>${F.esc(x.name)}</code> <span class="chip">à ré-ajouter</span></td><td class="muted">${mb(x.size || 0)}</td><td class="actions"><button class="btn sm ghost danger" data-rmm="${F.esc(x.name)}">${F.icon('x')}</button></td></tr>`).join('')}
        </tbody></table></div>` : '';
    };
    const syncStream = (v) => { v.stream = [...(files.get(v.id) || []).map((f) => ({ name: f.name, size: f.size })), ...v.stream.filter((x) => !(files.get(v.id) || []).some((f) => f.name === x.name))]; };

    const vehPanel = (v, idx) => {
      const p = F.h(`<div class="panel stack" data-id="${v.id}">
        <div class="panel-head"><h3>Véhicule ${idx + 1}</h3><button class="btn sm ghost danger" data-a="del">${F.icon('trash')}Retirer</button></div>
        <div class="grid-fields vf"></div>
        <div class="drop small">Dépose ici les fichiers du véhicule : <b>.meta</b> (type reconnu automatiquement) et <b>.yft / .ytd</b> — ou clique pour choisir</div>
        <div class="stream"></div>
        <div class="tabs-box"></div>
        <textarea rows="8" spellcheck="false" class="meta-ta"></textarea>
      </div>`);
      const d = detect(v);
      F.fields(F.$('.vf', p), [
        { key: 'model', label: 'Nom de spawn (modèle)', hint: 'Nom des fichiers .yft/.ytd et <modelName> du vehicles.meta.' },
        { key: 'label', label: 'Nom affiché', hint: 'Texte affiché en jeu (AddTextEntry sur le gameName).' },
        { key: 'brand', label: 'Marque affichée', placeholder: 'facultatif' },
        { key: 'gameName', label: 'gameName', placeholder: (d.game || v.model).toUpperCase(), hint: 'Lu dans le vehicles.meta si présent ; sinon le modèle en majuscules.' },
        { key: 'makeName', label: 'vehicleMakeName', placeholder: (d.make || brandKey(v.brand)).toUpperCase() || 'facultatif', hint: 'Clé de la marque : lue dans le vehicles.meta si présent.' },
      ], v, (k) => { if (k === 'model' || k === 'brand') updatePh(p, v); renderSide(); });
      const ta = F.$('.meta-ta', p);
      const tabs = F.tabs(METAS.map(([k, file]) => ({ id: k, label: file + (metaStatus(v, k) ? ' ' + metaStatus(v, k) : '') })), (k) => {
        tabOf.set(v.id, k); ta.value = v.metas[k]; ta.placeholder = `Colle ici le contenu du ${METAS.find((m) => m[0] === k)[1]} de ce véhicule (facultatif)…`;
      });
      F.$('.tabs-box', p).append(tabs.el);
      tabs.select(tabOf.get(v.id) || 'vehicles');
      ta.oninput = () => { v.metas[tabOf.get(v.id)] = ta.value; refreshTabs(p, v); updatePh(p, v); renderSide(); };
      const drop = F.$('.drop', p);
      const add = (list) => addFiles(v, list).then(() => { tabs.select(tabOf.get(v.id)); refreshTabs(p, v); updatePh(p, v); renderStream(v, F.$('.stream', p)); renderSide(); });
      F.dropZone(drop, add);
      drop.onclick = () => F.pickFiles({ multiple: true, accept: '.meta,.xml,.yft,.ytd,.ydr,.ydd,.ybn,.ycd' }).then(add);
      renderStream(v, F.$('.stream', p));
      return p;
    };
    const refreshTabs = (p, v) => F.$$('.tabs-box button', p).forEach((b) => { const st = metaStatus(v, b.dataset.id); b.textContent = METAS.find((m) => m[0] === b.dataset.id)[1] + (st ? ' ' + st : ''); });
    const updatePh = (p, v) => { const d = detect(v), ins = F.$$('.vf input', p); ins[3].placeholder = (d.game || v.model).toUpperCase(); ins[4].placeholder = (d.make || brandKey(v.brand)).toUpperCase() || 'facultatif'; };

    async function addFiles(v, list) {
      let nMeta = 0, nStream = 0;
      for (const f of list) {
        if (STREAM.test(f.name)) {
          const fl = files.get(v.id) || [];
          files.set(v.id, [...fl.filter((x) => x.name !== f.name), f]); nStream++;
          if (f.size > MAX) F.toast(`${f.name} dépasse 16 Mo`, 'error');
        } else if (/\.(meta|xml)$/i.test(f.name)) {
          const text = await F.readText(f);
          let k = null;
          try { const tag = X.parse(text).documentElement.tagName; k = (METAS.find((m) => m[3] === tag) || [])[0]; } catch { /* repli sur le nom du fichier */ }
          k = k || (METAS.find((m) => f.name.toLowerCase().includes(m[1].replace('.meta', ''))) || [])[0];
          if (!k) { F.toast(`${f.name} : type de meta non reconnu`, 'error'); continue; }
          v.metas[k] = text; tabOf.set(v.id, k); nMeta++;
        } else F.toast(`${f.name} ignoré (formats : .meta, .yft, .ytd…)`, 'error');
      }
      syncStream(v);
      if (nMeta || nStream) F.toast(`${nMeta} meta, ${nStream} fichier(s) stream ajoutés`);
    }

    const renderVehicles = () => { const box = F.$('.vehs', root); box.innerHTML = ''; s.vehicles.forEach((v, i) => box.append(vehPanel(v, i))); renderSide(); };

    root.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const p = b.closest('[data-id]'), v = p && s.vehicles.find((x) => x.id === p.dataset.id);
      if (b.dataset.rm != null && v) { const fl = files.get(v.id) || []; const [f] = fl.splice(Number(b.dataset.rm), 1); v.stream = v.stream.filter((x) => x.name !== f.name); renderStream(v, F.$('.stream', p)); renderSide(); }
      else if (b.dataset.rmm != null && v) { v.stream = v.stream.filter((x) => x.name !== b.dataset.rmm); renderStream(v, F.$('.stream', p)); renderSide(); }
      else if (b.dataset.a === 'del' && v) {
        if (s.vehicles.length < 2) return F.toast('Il faut garder au moins un véhicule', 'error');
        if (confirm(`Retirer ${v.model} du pack ?`)) { s.vehicles = s.vehicles.filter((x) => x !== v); files.delete(v.id); renderVehicles(); }
      } else if (b.dataset.a === 'add') { s.vehicles.push(newVeh(s.vehicles.length + 1)); renderVehicles(); }
      else if (b.dataset.a === 'zip') {
        const w = warnings().filter(([t]) => t === 'error');
        if (w.length && !confirm(`Il reste ${w.length} erreur(s) :\n- ${w.map((x) => x[1]).join('\n- ')}\n\nTélécharger quand même ?`)) return;
        try {
          b.disabled = true;
          const out = [{ name: `${R()}/fxmanifest.lua`, data: manifest() }, { name: `${R()}/vehicle_names.lua`, data: names() }];
          for (const m of metaList()) out.push({ name: `${R()}/${m.path}`, data: m.v.metas[m.k] });
          for (const x of s.vehicles) for (const f of files.get(x.id) || []) out.push({ name: `${R()}/${streamPath(x, f.name)}`, data: await F.readBytes(f) });
          F.download(`${R()}.zip`, F.zip(out));
          F.toast(`${R()}.zip créé (${out.length} fichiers)`);
        } catch (err) { F.toast('Création du .zip impossible : ' + err.message, 'error'); }
        finally { b.disabled = false; }
      }
    });

    renderVehicles();
    return {
      getState: () => F.clone(s), // les fichiers binaires ne sont pas inclus, seulement leurs noms (v.stream)
      setState(v) {
        v = v || {};
        Object.assign(s, { resource: v.resource || 'mes_vehicules', author: v.author || '', version: v.version || '1.0.0', layout: v.layout === 'plat' ? 'plat' : 'dossiers' });
        files.clear(); tabOf.clear();
        s.vehicles = (Array.isArray(v.vehicles) && v.vehicles.length ? v.vehicles : [{}]).map((x) => {
          const o = { ...newVeh(), ...x, id: x.id || F.uid() };
          o.metas = { ...emptyMetas(), ...(x.metas || {}) };
          o.stream = Array.isArray(x.stream) ? x.stream.filter((f) => f && f.name).map((f) => ({ name: String(f.name), size: Number(f.size) || 0 })) : [];
          return o;
        });
        resRefresh(); renderVehicles();
      },
    };
  },
});
