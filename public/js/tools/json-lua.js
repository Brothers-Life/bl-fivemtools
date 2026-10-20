'use strict';
// Convertisseur JSON ↔ table Lua avec de vrais parseurs (chaînes longues, hex, commentaires…) et erreurs localisées.
Forge.register({
  id: 'json-lua',
  cat: 'convertisseurs',
  name: 'JSON ↔ table Lua',
  desc: 'Convertis un JSON en table Lua et inversement : chaînes [[ ]], commentaires, clés [x] =, tableaux 1..n, erreurs avec numéro de ligne.',
  tags: ['json', 'lua', 'table', 'config', 'convertir', 'parse', 'tableau'],
  icon: 'braces',
  mount(root, F) {
    const DEF = {
      dir: 'lua2json', indent: '2', keys: 'auto', quote: "'", sort: false, inline: true, numKeys: true, trailing: true, prefix: '',
      input: `-- Exemple : config d'un shop
Config.Shop = {
    name = 'Ammu-Nation',
    coords = vector3(22.0, -1107.2, 29.8),
    blip = { sprite = 110, color = 0x1, scale = .8, enabled = true },
    items = {
        { name = "WEAPON_PISTOL", price = 2500, label = [[Pistolet]] },
        { name = 'ammo-9', price = 5, ['max-stack'] = 250 }, -- munitions
    },
    jobs = { 'police', 'sheriff' },
    --[[ désactivé
    discount = 0.1,
    ]]
    [10] = 'clé numérique',
}`,
    };
    const s = F.clone(DEF);
    const RESERVED = new Set('and break do else elseif end false for function goto if in local nil not or repeat return then true until while'.split(' '));

    root.append(F.h(`<div class="stack">
      <div class="row"><div class="jl-tabs"></div><button class="btn sm" data-a="swap" title="Mettre le résultat à gauche et inverser le sens">${F.icon('swap')}Inverser</button>
        <span class="spacer"></span><button class="btn sm ghost" data-a="open">${F.icon('upload')}Ouvrir un fichier</button></div>
      <div class="split">
        <div class="panel stack">
          <div class="panel-head"><h3 class="jl-in-title"></h3><span class="muted small jl-count"></span></div>
          <textarea class="jl-input" rows="22" spellcheck="false"></textarea>
          <div class="jl-err"></div>
        </div>
        <div class="stack">
          <div class="panel"><div class="grid-fields jl-opt"></div></div>
          <div class="jl-out"></div>
          <p class="muted small">Une table vide devient <code>[]</code>. Les <code>vector3(…)</code> deviennent <code>{ "x": …, "y": …, "z": … }</code>. Les variables, fonctions et calculs ne peuvent pas être convertis.</p>
        </div>
      </div>
    </div>`));
    const ta = F.$('.jl-input', root);
    const out = F.output({ title: 'Résultat', filename: () => (s.dir === 'lua2json' ? 'data.json' : 'data.lua'), lang: 'lua' });
    F.$('.jl-out', root).append(out.el);
    const fOpt = F.fields(F.$('.jl-opt', root), [
      { key: 'indent', label: 'Indentation', type: 'select', options: [['2', '2 espaces'], ['4', '4 espaces'], ['tab', 'Tabulation'], ['0', 'Compact (une ligne)']] },
      { key: 'sort', label: 'Trier les clés', type: 'checkbox' },
      { key: 'inline', label: 'Petits tableaux sur une ligne', type: 'checkbox' },
      { key: 'keys', label: 'Clés Lua', type: 'select', options: [['auto', 'name = (crochets si besoin)'], ['brackets', "['name'] = (toujours)"]] },
      { key: 'quote', label: 'Guillemets Lua', type: 'select', options: [["'", "Simples ' '"], ['"', 'Doubles " "']] },
      { key: 'numKeys', label: 'Clés "1" → [1] en Lua', type: 'checkbox', hint: 'JSON ne connaît que des clés texte : les remettre en nombres côté Lua' },
      { key: 'trailing', label: 'Virgule finale en Lua', type: 'checkbox' },
      { key: 'prefix', label: 'Préfixe Lua', placeholder: 'Config.Items = ' },
    ], s, () => render());

    /* --------------------------------- erreurs --------------------------------- */
    const fail = (src, at, msg) => {
      const pre = src.slice(0, at), line = pre.split('\n').length, col = at - pre.lastIndexOf('\n');
      throw Object.assign(new Error(`Ligne ${line}, colonne ${col} : ${msg}`), { line, col, src });
    };

    /* ------------------------------- parseur Lua ------------------------------- */
    const parseLua = (src) => {
      let i = 0;
      const n = src.length, err = (msg, at = i) => fail(src, at, msg);
      const longLevel = () => { const m = /^\[(=*)\[/.exec(src.slice(i, i + 40)); return m ? m[1].length : -1; };
      const readLong = (lv) => {
        const start = i, close = ']' + '='.repeat(lv) + ']';
        i += lv + 2;
        const end = src.indexOf(close, i);
        if (end < 0) err('chaîne ou commentaire long jamais fermé (' + close + ' manquant)', start);
        const str = src.slice(i, end).replace(/^\r?\n/, '');
        i = end + close.length;
        return str;
      };
      const ws = () => {
        for (;;) {
          while (i < n && /\s/.test(src[i])) i++;
          if (src.startsWith('--', i)) { i += 2; const lv = longLevel(); if (lv >= 0) readLong(lv); else while (i < n && src[i] !== '\n') i++; continue; }
          return;
        }
      };
      const expect = (c, what) => { ws(); if (src[i] !== c) err(`« ${c} » attendu${what ? ' ' + what : ''}${i < n ? `, « ${src[i]} » trouvé` : ', fin du texte trouvée'}`); i++; };
      const readStr = () => {
        const q = src[i], start = i;
        let out = '', bytes = [];
        const flush = () => { if (bytes.length) { out += new TextDecoder().decode(new Uint8Array(bytes)); bytes = []; } };
        const ESC = { n: '\n', t: '\t', r: '\r', a: '\x07', b: '\b', f: '\f', v: '\v', '\\': '\\', '"': '"', "'": "'", '\n': '\n' };
        i++;
        for (;;) {
          if (i >= n || src[i] === '\n') err('chaîne jamais fermée', start);
          const c = src[i];
          if (c === q) { i++; flush(); return out; }
          if (c !== '\\') { flush(); out += c; i++; continue; }
          const d = src[i + 1];
          i += 2;
          if (d in ESC) { flush(); out += ESC[d]; }
          else if (d === 'x') { const h = src.slice(i, i + 2); if (!/^[0-9a-f]{2}$/i.test(h)) err('échappement \\x invalide', i - 2); bytes.push(parseInt(h, 16)); i += 2; }
          else if (/\d/.test(d)) { let ds = d; while (ds.length < 3 && /\d/.test(src[i])) ds += src[i++]; if (+ds > 255) err('échappement \\' + ds + ' trop grand', i - ds.length - 1); bytes.push(+ds); }
          else if (d === 'z') { while (i < n && /\s/.test(src[i])) i++; }
          else if (d === 'u') { const m = /^\{([0-9a-f]{1,6})\}/i.exec(src.slice(i)); if (!m || parseInt(m[1], 16) > 0x10ffff) err('échappement \\u{…} invalide', i - 2); flush(); out += String.fromCodePoint(parseInt(m[1], 16)); i += m[0].length; }
          else err(`échappement inconnu « \\${d ?? ''} »`, i - 2);
        }
      };
      const number = () => {
        const m = /^(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/.exec(src.slice(i, i + 80));
        if (!m) return null;
        const start = i;
        i += m[0].length;
        if (/[\w.]/.test(src[i] || '')) err('nombre invalide', start);
        return { t: 'num', raw: m[0], at: start };
      };
      const value = () => {
        ws();
        const c = src[i], at = i;
        if (i >= n) err('valeur attendue, fin du texte trouvée');
        if (c === '{') return table();
        if (c === '"' || c === "'") return { t: 'str', v: readStr() };
        if (c === '[') { const lv = longLevel(); if (lv >= 0) return { t: 'str', v: readLong(lv) }; }
        if (c === '-') { i++; ws(); const num = number(); if (!num) err('nombre attendu après « - »'); num.neg = !num.neg; num.at = at; return num; }
        const num = number();
        if (num) return num;
        const id = /^[A-Za-z_]\w*/.exec(src.slice(i, i + 100));
        if (id) {
          const w = id[0];
          if (w === 'true' || w === 'false') { i += w.length; return { t: 'bool', v: w === 'true' }; }
          if (w === 'nil') { i += 3; return { t: 'nil' }; }
          if (/^vec(?:tor)?[234]$/.test(w)) {
            i += w.length; expect('(', 'après ' + w);
            const vals = [];
            ws();
            while (src[i] !== ')') { const v = value(); if (v.t !== 'num') err('nombre attendu dans ' + w, at); vals.push(v); ws(); if (src[i] === ',') { i++; ws(); } else if (src[i] !== ')') err('« , » ou « ) » attendu'); }
            i++;
            if (vals.length !== Number(w.at(-1))) err(`${w} attend ${w.at(-1)} nombres`, at);
            return { t: 'tbl', items: vals.map((v, k) => ({ k: { t: 'str', v: 'xyzw'[k] }, v })) };
          }
          err(`« ${w} » ne peut pas être converti (variable, fonction ou mot-clé : seules les valeurs littérales sont acceptées)`);
        }
        err(`caractère inattendu « ${c} »`);
      };
      const table = () => {
        const start = i, items = [];
        i++;
        for (;;) {
          ws();
          if (src[i] === '}') { i++; return { t: 'tbl', items }; }
          if (i >= n) err('« } » manquant pour fermer la table ouverte ici', start);
          let k = null;
          const kat = i;
          if (src[i] === '[' && longLevel() < 0) { i++; k = value(); expect(']', 'après la clé'); expect('=', 'après [clé]'); }
          else {
            const m = /^([A-Za-z_]\w*)\s*=(?!=)/.exec(src.slice(i, i + 200));
            if (m && !RESERVED.has(m[1])) { k = { t: 'str', v: m[1] }; i += m[0].length; }
          }
          if (k && k.t === 'nil') err('une clé ne peut pas être nil', kat);
          if (k && k.t === 'tbl') err('une table ne peut pas servir de clé en JSON', kat);
          items.push({ k, v: value(), at: kat });
          ws();
          if (src[i] === ',' || src[i] === ';') { i++; continue; }
          if (src[i] !== '}') err(i >= n ? '« } » manquant pour fermer la table ouverte ici' : `« , » ou « } » attendu, « ${src[i]} » trouvé`, i >= n ? start : i);
        }
      };
      ws();
      const pre = /^(?:return\b|(?:local\s+)?[A-Za-z_][\w.]*(?:\[[^\]\n]*\])*\s*=(?!=))/.exec(src.slice(i, i + 300));
      if (pre) i += pre[0].length;
      const v = value();
      ws();
      if (i < n) err('texte en trop après la valeur (une seule table ou valeur à la fois)');
      return v;
    };

    // Arbre Lua → modèle commun { t: 'obj'|'arr'|'str'|'num'|'bool'|'null' }.
    const jsonNum = (node, src) => {
      const r = node.raw;
      const out = /^(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(r) ? r : /^[1-9]\d*\.$/.test(r) ? r + '0' : String(/^0x/i.test(r) ? parseInt(r, 16) : Number(r));
      if (!Number.isFinite(Number(out))) fail(src, node.at, 'nombre trop grand pour JSON');
      return node.neg ? '-' + out : out;
    };
    const fromLua = (node, src) => {
      if (node.t === 'num') return { t: 'num', raw: jsonNum(node, src) };
      if (node.t === 'nil') return { t: 'null' };
      if (node.t !== 'tbl') return node;
      const map = new Map();
      let pos = 0;
      for (const { k, v } of node.items) {
        let key;
        if (!k) key = ++pos;
        else if (k.t === 'num') { const x = Number(jsonNum(k, src)); key = Number.isInteger(x) ? x : String(x); }
        else if (k.t === 'bool') key = String(k.v);
        else key = k.v;
        map.set(typeof key === 'number' ? 'n:' + key : 's:' + key, { key, v });
      }
      const keys = [...map.values()];
      const ints = keys.every((e) => typeof e.key === 'number' && e.key >= 1);
      if (!keys.length || (ints && Math.max(...keys.map((e) => e.key)) === keys.length)) {
        return { t: 'arr', items: keys.sort((a, b) => a.key - b.key).map((e) => fromLua(e.v, src)) };
      }
      return { t: 'obj', entries: keys.filter((e) => e.v.t !== 'nil').map((e) => [String(e.key), fromLua(e.v, src)]) };
    };

    /* ------------------------------- parseur JSON ------------------------------- */
    const parseJson = (src) => {
      let i = 0;
      const n = src.length, err = (msg, at = i) => fail(src, at, msg);
      const ws = () => {
        while (i < n && /[ \t\r\n﻿]/.test(src[i])) i++;
        if (src.startsWith('//', i) || src.startsWith('/*', i)) err('les commentaires ne sont pas autorisés en JSON');
      };
      const str = () => {
        const start = i;
        let out = '';
        i++;
        for (;;) {
          if (i >= n) err('chaîne jamais fermée', start);
          const c = src[i];
          if (c === '"') { i++; return out; }
          if (c < ' ') err('caractère de contrôle (retour à la ligne ?) interdit dans une chaîne');
          if (c !== '\\') { out += c; i++; continue; }
          const d = src[i + 1];
          const E = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
          if (d in E) { out += E[d]; i += 2; }
          else if (d === 'u' && /^[0-9a-f]{4}$/i.test(src.slice(i + 2, i + 6))) { out += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16)); i += 6; }
          else err(`échappement invalide « \\${d ?? ''} »`);
        }
      };
      const value = () => {
        ws();
        const c = src[i], at = i;
        if (i >= n) err('valeur attendue, fin du texte trouvée');
        if (c === '{') {
          i++; const entries = [];
          ws();
          if (src[i] === '}') { i++; return { t: 'obj', entries }; }
          for (;;) {
            ws();
            if (src[i] !== '"') err(src[i] === '}' ? 'virgule en trop avant « } »' : src[i] === "'" ? 'les clés JSON doivent être entre guillemets doubles' : 'clé entre guillemets attendue');
            const k = str();
            ws(); if (src[i] !== ':') err('« : » attendu après la clé'); i++;
            entries.push([k, value()]);
            ws();
            if (src[i] === ',') { i++; continue; }
            if (src[i] === '}') { i++; return { t: 'obj', entries }; }
            err(i >= n ? '« } » manquant pour fermer l’objet ouvert ici' : '« , » ou « } » attendu', i >= n ? at : i);
          }
        }
        if (c === '[') {
          i++; const items = [];
          ws();
          if (src[i] === ']') { i++; return { t: 'arr', items }; }
          for (;;) {
            ws();
            if (src[i] === ']') err('virgule en trop avant « ] »');
            items.push(value());
            ws();
            if (src[i] === ',') { i++; continue; }
            if (src[i] === ']') { i++; return { t: 'arr', items }; }
            err(i >= n ? '« ] » manquant pour fermer le tableau ouvert ici' : '« , » ou « ] » attendu', i >= n ? at : i);
          }
        }
        if (c === '"') return { t: 'str', v: str() };
        if (c === "'") err('les chaînes JSON doivent être entre guillemets doubles');
        const num = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?/.exec(src.slice(i, i + 80));
        if (num && num[0] !== '-') { i += num[0].length; if (/[\w.]/.test(src[i] || '')) err('nombre invalide', at); return { t: 'num', raw: num[0] }; }
        for (const [w, node] of [['true', { t: 'bool', v: true }], ['false', { t: 'bool', v: false }], ['null', { t: 'null' }]]) if (src.startsWith(w, i) && !/\w/.test(src[i + w.length] || '')) { i += w.length; return node; }
        err(`valeur inattendue « ${src.slice(i, i + 12).split(/[\s,}\]]/)[0] || c} »`);
      };
      const v = value();
      ws();
      if (i < n) err('texte en trop après la valeur JSON');
      return v;
    };

    /* --------------------------------- sortie --------------------------------- */
    const luaQ = (str) => {
      const q = s.quote === '"' ? '"' : "'";
      return q + [...str].map((c) => {
        if (c === '\\') return '\\\\';
        if (c === q) return '\\' + q;
        if (c === '\n') return '\\n';
        if (c === '\r') return '\\r';
        if (c === '\t') return '\\t';
        const code = c.charCodeAt(0);
        return code < 32 || code === 127 ? '\\' + String(code).padStart(3, '0') : c;
      }).join('') + q;
    };
    const luaKey = (k) => {
      if (s.numKeys && /^-?(?:0|[1-9]\d{0,14})$/.test(k)) return `[${k}]`;
      if (s.keys === 'auto' && /^[A-Za-z_]\w*$/.test(k) && !RESERVED.has(k)) return k;
      return `[${luaQ(k)}]`;
    };
    const scalar = (n) => n.t !== 'arr' && n.t !== 'obj';
    const emit = (node, lang) => {
      const json = lang === 'json', compact = s.indent === '0';
      const ind = s.indent === 'tab' ? '\t' : ' '.repeat(Number(s.indent) || 0);
      const end = !json && s.trailing ? ',' : '';
      const rec = (n, d) => {
        if (n.t === 'str') return json ? JSON.stringify(n.v) : luaQ(n.v);
        if (n.t === 'num') return n.raw;
        if (n.t === 'bool') return String(n.v);
        if (n.t === 'null') return json ? 'null' : 'nil';
        const arr = n.t === 'arr';
        let entries = arr ? n.items.map((v) => [null, v]) : n.entries;
        if (!entries.length) return json && arr ? '[]' : '{}';
        if (!arr && s.sort) entries = [...entries].sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }));
        const [o, c] = json && arr ? ['[', ']'] : ['{', '}'];
        const sep = json ? (compact ? ':' : ': ') : (compact ? '=' : ' = ');
        const parts = entries.map(([k, v]) => (k == null ? '' : (json ? JSON.stringify(k) : luaKey(k)) + sep) + rec(v, d + 1));
        if (compact) return o + parts.join(',') + c;
        const one = parts.join(', ');
        if (s.inline && arr && entries.every(([, v]) => scalar(v)) && one.length <= 72) return json ? `[${one}]` : `{ ${one} }`;
        return `${o}\n${parts.map((p) => ind.repeat(d + 1) + p).join(',\n')}${end}\n${ind.repeat(d)}${c}`;
      };
      return rec(node, 0);
    };

    /* --------------------------------- rendu --------------------------------- */
    const tabs = F.tabs([{ id: 'lua2json', label: 'Lua → JSON' }, { id: 'json2lua', label: 'JSON → Lua' }], (id) => { s.dir = id; render(); });
    F.$('.jl-tabs', root).append(tabs.el);
    function render() {
      if (ta.value !== s.input) ta.value = s.input;
      const l2j = s.dir === 'lua2json';
      F.$('.jl-in-title', root).textContent = l2j ? 'Table Lua' : 'JSON';
      ta.placeholder = l2j ? "{ name = 'bread', count = 2 }" : '{ "name": "bread", "count": 2 }';
      out.setTitle(l2j ? 'JSON' : 'Lua');
      F.$('pre', out.el).className = 'code lang-' + (l2j ? 'json' : 'lua');
      F.$$('.jl-opt .field', root).forEach((f, k) => { f.style.opacity = l2j && k >= 3 ? '.45' : ''; });
      const errBox = F.$('.jl-err', root);
      if (!s.input.trim()) { out.set(''); errBox.innerHTML = ''; F.$('.jl-count', root).textContent = ''; return; }
      try {
        const text = s.input.replace(/^﻿/, '');
        const model = l2j ? fromLua(parseLua(text), text) : parseJson(text);
        out.set(l2j ? emit(model, 'json') + '\n' : (s.prefix ? s.prefix.replace(/\s*$/, ' ') : '') + emit(model, 'lua') + '\n');
        errBox.innerHTML = '';
        const count = (n) => (n.t === 'arr' ? n.items.reduce((a, v) => a + count(v), 1) : n.t === 'obj' ? n.entries.reduce((a, [, v]) => a + count(v), 1) : 1);
        F.$('.jl-count', root).textContent = `${count(model)} valeurs`;
      } catch (e) {
        if (!e.line) throw e;
        const lineText = e.src.split('\n')[e.line - 1] || '';
        const shown = lineText.replace(/\t/g, ' ').slice(Math.max(0, e.col - 60), e.col + 40);
        const caret = ' '.repeat(Math.min(e.col - 1, 59)) + '^';
        errBox.innerHTML = `<div class="note error stack" style="gap:6px"><b>${F.esc(e.message)}</b><pre class="code" style="padding:8px;max-height:none">${F.esc(shown)}\n${caret}</pre></div>`;
        out.set('');
        F.$('.jl-count', root).textContent = '';
      }
    }
    ta.addEventListener('input', () => { s.input = ta.value; render(); });
    root.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'swap') {
        if (!out.get().trim()) return F.toast('Rien à inverser : corrige d’abord l’erreur', 'error');
        s.input = out.get().replace(/\n$/, '');
        if (s.dir === 'json2lua' && s.prefix) s.input = s.input.slice(s.prefix.replace(/\s*$/, ' ').length);
        tabs.select(s.dir === 'lua2json' ? 'json2lua' : 'lua2json');
      } else if (a.dataset.a === 'open') {
        const [file] = await F.pickFiles({ accept: '.json,.lua,.txt' });
        if (!file) return;
        if (file.size > 2e6) return F.toast('Fichier trop gros (2 Mo max)', 'error');
        s.input = await F.readText(file);
        tabs.select(/\.json$/i.test(file.name) ? 'json2lua' : 'lua2json');
      }
    });

    tabs.select(s.dir);
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v && typeof v === 'object' ? v : {});
        s.input = String(s.input ?? '');
        if (s.dir !== 'json2lua') s.dir = 'lua2json';
        fOpt.refresh();
        tabs.select(s.dir);
      },
    };
  },
});
