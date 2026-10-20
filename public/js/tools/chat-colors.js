'use strict';
// Couleurs FiveM ^0…^9 : éditeur avec aperçu liste des serveurs + chat, sorties sv_hostname, chat:addMessage et template HTML.
Forge.register({
  id: 'chat-colors',
  cat: 'textes',
  name: 'Couleurs du chat & nom de serveur',
  desc: 'Codes ^0…^9, ^* gras, ^_ souligné : aperçu liste des serveurs et chat, sv_hostname, chat:addMessage et template.',
  tags: ['chat', 'couleur', 'caret', 'sv_hostname', 'hostname', 'nom serveur', 'addmessage', 'template', 'server.cfg', 'projectname'],
  icon: 'chat',
  mount(root, F) {
    // Couleurs du chat par défaut (resource chat de cfx) ; ^7 n'a pas de couleur dédiée → blanc.
    const CHAT = ['#ffffff', '#ff4444', '#99cc00', '#ffbb33', '#0099cc', '#33b5e5', '#aa66cc', '#ffffff', '#cc0000', '#cc0068'];
    // Liste des serveurs (approximatif, l'interface évolue).
    const LIST = ['#ffffff', '#f44336', '#4caf50', '#ffeb3b', '#42a5f5', '#03a9f4', '#9c27b0', '#ffffff', '#ff5722', '#9e9e9e'];
    const NAMES = ['Blanc', 'Rouge', 'Vert', 'Jaune', 'Bleu', 'Bleu clair', 'Violet', 'Blanc', 'Rouge foncé (chat) · orange (liste)', 'Rose (chat) · gris (liste)'];
    const STYLES = [['*', 'Gras', '<b>G</b>'], ['_', 'Souligné', '<u>S</u>'], ['~', 'Barré', '<s>B</s>'], ['=', 'Souligné + barré', '<u><s>SB</s></u>'], ['r', 'Réinitialiser les styles', '^r']];
    const DEF = {
      host: '^3Brothers ^7Life ^9| ^2Serious RP ^9| ^5discord.gg/brotherslife', author: '^1[Staff] ^0Admin', message: 'Bienvenue sur ^3Brothers Life^0 ! ^*Bon jeu^r à tous.',
      color: '#ffffff', multiline: true, side: 'server', target: 'all',
      tplBg: '#1c1c22', tplAlpha: 0.75, tplAccent: '#ff7a18', tplRadius: 6, tplBold: true,
    };
    const s = F.clone(DEF);

    if (!document.getElementById('cc-style')) document.head.append(F.h(`<style id="cc-style">
      .cc-bar{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
      .cc-c{width:28px;height:28px;border-radius:7px;border:1px solid var(--line-strong);font:700 12px var(--mono);cursor:pointer;color:#fff;text-shadow:0 1px 2px #000;padding:0}
      .cc-c.light{color:#111;text-shadow:none}
      .cc-sep{width:1px;height:22px;background:var(--line-strong);margin:0 4px}
      .cc-list{border-radius:var(--r);background:#0e0e10;border:1px solid var(--line);padding:6px;font-family:Montserrat,"Segoe UI",Arial,sans-serif}
      .cc-row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;background:#19191c;color:#ddd}
      .cc-ico{width:44px;height:44px;border-radius:8px;flex-shrink:0;background:var(--brand-grad);display:grid;place-items:center;font:800 15px var(--font);color:#1b0f05}
      .cc-name{font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
      .cc-meta{font-size:12px;color:#8a8a90;display:flex;gap:10px;margin-top:2px}
      .cc-pl{margin-left:auto;text-align:right;font-size:13px;color:#ccc;white-space:nowrap}
      .cc-pl small{display:block;color:#6fbf73;font-size:11px}
      .cc-scene{position:relative;min-height:220px;border-radius:var(--r);overflow:hidden;padding:14px;border:1px solid var(--line);
        background:linear-gradient(180deg,#1d2b44 0%,#3b587c 45%,#b9785f 72%,#232225 72.5%,#151417 100%)}
      .cc-chat{width:min(100%,460px);background:rgba(52,73,94,.7);padding:8px 10px;color:#fff;font:15px/1.45 Lato,"Segoe UI",Arial,sans-serif;text-shadow:1px 1px 1px rgba(0,0,0,.6);word-wrap:break-word}
      .cc-chat .msg{margin:2px 0;white-space:pre-wrap}
      .cc-input{width:min(100%,460px);margin-top:6px;background:rgba(44,62,80,1);color:#ccc;font:14px Lato,Arial,sans-serif;padding:6px 10px}
      .cc-legend td{padding:5px 10px}
    </style>`));

    root.append(F.h(`<div class="split">
      <div class="stack">
        <div class="panel stack">
          <div class="panel-head"><h3>Texte</h3><span class="muted small">insère dans le champ actif</span></div>
          <div class="cc-bar">
            ${CHAT.map((c, i) => `<button class="cc-c${i === 0 || i === 7 || i === 3 ? ' light' : ''}" data-c="${i}" title="^${i} ${NAMES[i]}" style="background:${c}">${i}</button>`).join('')}
            <span class="cc-sep"></span>
            ${STYLES.map(([k, l, ico]) => `<button class="btn sm" data-st="${k}" title="^${k} ${l}">${ico}</button>`).join('')}
          </div>
          <div class="grid-fields cc-f"></div>
          <div class="cc-warn"></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Message chat</h3><span class="muted small">chat:addMessage</span></div>
          <div class="grid-fields cc-opt"></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Template HTML</h3><span class="muted small">bulle stylée avec {0} = auteur, {1} = message</span></div>
          <div class="grid-fields cc-tpl"></div>
        </div>
        <div class="table-wrap"><table class="table cc-legend"><thead><tr><th>Code</th><th>Chat</th><th>Liste des serveurs</th><th>Nom</th></tr></thead><tbody>
          ${CHAT.map((c, i) => `<tr><td><code>^${i}</code></td><td><span class="swatch" style="background:${c}"></span> <code class="small">${c}</code></td><td><span class="swatch" style="background:${LIST[i]}"></span> <code class="small">${LIST[i]}</code></td><td class="small">${NAMES[i]}</td></tr>`).join('')}
          ${STYLES.map(([k, l]) => `<tr><td><code>^${k}</code></td><td colspan="2" class="muted small">chat uniquement</td><td class="small">${l}</td></tr>`).join('')}
        </tbody></table></div>
      </div>
      <div class="stack sticky">
        <div class="stack" style="gap:6px"><span class="muted small">Liste des serveurs (aperçu approximatif)</span>
          <div class="cc-list"><div class="cc-row"><div class="cc-ico">BL</div><div style="min-width:0"><div class="cc-name"></div><div class="cc-meta"><span>Roleplay</span><span>FR</span><span>OneSync</span></div></div><div class="cc-pl">48 / 128<small>● 32 ms</small></div></div></div></div>
        <div class="stack" style="gap:6px"><span class="muted small">Chat en jeu (thème par défaut)</span>
          <div class="cc-scene"><div class="cc-chat"></div><div class="cc-input">Tape ton message…</div></div></div>
        <div class="cc-out stack"></div>
      </div>
    </div>`));

    const onChange = () => render();
    const fText = F.fields(F.$('.cc-f', root), [
      { key: 'host', label: 'Nom du serveur (sv_hostname)', wide: true },
      { key: 'author', label: 'Auteur (args[1])', wide: true, hint: 'Laisser vide pour un message sans auteur' },
      { key: 'message', label: 'Message (args[2])', type: 'textarea', rows: 3, wide: true },
    ], s, onChange);
    const fOpt = F.fields(F.$('.cc-opt', root), [
      { key: 'color', label: 'Couleur de base (color)', type: 'color' },
      { key: 'side', label: 'Côté', type: 'select', options: [['server', 'Serveur (TriggerClientEvent)'], ['client', 'Client (TriggerEvent)']] },
      { key: 'target', label: 'Destinataire (serveur)', type: 'select', options: [['all', 'Tout le monde (-1)'], ['source', 'Le joueur (source)']] },
      { key: 'multiline', label: 'multiline', type: 'checkbox' },
    ], s, onChange);
    const fTpl = F.fields(F.$('.cc-tpl', root), [
      { key: 'tplBg', label: 'Fond', type: 'color' }, { key: 'tplAlpha', label: 'Opacité du fond', type: 'range', min: 0, max: 1, step: 0.05 },
      { key: 'tplAccent', label: 'Bordure gauche', type: 'color' }, { key: 'tplRadius', label: 'Arrondi (px)', type: 'range', min: 0, max: 16, step: 1 },
      { key: 'tplBold', label: 'Auteur en gras', type: 'checkbox' },
    ], s, onChange);

    const outCfg = F.output({ title: 'server.cfg', lang: 'cfg' });
    const outMsg = F.output({ title: 'chat:addMessage', filename: 'chat_message.lua', lang: 'lua' });
    const outTpl = F.output({ title: 'chat:addMessage (template)', filename: 'chat_template.lua', lang: 'lua' });
    F.$('.cc-out', root).append(outCfg.el, outMsg.el, outTpl.el);

    /* ------------------------------ rendu ------------------------------ */
    const colorize = (str, palette, styles = true) => {
      let html = '', col = null, bo = false, un = false, st = false;
      for (const p of String(str ?? '').split(/(\^[0-9*_~=r])/)) {
        if (!p) continue;
        const m = /^\^(.)$/.exec(p);
        if (m) {
          const k = m[1];
          if (/\d/.test(k)) col = palette[k];
          else if (!styles) continue;
          else if (k === '*') bo = true;
          else if (k === '_') un = true;
          else if (k === '~') st = true;
          else if (k === '=') un = st = true;
          else bo = un = st = false;
          continue;
        }
        const deco = [un && 'underline', st && 'line-through'].filter(Boolean).join(' ');
        html += `<span style="${col ? `color:${col};` : ''}${bo ? 'font-weight:700;' : ''}${deco ? `text-decoration:${deco};` : ''}">${F.esc(p)}</span>`;
      }
      return html;
    };
    const rgb = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); const n = m ? parseInt(m[1], 16) : 0xffffff; return [n >> 16, (n >> 8) & 255, n & 255]; };
    const tplHtml = () => {
      const [r, g, b] = rgb(s.tplBg), a = Math.round((Number(s.tplAlpha) || 0) * 100) / 100;
      const style = `padding: 6px 10px; margin: 4px 0; background-color: rgba(${r}, ${g}, ${b}, ${a}); border-left: 4px solid #${rgb(s.tplAccent).map((v) => v.toString(16).padStart(2, '0')).join('')}; border-radius: ${Number(s.tplRadius) || 0}px;`;
      return s.author.trim() ? `<div style="${style}">${s.tplBold ? '<b>{0}</b>' : '{0}'} : {1}</div>` : `<div style="${style}">{0}</div>`;
    };
    const fill = (tpl, args) => tpl.replace(/\{(\d)\}/g, (_, i) => colorize(args[i] ?? '', CHAT));
    const head = () => (s.side === 'client' ? "TriggerEvent('chat:addMessage', {" : `TriggerClientEvent('chat:addMessage', ${s.target === 'source' ? 'source' : '-1'}, {`);
    const argsLua = () => (s.author.trim() ? `{ ${F.luaStr(s.author)}, ${F.luaStr(s.message)} }` : `{ ${F.luaStr(s.message)} }`);

    function render() {
      F.$('.cc-name', root).innerHTML = colorize(s.host, LIST, false) || '<span style="opacity:.4">Nom du serveur</span>';
      const base = `rgb(${rgb(s.color).join(', ')})`;
      const twoArgs = !!s.author.trim();
      const msgText = s.multiline ? s.message : s.message.replace(/\n/g, ' ');
      F.$('.cc-chat', root).innerHTML = `<div class="msg" style="opacity:.75">${colorize('^2[BL]^0 Serveur prêt.', CHAT)}</div>
        <div class="msg" style="color:${base}">${twoArgs ? `<b>${colorize(s.author, CHAT)}</b>: ${colorize(msgText, CHAT)}` : colorize(msgText, CHAT)}</div>
        <div class="msg">${fill(tplHtml(), twoArgs ? [s.author, msgText] : [msgText])}</div>`;

      const warn = [];
      if (s.host.includes('"')) warn.push('Le nom du serveur contient un guillemet " : il casserait la ligne sv_hostname.');
      if (/\^[^0-9*_~=r]/.test(s.host + s.author + s.message)) warn.push('Un ^ suivi d’un caractère non reconnu sera affiché tel quel.');
      F.$('.cc-warn', root).innerHTML = warn.map((w) => `<div class="note warn">${F.esc(w)}</div>`).join('');

      const host = s.host.replace(/"/g, '');
      outCfg.set(`sv_hostname "${host}"\nsets sv_projectName "${host}"\n`);
      const c = rgb(s.color);
      outMsg.set(`${s.side === 'client' ? '-- client.lua' : `-- server.lua : ${s.target === 'source' ? 'au joueur qui a déclenché l’événement' : 'à tous les joueurs'}`}
${head()}
    color = { ${c.join(', ')} },
    multiline = ${!!s.multiline},
    args = ${argsLua()}
})
`);
      outTpl.set(`-- {0} = premier argument, {1} = second (les codes ^ sont aussi colorés)
${head()}
    template = ${F.luaStr(tplHtml())},
    args = ${argsLua()}
})
`);
    }

    /* ---------------------------- insertion ---------------------------- */
    let active = F.$('.cc-f input', root);
    F.$('.cc-f', root).addEventListener('focusin', (e) => { if (e.target.matches('input, textarea')) active = e.target; });
    const insert = (before, after = '') => {
      const el = active, a = el.selectionStart ?? el.value.length, b = el.selectionEnd ?? a, v = el.value;
      const sel = v.slice(a, b);
      el.value = v.slice(0, a) + before + sel + (sel ? after : '') + v.slice(b);
      el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    root.addEventListener('mousedown', (e) => { if (e.target.closest('[data-c],[data-st]')) e.preventDefault(); });
    root.addEventListener('click', (e) => {
      const c = e.target.closest('[data-c]'), st = e.target.closest('[data-st]');
      if (c) insert('^' + c.dataset.c, c.dataset.c === '0' ? '' : '^0');
      else if (st) insert('^' + st.dataset.st, st.dataset.st === 'r' ? '' : '^r');
    });

    render();
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v && typeof v === 'object' ? v : {});
        ['host', 'author', 'message'].forEach((k) => { s[k] = String(s[k] ?? ''); });
        [fText, fOpt, fTpl].forEach((f) => f.refresh());
        render();
      },
    };
  },
});
