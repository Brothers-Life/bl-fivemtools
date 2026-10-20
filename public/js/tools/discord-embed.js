'use strict';
// Générateur d'embed Discord pour les logs FiveM : aperçu style Discord, fonction Lua sendLog (PerformHttpRequest) et JSON brut.
Forge.register({
  id: 'discord-embed',
  cat: 'textes',
  name: 'Embed Discord (logs)',
  desc: 'Compose un embed (titre, champs, couleur, image…) avec aperçu Discord, et récupère la fonction Lua sendLog prête à l’emploi.',
  tags: ['discord', 'embed', 'webhook', 'logs', 'performhttprequest', 'json', 'sendlog'],
  icon: 'discord',
  mount(root, F) {
    const PRESETS = [['#57f287', 'Vert'], ['#ed4245', 'Rouge'], ['#fee75c', 'Jaune'], ['#5865f2', 'Blurple'], ['#eb459e', 'Fuchsia'], ['#ff7a18', 'Orange'], ['#99aab5', 'Gris']];
    const DEF = {
      webhook: '', username: 'BL Logs', avatar: '',
      color: '#57f287', authorName: '', authorIcon: '', authorUrl: '',
      title: 'Joueur connecté', url: '', description: '**John Doe** vient de rejoindre le serveur.\n> ID serveur : `12`',
      fields: [{ name: 'Steam', value: 'steam:1100001000056ba', inline: true }, { name: 'Discord', value: '<@123456789012345678>', inline: true }, { name: 'Job', value: 'police', inline: true }],
      thumbnail: '', image: '', footerText: 'Brothers Life • Logs', footerIcon: '', timestamp: true, fn: 'sendLog', exportFn: false,
    };
    const s = F.clone(DEF);

    if (!document.getElementById('de-style')) document.head.append(F.h(`<style id="de-style">
      .de-prev{--d-bg:#313338;--d-text:#dbdee1;--d-head:#f2f3f5;--d-muted:#949ba4;--d-embed:#2b2d31;--d-link:#00a8fc;--d-code:#1e1f22;--d-quote:#4e5058;--d-mention:rgba(88,101,242,.3);
        background:var(--d-bg);color:var(--d-text);border-radius:var(--r);padding:16px 16px 18px 12px;display:flex;gap:14px;font:15px/1.375 "gg sans","Noto Sans","Helvetica Neue",Arial,sans-serif;border:1px solid var(--line);overflow:hidden}
      :root[data-theme="light"] .de-prev{--d-bg:#ffffff;--d-text:#313338;--d-head:#060607;--d-muted:#5c5e66;--d-embed:#f2f3f5;--d-link:#006ce7;--d-code:#e3e5e8;--d-quote:#c4c9ce;--d-mention:rgba(88,101,242,.15)}
      .de-av{width:40px;height:40px;border-radius:50%;flex-shrink:0;background:#5865f2;color:#fff;display:grid;place-items:center;object-fit:cover}
      .de-av svg{width:24px;height:24px}
      .de-body{min-width:0;flex:1}
      .de-user{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
      .de-user b{color:var(--d-head);font-weight:600}
      .de-tag{background:#5865f2;color:#fff;font-size:10px;font-weight:600;padding:1px 5px;border-radius:4px;line-height:15px}
      .de-time{color:var(--d-muted);font-size:12px}
      .de-embed{margin-top:4px;display:grid;grid-template-columns:minmax(0,1fr) auto;max-width:516px;background:var(--d-embed);border-left:4px solid;border-radius:4px;padding:8px 16px 16px 12px}
      .de-embed>*{grid-column:1/2;min-width:0}
      .de-author{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:14px;font-weight:600;color:var(--d-head)}
      .de-author img{width:24px;height:24px;border-radius:50%;object-fit:cover}
      .de-title{margin-top:8px;font-size:16px;font-weight:600;color:var(--d-head);word-wrap:break-word}
      .de-title a{color:var(--d-link)}
      .de-desc{margin-top:8px;font-size:14px;word-wrap:break-word}
      .de-fields{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:8px;margin-top:8px}
      .de-field{font-size:14px;min-width:0;word-wrap:break-word}
      .de-field b{display:block;color:var(--d-head);font-weight:600;margin-bottom:2px}
      .de-thumb{grid-column:2/3;grid-row:1/8;margin:8px 0 0 16px;max-width:80px;max-height:80px;border-radius:4px;object-fit:contain;justify-self:end}
      .de-image{grid-column:1/3;margin-top:16px;max-width:100%;max-height:300px;border-radius:4px;object-fit:contain;justify-self:start}
      .de-footer{grid-column:1/3;display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px;color:var(--d-muted)}
      .de-footer img{width:20px;height:20px;border-radius:50%;object-fit:cover}
      .de-prev a{color:var(--d-link)}
      .de-code{background:var(--d-code);padding:0 .2em;border-radius:3px;font:.85em/1.125rem var(--mono)}
      .de-pre{background:var(--d-code);padding:7px;border-radius:4px;margin:6px 0 0;font:.85em/1.125rem var(--mono);white-space:pre-wrap;border:1px solid rgba(0,0,0,.15)}
      .de-quote{border-left:4px solid var(--d-quote);padding-left:12px;margin:2px 0}
      .de-h1{font-size:1.5em;font-weight:700;margin:6px 0 4px;color:var(--d-head)}.de-h2{font-size:1.25em;font-weight:700;margin:6px 0 4px;color:var(--d-head)}.de-h3{font-size:1em;font-weight:700;margin:6px 0 4px;color:var(--d-head)}
      .de-mention{background:var(--d-mention);color:#c9cdfb;border-radius:3px;padding:0 2px;font-weight:500}
      :root[data-theme="light"] .de-mention{color:#505cdc}
      .de-spoil{background:#1e1f22;color:transparent;border-radius:3px}
      .de-broken{display:none!important}
      .de-frow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr) auto auto;gap:8px;align-items:start;padding:8px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--surface-2)}
      .de-frow textarea{font-family:var(--font);font-size:13px}
      .de-inl{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-2);padding-top:8px;white-space:nowrap}
      @media (max-width:600px){.de-frow{grid-template-columns:1fr auto}.de-frow textarea{grid-column:1/-1;grid-row:2}}
    </style>`));

    root.append(F.h(`<div class="split">
      <div class="stack">
        <div class="panel stack">
          <div class="panel-head"><h3>Webhook</h3><span class="muted small">Paramètres du salon → Intégrations → Webhooks</span></div>
          <div class="grid-fields de-hook"></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Embed</h3><span class="chip de-dec"></span></div>
          <div class="row de-presets">${PRESETS.map(([c, l]) => `<button class="chip" data-col="${c}" title="${l}"><span class="swatch" style="background:${c};width:12px;height:12px"></span>${l}</button>`).join('')}</div>
          <div class="grid-fields de-emb"></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Champs</h3><span class="muted small de-fcount"></span><button class="btn sm" data-a="add">${F.icon('plus')}Ajouter un champ</button></div>
          <div class="stack de-fields-ed" style="gap:8px"></div>
        </div>
      </div>
      <div class="stack sticky">
        <div class="de-prev"></div>
        <div class="de-warn stack" style="gap:8px"></div>
        <div class="de-tabs"></div>
        <div class="de-out"></div>
      </div>
    </div>`));

    const onChange = () => render();
    const fHook = F.fields(F.$('.de-hook', root), [
      { key: 'webhook', label: 'URL du webhook', wide: true, placeholder: 'https://discord.com/api/webhooks/…' },
      { key: 'username', label: 'Nom affiché' }, { key: 'avatar', label: 'Avatar (URL)', placeholder: 'https://…' },
      { key: 'fn', label: 'Nom de la fonction Lua' }, { key: 'exportFn', label: 'Exporter la fonction (exports)', type: 'checkbox' },
    ], s, onChange);
    const fEmb = F.fields(F.$('.de-emb', root), [
      { key: 'color', label: 'Couleur', type: 'color' }, { key: 'title', label: 'Titre' },
      { key: 'url', label: 'Lien du titre (URL)', placeholder: 'https://…' }, { key: 'timestamp', label: 'Horodatage (timestamp)', type: 'checkbox' },
      { key: 'description', label: 'Description (markdown Discord)', type: 'textarea', rows: 4, wide: true },
      { key: 'authorName', label: 'Auteur' }, { key: 'authorIcon', label: 'Icône de l’auteur (URL)' }, { key: 'authorUrl', label: 'Lien de l’auteur (URL)' },
      { key: 'thumbnail', label: 'Miniature (URL)', placeholder: 'https://…' }, { key: 'image', label: 'Grande image (URL)', placeholder: 'https://…' },
      { key: 'footerText', label: 'Pied de page' }, { key: 'footerIcon', label: 'Icône du pied (URL)' },
    ], s, onChange);
    const outLua = F.output({ title: 'server.lua', filename: 'discord_log.lua', lang: 'lua' });
    const outJson = F.output({ title: 'payload.json', filename: 'embed.json', lang: 'json' });
    F.$('.de-out', root).append(outLua.el, outJson.el);
    const tabs = F.tabs([{ id: 'lua', label: 'Code Lua' }, { id: 'json', label: 'JSON brut' }], (id) => { outLua.el.hidden = id !== 'lua'; outJson.el.hidden = id !== 'json'; });
    F.$('.de-tabs', root).append(tabs.el);

    /* ------------------------------ données ------------------------------ */
    const hex = () => (/^#[0-9a-f]{6}$/i.test(s.color) ? s.color.toLowerCase() : '#000000');
    const dec = () => parseInt(hex().slice(1), 16);
    const isUrl = (u) => /^https?:\/\/\S+$/i.test(u || '');
    const t = (v) => String(v ?? '').trim();
    const fields = () => s.fields.filter((f) => t(f.name) || t(f.value));
    const ident = () => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s.fn) ? s.fn : 'sendLog');
    const embed = (forJson) => {
      const e = {};
      if (t(s.title)) e.title = s.title;
      if (t(s.url)) e.url = s.url.trim();
      if (t(s.description)) e.description = s.description;
      e.color = dec();
      if (t(s.authorName)) e.author = { name: s.authorName, ...(t(s.authorIcon) && { icon_url: s.authorIcon.trim() }), ...(t(s.authorUrl) && { url: s.authorUrl.trim() }) };
      if (forJson && fields().length) e.fields = fields().map((f) => ({ name: f.name, value: f.value, ...(f.inline && { inline: true }) }));
      if (t(s.thumbnail)) e.thumbnail = { url: s.thumbnail.trim() };
      if (t(s.image)) e.image = { url: s.image.trim() };
      if (t(s.footerText)) e.footer = { text: s.footerText, ...(t(s.footerIcon) && { icon_url: s.footerIcon.trim() }) };
      if (forJson && s.timestamp) e.timestamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
      return e;
    };

    /* ------------------------------ code Lua ------------------------------ */
    const L = F.luaStr;
    const luaTable = (o) => `{ ${Object.entries(o).map(([k, v]) => `${k} = ${L(v)}`).join(', ')} }`;
    const luaCode = () => {
      const e = embed(false), fn = ident(), fl = fields();
      const lines = ['        title = title,', '        description = message,', `        color = color or ${dec()},`];
      if (e.url) lines.push(`        url = ${L(e.url)},`);
      lines.push('        fields = fields,');
      if (e.author) lines.push(`        author = ${luaTable(e.author)},`);
      if (e.thumbnail) lines.push(`        thumbnail = { url = ${L(e.thumbnail.url)} },`);
      if (e.image) lines.push(`        image = { url = ${L(e.image.url)} },`);
      if (e.footer) lines.push(`        footer = ${luaTable(e.footer)},`);
      if (s.timestamp) lines.push("        timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),");
      const payload = [`        username = ${L(s.username || 'Logs')},`];
      if (t(s.avatar)) payload.push(`        avatar_url = ${L(s.avatar.trim())},`);
      const ex = `${fn}(${L(s.title)}, ${L(s.description)}, ${dec()}${fl.length ? `, {\n${fl.map((f) => `    { name = ${L(f.name)}, value = ${L(f.value)}${f.inline ? ', inline = true' : ''} },`).join('\n')}\n}` : ''})`;
      return `-- server.lua : uniquement côté serveur (un webhook dans un script client peut être volé et spammé).
local WEBHOOK = ${L(t(s.webhook) || 'https://discord.com/api/webhooks/ID/TOKEN')}

--- Envoie un embed dans le salon du webhook.
---@param title string
---@param message string
---@param color? number couleur décimale (${hex()} = ${dec()})
---@param fields? table liste de { name = '', value = '', inline = true } (nil si aucun)
local function ${fn}(title, message, color, fields)
    local embed = {
${lines.join('\n')}
    }
    PerformHttpRequest(WEBHOOK, function(err, text, headers) end, 'POST', json.encode({
${payload.join('\n')}
        embeds = { embed },
    }), { ['Content-Type'] = 'application/json' })
end
${s.exportFn ? `exports('${fn}', ${fn}) -- depuis une autre ressource : exports['nom_ressource']:${fn}(…)\n` : ''}
-- Exemple
${ex}
`;
    };

    /* ------------------------------ aperçu ------------------------------ */
    const md = (src) => {
      const keep = [];
      const stash = (html) => { keep.push(html); return `\u0000${keep.length - 1}\u0000`; };
      let x = F.esc(src);
      x = x.replace(/```(?:[a-z0-9]+\n)?([\s\S]*?)```/gi, (_, c) => stash(`<pre class="de-pre">${c.replace(/^\n|\n$/g, '')}</pre>`));
      x = x.replace(/`([^`\n]+)`/g, (_, c) => stash(`<code class="de-code">${c}</code>`));
      x = x.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, l, u) => stash(`<a href="${u}" target="_blank" rel="noopener noreferrer">${l}</a>`));
      x = x.replace(/https?:\/\/[^\s<]+/g, (u) => stash(`<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`));
      x = x.replace(/&lt;@!?(\d{15,21})&gt;/g, () => stash('<span class="de-mention">@utilisateur</span>'))
        .replace(/&lt;@&amp;(\d{15,21})&gt;/g, () => stash('<span class="de-mention">@rôle</span>'))
        .replace(/&lt;#(\d{15,21})&gt;/g, () => stash('<span class="de-mention">#salon</span>'))
        .replace(/&lt;t:(\d{1,12})(?::[tTdDfFR])?&gt;/g, (_, n) => stash(`<span class="de-code">${F.esc(new Date(n * 1000).toLocaleString('fr-FR'))}</span>`));
      x = x.replace(/^(#{1,3}) (.+)$/gm, (_, h, c) => `<div class="de-h${h.length}">${c}</div>`)
        .replace(/^&gt; (.*)$/gm, '<div class="de-quote">$1</div>')
        .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/__(.+?)__/g, '<u>$1</u>')
        .replace(/\*([^*\s][^*]*?)\*/g, '<i>$1</i>').replace(/(^|[^\w])_([^_\s][^_]*?)_(?![\w])/g, '$1<i>$2</i>')
        .replace(/~~(.+?)~~/g, '<s>$1</s>').replace(/\|\|(.+?)\|\|/g, '<span class="de-spoil" title="Spoiler">$1</span>')
        .replace(/\n/g, '<br>').replace(/<\/div><br>/g, '</div>');
      return x.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[i]);
    };
    const img = (u, cls) => (isUrl(u) ? `<img class="${cls}" src="${F.esc(u.trim())}" alt="" referrerpolicy="no-referrer">` : '');
    const time = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    function renderPreview() {
      const fl = fields(), max = isUrl(s.thumbnail) ? 2 : 3;
      let fhtml = '';
      for (let i = 0; i < fl.length;) {
        if (!fl[i].inline) { fhtml += field(fl[i], 12); i++; continue; }
        let n = 0;
        while (n < max && fl[i + n] && fl[i + n].inline) n++;
        for (let k = 0; k < n; k++) fhtml += field(fl[i + k], 12 / n);
        i += n;
      }
      const titleHtml = t(s.title) ? `<div class="de-title">${isUrl(s.url) ? `<a href="${F.esc(s.url.trim())}" target="_blank" rel="noopener noreferrer">${F.esc(s.title)}</a>` : F.esc(s.title)}</div>` : '';
      const foot = [t(s.footerText) && F.esc(s.footerText), s.timestamp && `Aujourd’hui à ${time()}`].filter(Boolean).join(' • ');
      const avatar = isUrl(s.avatar) ? `<img class="de-av" src="${F.esc(s.avatar.trim())}" alt="" referrerpolicy="no-referrer">` : `<div class="de-av">${F.icon('discord')}</div>`;
      F.$('.de-prev', root).innerHTML = `${avatar}<div class="de-body">
        <div class="de-user"><b>${F.esc(s.username || 'Captain Hook')}</b><span class="de-tag">APP</span><span class="de-time">Aujourd’hui à ${time()}</span></div>
        <div class="de-embed" style="border-left-color:${hex()}">
          ${t(s.authorName) ? `<div class="de-author">${img(s.authorIcon, '')}<span>${F.esc(s.authorName)}</span></div>` : ''}
          ${titleHtml}
          ${t(s.description) ? `<div class="de-desc">${md(s.description)}</div>` : ''}
          ${fhtml ? `<div class="de-fields">${fhtml}</div>` : ''}
          ${img(s.thumbnail, 'de-thumb')}${img(s.image, 'de-image')}
          ${foot ? `<div class="de-footer">${t(s.footerText) ? img(s.footerIcon, '') : ''}<span>${foot}</span></div>` : ''}
        </div></div>`;
      F.$$('.de-prev img', root).forEach((im) => { im.onerror = () => im.classList.add('de-broken'); });
    }
    const field = (f, span) => `<div class="de-field" style="grid-column:span ${span}"><b>${F.esc(f.name) || '&nbsp;'}</b><div>${md(f.value)}</div></div>`;

    const checks = () => {
      const w = [], e = embed(true), len = (v) => String(v || '').length;
      if (len(s.title) > 256) w.push(`Titre trop long (${len(s.title)}/256).`);
      if (len(s.description) > 4096) w.push(`Description trop longue (${len(s.description)}/4096).`);
      if (len(s.authorName) > 256) w.push('Nom d’auteur trop long (256 max).');
      if (len(s.footerText) > 2048) w.push('Pied de page trop long (2048 max).');
      if (len(s.username) > 80) w.push('Nom affiché trop long (80 max).');
      if (/discord|clyde/i.test(s.username)) w.push('Discord refuse un nom de webhook contenant « discord » ou « clyde ».');
      const fl = fields();
      if (fl.length > 25) w.push(`Trop de champs (${fl.length}/25).`);
      fl.forEach((f, i) => {
        if (!t(f.name) || !t(f.value)) w.push(`Champ ${i + 1} : le nom et la valeur sont obligatoires (sinon Discord renvoie une erreur 400).`);
        if (len(f.name) > 256) w.push(`Champ ${i + 1} : nom trop long (256 max).`);
        if (len(f.value) > 1024) w.push(`Champ ${i + 1} : valeur trop longue (${len(f.value)}/1024).`);
      });
      for (const [k, l] of [['url', 'Lien du titre'], ['authorUrl', 'Lien de l’auteur'], ['avatar', 'Avatar'], ['authorIcon', 'Icône de l’auteur'], ['thumbnail', 'Miniature'], ['image', 'Image'], ['footerIcon', 'Icône du pied']]) if (t(s[k]) && !isUrl(s[k].trim())) w.push(`${l} : l’URL doit commencer par http:// ou https://.`);
      const total = len(e.title) + len(e.description) + len(e.footer?.text) + len(e.author?.name) + fl.reduce((n, f) => n + len(f.name) + len(f.value), 0);
      if (total > 6000) w.push(`Embed trop long au total (${total}/6000 caractères).`);
      if (!e.title && !e.description && !fl.length && !e.image && !e.thumbnail) w.push('L’embed est vide : Discord le refusera.');
      if (t(s.webhook) && !/^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+/.test(s.webhook.trim())) w.push('L’URL du webhook ne ressemble pas à https://discord.com/api/webhooks/ID/TOKEN.');
      return w;
    };

    function render() {
      renderPreview();
      F.$('.de-dec', root).textContent = `${hex()} = ${dec()}`;
      F.$('.de-fcount', root).textContent = `${fields().length}/25`;
      F.$('.de-warn', root).innerHTML = checks().map((w) => `<div class="note warn">${F.esc(w)}</div>`).join('');
      outLua.set(luaCode());
      const payload = { username: s.username || 'Logs', ...(t(s.avatar) && { avatar_url: s.avatar.trim() }), embeds: [embed(true)] };
      outJson.set(JSON.stringify(payload, null, 2) + '\n');
    }

    /* ---------------------------- éditeur de champs ---------------------------- */
    const fed = F.$('.de-fields-ed', root);
    const drawFields = () => {
      fed.innerHTML = s.fields.map((f, i) => `<div class="de-frow" data-i="${i}">
        <input type="text" data-k="name" placeholder="Nom" value="${F.esc(f.name)}" maxlength="256">
        <textarea data-k="value" rows="2" placeholder="Valeur (markdown)" spellcheck="false">${F.esc(f.value)}</textarea>
        <label class="de-inl"><input type="checkbox" data-k="inline"${f.inline ? ' checked' : ''}>En ligne</label>
        <button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></div>`).join('') || '<div class="empty small">Aucun champ</div>';
    };
    fed.addEventListener('input', (e) => {
      const row = e.target.closest('[data-i]'), k = e.target.dataset.k;
      if (!row || !k) return;
      s.fields[row.dataset.i][k] = k === 'inline' ? e.target.checked : e.target.value;
      render();
    });
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]'), col = e.target.closest('[data-col]');
      if (col) { s.color = col.dataset.col; fEmb.refresh(); render(); return; }
      if (!a) return;
      if (a.dataset.a === 'add') { if (s.fields.length >= 25) return F.toast('25 champs maximum', 'error'); s.fields.push({ name: '', value: '', inline: true }); drawFields(); render(); F.$$('[data-k=name]', fed).pop().focus(); }
      else if (a.dataset.a === 'del') { s.fields.splice(Number(a.closest('[data-i]').dataset.i), 1); drawFields(); render(); }
    });

    drawFields();
    tabs.select('lua');
    render();
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v && typeof v === 'object' ? v : {});
        s.fields = (Array.isArray(s.fields) ? s.fields : []).filter((f) => f && typeof f === 'object').slice(0, 25)
          .map((f) => ({ name: String(f.name ?? ''), value: String(f.value ?? ''), inline: !!f.inline }));
        for (const k of ['webhook', 'username', 'avatar', 'authorName', 'authorIcon', 'authorUrl', 'title', 'url', 'description', 'thumbnail', 'image', 'footerText', 'footerIcon', 'fn', 'color']) s[k] = String(s[k] ?? '');
        fHook.refresh(); fEmb.refresh(); drawFields(); render();
      },
    };
  },
});
