'use strict';
/*
 * Noyau de BL Forge : registre des outils et aides partagées (window.Forge).
 *
 * Un outil = un fichier public/js/tools/<id>.js (chargé dans index.html) qui appelle :
 *
 *   Forge.register({
 *     id: 'handling',                 // [a-z0-9-], unique (sert à l'URL #/outil/<id> et aux projets)
 *     cat: 'vehicules',               // une clé de Forge.CATEGORIES
 *     name: 'Éditeur handling.meta',
 *     desc: 'Une phrase qui dit ce que fait l’outil.',
 *     tags: ['handling', 'meta'],     // mots-clés pour la recherche
 *     icon: 'car',                    // une clé de Forge.ICONS
 *     mount(root, F) {                // root : élément vide à remplir ; F === Forge
 *       ...
 *       return { getState() {}, setState(s) {} };   // facultatif : active la sauvegarde de projets
 *     },
 *   });
 *
 * getState() renvoie un objet JSON (moins de 1 Mo) ; setState(s) le recharge (s peut venir d'une
 * version plus ancienne de l'outil : compléter avec des valeurs par défaut). Rien n'est envoyé au
 * serveur sauf quand la personne clique « Sauvegarder ». Le brouillon est aussi gardé dans le navigateur.
 */
(function () {
  const tools = [];
  const F = {
    tools,
    CATEGORIES: {
      vehicules: { name: 'Véhicules', icon: 'car', desc: 'Handling, metas, packs addon' },
      vetements: { name: 'Vêtements', icon: 'shirt', desc: 'Packs addon, noms de fichiers, metas' },
      scripts: { name: 'Scripts & config', icon: 'code', desc: 'fxmanifest, items, jobs, blips, server.cfg' },
      textes: { name: 'Textes & couleurs', icon: 'type', desc: 'Couleurs GTA, notifications, chat' },
      convertisseurs: { name: 'Convertisseurs', icon: 'swap', desc: 'Hash, coordonnées, JSON ↔ Lua, couleurs' },
    },
    register(def) {
      if (!def || !/^[a-z0-9-]{1,40}$/.test(def.id) || tools.some((t) => t.id === def.id)) { console.error('[forge] outil invalide ou en double', def && def.id); return; }
      if (!F.CATEGORIES[def.cat]) console.warn('[forge] catégorie inconnue', def.cat);
      tools.push({ tags: [], icon: 'tool', ...def });
    },
  };

  /* ------------------------------- DOM ------------------------------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  F.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
  F.$ = (sel, root = document) => root.querySelector(sel);
  F.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // Crée un élément à partir de HTML (penser à F.esc pour les valeurs venant de l'utilisateur).
  F.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content; };
  F.debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  F.uid = () => Math.random().toString(36).slice(2, 10);
  // Nom de ressource / fichier sûr : minuscules, chiffres, _ et -.
  F.slug = (s, sep = '_') => { const r = String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_-]+/g, sep); return sep ? r.replace(new RegExp(`^${sep}+|${sep}+$`, 'g'), '') : r; };
  F.pad = (n, len = 3) => String(n).padStart(len, '0');
  F.clone = (o) => JSON.parse(JSON.stringify(o));

  /* ------------------------------ icônes ------------------------------ */
  const svg = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  F.ICONS = {
    car: svg('<path d="M5 17h14M3 13l2-6a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 7l2 6v4a1 1 0 0 1-1 1h-1M4 18H3v-5h18"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/>'),
    shirt: svg('<path d="M8 3 4 5 2 9l3 2 1-1v11h12V10l1 1 3-2-2-4-4-2a4 4 0 0 1-8 0Z"/>'),
    code: svg('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'),
    type: svg('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>'),
    swap: svg('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
    tool: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z"/>'),
    gauge: svg('<path d="M12 14l4-4M3.3 17a9 9 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1.5"/>'),
    file: svg('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/>'),
    box: svg('<path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10"/>'),
    palette: svg('<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.4-1-1.6-1-2.8 0-.9.7-1.7 1.7-1.7H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>'),
    pin: svg('<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>'),
    hash: svg('<path d="M5 9h14M4 15h14M10 3 8 21M16 3l-2 18"/>'),
    briefcase: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
    server: svg('<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>'),
    chat: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>'),
    braces: svg('<path d="M8 3H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"/>'),
    tag: svg('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    layers: svg('<path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5"/>'),
    zap: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    home: svg('<path d="M3 11 12 3l9 8M5 9v11h14V9"/>'),
    folder: svg('<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>'),
    copy: svg('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'),
    download: svg('<path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/>'),
    upload: svg('<path d="M12 21V9m0 0-5 5m5-5 5 5M4 3h16"/>'),
    save: svg('<path d="M5 3h11l5 5v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M7 3v5h8V3M7 21v-7h10v7"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    x: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
    menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    discord: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1a15.7 15.7 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17 17 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3-1.7.8 1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7ZM8.5 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm7 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z"/></svg>',
  };
  F.icon = (name) => F.ICONS[name] || F.ICONS.tool;

  /* ------------------------------ messages ----------------------------- */
  F.toast = (msg, type = 'ok') => {
    let box = F.$('#toasts');
    if (!box) { box = F.h('<div id="toasts" aria-live="polite"></div>'); document.body.append(box); }
    const t = F.h(`<div class="toast ${type}">${F.esc(msg)}</div>`);
    box.append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, type === 'error' ? 5000 : 2600);
  };

  /* --------------------------- presse-papiers --------------------------- */
  F.copy = async (text, label = 'Copié') => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = F.h('<textarea style="position:fixed;opacity:0"></textarea>');
      ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    F.toast(label);
  };

  /* ---------------------------- fichiers ---------------------------- */
  F.download = (filename, content, mime = 'text/plain;charset=utf-8') => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  F.readText = (file) => file.text();
  F.readBytes = async (file) => new Uint8Array(await file.arrayBuffer());
  // Ouvre le sélecteur de fichiers ; renvoie une liste de File (vide si annulé).
  F.pickFiles = ({ accept = '', multiple = false } = {}) => new Promise((resolve) => {
    const i = Object.assign(document.createElement('input'), { type: 'file', accept, multiple });
    i.addEventListener('change', () => resolve([...i.files]));
    i.click();
  });
  // Zone de dépôt : el reçoit la classe .drag pendant le survol ; cb(listeDeFile).
  F.dropZone = (el, cb) => {
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drag'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag'));
    el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('drag'); if (e.dataTransfer.files.length) cb([...e.dataTransfer.files]); });
  };

  /* ------------------------------ zip ------------------------------- */
  // Archive .zip sans compression. files : [{ name: 'dossier/fichier.lua', data: string | Uint8Array }]
  const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
  F.crc32 = (bytes) => { let c = 0xffffffff; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  F.zip = (files) => {
    const enc = new TextEncoder(), parts = [], central = [];
    let offset = 0;
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    for (const f of files) {
      const name = enc.encode(f.name.replace(/\\/g, '/'));
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = F.crc32(data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint16(10, time, true); local.setUint16(12, date, true); local.setUint32(14, crc, true);
      local.setUint32(18, data.length, true); local.setUint32(22, data.length, true); local.setUint16(26, name.length, true);
      parts.push(local, name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
      c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(c, name);
      offset += 30 + name.length + data.length;
    }
    const size = central.reduce((s, p) => s + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, size, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, end], { type: 'application/zip' });
  };

  /* ------------------------------ hash ------------------------------ */
  // GetHashKey / joaat de GTA V (insensible à la casse). Renvoie un entier non signé 32 bits.
  F.joaat = (str) => {
    const s = String(str).toLowerCase();
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h + s.charCodeAt(i)) >>> 0;
      h = (h + (h << 10)) >>> 0;
      h = (h ^ (h >>> 6)) >>> 0;
    }
    h = (h + (h << 3)) >>> 0;
    h = (h ^ (h >>> 11)) >>> 0;
    return (h + (h << 15)) >>> 0;
  };
  F.signed32 = (n) => n | 0;
  F.hex32 = (n) => '0x' + (n >>> 0).toString(16).toUpperCase().padStart(8, '0');

  /* ------------------------------ XML ------------------------------- */
  F.xml = {
    // Analyse un texte XML (les metas de GTA) ; lève une erreur lisible si invalide.
    parse(text) {
      const doc = new DOMParser().parseFromString(String(text).replace(/^﻿/, ''), 'application/xml');
      const err = doc.querySelector('parsererror');
      if (err) throw new Error('XML invalide : ' + (err.textContent.split('\n').find((l) => l.trim()) || '').trim().slice(0, 160));
      return doc;
    },
    // Enfants directs portant ce nom.
    kids: (el, name) => [...el.children].filter((c) => !name || c.tagName === name),
    kid: (el, name) => [...el.children].find((c) => c.tagName === name) || null,
    // Valeur d'une balise du type <fMass value="1500.0" /> ou <handlingName>ADDER</handlingName>.
    val(el, name) {
      const k = F.xml.kid(el, name);
      if (!k) return null;
      return k.hasAttribute('value') ? k.getAttribute('value') : k.textContent.trim();
    },
    // Ré-indente un document XML (2 espaces), avec l'en-tête <?xml ... ?>.
    pretty(doc) {
      const out = ['<?xml version="1.0" encoding="UTF-8"?>'];
      const walk = (el, depth) => {
        const pad = '  '.repeat(depth);
        const attrs = [...el.attributes].map((a) => ` ${a.name}="${F.esc(a.value).replace(/&#39;/g, "'")}"`).join('');
        const kids = [...el.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()) || n.nodeType === 8);
        if (!kids.length) return out.push(`${pad}<${el.tagName}${attrs} />`);
        if (kids.length === 1 && kids[0].nodeType === 3) return out.push(`${pad}<${el.tagName}${attrs}>${F.esc(kids[0].textContent.trim()).replace(/&#39;/g, "'")}</${el.tagName}>`);
        out.push(`${pad}<${el.tagName}${attrs}>`);
        for (const k of kids) {
          if (k.nodeType === 1) walk(k, depth + 1);
          else if (k.nodeType === 8) out.push(`${pad}  <!--${k.textContent}-->`);
          else out.push(pad + '  ' + F.esc(k.textContent.trim()));
        }
        out.push(`${pad}</${el.tagName}>`);
      };
      walk(doc.documentElement, 0);
      return out.join('\n') + '\n';
    },
  };

  /* --------------------------- Lua / texte --------------------------- */
  // Chaîne Lua entre guillemets simples.
  F.luaStr = (s) => "'" + String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
  // Chaîne SQL entre guillemets simples.
  F.sqlStr = (s) => "'" + String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
  // Nombre formaté pour les metas (toujours avec décimale : 1 -> 1.000000).
  F.num = (n, digits = 6) => { const v = Number(n); return Number.isFinite(v) ? v.toFixed(digits) : (0).toFixed(digits); };
  // Nombre court sans zéros inutiles (1.50 -> 1.5, 2 -> 2.0 si keepDot).
  F.short = (n, keepDot = false) => { const v = Number(n); if (!Number.isFinite(v)) return '0'; let s = String(Math.round(v * 1e6) / 1e6); if (keepDot && !s.includes('.') && !s.includes('e')) s += '.0'; return s; };

  /* ------------------------------ formulaires ------------------------------ */
  /*
   * Construit des champs liés à un objet d'état.
   *   F.fields(container, defs, state, onChange)
   * defs : [{ key, label, type: 'text'|'number'|'select'|'checkbox'|'textarea'|'color'|'range',
   *           options: [['valeur','Libellé'], ...] ou ['a','b'], hint, placeholder, min, max, step, wide: bool }]
   * Les valeurs sont écrites dans state[key] (nombres pour number/range, booléens pour checkbox).
   * Renvoie { refresh() } pour remettre les champs à jour après un changement de state.
   */
  F.fields = (container, defs, state, onChange = () => {}) => {
    const inputs = [];
    for (const d of defs) {
      const id = 'f_' + F.uid();
      const wrap = F.h(`<div class="field${d.wide ? ' wide' : ''}${d.type === 'checkbox' ? ' check' : ''}"></div>`);
      let input;
      if (d.type === 'select') {
        const opts = (d.options || []).map((o) => (Array.isArray(o) ? o : [o, o]));
        input = F.h(`<select id="${id}">${opts.map(([v, l]) => `<option value="${F.esc(v)}">${F.esc(l)}</option>`).join('')}</select>`);
      } else if (d.type === 'textarea') {
        input = F.h(`<textarea id="${id}" rows="${d.rows || 4}" placeholder="${F.esc(d.placeholder || '')}" spellcheck="false"></textarea>`);
      } else {
        const type = d.type === 'range' ? 'range' : d.type === 'number' ? 'number' : d.type === 'checkbox' ? 'checkbox' : d.type === 'color' ? 'color' : 'text';
        input = F.h(`<input id="${id}" type="${type}" placeholder="${F.esc(d.placeholder || '')}"${d.min != null ? ` min="${d.min}"` : ''}${d.max != null ? ` max="${d.max}"` : ''}${d.step != null ? ` step="${d.step}"` : type === 'number' ? ' step="any"' : ''} spellcheck="false">`);
      }
      const label = `<label for="${id}">${F.esc(d.label)}${d.hint ? ` <span class="hint" title="${F.esc(d.hint)}">?</span>` : ''}</label>`;
      if (d.type === 'checkbox') { wrap.append(input); wrap.append(F.h(label)); }
      else { wrap.append(F.h(label)); wrap.append(input); }
      let out = null;
      if (d.type === 'range') { out = F.h('<output></output>'); wrap.append(out); }
      const read = () => {
        let v = d.type === 'checkbox' ? input.checked : input.value;
        if (d.type === 'number' || d.type === 'range') v = input.value === '' ? 0 : Number(input.value);
        state[d.key] = v;
        if (out) out.textContent = v;
        onChange(d.key, v);
      };
      input.addEventListener(d.type === 'checkbox' || d.type === 'select' || d.type === 'color' ? 'change' : 'input', read);
      const write = () => {
        const v = state[d.key] ?? d.default ?? (d.type === 'checkbox' ? false : '');
        if (d.type === 'checkbox') input.checked = !!v; else input.value = v;
        if (out) out.textContent = v;
      };
      write();
      inputs.push(write);
      container.append(wrap);
    }
    return { refresh: () => inputs.forEach((w) => w()) };
  };

  /*
   * Bloc de sortie (code généré) avec boutons Copier / Télécharger.
   *   const out = F.output({ title: 'fxmanifest.lua', filename: 'fxmanifest.lua', lang: 'lua' });
   *   root.append(out.el); out.set(texte);
   * filename peut être une fonction (nom calculé au moment du téléchargement).
   */
  F.output = ({ title = 'Résultat', filename = null, lang = '' } = {}) => {
    const el = F.h(`<div class="output">
      <div class="output-head"><span class="output-title">${F.esc(title)}</span><span class="spacer"></span>
        <button class="btn sm ghost" data-a="copy">${F.icon('copy')}Copier</button>
        ${filename ? `<button class="btn sm ghost" data-a="dl">${F.icon('download')}Télécharger</button>` : ''}
      </div>
      <pre class="code lang-${F.esc(lang)}"><code></code></pre></div>`);
    let text = '';
    const code = F.$('code', el);
    F.$('[data-a=copy]', el).onclick = () => F.copy(text);
    if (filename) F.$('[data-a=dl]', el).onclick = () => F.download(typeof filename === 'function' ? filename() : filename, text);
    return {
      el,
      set(t) { text = String(t); code.textContent = text; },
      get: () => text,
      setTitle(t) { F.$('.output-title', el).textContent = t; },
    };
  };

  /* -------------------------------- onglets -------------------------------- */
  // F.tabs([{ id, label }], onSelect) → { el, select(id) }
  F.tabs = (items, onSelect) => {
    const el = F.h(`<div class="tabs" role="tablist">${items.map((t) => `<button role="tab" data-id="${F.esc(t.id)}">${F.esc(t.label)}</button>`).join('')}</div>`);
    const select = (id) => { F.$$('button', el).forEach((b) => b.classList.toggle('on', b.dataset.id === id)); onSelect(id); };
    el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) select(b.dataset.id); });
    return { el, select };
  };

  /* ------------------------------ réseau ------------------------------ */
  F.api = async (method, url, body) => {
    const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    let d = {};
    try { d = await r.json(); } catch { /* vide */ }
    if (!r.ok) throw Object.assign(new Error(d.error || 'HTTP ' + r.status), { status: r.status });
    return d;
  };

  /* ---------------------------- stockage local ---------------------------- */
  F.local = {
    get(k, def = null) { try { const v = localStorage.getItem('forge:' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
    set(k, v) { try { localStorage.setItem('forge:' + k, JSON.stringify(v)); } catch { /* plein ou bloqué */ } },
    del(k) { try { localStorage.removeItem('forge:' + k); } catch { /* bloqué */ } },
  };

  window.Forge = F;
})();
