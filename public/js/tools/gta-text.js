'use strict';
// Éditeur de texte GTA : codes ~r~ ~h~ ~n~…, touches ~INPUT_…~, aperçu façon jeu et code Lua (notification, aide, sous-titre, texte 3D).
Forge.register({
  id: 'gta-text',
  cat: 'textes',
  name: 'Éditeur de texte GTA',
  desc: 'Codes couleur ~r~ ~g~ ~h~…, touches ~INPUT_CONTEXT~, aperçu en jeu et code Lua : notification, aide, sous-titre, texte 3D.',
  tags: ['couleur', 'gta', 'tilde', 'notification', 'thefeed', 'help', 'aide', 'subtitle', 'sous-titre', 'texte 3d', 'drawtext3d', 'input', 'char'],
  icon: 'type',
  mount(root, F) {
    const COLORS = [
      ['r', 'Rouge', '#e03232'], ['b', 'Bleu', '#5db6e5'], ['g', 'Vert', '#72cc72'], ['y', 'Jaune', '#f0c850'],
      ['p', 'Violet', '#8466e2'], ['q', 'Rose', '#cb3694'], ['o', 'Orange', '#ea8e50'], ['c', 'Gris', '#9b9b9b'],
      ['m', 'Gris foncé', '#5c5c5c'], ['u', 'Noir', '#000000'], ['w', 'Blanc', '#f0f0f0'], ['s', 'Couleur par défaut', null],
    ];
    const CMAP = Object.fromEntries(COLORS.map(([k, , c]) => [k, c]));
    const HUD = { RED: '#e03232', BLUE: '#5db6e5', GREEN: '#72cc72', YELLOW: '#f0c850', ORANGE: '#ea8e50', PURPLE: '#8466e2', PINK: '#cb3694', GREY: '#9b9b9b', BLACK: '#000000', WHITE: '#f0f0f0' };
    const KEYS = {
      CONTEXT: 'E', PICKUP: 'E', VEH_HORN: 'E', CONTEXT_SECONDARY: 'Q', COVER: 'Q', ENTER: 'F', DETONATE: 'G', RELOAD: 'R', VEH_HEADLIGHT: 'H',
      INTERACTION_MENU: 'M', MULTIPLAYER_INFO: 'Z', JUMP: 'Espace', SPRINT: 'Maj', DUCK: 'Ctrl', FRONTEND_ACCEPT: 'Entrée', CELLPHONE_CANCEL: 'Retour', ATTACK: 'Clic G', AIM: 'Clic D',
    };
    const CHARS = ['CHAR_DEFAULT', 'CHAR_BANK_MAZE', 'CHAR_BANK_FLEECA', 'CHAR_BANK_BOL', 'CHAR_LS_CUSTOMS', 'CHAR_CALL911', 'CHAR_TAXI', 'CHAR_MECHANIC', 'CHAR_AMMUNATION',
      'CHAR_PEGASUS_DELIVERY', 'CHAR_CARSITE', 'CHAR_ESTATE_AGENT', 'CHAR_MP_MORS_MUTUAL', 'CHAR_MP_FM_CONTACT', 'CHAR_LIFEINVADER', 'CHAR_SOCIAL_CLUB', 'CHAR_BLOCKED',
      'CHAR_LESTER', 'CHAR_LAMAR', 'CHAR_SIMEON', 'CHAR_MICHAEL', 'CHAR_FRANKLIN', 'CHAR_TREVOR'];
    const ICON_TYPES = [[1, '1 · bulle de discussion'], [2, '2 · e-mail'], [3, '3 · demande d’ami'], [7, '7 · flèche'], [8, '8 · RP'], [9, '9 · dollar']];
    const FONTS = [[0, '0 · Chalet London'], [1, '1 · House Script'], [2, '2 · Monospace'], [4, '4 · Chalet Comprime'], [7, '7 · Pricedown']];
    const FONT_CSS = { 0: 'Arial, Helvetica, sans-serif', 1: '"Brush Script MT", cursive', 2: 'ui-monospace, monospace', 4: '"Arial Narrow", "Roboto Condensed", Arial, sans-serif', 7: 'Impact, "Arial Black", sans-serif' };
    const MODES = [{ id: 'notif', label: 'Notification' }, { id: 'adv', label: 'Notif. avec image' }, { id: 'help', label: 'Texte d’aide' }, { id: 'sub', label: 'Sous-titre' }, { id: '3d', label: 'Texte 3D' }];
    const DEF = {
      text: '~g~Bienvenue~s~ sur ~o~Brothers Life~s~ !~n~Appuie sur ~INPUT_CONTEXT~ pour ouvrir le ~h~garage~h~.',
      mode: 'notif', title: 'Fleeca Bank', subtitle: '~g~Virement reçu', char: 'CHAR_BANK_FLEECA', iconType: 9, flash: false,
      duration: 5000, font: 4, scale: 0.35, bg: true,
    };
    const s = F.clone(DEF);

    if (!document.getElementById('gt-style')) document.head.append(F.h(`<style id="gt-style">
      .gt-bar{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
      .gt-c{width:28px;height:28px;border-radius:7px;border:1px solid var(--line-strong);font:700 12px var(--mono);cursor:pointer;color:#fff;text-shadow:0 1px 2px #000;padding:0}
      .gt-c:hover{transform:translateY(-1px)}
      .gt-bar select{width:auto;max-width:190px;padding:5px 8px;font-size:12px}
      .gt-sep{width:1px;height:22px;background:var(--line-strong);margin:0 4px}
      .gt-scene{position:relative;height:310px;border-radius:var(--r);overflow:hidden;color:#f0f0f0;font:13px/1.35 "Chalet London","Helvetica Neue",Arial,sans-serif;
        background:linear-gradient(180deg,#14213a 0%,#2e4a72 38%,#c77d63 66%,#e9a874 70%,#1b1a1d 70.5%,#121114 100%);border:1px solid var(--line)}
      .gt-scene svg.sky{position:absolute;left:0;right:0;bottom:29.5%;width:100%;height:90px}
      .gt-map{position:absolute;left:14px;bottom:14px;width:168px;height:104px;border:2px solid rgba(0,0,0,.6);border-radius:2px;
        background:repeating-linear-gradient(35deg,transparent 0 22px,rgba(255,255,255,.18) 22px 25px),repeating-linear-gradient(-55deg,transparent 0 30px,rgba(255,255,255,.12) 30px 32px),#3f5446}
      .gt-map::after{content:"";position:absolute;left:-2px;right:-2px;bottom:-9px;height:5px;background:linear-gradient(90deg,#5aa05a 0 49%,transparent 49% 51%,#4f8fd0 51%)}
      .gt-map i{position:absolute;left:50%;top:50%;width:0;height:0;border:6px solid transparent;border-bottom:12px solid #fff;transform:translate(-50%,-70%)}
      .gt-feed{position:absolute;left:14px;bottom:132px;width:260px;background:rgba(18,18,20,.82);padding:7px 9px;border-radius:2px;box-shadow:0 2px 10px rgba(0,0,0,.4);word-wrap:break-word}
      .gt-adv{display:flex;gap:8px;align-items:center;margin-bottom:5px}
      .gt-pic{width:40px;height:40px;flex-shrink:0;display:grid;place-items:center;font:700 10px/1.1 Arial;text-align:center;color:#eee;background:linear-gradient(135deg,#5b6b7d,#262c33);border:1px solid rgba(255,255,255,.15)}
      .gt-adv b{display:block;font-size:13.5px}.gt-adv small{display:block;font-size:12px;opacity:.95}
      .gt-help{position:absolute;left:14px;top:14px;max-width:330px;background:rgba(0,0,0,.8);padding:9px 11px;font-size:13.5px;word-wrap:break-word}
      .gt-sub{position:absolute;left:8%;right:8%;bottom:22px;text-align:center;font-size:16px;text-shadow:1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000}
      .gt-3d{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;max-width:70%;text-shadow:1px 1px 1px #000;padding:2px 8px}
      .gt-3d.bg{background:rgba(0,0,0,.3)}
      .gt-3d-pin{position:absolute;left:50%;top:52%;width:10px;height:10px;border-radius:50%;background:rgba(255,200,80,.85);transform:translate(-50%,0);box-shadow:0 0 12px rgba(255,200,80,.9)}
      .gt-key{display:inline-block;min-width:1.4em;padding:0 .32em;margin:0 .12em;background:#f0f0f0;color:#111;border-radius:3px;font:700 .82em/1.45 Arial,sans-serif;text-align:center;text-shadow:none;box-shadow:0 0 0 1px rgba(0,0,0,.7);vertical-align:.08em}
      .gt-unk{opacity:.55;text-decoration:underline dotted}
      .gt-stats{display:flex;gap:6px;flex-wrap:wrap}
    </style>`));

    root.append(F.h(`<div class="split">
      <div class="stack">
        <div class="panel stack">
          <div class="panel-head"><h3>Texte</h3><span class="muted small">sélectionne un mot puis clique une couleur</span></div>
          <div class="gt-bar">
            ${COLORS.map(([k, l, c]) => `<button class="gt-c" data-c="${k}" title="~${k}~ ${l}" style="background:${c || 'var(--surface-2)'};${k === 'w' ? 'color:#111;text-shadow:none' : ''}">${k}</button>`).join('')}
            <span class="gt-sep"></span>
            <button class="btn sm" data-w="h" title="~h~ gras"><b>G</b></button>
            <button class="btn sm" data-w="italic" title="~italic~ italique"><i>I</i></button>
            <button class="btn sm" data-i="~n~" title="~n~ retour à la ligne">↵ ~n~</button>
          </div>
          <div class="gt-bar">
            <select data-sel="key"><option value="">Touche ~INPUT_…~</option>${Object.entries(KEYS).map(([k, v]) => `<option value="~INPUT_${k}~">${k} [${v}]</option>`).join('')}</select>
            <select data-sel="hud"><option value="">Couleur ~HUD_COLOUR_…~</option>${Object.keys(HUD).map((k) => `<option value="~HUD_COLOUR_${k}~">HUD_COLOUR_${k}</option>`).join('')}</select>
            <span class="spacer"></span>
            <button class="btn sm ghost" data-a="strip" title="Retirer tous les codes ~…~">Retirer les codes</button>
          </div>
          <textarea class="gt-text" rows="6" spellcheck="false"></textarea>
          <div class="gt-stats"></div>
          <div class="gt-warn stack" style="gap:8px"></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Options</h3><span class="muted small gt-mode-name"></span></div>
          <div class="grid-fields" data-m="adv"></div>
          <div class="grid-fields" data-m="sub"></div>
          <div class="grid-fields" data-m="3d"></div>
          <p class="muted small" data-m="notif">Notification classique au-dessus de la mini-carte (aucune option).</p>
          <p class="muted small" data-m="help">Le texte d’aide doit être appelé à chaque frame (dans une boucle avec <code>Wait(0)</code>).</p>
        </div>
      </div>
      <div class="stack sticky">
        <div class="gt-tabs"></div>
        <div class="gt-scene"></div>
        <div class="gt-out"></div>
      </div>
    </div>`));

    const ta = F.$('.gt-text', root), scene = F.$('.gt-scene', root);
    const out = F.output({ title: 'client.lua', filename: 'texte_gta.lua', lang: 'lua' });
    F.$('.gt-out', root).append(out.el);
    const onOpt = () => render();
    const fAdv = F.fields(F.$('[data-m=adv]', root), [
      { key: 'title', label: 'Titre (expéditeur)' }, { key: 'subtitle', label: 'Sous-titre' },
      { key: 'char', label: 'Image (CHAR_…)', type: 'select', options: CHARS }, { key: 'iconType', label: 'Petite icône', type: 'select', options: ICON_TYPES },
      { key: 'flash', label: 'Faire clignoter', type: 'checkbox' },
    ], s, onOpt);
    const fSub = F.fields(F.$('[data-m=sub]', root), [{ key: 'duration', label: 'Durée (ms)', type: 'number', min: 0, step: 500 }], s, onOpt);
    const f3d = F.fields(F.$('[data-m="3d"]', root), [
      { key: 'font', label: 'Police', type: 'select', options: FONTS }, { key: 'scale', label: 'Taille (SetTextScale)', type: 'number', min: 0.1, max: 1.5, step: 0.05 },
      { key: 'bg', label: 'Fond semi-transparent (DrawRect)', type: 'checkbox' },
    ], s, onOpt);

    /* ------------------------------ analyse ------------------------------ */
    const TOKEN = /(~[^~\s]{1,40}~|\n)/;
    const enc = new TextEncoder();
    const gameText = () => s.text.replace(/\r/g, '').replace(/\n/g, '~n~');
    // Découpe en morceaux de 99 octets max sans casser un code ~…~ (limite de AddTextComponentSubstringPlayerName).
    const chunks = (str) => {
      const res = []; let cur = '', n = 0;
      for (const part of str.split(TOKEN)) {
        for (const u of /^~.*~$/.test(part) ? [part] : [...part]) {
          const b = enc.encode(u).length;
          if (n + b > 99 && cur) { res.push(cur); cur = ''; n = 0; }
          cur += u; n += b;
        }
      }
      if (cur) res.push(cur);
      return res.length ? res : [''];
    };
    const fmt = (str) => {
      let html = '', c = null, b = false, it = false;
      const unknown = new Set();
      for (const p of String(str).replace(/\r/g, '').split(TOKEN)) {
        if (!p) continue;
        if (p === '\n') { html += '<br>'; continue; }
        const m = /^~([^~]+)~$/.exec(p);
        if (m) {
          const k = m[1], low = k.toLowerCase(), up = k.toUpperCase();
          if (low.length === 1 && low in CMAP) c = CMAP[low];
          else if (low === 'h') b = !b;
          else if (low === 'italic') it = !it;
          else if (low === 'n') html += '<br>';
          else if (up.startsWith('INPUT_')) { const key = KEYS[up.slice(6)]; html += `<span class="gt-key" title="${F.esc(k)}">${F.esc(key || '?')}</span>`; if (!key) unknown.add(p); }
          else if (up.startsWith('HUD_COLOUR_') && HUD[up.slice(11)]) c = HUD[up.slice(11)];
          else { html += `<span class="gt-unk" title="Code non reconnu par l’aperçu">${F.esc(p)}</span>`; unknown.add(p); }
          continue;
        }
        html += `<span style="${c ? `color:${c};` : ''}${b ? 'font-weight:700;' : ''}${it ? 'font-style:italic;' : ''}">${F.esc(p)}</span>`;
      }
      return { html, unknown };
    };

    /* ------------------------------- code ------------------------------- */
    const L = F.luaStr;
    const addParts = '    for _, part in ipairs({ ... }) do AddTextComponentSubstringPlayerName(part) end';
    const args = (parts) => parts.map(L).join(',\n    ');
    const call = (head, parts) => (parts.length > 1 ? `${head.trimEnd()}\n    ${args(parts)}\n)` : `${head}${L(parts[0])})`);
    const code = (parts) => {
      const cut = parts.length > 1 ? `\n-- Texte découpé en ${parts.length} morceaux (99 octets max par AddTextComponentSubstringPlayerName).` : '';
      if (s.mode === 'notif') return `-- Notification au-dessus de la mini-carte
local function notify(...)
    BeginTextCommandThefeedPost('STRING')
${addParts}
    EndTextCommandThefeedPostTicker(false, true)
end
${cut}
${call('notify(', parts)}\n`;
      if (s.mode === 'adv') return `-- Notification avec image (CHAR_…), titre et sous-titre
local function notifyAdvanced(title, subtitle, picture, iconType, flash, ...)
    BeginTextCommandThefeedPost('STRING')
${addParts}
    EndTextCommandThefeedPostMessagetext(picture, picture, flash, iconType, title, subtitle)
    EndTextCommandThefeedPostTicker(flash, true)
end
${cut}
${call(`notifyAdvanced(${L(s.title)}, ${L(s.subtitle)}, ${L(s.char)}, ${Number(s.iconType) || 1}, ${!!s.flash}, `, parts)}\n`;
      if (s.mode === 'help') return `-- Texte d'aide en haut à gauche (à appeler à chaque frame)
local function helpText(...)
    BeginTextCommandDisplayHelp('STRING')
${addParts}
    EndTextCommandDisplayHelp(0, false, true, -1)
end
${cut}
CreateThread(function()
    while true do
        Wait(0)
        ${call('helpText(', parts).replace(/\n/g, '\n        ')}
    end
end)\n`;
      if (s.mode === 'sub') return `-- Sous-titre en bas de l'écran
local function subtitle(duration, ...)
    BeginTextCommandPrint('STRING')
${addParts}
    EndTextCommandPrint(duration, true)
end
${cut}
${call(`subtitle(${Math.max(0, Math.round(Number(s.duration) || 0))}, `, parts)}\n`;
      const sc = F.short(Number(s.scale) || 0.35, true);
      return `-- Texte 3D affiché à des coordonnées du monde
local function DrawText3D(x, y, z, ...)
    local onScreen, sx, sy = World3dToScreen2d(x, y, z)
    if not onScreen then return end
    SetTextScale(${sc}, ${sc})
    SetTextFont(${Number(s.font) || 0})
    SetTextColour(255, 255, 255, 215)
    SetTextCentre(true)
    BeginTextCommandDisplayText('STRING')
${addParts}
    EndTextCommandDisplayText(sx, sy)${s.bg ? `
    local width = #table.concat({ ... }):gsub('~.-~', '') / 370
    DrawRect(sx, sy + 0.0125, 0.015 + width, 0.03, 0, 0, 0, 75)` : ''}
end
${cut}
local coords = vector3(215.76, -810.12, 30.73)

CreateThread(function()
    while true do
        local sleep = 1000
        if #(GetEntityCoords(PlayerPedId()) - coords) < 10.0 then
            sleep = 0
            ${call('DrawText3D(coords.x, coords.y, coords.z, ', parts).replace(/\n/g, '\n            ')}
        end
        Wait(sleep)
    end
end)\n`;
    };

    /* ------------------------------ rendu ------------------------------ */
    const skyline = '<svg class="sky" viewBox="0 0 600 90" preserveAspectRatio="none" aria-hidden="true"><path fill="#1b1a1d" d="M0 90V60h30V42h22v18h18V20h26v40h14V50h30V8h20v52h16V36h28v24h20V55h24V28h18v32h30V14h26v46h18V44h24v16h30V30h22v30h26V48h28v12h22V22h20v38h32V40h56v50Z"/></svg>';
    const tabs = F.tabs(MODES, (id) => { s.mode = id; render(); });
    F.$('.gt-tabs', root).append(tabs.el);

    function render() {
      if (ta.value !== s.text) ta.value = s.text;
      const { html, unknown } = fmt(s.text);
      let view = '';
      if (s.mode === 'notif') view = `<div class="gt-map"><i></i></div><div class="gt-feed">${html}</div>`;
      else if (s.mode === 'adv') {
        const label = s.char.replace(/^CHAR_/, '').replace(/_/g, ' ');
        view = `<div class="gt-map"><i></i></div><div class="gt-feed"><div class="gt-adv"><div class="gt-pic" title="${F.esc(s.char)}">${F.esc(label.slice(0, 14))}</div>
          <div><b>${fmt(s.title).html}</b><small>${fmt(s.subtitle).html}</small></div></div>${html}</div>`;
      } else if (s.mode === 'help') view = `<div class="gt-help">${html}</div><div class="gt-map"><i></i></div>`;
      else if (s.mode === 'sub') view = `<div class="gt-map"><i></i></div><div class="gt-sub">${html}</div>`;
      else view = `<div class="gt-3d-pin"></div><div class="gt-3d${s.bg ? ' bg' : ''}" style="font-family:${FONT_CSS[s.font] || FONT_CSS[0]};font-size:${Math.max(6, Math.round((Number(s.scale) || 0.35) * 44))}px">${html}</div>`;
      scene.innerHTML = skyline + view;

      const txt = gameText(), parts = chunks(txt), bytes = enc.encode(txt).length;
      const visible = txt.replace(/~[^~\s]{1,40}~/g, '').length;
      F.$('.gt-stats', root).innerHTML = `<span class="chip">${visible} caractères visibles</span><span class="chip">${bytes} octets avec les codes</span><span class="chip${parts.length > 1 ? ' on' : ''}">${parts.length} morceau${parts.length > 1 ? 'x' : ''}</span>`;
      const warns = [];
      if (parts.length > 1) warns.push(`<div class="note warn">Le texte fait ${bytes} octets : AddTextComponentSubstringPlayerName est limité à 99 caractères par appel (les accents comptent double). Il est découpé automatiquement en ${parts.length} morceaux dans le code, sans couper les codes ~…~.</div>`);
      if (unknown.size) warns.push(`<div class="note">Codes non reconnus par l’aperçu : ${[...unknown].slice(0, 8).map((u) => `<code>${F.esc(u)}</code>`).join(' ')} — ils sont gardés tels quels dans le code.</div>`);
      F.$('.gt-warn', root).innerHTML = warns.join('');
      F.$$('[data-m]', root).forEach((el) => { el.style.display = el.dataset.m === s.mode ? '' : 'none'; });
      F.$('.gt-mode-name', root).textContent = MODES.find((m) => m.id === s.mode).label;
      out.set(code(parts));
    }

    /* ---------------------------- édition ---------------------------- */
    const edit = (before, after = null) => {
      const a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
      const sel = v.slice(a, b);
      ta.value = v.slice(0, a) + before + sel + (after ?? '') + v.slice(b);
      ta.focus();
      ta.setSelectionRange(a + before.length, a + before.length + sel.length);
      s.text = ta.value; render();
    };
    ta.addEventListener('input', () => { s.text = ta.value; render(); });
    root.addEventListener('click', (e) => {
      const c = e.target.closest('[data-c]'), w = e.target.closest('[data-w]'), i = e.target.closest('[data-i]');
      if (c) { const k = c.dataset.c; edit(`~${k}~`, ta.selectionStart !== ta.selectionEnd && k !== 's' ? '~s~' : ''); }
      else if (w) edit(`~${w.dataset.w}~`, ta.selectionStart !== ta.selectionEnd ? `~${w.dataset.w}~` : '');
      else if (i) edit(i.dataset.i);
      else if (e.target.closest('[data-a=strip]')) { s.text = s.text.replace(/~n~/gi, '\n').replace(/~[^~\s]{1,40}~/g, ''); render(); }
    });
    F.$$('[data-sel]', root).forEach((sel) => sel.addEventListener('change', () => { if (sel.value) edit(sel.value); sel.value = ''; }));

    tabs.select(s.mode);
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v && typeof v === 'object' ? v : {});
        if (!MODES.some((m) => m.id === s.mode)) s.mode = DEF.mode;
        s.text = String(s.text ?? '');
        [fAdv, fSub, f3d].forEach((f) => f.refresh());
        tabs.select(s.mode);
      },
    };
  },
});
