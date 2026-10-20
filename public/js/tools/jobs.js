'use strict';
// Générateur de jobs et gangs avec grades : ESX (SQL), QBCore et Qbox, avec import / conversion par copier-coller.
Forge.register({
  id: 'jobs',
  cat: 'scripts',
  name: 'Générateur de jobs & gangs',
  desc: 'Métiers et grades (salaire, patron) exportés en SQL ESX, jobs.lua QBCore / Qbox, plus les gangs QBCore.',
  tags: ['jobs', 'job', 'métier', 'metier', 'grades', 'gangs', 'gang', 'esx', 'qbcore', 'qbox', 'sql', 'salaire', 'convertisseur'],
  icon: 'briefcase',
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
    const g = (grade, name, label, salary, isboss = false) => ({ grade, name, label, salary, isboss });
    const TPL = {
      police: { name: 'police', label: 'Police', type: 'leo', whitelisted: true, grades: [g(0, 'recruit', 'Recrue', 50), g(1, 'officer', 'Officier', 75), g(2, 'sergeant', 'Sergent', 100), g(3, 'lieutenant', 'Lieutenant', 125), g(4, 'boss', 'Capitaine', 150, true)] },
      ambulance: { name: 'ambulance', label: 'EMS', type: 'ems', whitelisted: true, grades: [g(0, 'ambulance', 'Ambulancier', 50), g(1, 'doctor', 'Médecin', 75), g(2, 'chief_doctor', 'Médecin-chef', 100), g(3, 'boss', 'Directeur', 125, true)] },
      mechanic: { name: 'mechanic', label: 'Mécano', type: 'mechanic', whitelisted: true, grades: [g(0, 'recrue', 'Recrue', 40), g(1, 'novice', 'Novice', 55), g(2, 'experimente', 'Expérimenté', 70), g(3, 'chief', 'Chef d’équipe', 85), g(4, 'boss', 'Patron', 100, true)] },
      taxi: { name: 'taxi', label: 'Taxi', type: '', whitelisted: false, grades: [g(0, 'recrue', 'Recrue', 30), g(1, 'driver', 'Chauffeur', 45), g(2, 'boss', 'Patron', 70, true)] },
      gang: { name: 'ballas', label: 'Ballas', grades: [g(0, 'recruit', 'Recrue', 0), g(1, 'enforcer', 'Homme de main', 0), g(2, 'shotcaller', 'Bras droit', 0), g(3, 'boss', 'Chef', 0, true)] },
    };
    const JOB = { name: '', label: '', type: '', whitelisted: false, defaultDuty: true, offDutyPay: false, grades: [] };
    const normGrade = (x, i) => ({ grade: Number.isFinite(+x?.grade) ? Math.trunc(+x.grade) : i, name: String(x?.name ?? ''), label: String(x?.label ?? ''), salary: Number(x?.salary) || 0, isboss: !!x?.isboss });
    const normJob = (j) => {
      const o = { ...JOB };
      for (const k of ['name', 'label', 'type']) o[k] = String(j?.[k] ?? '');
      for (const k of ['whitelisted', 'defaultDuty', 'offDutyPay']) if (j && j[k] != null) o[k] = !!j[k];
      o.grades = Array.isArray(j?.grades) ? j.grades.filter((x) => x && typeof x === 'object').map(normGrade) : [];
      return o;
    };
    const DEF = { mode: 'jobs', jobs: [normJob(TPL.police)], gangs: [normJob(TPL.gang)], sel: 0, tab: 'esx', gtab: 'qb', wrap: false, esxWl: true, esxBoss: true, esxReplace: false, importText: '' };
    const s = F.clone(DEF);
    const list = () => s[s.mode];
    const cur = () => list()[s.sel];
    const isJobs = () => s.mode === 'jobs';

    root.append(F.h(`<div class="stack">
      <div class="mode-tabs"></div>
      <div class="split">
        <div class="stack">
          <div class="panel"><div class="panel-head"><h3 class="list-title"></h3>
            <select class="tpl" style="width:auto"></select>
            <button class="btn sm" data-a="add">${F.icon('plus')}Ajouter</button></div>
            <div class="row job-chips"></div></div>
          <div class="panel editor"></div>
          <div class="panel"><div class="panel-head"><h3>Importer / convertir</h3></div>
            <p class="muted small" style="margin-bottom:10px">Colle un <b>jobs.lua / gangs.lua</b> QBCore ou Qbox, ou les <b>INSERT INTO jobs / job_grades</b> d’ESX : ils sont convertis dans la liste ci-dessus.</p>
            <div class="f-import"></div>
            <div class="row" style="margin-top:10px"><button class="btn primary sm" data-a="imp-add">${F.icon('upload')}Ajouter / fusionner</button><button class="btn sm" data-a="imp-rep">Remplacer la liste</button><span class="muted small imp-msg"></span></div></div>
        </div>
        <div class="stack sticky res"><div class="out-tabs"></div><div class="panel f-opts grid-fields"></div><div class="stack warn-box"></div></div>
      </div></div>`));

    const modeTabs = F.tabs([{ id: 'jobs', label: 'Jobs / métiers' }, { id: 'gangs', label: 'Gangs (QBCore / Qbox)' }], (id) => { if (s.mode !== id) { s.mode = id; s.sel = 0; } drawAll(); });
    F.$('.mode-tabs', root).append(modeTabs.el);

    /* ------------------------------ liste + éditeur ------------------------------ */
    const drawList = () => {
      F.$('.list-title', root).textContent = isJobs() ? `Jobs (${s.jobs.length})` : `Gangs (${s.gangs.length})`;
      F.$('.tpl', root).innerHTML = '<option value="">Ajouter un modèle…</option>' + (isJobs() ? [['police', 'Police (leo)'], ['ambulance', 'EMS (ems)'], ['mechanic', 'Mécano (mechanic)'], ['taxi', 'Taxi']] : [['gang', 'Gang (4 grades)']]).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
      F.$('.job-chips', root).innerHTML = list().map((j, i) => `<button class="chip${i === s.sel ? ' on' : ''}" data-sel="${i}">${F.esc(j.label || j.name || 'sans nom')} <span class="muted">${F.esc(j.name)}</span></button>`).join('') || '<span class="muted small">Liste vide : ajoute un job ou un modèle.</span>';
    };
    const editor = F.$('.editor', root);
    let editorFields = null;
    const drawEditor = () => {
      const j = cur();
      if (!j) { editor.innerHTML = '<div class="empty">Rien à éditer</div>'; editorFields = null; return; }
      editor.innerHTML = `<div class="panel-head"><h3>${isJobs() ? 'Job' : 'Gang'} sélectionné</h3>
        <button class="btn sm ghost" data-a="dup-job">${F.icon('copy')}Dupliquer</button><button class="btn sm ghost danger" data-a="del-job">${F.icon('trash')}Supprimer</button></div>
        <div class="grid-fields jf"></div>
        <div class="panel-head" style="margin-top:16px"><h3>Grades</h3><button class="btn sm" data-a="add-grade">${F.icon('plus')}Grade</button></div>
        <div class="grades"></div>
        <p class="muted small" style="margin-top:8px">Bulk : colle des lignes <code>grade;nom;label;salaire</code> dans la zone ci-dessous puis « Remplacer les grades ».</p>
        <div class="row" style="margin-top:6px"><textarea class="bulk" rows="2" spellcheck="false" placeholder="0;recruit;Recrue;50\n1;officer;Officier;75"></textarea></div>
        <div class="row" style="margin-top:6px"><button class="btn sm" data-a="bulk">Remplacer les grades</button></div>`;
      const defs = [
        { key: 'name', label: 'Nom technique', placeholder: 'police' },
        { key: 'label', label: 'Label affiché', placeholder: 'Police' },
      ];
      if (isJobs()) defs.push(
        { key: 'type', label: 'Type (QBCore / Qbox)', type: 'select', options: [['', 'aucun'], ['leo', 'leo (police)'], ['ems', 'ems (médical)'], ['mechanic', 'mechanic']] },
        { key: 'whitelisted', label: 'Whitelisté (ESX)', type: 'checkbox' },
        { key: 'defaultDuty', label: 'En service à la connexion (defaultDuty)', type: 'checkbox' },
        { key: 'offDutyPay', label: 'Payé hors service (offDutyPay)', type: 'checkbox' });
      editorFields = F.fields(F.$('.jf', editor), defs, j, (k) => { if (k === 'name' || k === 'label') drawList(); render(); });
      drawGrades();
    };
    const drawGrades = () => {
      const j = cur(); if (!j) return;
      const cols = [['grade', 'N°', 'number', 50], ['name', 'Nom technique', 'text', 96], ['label', 'Label', 'text', 110], ...(isJobs() ? [['salary', 'Salaire', 'number', 64]] : []), ['isboss', 'Patron', 'check']];
      F.$('.grades', editor).innerHTML = `<div class="table-wrap"><table class="table"><thead><tr>${cols.map((c) => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${j.grades.map((r, i) => `<tr data-i="${i}">${cols.map(([k, , t, w]) => `<td>${t === 'check' ? `<input type="checkbox" data-k="${k}"${r[k] ? ' checked' : ''}>` : `<input data-k="${k}" ${t === 'number' ? 'type="number" step="1"' : ''} value="${F.esc(r[k])}" style="min-width:${w}px">`}</td>`).join('')}
        <td class="actions"><button class="btn sm ghost" data-a="dup" title="Dupliquer">${F.icon('copy')}</button><button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></td></tr>`).join('')
        || `<tr><td colspan="${cols.length + 1}" class="empty">Aucun grade</td></tr>`}</tbody></table></div>`;
    };
    editor.addEventListener('input', (e) => {
      const k = e.target.dataset.k, tr = e.target.closest('tr[data-i]');
      if (!k || !tr) return;
      const r = cur().grades[tr.dataset.i];
      r[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? Math.trunc(Number(e.target.value) || 0) : e.target.value;
      render();
    });

    /* --------------------------------- import --------------------------------- */
    const refreshers = [F.fields(F.$('.f-import', root), [{ key: 'importText', label: 'Texte à importer', type: 'textarea', rows: 6, wide: true, placeholder: "police = { label = 'Police', type = 'leo', grades = { ['0'] = { name = 'Recrue', payment = 50 } } },\n-- ou\nINSERT INTO job_grades (job_name, grade, name, label, salary, skin_male, skin_female) VALUES ('police', 0, 'recruit', 'Recrue', 50, '{}', '{}');" }], s)];
    const parseImport = (txt) => {
      const out = new Map();
      const get = (name) => { if (!out.has(name)) out.set(name, { ...F.clone(JOB), name, label: name }); return out.get(name); };
      const sql = sqlInserts(txt);
      for (const q of sql) {
        if (q.table === 'jobs' || q.table === 'gangs') {
          const cols = q.cols || ['name', 'label', 'whitelisted'];
          for (const r of q.rows) { const o = Object.fromEntries(cols.map((c, i) => [c, r[i]])); if (o.name) Object.assign(get(String(o.name)), { label: String(o.label ?? o.name), whitelisted: !!Number(o.whitelisted) }); }
        } else if (q.table === 'job_grades') {
          for (const r of q.rows) {
            const cols = q.cols || (r.length >= 8 ? ['id', 'job_name', 'grade', 'name', 'label', 'salary', 'skin_male', 'skin_female'] : ['job_name', 'grade', 'name', 'label', 'salary', 'skin_male', 'skin_female']);
            const o = Object.fromEntries(cols.map((c, i) => [c, r[i]]));
            if (o.job_name) get(String(o.job_name)).grades.push(normGrade({ grade: o.grade, name: o.name, label: o.label, salary: o.salary, isboss: o.name === 'boss' }, 0));
          }
        }
      }
      if (out.size) return { jobs: [...out.values()], fmt: 'SQL ESX' };
      const walk = (o, key, depth) => {
        if (!o || typeof o !== 'object' || depth > 6) return;
        if (o.grades && typeof o.grades === 'object' && typeof key === 'string' && !/^\d+$/.test(key)) {
          const j = get(key);
          Object.assign(j, { label: String(o.label ?? key), type: typeof o.type === 'string' ? o.type : '', defaultDuty: o.defaultDuty !== false, offDutyPay: !!o.offDutyPay });
          for (const [gk, gv] of Object.entries(o.grades)) {
            if (!gv || typeof gv !== 'object') continue;
            const lbl = String(gv.name ?? gv.label ?? '');
            j.grades.push(normGrade({ grade: parseInt(gk, 10), name: F.slug(lbl, '_') || 'grade' + gk, label: lbl, salary: gv.payment ?? gv.salary, isboss: gv.isboss }, 0));
          }
          return;
        }
        for (const [k, v] of Object.entries(o)) walk(v, k, depth + 1);
      };
      luaParse(txt).forEach((r) => walk(r, null, 0));
      return { jobs: [...out.values()], fmt: 'Lua' };
    };
    const doImport = (replace) => {
      try {
        const { jobs, fmt } = parseImport(s.importText || '');
        if (!jobs.length) { F.$('.imp-msg', root).textContent = ''; return F.toast('Aucun job / gang reconnu dans ce texte', 'error'); }
        jobs.forEach((j) => j.grades.sort((a, b) => a.grade - b.grade));
        if (replace) s[s.mode] = jobs.map(normJob);
        else for (const j of jobs.map(normJob)) { const i = list().findIndex((x) => x.name === j.name); if (i >= 0) list()[i] = j; else list().push(j); }
        s.sel = 0;
        F.$('.imp-msg', root).textContent = `${jobs.length} ${isJobs() ? 'job(s)' : 'gang(s)'} importé(s) — format ${fmt}`;
        drawAll();
      } catch (e) { F.toast('Import impossible : ' + e.message, 'error'); }
    };

    /* --------------------------------- exports --------------------------------- */
    const L = F.luaStr, Q = F.sqlStr;
    const valid = () => list().filter((j) => j.name.trim());
    const sorted = (j) => [...j.grades].sort((a, b) => a.grade - b.grade);
    const ind = (t) => t.replace(/^(?=.)/gm, '    ');
    function esxOut() {
      const jobs = valid();
      if (!jobs.length) return '-- Aucun job';
      const names = jobs.map((j) => Q(j.name.trim())).join(', ');
      let q = '-- ESX legacy : tables jobs et job_grades\n';
      if (s.esxReplace) q += `DELETE FROM \`job_grades\` WHERE \`job_name\` IN (${names});\nDELETE FROM \`jobs\` WHERE \`name\` IN (${names});\n\n`;
      q += `INSERT INTO \`jobs\` (\`name\`, \`label\`${s.esxWl ? ', `whitelisted`' : ''}) VALUES\n${jobs.map((j) => `  (${Q(j.name.trim())}, ${Q(j.label || j.name)}${s.esxWl ? ', ' + (j.whitelisted ? 1 : 0) : ''})`).join(',\n')};\n`;
      const rows = jobs.flatMap((j) => sorted(j).map((r) => `  (${Q(j.name.trim())}, ${r.grade}, ${Q(s.esxBoss && r.isboss ? 'boss' : r.name || 'grade' + r.grade)}, ${Q(r.label || r.name)}, ${Math.max(0, r.salary)}, '{}', '{}')`));
      if (rows.length) q += `\nINSERT INTO \`job_grades\` (\`job_name\`, \`grade\`, \`name\`, \`label\`, \`salary\`, \`skin_male\`, \`skin_female\`) VALUES\n${rows.join(',\n')};\n`;
      return q;
    }
    // QBCore : clés de grade en chaîne ['0'] ; Qbox : clés numériques [0] + bankAuth pour le patron.
    function luaOut(qbox) {
      const jobs = valid(), job = isJobs();
      if (!jobs.length) return `-- Aucun ${job ? 'job' : 'gang'}`;
      const body = jobs.map((j) => {
        const f = [`label = ${L(j.label || j.name)},`];
        if (job && j.type) f.push(`type = ${L(j.type)},`);
        if (job) f.push(`defaultDuty = ${j.defaultDuty},`, `offDutyPay = ${j.offDutyPay},`);
        const gr = sorted(j).map((r) => {
          const parts = [`name = ${L(r.label || r.name)}`];
          if (r.isboss) parts.push('isboss = true');
          if (r.isboss && qbox) parts.push('bankAuth = true');
          if (job) parts.push(`payment = ${Math.max(0, r.salary)}`);
          return `    ${qbox ? `[${r.grade}]` : `['${r.grade}']`} = { ${parts.join(', ')} },`;
        });
        f.push('grades = {', ...gr, '},');
        return `[${L(j.name.trim())}] = {\n${ind(f.join('\n'))}\n},`;
      }).join('\n');
      const file = qbox ? `qbx_core/shared/${job ? 'jobs' : 'gangs'}.lua` : `qb-core/shared/${job ? 'jobs' : 'gangs'}.lua`;
      if (!s.wrap) return `-- À coller dans ${file}${qbox ? '' : ` (table QBShared.${job ? 'Jobs' : 'Gangs'})`}\n${body}\n`;
      return qbox ? `-- ${file}\nreturn {\n${ind(body)}\n}\n` : `-- ${file}\nQBShared = QBShared or {}\nQBShared.${job ? 'Jobs' : 'Gangs'} = {\n${ind(body)}\n}\n`;
    }
    const OUTS = {
      jobs: { esx: ['ESX (SQL)', 'jobs.sql', esxOut], qb: ['QBCore', 'jobs.lua', () => luaOut(false)], qbx: ['Qbox', 'jobs.lua', () => luaOut(true)] },
      gangs: { qb: ['QBCore', 'gangs.lua', () => luaOut(false)], qbx: ['Qbox', 'gangs.lua', () => luaOut(true)] },
    };
    const tabKey = () => (isJobs() ? 'tab' : 'gtab');
    const out = F.output({ title: '', filename: () => OUTS[s.mode][s[tabKey()]][1], lang: 'lua' });
    F.$('.res', root).append(out.el);
    let outTabs = null;
    const drawOutTabs = () => {
      outTabs = F.tabs(Object.entries(OUTS[s.mode]).map(([id, o]) => ({ id, label: o[0] })), (id) => { s[tabKey()] = id; render(); });
      F.$('.out-tabs', root).replaceChildren(outTabs.el);
      if (!OUTS[s.mode][s[tabKey()]]) s[tabKey()] = Object.keys(OUTS[s.mode])[0];
      outTabs.select(s[tabKey()]);
    };
    refreshers.push(F.fields(F.$('.f-opts', root), [
      { key: 'wrap', label: 'Fichier complet (table englobante)', type: 'checkbox', wide: true },
      { key: 'esxWl', label: 'ESX : colonne whitelisted', type: 'checkbox', hint: 'Présente dans ESX legacy ; décoche si ta table jobs ne l’a pas.' },
      { key: 'esxBoss', label: "ESX : grade patron nommé 'boss'", type: 'checkbox', hint: 'esx_society donne l’accès patron au grade dont le nom est « boss ».' },
      { key: 'esxReplace', label: 'ESX : supprimer avant d’insérer (mise à jour)', type: 'checkbox', wide: true },
    ], s, () => render()));

    function warnings() {
      const w = [], items = valid();
      const names = items.map((j) => j.name.trim()), dup = names.filter((n, i) => names.indexOf(n) !== i);
      if (dup.length) w.push(`Noms en double : ${[...new Set(dup)].join(', ')}`);
      for (const j of items) {
        const nums = j.grades.map((r) => r.grade);
        if (!j.grades.length) w.push(`${j.name} : aucun grade.`);
        else if (!nums.includes(0)) w.push(`${j.name} : pas de grade 0 (grade de départ attendu).`);
        if (nums.some((n, i) => nums.indexOf(n) !== i)) w.push(`${j.name} : numéros de grade en double.`);
        if (!/^[a-z0-9_-]+$/.test(j.name.trim())) w.push(`${j.name} : nom technique à garder en minuscules sans espace.`);
      }
      return w;
    }
    function render() {
      const o = OUTS[s.mode][s[tabKey()]];
      if (!o) return;
      out.set(o[2]());
      out.setTitle(o[1]);
      F.$('pre', out.el).className = 'code lang-' + (o[1].endsWith('.sql') ? 'sql' : 'lua');
      F.$$('.f-opts .field', root).forEach((el, i) => { el.style.display = i > 0 && s[tabKey()] !== 'esx' ? 'none' : ''; });
      F.$('.warn-box', root).innerHTML = warnings().map((x) => `<div class="note warn">${F.esc(x)}</div>`).join('');
    }
    function drawAll() {
      if (s.sel >= list().length) s.sel = Math.max(0, list().length - 1);
      drawList(); drawEditor(); drawOutTabs(); render();
    }

    F.$('.tpl', root).addEventListener('change', (e) => {
      const t = TPL[e.target.value]; e.target.value = '';
      if (!t) return;
      list().push(normJob(t)); s.sel = list().length - 1; drawAll();
    });
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-sel]');
      if (chip) { s.sel = +chip.dataset.sel; drawList(); drawEditor(); render(); return; }
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, tr = b.closest('tr[data-i]'), j = cur();
      if (a === 'add') { list().push(normJob({ name: (isJobs() ? 'job' : 'gang') + (list().length + 1), label: isJobs() ? 'Nouveau job' : 'Nouveau gang', grades: [g(0, 'recruit', 'Recrue', isJobs() ? 50 : 0)] })); s.sel = list().length - 1; return drawAll(); }
      if (a === 'imp-add' || a === 'imp-rep') return doImport(a === 'imp-rep');
      if (!j) return;
      if (a === 'dup-job') { list().splice(s.sel + 1, 0, { ...F.clone(j), name: j.name + '_copie' }); s.sel++; return drawAll(); }
      if (a === 'del-job') { list().splice(s.sel, 1); return drawAll(); }
      if (a === 'add-grade') { const n = j.grades.reduce((m, r) => Math.max(m, r.grade), -1) + 1; j.grades.push(g(n, 'grade' + n, 'Grade ' + n, isJobs() ? 50 : 0)); }
      else if (a === 'dup' && tr) { const r = j.grades[tr.dataset.i]; j.grades.splice(+tr.dataset.i + 1, 0, { ...r, grade: r.grade + 1, isboss: false }); }
      else if (a === 'del' && tr) j.grades.splice(+tr.dataset.i, 1);
      else if (a === 'bulk') {
        const rows = F.$('.bulk', editor).value.split(/\r?\n/).map((l) => l.split(/[;\t,|]/).map((x) => x.trim())).filter((p) => p[0] !== '' && Number.isFinite(+p[0]));
        if (!rows.length) return F.toast('Format attendu : grade;nom;label;salaire', 'error');
        j.grades = rows.map((p) => normGrade({ grade: p[0], name: p[1] || 'grade' + p[0], label: p[2] || p[1], salary: p[3], isboss: /^(boss|1|true|oui|x)$/i.test(p[4] || '') || p[1] === 'boss' }, 0));
      } else return;
      drawGrades(); render();
    });

    modeTabs.select(s.mode);
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v || {});
        s.jobs = Array.isArray(s.jobs) ? s.jobs.filter((x) => x && typeof x === 'object').map(normJob) : [];
        s.gangs = Array.isArray(s.gangs) ? s.gangs.filter((x) => x && typeof x === 'object').map(normJob) : [];
        if (s.mode !== 'gangs') s.mode = 'jobs';
        s.sel = Math.max(0, Math.trunc(+s.sel) || 0);
        refreshers.forEach((r) => r.refresh()); modeTabs.select(s.mode);
      },
    };
  },
});
