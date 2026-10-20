'use strict';
// Renommeur de fichiers vêtements : renumérote, change le pack ou le genre d'une liste de .ydd/.ytd/.yld → table + scripts .bat / .sh.
Forge.register({
  id: 'clothing-names',
  cat: 'vetements',
  name: 'Renommeur de fichiers vêtements',
  desc: 'Colle tes noms de .ydd/.ytd : renumérotation sans collision, nouveau pack, homme ↔ femme, et scripts .bat / .sh pour renommer sur ton PC.',
  tags: ['vetements', 'clothes', 'renommer', 'ydd', 'ytd', 'yld', 'numerotation', 'fusion', 'bat', 'sh'],
  icon: 'tag',
  mount(root, F) {
    // [mp_x_freemode_01_[p_]<dlc>^]<comp>_[diff_]<000>[_<lettre>][_<suffixe>].<ext>
    const RE = /^(?:mp_([mf])_freemode_01_(p_)?(.+?)\^)?(p_[a-z]+|head|berd|hair|uppr|lowr|hand|feet|teef|accs|task|decl|jbib)_(diff_)?(\d{3})(?:_([a-z]))?(?:_([a-z]+))?\.(ydd|ytd|yld)$/i;
    const EX = 'jbib_000_u.ydd\njbib_diff_000_a_uni.ytd\njbib_diff_000_b_uni.ytd\njbib_003_u.ydd\njbib_diff_003_a_uni.ytd\nmp_m_freemode_01_mp_m_xyz^lowr_002_u.ydd\nmp_m_freemode_01_mp_m_xyz^lowr_002_u.yld\nmp_m_freemode_01_mp_m_xyz^lowr_diff_002_a_uni.ytd\nmp_m_freemode_01_p_mp_m_xyz^p_head_001.ydd\nmp_m_freemode_01_p_mp_m_xyz^p_head_diff_001_a.ytd';
    const DEF = { input: EX, mode: 'compact', start: 0, starts: '', pack: 'bl_clothes', gender: 'keep', format: 'addon' };
    const s = F.clone(DEF);

    root.append(F.h(`<div class="stack">
      <div class="split">
        <div class="panel stack"><div class="panel-head"><h3>Noms de fichiers</h3><span class="muted small">un par ligne (les chemins sont ignorés)</span><button class="btn sm ghost" data-a="pick">${F.icon('folder')}Lire depuis des fichiers</button></div><div class="f-in"></div></div>
        <div class="panel stack"><div class="panel-head"><h3>Règles</h3></div><div class="grid-fields f-opt"></div>
          <div class="note">Le numéro d'un modèle et de toutes ses textures change ensemble (<code>jbib_003_u.ydd</code> + <code>jbib_diff_003_*.ytd</code>). La numérotation est séparée par genre, par composant et pour les props.</div>
          <div class="note warn gender-warn" hidden>Changer homme ↔ femme ne fait que <b>renommer</b> : un modèle conçu sur le corps homme ne s'adaptera pas au corps femme (et inversement). Il faut l'adapter dans un logiciel 3D.</div></div>
      </div>
      <div class="msg stack"></div>
      <div class="stack">
        <div class="table-wrap" style="max-height:520px;overflow:auto"><table class="table"><thead><tr><th>Ancien nom</th><th>Nouveau nom</th></tr></thead><tbody></tbody></table></div>
        <div class="stack"><div class="row"><div class="tabs-slot" style="min-width:0;max-width:100%"></div><span class="spacer"></span><button class="btn sm primary" data-a="dl">${F.icon('download')}Télécharger le script</button></div><div class="out"></div>
          <p class="small muted">Place le script dans le dossier qui contient les fichiers puis lance-le. Le renommage se fait en deux passes (noms temporaires) : aucun fichier n'est écrasé même si les anciens et nouveaux numéros se chevauchent.</p></div>
      </div></div>`));
    const $ = (q) => F.$(q, root);
    const out = F.output({ title: 'renommer.bat', lang: 'bat' });
    $('.out').append(out.el);
    let tab = 'bat', res = { rows: [], ok: [] };
    const tabs = F.tabs([{ id: 'bat', label: 'Windows (.bat)' }, { id: 'sh', label: 'Linux / macOS (.sh)' }, { id: 'list', label: 'Nouveaux noms' }], (id) => { tab = id; showOut(); });
    $('.tabs-slot').append(tabs.el);

    const fIn = F.fields($('.f-in'), [{ key: 'input', label: 'Fichiers', type: 'textarea', rows: 16, wide: true, placeholder: 'jbib_000_u.ydd\njbib_diff_000_a_uni.ytd' }], s, () => render());
    const fOpt = F.fields($('.f-opt'), [
      { key: 'mode', label: 'Numérotation', type: 'select', options: [['compact', 'À la suite depuis l’index (sans trous)'], ['offset', 'Décalage : ancien + index'], ['keep', 'Garder les numéros']] },
      { key: 'start', label: 'Index de départ / décalage', type: 'number', min: 0, max: 999, step: 1 },
      { key: 'starts', label: 'Index par composant (facultatif)', placeholder: 'jbib=15 lowr=8 p_head=3', wide: true, hint: 'Pour fusionner avec un pack existant : mets le nombre de modèles qu’il a déjà pour ce composant.' },
      { key: 'format', label: 'Format de sortie', type: 'select', options: [['addon', 'Addon FiveM (mp_m_freemode_01_<pack>^…)'], ['short', 'Court (jbib_000_u.ydd)']] },
      { key: 'pack', label: 'Nouveau nom de pack', placeholder: 'vide = garder celui du fichier', hint: 'Nom de collection après mp_m_freemode_01_ (ex. bl_clothes ou mp_m_bl_clothes).' },
      { key: 'gender', label: 'Genre', type: 'select', options: [['keep', 'Garder (homme si inconnu)'], ['m', 'Tout en homme (mp_m)'], ['f', 'Tout en femme (mp_f)']] },
    ], s, () => render());

    function render() {
      const starts = {};
      for (const [, k, v] of String(s.starts || '').toLowerCase().matchAll(/([a-z_]+)\s*[=:]\s*(\d+)/g)) starts[k] = +v;
      const lines = String(s.input || '').split(/\r?\n/).map((l) => l.trim().replace(/^["']|["']$/g, '').split(/[\\/]/).pop()).filter(Boolean);
      const items = lines.map((name) => {
        const m = name.match(RE);
        if (!m) return { name, err: 'Nom non reconnu' };
        const [, g0, p, dlc0, comp0, diff, num, l0, x0, ext0] = m, comp = comp0.toLowerCase(), ext = ext0.toLowerCase();
        let letter = l0 && l0.toLowerCase(), suf = x0 && x0.toLowerCase();
        if (!diff && letter && !suf) { suf = letter; letter = null; }
        const prop = comp.startsWith('p_');
        if (ext === 'ytd' && !letter) return { name, err: 'Texture sans lettre (_a, _b…)' };
        if (!!p !== prop && g0) return { name, err: 'Préfixe p_ incohérent avec le composant' };
        return { name, g: (g0 || 'm').toLowerCase(), dlc: dlc0 || '', comp, prop, diff: !!diff, num: +num, letter, suf, ext };
      });
      const good = items.filter((i) => !i.err);
      // numérotation : clé = genre + pack + composant
      // (si un nouveau pack est donné, plusieurs packs d'origine sont fusionnés et numérotés à la suite)
      const outG = (i) => (s.gender === 'm' || s.gender === 'f' ? s.gender : i.g);
      const outDlc = (i) => { const g = outG(i); const d = F.slug(s.pack) || i.dlc; return !F.slug(s.pack) && /^mp_[mf]_/.test(d) ? `mp_${g}_` + d.slice(5) : d; };
      const order = [...new Set(good.map((i) => i.dlc))], map = {}, renum = {};
      for (const i of good) { const k = `${outG(i)}|${outDlc(i)}|${i.comp}`; (map[k] = map[k] || new Map()).set(`${i.dlc}|${i.num}`, [order.indexOf(i.dlc), i.num]); }
      for (const [k, m] of Object.entries(map)) {
        const base = starts[k.split('|')[2]] ?? (Number(s.start) || 0);
        [...m].sort((a, b) => a[1][0] - b[1][0] || a[1][1] - b[1][1]).forEach(([id, [, n]], r) => { renum[k + '|' + id] = s.mode === 'compact' ? base + r : s.mode === 'offset' ? n + base : n; });
      }
      const errs = [];
      const rows = items.map((i) => {
        if (i.err) return { from: i.name, err: i.err };
        const g = outG(i), dlc = outDlc(i), n = renum[`${g}|${dlc}|${i.comp}|${i.dlc}|${i.num}`];
        if (n > 999) return { from: i.name, err: 'Numéro > 999' };
        const body = `${i.comp}_${i.diff || i.ext === 'ytd' ? 'diff_' : ''}${F.pad(n)}${i.letter ? '_' + i.letter : ''}${i.suf ? '_' + i.suf : ''}.${i.ext}`;
        if (s.format === 'short') return { from: i.name, to: body };
        if (!dlc) return { from: i.name, err: 'Indique un nom de pack (le fichier n’en a pas)' };
        return { from: i.name, to: `mp_${g}_freemode_01_${i.prop ? 'p_' : ''}${dlc}^${body}` };
      });
      const seenFrom = new Set(), seenTo = new Map();
      rows.forEach((r) => {
        if (r.err) return;
        if (seenFrom.has(r.from.toLowerCase())) r.err = 'Ligne en double'; seenFrom.add(r.from.toLowerCase());
        const t = r.to.toLowerCase();
        if (!r.err && seenTo.has(t)) r.err = 'Collision : même nouveau nom que ' + seenTo.get(t); else seenTo.set(t, r.from);
      });
      if (rows.some((r) => r.err)) errs.push(`${rows.filter((r) => r.err).length} ligne(s) ignorée(s) (voir le tableau).`);
      if (s.format === 'addon' && s.gender === 'keep' && good.some((i) => !i.dlc)) errs.push('Certains noms courts n’indiquent pas le genre : ils sont considérés comme homme (mp_m).');
      res = { rows, ok: rows.filter((r) => !r.err) };
      $('.gender-warn').hidden = s.gender === 'keep';
      $('.msg').innerHTML = errs.map((e) => `<div class="note warn">${F.esc(e)}</div>`).join('');
      F.$('tbody', root).innerHTML = rows.map((r) => `<tr><td><code style="word-break:break-all">${F.esc(r.from)}</code></td><td>${r.err ? `<span class="chip" style="color:var(--danger)">${F.esc(r.err)}</span>` : `<code style="word-break:break-all"${r.to === r.from ? ' class="muted"' : ''}>${F.esc(r.to)}</code>`}</td></tr>`).join('')
        || '<tr><td colspan="2" class="empty">Colle une liste de noms à gauche</td></tr>';
      showOut();
    }
    function script(kind) {
      const ch = res.ok.filter((r) => r.to !== r.from);
      if (kind === 'list') return res.ok.map((r) => r.to).join('\n') + '\n';
      if (kind === 'bat') {
        const q = (x) => '"' + x.replace(/%/g, '%%') + '"';
        return ['@echo off', 'chcp 65001 >nul', 'cd /d "%~dp0"', `rem BL Forge : ${ch.length} fichier(s) a renommer (2 passes pour eviter les collisions)`,
          ...ch.map((r, i) => `ren ${q(r.from)} "__blf_tmp_${i}" || echo Introuvable : ${r.from.replace(/[%&<>|^]/g, '')}`),
          ...ch.map((r, i) => `if exist "__blf_tmp_${i}" ren "__blf_tmp_${i}" ${q(r.to)}`), 'echo Termine.', 'pause', ''].join('\r\n');
      }
      const q = (x) => "'" + x.replace(/'/g, "'\\''") + "'";
      return ['#!/bin/sh', `# BL Forge : ${ch.length} fichier(s) à renommer (2 passes pour éviter les collisions)`, 'cd "$(dirname "$0")" || exit 1',
        ...ch.map((r, i) => `mv -- ${q(r.from)} '__blf_tmp_${i}' || echo ${q('Introuvable : ' + r.from)}`),
        ...ch.map((r, i) => `[ -e '__blf_tmp_${i}' ] && mv -- '__blf_tmp_${i}' ${q(r.to)}`), 'echo "Terminé."', ''].join('\n');
    }
    const fname = () => ({ bat: 'renommer.bat', sh: 'renommer.sh', list: 'nouveaux_noms.txt' })[tab];
    function showOut() { out.setTitle(fname()); out.set(script(tab)); }

    root.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'dl') {
        if (!res.ok.length) return F.toast('Aucun nom valide à renommer', 'error');
        F.download(fname(), script(tab));
      } else if (b.dataset.a === 'pick') {
        const l = await F.pickFiles({ accept: '.ydd,.ytd,.yld', multiple: true });
        if (!l.length) return;
        s.input = l.map((f) => f.name).sort((a, c) => a.localeCompare(c, 'fr', { numeric: true })).join('\n');
        fIn.refresh(); render();
      }
    });
    tabs.select('bat');
    render();
    return {
      getState: () => ({ ...s }),
      setState(v) { Object.assign(s, F.clone(DEF), v || {}); fIn.refresh(); fOpt.refresh(); render(); },
    };
  },
});
