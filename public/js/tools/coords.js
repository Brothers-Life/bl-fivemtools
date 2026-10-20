'use strict';
// Convertisseur de coordonnées : détecte vector3/vec4/tables/JSON/« X: Y: Z: » et reconvertit en masse ; distance et heading.
Forge.register({
  id: 'coords',
  cat: 'convertisseurs',
  name: 'Convertisseur de coordonnées',
  desc: 'Colle des coordonnées dans n’importe quel format (vector3, table, JSON, X: Y: Z:…) et convertis-les en masse ; distance et heading.',
  tags: ['coordonnees', 'coords', 'vector3', 'vector4', 'vec3', 'heading', 'position', 'distance', 'json', 'c#'],
  icon: 'pin',
  mount(root, F) {
    const FORMATS = [
      ['vector3', 'vector3(x, y, z)'], ['vector4', 'vector4(x, y, z, h)'], ['vec3', 'vec3(x, y, z)'], ['vec4', 'vec4(x, y, z, h)'],
      ['lua', 'Table Lua { x = , y = , z = }'], ['luaarr', 'Table Lua { x, y, z }'], ['json', 'JSON {"x": …}'], ['array', 'Tableau [x, y, z]'],
      ['js', 'JS { x: , y: , z: }'], ['cs', 'C# new Vector3(…f)'], ['plain', 'Nombres x, y, z'],
    ];
    const DEF = {
      input: "vector3(215.76, -810.12, 30.73)\n{x = -1037.74, y = -2737.75, z = 20.17, h = 328.5}\n{ \"x\": 425.1, \"y\": -979.5, \"z\": 30.7 }\nX: 1855.25 Y: 3683.1 Z: 34.27 H: 210.0\n['garage'] = vec4(-337.4, -136.9, 39.0, 70.0),\n-75.2, -818.9, 326.2",
      format: 'vector4', dec: 2, heading: 'keep', hKey: 'h', mode: 'list', comma: false,
      a: 'vector3(215.76, -810.12, 30.73)', b: 'vector3(425.1, -979.5, 30.7)', hdg: 90,
    };
    const s = F.clone(DEF);

    root.append(F.h(`<div class="stack">
      <div class="split">
        <div class="panel stack">
          <div class="panel-head"><h3>Coordonnées</h3><span class="muted small">une ou plusieurs, n’importe quel format</span></div>
          <div class="grid-fields co-in"></div>
          <div class="co-info"></div>
        </div>
        <div class="stack">
          <div class="panel stack"><div class="panel-head"><h3>Format de sortie</h3></div><div class="grid-fields co-opt"></div></div>
          <div class="co-out"></div>
        </div>
      </div>
      <div class="split">
        <div class="panel stack">
          <div class="panel-head"><h3>Distance entre deux points</h3></div>
          <div class="grid-fields co-dist"></div>
          <div class="table-wrap"><table class="table"><tbody class="co-dres"></tbody></table></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Heading → rotation</h3><span class="muted small">0 = nord, 90 = ouest (sens anti-horaire)</span></div>
          <div class="grid-fields co-hdg"></div>
          <div class="table-wrap"><table class="table"><tbody class="co-hres"></tbody></table></div>
        </div>
      </div>
    </div>`));

    const out = F.output({ title: 'Résultat', filename: 'coords.lua', lang: 'lua' });
    F.$('.co-out', root).append(out.el);
    const fIn = F.fields(F.$('.co-in', root), [{ key: 'input', label: 'Texte à convertir', type: 'textarea', rows: 12, wide: true, placeholder: 'vector3(1.0, 2.0, 3.0)' }], s, () => render());
    const fOpt = F.fields(F.$('.co-opt', root), [
      { key: 'format', label: 'Format', type: 'select', options: FORMATS },
      { key: 'dec', label: 'Décimales', type: 'number', min: 0, max: 6, step: 1 },
      { key: 'heading', label: 'Heading', type: 'select', options: [['keep', 'Garder s’il existe'], ['add', 'Ajouter 0.0 si absent'], ['remove', 'Retirer']] },
      { key: 'hKey', label: 'Nom de la clé heading', type: 'select', options: [['h', 'h'], ['heading', 'heading'], ['w', 'w']] },
      { key: 'mode', label: 'Sortie', type: 'select', options: [['list', 'Une coordonnée par ligne'], ['inplace', 'Remplacer dans le texte d’origine']] },
      { key: 'comma', label: 'Virgule en fin de ligne', type: 'checkbox' },
    ], s, () => render());
    const fDist = F.fields(F.$('.co-dist', root), [{ key: 'a', label: 'Point A', wide: true }, { key: 'b', label: 'Point B', wide: true }], s, () => renderDist());
    const fHdg = F.fields(F.$('.co-hdg', root), [{ key: 'hdg', label: 'Heading (degrés)', type: 'number', step: 0.1 }], s, () => renderHdg());

    /* ------------------------------ analyse ------------------------------ */
    const NUM = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?';
    const numsOf = (str) => (str.match(new RegExp(`(?<![\\w.])${NUM}`, 'g')) || []).map(Number);
    const labelled = (str) => {
      const o = {}, re = new RegExp(`(?<![\\w])["']?(x|y|z|h|w|heading)["']?\\s*[:=]\\s*(${NUM})`, 'gi');
      let m, first = -1, last = -1;
      while ((m = re.exec(str))) {
        const k = m[1].toLowerCase(), key = k === 'w' || k === 'heading' ? 'h' : k;
        if (!(key in o)) o[key] = Number(m[2]);
        if (first < 0) first = m.index;
        last = m.index + m[0].length;
      }
      return 'x' in o && 'y' in o && 'z' in o ? { x: o.x, y: o.y, z: o.z, h: o.h ?? null, first, last } : null;
    };
    const fromList = (n) => (n.length === 3 || n.length === 4 ? { x: n[0], y: n[1], z: n[2], h: n.length === 4 ? n[3] : null } : null);
    // Renvoie [{ start, end, x, y, z, h }] triés dans l'ordre du texte.
    const parse = (text) => {
      const found = [];
      const free = (a, b) => !found.some((f) => a < f.end && b > f.start);
      const push = (start, end, c) => { if (c && [c.x, c.y, c.z].every(Number.isFinite) && free(start, end)) found.push({ start, end, ...c, h: Number.isFinite(c.h) ? c.h : null }); };
      const groups = [/\b(?:new\s+)?vec(?:tor)?[234]?\s*\(([^()]*)\)/gi, /\{([^{}]*)\}/g, /\[([^[\]]*)\]/g];
      for (const re of groups) {
        let m;
        while ((m = re.exec(text))) { if (/^\s*\[\s*['"]/.test(m[0])) continue; push(m.index, m.index + m[0].length, labelled(m[1]) || fromList(numsOf(m[1]))); }
      }
      let pos = 0;
      for (const line of text.split('\n')) {
        const a = pos, b = pos + line.length; pos = b + 1;
        if (!free(a, b)) continue;
        const l = labelled(line);
        if (l) { push(a + l.first, a + l.last, l); continue; }
        const re = new RegExp(`(?<![\\w.])${NUM}`, 'g'), ms = [...line.matchAll(re)];
        if (ms.length === 3 || ms.length === 4) push(a + ms[0].index, a + ms.at(-1).index + ms.at(-1)[0].length, fromList(ms.map((m) => Number(m[0]))));
      }
      return found.sort((p, q) => p.start - q.start);
    };
    const first = (str) => parse(String(str || ''))[0] || null;

    /* ------------------------------ formatage ------------------------------ */
    const fmt = (c) => {
      const d = Math.min(6, Math.max(0, Math.round(Number(s.dec) || 0)));
      const n = (v) => { const r = Number(v).toFixed(d); return /^-0(\.0*)?$/.test(r) ? r.slice(1) : r; };
      let h = c.h;
      if (s.heading === 'remove') h = null; else if (s.heading === 'add' && h == null) h = 0;
      const f = s.format, k = s.hKey;
      if (f === 'vector3' || f === 'vec3') return `${f}(${n(c.x)}, ${n(c.y)}, ${n(c.z)})`;
      if (f === 'vector4' || f === 'vec4') return `${f}(${n(c.x)}, ${n(c.y)}, ${n(c.z)}, ${n(h ?? 0)})`;
      const v = [n(c.x), n(c.y), n(c.z), ...(h != null ? [n(h)] : [])];
      if (f === 'lua') return `{ x = ${v[0]}, y = ${v[1]}, z = ${v[2]}${h != null ? `, ${k} = ${v[3]}` : ''} }`;
      if (f === 'luaarr') return `{ ${v.join(', ')} }`;
      if (f === 'json') return `{ "x": ${v[0]}, "y": ${v[1]}, "z": ${v[2]}${h != null ? `, "${k}": ${v[3]}` : ''} }`;
      if (f === 'array') return `[${v.join(', ')}]`;
      if (f === 'js') return `{ x: ${v[0]}, y: ${v[1]}, z: ${v[2]}${h != null ? `, ${k}: ${v[3]}` : ''} }`;
      if (f === 'cs') return `new Vector${h != null ? 4 : 3}(${v.map((x) => x + 'f').join(', ')})`;
      return v.join(', ');
    };

    function render() {
      const list = parse(s.input);
      let text;
      if (s.mode === 'inplace') {
        text = ''; let at = 0;
        for (const c of list) { text += s.input.slice(at, c.start) + fmt(c); at = c.end; }
        text += s.input.slice(at);
      } else text = list.map(fmt).join(s.comma ? ',\n' : '\n') + (s.comma && list.length ? ',' : '');
      out.set(list.length ? text : '');
      out.setTitle(`Résultat · ${list.length} coordonnée${list.length > 1 ? 's' : ''}`);
      const withH = list.filter((c) => c.h != null).length;
      const lines = s.input.split('\n').filter((l) => /\d/.test(l)).length;
      F.$('.co-info', root).innerHTML = list.length
        ? `<div class="row"><span class="chip on">${list.length} détectée${list.length > 1 ? 's' : ''}</span><span class="chip">${withH} avec heading</span>${lines > list.length ? `<span class="chip" title="Lignes contenant des chiffres mais pas de coordonnée reconnue">${lines - list.length} ligne(s) ignorée(s)</span>` : ''}</div>`
        : (s.input.trim() ? '<div class="note warn">Aucune coordonnée reconnue (il faut 3 ou 4 nombres : x, y, z et éventuellement heading).</div>' : '');
    }

    const row = (label, value) => `<tr><td class="muted small" style="white-space:nowrap">${label}</td><td><button class="btn sm ghost" data-copy="${F.esc(value)}"><code>${F.esc(value)}</code></button></td></tr>`;
    const r2 = (v) => F.short(Math.round(v * 100) / 100);
    function renderDist() {
      const A = first(s.a), B = first(s.b), tb = F.$('.co-dres', root);
      if (!A || !B) { tb.innerHTML = `<tr><td class="empty">${!A ? 'Point A' : 'Point B'} non reconnu</td></tr>`; return; }
      const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z, d2 = Math.hypot(dx, dy), d3 = Math.hypot(dx, dy, dz);
      const hd = ((Math.atan2(-dx, dy) * 180) / Math.PI + 360) % 360;
      tb.innerHTML = row('Distance 3D', r2(d3) + ' m') + row('Distance 2D (sol)', r2(d2) + ' m') + row('Écart x, y, z', `${r2(dx)}, ${r2(dy)}, ${r2(dz)}`)
        + row('Heading de A vers B', r2(hd)) + row('En Lua', '#(pointA - pointB)');
    }
    function renderHdg() {
      const h = Number(s.hdg) || 0, n = ((h % 360) + 360) % 360, rad = (n * Math.PI) / 180;
      const dirs = ['Nord', 'Nord-Ouest', 'Ouest', 'Sud-Ouest', 'Sud', 'Sud-Est', 'Est', 'Nord-Est'];
      const fx = -Math.sin(rad), fy = Math.cos(rad), z = n > 180 ? n - 360 : n;
      F.$('.co-hres', root).innerHTML = row('Heading normalisé (0–360)', r2(n)) + row('Radians', F.short(Math.round(rad * 1e6) / 1e6)) + row('Rotation Z (−180…180)', r2(z))
        + row('Direction (vecteur avant)', `vector3(${F.short(Math.round(fx * 1e4) / 1e4, true)}, ${F.short(Math.round(fy * 1e4) / 1e4, true)}, 0.0)`) + row('Orientation', dirs[Math.round(n / 45) % 8])
        + row('Heading opposé (demi-tour)', r2((n + 180) % 360));
    }
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-copy]'); if (b) F.copy(b.dataset.copy); });

    render(); renderDist(); renderHdg();
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v && typeof v === 'object' ? v : {});
        if (!FORMATS.some(([k]) => k === s.format)) s.format = DEF.format;
        for (const k of ['input', 'a', 'b']) s[k] = String(s[k] ?? '');
        [fIn, fOpt, fDist, fHdg].forEach((f) => f.refresh());
        render(); renderDist(); renderHdg();
      },
    };
  },
});
