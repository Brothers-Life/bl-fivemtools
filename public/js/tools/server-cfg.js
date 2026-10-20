'use strict';
// Générateur de server.cfg commenté : réseau, infos serveur, clés, MySQL, build, OneSync, framework, admins, convars ox.
Forge.register({
  id: 'server-cfg',
  cat: 'scripts',
  name: 'Générateur server.cfg',
  desc: 'server.cfg complet et commenté : hostname coloré, MySQL, build du jeu, OneSync, ordre des ensure ESX / QBCore / Qbox, admins.',
  tags: ['server.cfg', 'cfg', 'serveur', 'config', 'hostname', 'mysql', 'oxmysql', 'onesync', 'gamebuild', 'ensure', 'ace', 'admin', 'txadmin'],
  icon: 'server',
  mount(root, F) {
    const BUILDS = [['', 'Par défaut (pas de build forcé)'], ['2189', '2189 — Cayo Perico Heist'], ['2372', '2372 — Los Santos Tuners'], ['2545', '2545 — The Contract'],
      ['2612', '2612 — The Contract (correctif)'], ['2699', '2699 — The Criminal Enterprises'], ['2802', '2802 — Los Santos Drug Wars'], ['2944', '2944 — San Andreas Mercenaries'],
      ['3095', '3095 — The Chop Shop'], ['3258', '3258 — Bottom Dollar Bounties'], ['3407', '3407 — Agents of Sabotage'], ['custom', 'Autre…']];
    const BASE = ['mapmanager', 'chat', 'spawnmanager', 'sessionmanager', 'basic-gamemode', 'hardcap', 'baseevents'];
    const FW = {
      esx: { label: 'ESX Legacy', base: ['mapmanager', 'chat', 'spawnmanager', 'sessionmanager', 'basic-gamemode', 'hardcap'], core: ['es_extended', '[core]'], db: 'es_extended', inv: 'esx' },
      qb: { label: 'QBCore', base: ['mapmanager', 'chat', 'spawnmanager', 'sessionmanager', 'basic-gamemode', 'hardcap', 'baseevents'], core: ['qb-core', '[qb]', '[standalone]', '[voice]', '[defaultmaps]'], db: 'qbcore', inv: 'qb' },
      qbx: { label: 'Qbox', base: ['mapmanager', 'chat', 'spawnmanager', 'sessionmanager', 'basic-gamemode', 'hardcap', 'baseevents'], core: ['qbx_core'], db: 'qbox', inv: 'qbx', ox: true },
      none: { label: 'Vierge', base: ['mapmanager', 'chat', 'spawnmanager', 'sessionmanager', 'basic-gamemode', 'hardcap'], core: [], db: 'fivem', inv: 'ox' },
    };
    const COLORS = { 0: '#ffffff', 1: '#f44336', 2: '#4caf50', 3: '#ffeb3b', 4: '#42a5f5', 5: '#26c6da', 6: '#ab47bc', 7: '#ffffff', 8: '#ff7043', 9: '#9e9e9e' };
    const DEF = {
      ip: '0.0.0.0', port: 30120, hostname: '^1Brothers ^7Life ^8| ^3RP FR ^7- Whitelist', projectName: 'Brothers Life', projectDesc: 'Serveur RP francophone', locale: 'fr-FR', tags: 'roleplay, fr, rp, serious', discord: '',
      maxclients: 48, licenseKey: '', steamKey: '', build: '3258', customBuild: '', onesync: 'on',
      useDb: true, dbHost: '127.0.0.1', dbPort: 3306, dbUser: 'root', dbPass: '', dbName: 'es_extended', dbFmt: 'uri',
      framework: 'esx', base: FW.esx.base.slice(), oxlib: true, oxtarget: false, oxinv: false, extra: '',
      oxConvars: false, invSlots: 50, invWeight: 30000, invTarget: false, oxLocale: 'fr',
      admins: [], bannerDetail: '', bannerConnecting: '', icon: false, iconFile: 'logo.png', privacy: true,
    };
    const s = F.clone(DEF);
    const q = (v) => '"' + String(v ?? '').replace(/["\r\n]/g, '') + '"';
    const lines = (t) => String(t || '').split(/[\r\n,]+/).map((l) => l.trim().replace(/^ensure\s+/, '')).filter(Boolean);

    root.append(F.h(`<div class="split">
      <div class="stack">
        <div class="panel"><div class="panel-head"><h3>Serveur</h3></div><div class="grid-fields f-srv"></div>
          <div class="field" style="margin-top:12px"><label>Aperçu du nom (liste des serveurs)</label><div class="host-prev" style="padding:9px 12px;border-radius:var(--r-sm);background:#111;font-weight:600;min-height:38px;overflow-wrap:anywhere"></div></div></div>
        <div class="panel"><div class="panel-head"><h3>Clés</h3></div>
          <div class="note warn" style="margin-bottom:12px">Ne partage jamais ta <b>sv_licenseKey</b> ni ta clé Steam (captures, Discord, GitHub) : n’importe qui pourrait lancer un serveur à ta place. Le fichier généré contient un simple emplacement si tu laisses le champ vide.</div>
          <div class="grid-fields f-keys"></div></div>
        <div class="panel"><div class="panel-head"><h3>Base de données (oxmysql)</h3></div><div class="grid-fields f-db"></div></div>
        <div class="panel"><div class="panel-head"><h3>Framework & ressources</h3></div><div class="grid-fields f-fw"></div>
          <div class="field" style="margin-top:12px"><label>Ressources par défaut (cfx-server-data)</label><div class="row base-list"></div></div>
          <div class="grid-fields f-extra" style="margin-top:12px"></div></div>
        <div class="panel"><div class="panel-head"><h3>Admins (ACE)</h3><button class="btn sm" data-a="add-admin">${F.icon('plus')}Ajouter</button></div>
          <div class="admins"></div></div>
        <div class="panel"><div class="panel-head"><h3>Convars ox & apparence</h3></div><div class="grid-fields f-ox"></div></div>
      </div>
      <div class="stack sticky res"><div class="stack warn-box"></div></div></div>`));
    const out = F.output({ title: 'server.cfg', filename: 'server.cfg', lang: 'cfg' });
    F.$('.res', root).append(out.el);

    const refreshers = [];
    const fields = (sel, defs, cb = render) => refreshers.push(F.fields(F.$(sel, root), defs, s, cb));
    fields('.f-srv', [
      { key: 'hostname', label: 'sv_hostname (couleurs ^0 à ^9)', wide: true },
      { key: 'projectName', label: 'sv_projectName' }, { key: 'projectDesc', label: 'sv_projectDesc' },
      { key: 'tags', label: 'tags (séparés par des virgules)' }, { key: 'locale', label: 'locale', placeholder: 'fr-FR' },
      { key: 'maxclients', label: 'sv_maxclients', type: 'number', min: 1, max: 2048, step: 1 }, { key: 'discord', label: 'Lien Discord (facultatif)', placeholder: 'https://discord.gg/…' },
      { key: 'ip', label: 'IP d’écoute', placeholder: '0.0.0.0' }, { key: 'port', label: 'Port', type: 'number', min: 1, max: 65535, step: 1 },
      { key: 'build', label: 'sv_enforceGameBuild', type: 'select', options: BUILDS }, { key: 'customBuild', label: 'Build personnalisé', placeholder: '3570' },
      { key: 'onesync', label: 'OneSync', type: 'select', options: [['on', 'on (recommandé)'], ['legacy', 'legacy'], ['off', 'off'], ['', 'géré par txAdmin (ne rien écrire)']] },
    ]);
    fields('.f-keys', [
      { key: 'licenseKey', label: 'sv_licenseKey', placeholder: 'cfxk_… (portal.cfx.re)' },
      { key: 'steamKey', label: 'steam_webApiKey', placeholder: 'none', hint: 'Nécessaire pour les identifiants steam: ; sinon laisse vide (none).' },
    ]);
    fields('.f-db', [
      { key: 'useDb', label: 'Ajouter mysql_connection_string', type: 'checkbox', wide: true },
      { key: 'dbHost', label: 'Hôte', placeholder: '127.0.0.1' }, { key: 'dbPort', label: 'Port', type: 'number', step: 1 },
      { key: 'dbUser', label: 'Utilisateur' }, { key: 'dbPass', label: 'Mot de passe' }, { key: 'dbName', label: 'Base' },
      { key: 'dbFmt', label: 'Format', type: 'select', options: [['uri', 'mysql://user:pass@hôte/base'], ['kv', 'user=…;host=…;database=…']] },
    ]);
    fields('.f-fw', [
      { key: 'framework', label: 'Framework', type: 'select', options: Object.entries(FW).map(([k, v]) => [k, v.label]) },
      { key: 'oxlib', label: 'ox_lib', type: 'checkbox' }, { key: 'oxtarget', label: 'ox_target', type: 'checkbox' }, { key: 'oxinv', label: 'ox_inventory', type: 'checkbox' },
    ], (k) => {
      if (k === 'framework') { const f = FW[s.framework]; s.base = f.base.slice(); if (f.ox) Object.assign(s, { oxlib: true, oxtarget: true, oxinv: true }); if (!s.dbName || Object.values(FW).some((x) => x.db === s.dbName)) s.dbName = f.db; refreshers.forEach((r) => r.refresh()); drawBase(); }
      render();
    });
    fields('.f-extra', [{ key: 'extra', label: 'Tes ressources (une par ligne, dans l’ordre de démarrage)', type: 'textarea', rows: 4, wide: true, placeholder: 'pma-voice\n[maps]\nmon_script' }]);
    fields('.f-ox', [
      { key: 'oxConvars', label: 'Convars ox_inventory / ox_lib', type: 'checkbox', wide: true },
      { key: 'invSlots', label: 'inventory:slots', type: 'number', step: 1 }, { key: 'invWeight', label: 'inventory:weight (g)', type: 'number', step: 1 },
      { key: 'invTarget', label: 'inventory:target (utiliser ox_target)', type: 'checkbox' }, { key: 'oxLocale', label: 'ox:locale', placeholder: 'fr' },
      { key: 'bannerDetail', label: 'banner_detail (URL image 1920×200)', placeholder: 'https://…/banner.png' }, { key: 'bannerConnecting', label: 'banner_connecting (URL)', placeholder: 'https://…/connecting.png' },
      { key: 'icon', label: 'load_server_icon (PNG 96×96)', type: 'checkbox' }, { key: 'iconFile', label: 'Fichier icône', placeholder: 'logo.png' },
      { key: 'privacy', label: 'sv_endpointprivacy (masquer les IP des joueurs)', type: 'checkbox', wide: true },
    ]);

    const baseBox = F.$('.base-list', root);
    const drawBase = () => { baseBox.innerHTML = BASE.map((r) => `<button class="chip${s.base.includes(r) ? ' on' : ''}" data-base="${r}">${r}</button>`).join(''); };

    /* ----------------------------------- admins ----------------------------------- */
    const ROLES = { god: 'Super-admin', admin: 'Admin', mod: 'Modérateur' };
    const adBox = F.$('.admins', root);
    const drawAdmins = () => {
      adBox.innerHTML = s.admins.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Type</th><th>Identifiant</th><th>Pseudo</th><th>Rôle</th><th></th></tr></thead><tbody>${s.admins.map((a, i) => `<tr data-i="${i}">
        <td><select data-k="type" style="min-width:90px">${['license', 'discord', 'steam', 'fivem'].map((t) => `<option${t === a.type ? ' selected' : ''}>${t}</option>`).join('')}</select></td>
        <td><input data-k="id" value="${F.esc(a.id)}" placeholder="${a.type === 'discord' ? '123456789012345678' : a.type === 'steam' ? '110000100000000' : a.type === 'fivem' ? '123456' : 'abc123…'}" style="min-width:150px"></td>
        <td><input data-k="name" value="${F.esc(a.name)}" style="min-width:90px"></td>
        <td><select data-k="role" style="min-width:110px">${Object.entries(ROLES).map(([k, l]) => `<option value="${k}"${k === a.role ? ' selected' : ''}>${l}</option>`).join('')}</select></td>
        <td class="actions"><button class="btn sm ghost" data-a="dup" title="Dupliquer">${F.icon('copy')}</button><button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty small">Aucun admin. Ajoute ton identifiant license, discord, steam ou fivem.</div>';
    };
    const onAdmin = (e) => {
      const k = e.target.dataset.k, tr = e.target.closest('tr[data-i]');
      if (!k || !tr) return;
      const a = s.admins[tr.dataset.i];
      a[k] = k === 'id' ? e.target.value.trim().replace(/^(identifier\.)?(license2?|discord|steam|fivem):/i, '') : e.target.value;
      if (k === 'type' && e.type === 'change') drawAdmins();
      render();
    };
    adBox.addEventListener('input', onAdmin);
    adBox.addEventListener('change', onAdmin);

    /* ----------------------------------- sortie ----------------------------------- */
    const build = () => (s.build === 'custom' ? String(s.customBuild).trim() : s.build);
    function dbString() {
      if (s.dbFmt === 'kv') return `user=${s.dbUser};host=${s.dbHost}${+s.dbPort && +s.dbPort !== 3306 ? `;port=${s.dbPort}` : ''};password=${s.dbPass};database=${s.dbName};charset=utf8mb4`;
      const e = encodeURIComponent;
      return `mysql://${e(s.dbUser)}${s.dbPass ? ':' + e(s.dbPass) : ''}@${s.dbHost}${+s.dbPort && +s.dbPort !== 3306 ? ':' + s.dbPort : ''}/${e(s.dbName)}?charset=utf8mb4`;
    }
    function cfg() {
      const f = FW[s.framework] || FW.none, o = [];
      const sec = (t) => o.push('', '## ' + '='.repeat(4) + ' ' + t + ' ' + '='.repeat(Math.max(4, 60 - t.length)));
      o.push('# server.cfg généré avec BL Forge', '# Les lignes qui commencent par # sont des commentaires.');
      sec('Réseau');
      const ep = `${s.ip.trim() || '0.0.0.0'}:${Math.trunc(s.port) || 30120}`;
      o.push(`endpoint_add_tcp ${q(ep)}`, `endpoint_add_udp ${q(ep)}`);
      if (s.privacy) o.push('sv_endpointprivacy true # masque les IP des joueurs');
      sec('Informations du serveur');
      o.push(`sv_hostname ${q(s.hostname)}`, `sets sv_projectName ${q(s.projectName)}`, `sets sv_projectDesc ${q(s.projectDesc)}`);
      if (s.tags.trim()) o.push(`sets tags ${q(s.tags.split(',').map((t) => t.trim()).filter(Boolean).join(', '))}`);
      o.push(`sets locale ${q(s.locale || 'fr-FR')}`);
      if (s.discord.trim()) o.push(`sets Discord ${q(s.discord.trim())}`);
      if (s.bannerDetail.trim()) o.push(`sets banner_detail ${q(s.bannerDetail.trim())}`);
      if (s.bannerConnecting.trim()) o.push(`sets banner_connecting ${q(s.bannerConnecting.trim())}`);
      if (s.icon) o.push(`load_server_icon ${(s.iconFile || 'logo.png').replace(/\s/g, '')} # PNG 96x96 à côté du server.cfg`);
      o.push(`sv_maxclients ${Math.max(1, Math.trunc(s.maxclients) || 48)}`);
      sec('Jeu');
      if (build()) o.push(`set sv_enforceGameBuild ${build()} # version des DLC du jeu`);
      if (s.onesync) o.push(`set onesync ${s.onesync}`);
      o.push('sv_scriptHookAllowed 0 # interdit les menus ScriptHook');
      sec('Clés (NE JAMAIS PARTAGER)');
      o.push(`sv_licenseKey ${q(s.licenseKey.trim() || 'changeme')} # https://portal.cfx.re`);
      o.push(`set steam_webApiKey ${q(s.steamKey.trim() || 'none')}`);
      if (s.useDb) { sec('Base de données (oxmysql)'); o.push(`set mysql_connection_string ${q(dbString())}`, 'set mysql_ui true # /mysql en jeu pour les admins'); }
      if (s.oxConvars && (s.oxinv || s.oxlib)) {
        sec('Convars ox');
        if (s.oxlib) o.push(`setr ox:locale ${q(s.oxLocale || 'fr')}`);
        if (s.oxinv) o.push(`setr inventory:framework ${q(f.inv)}`, `setr inventory:slots ${Math.trunc(s.invSlots) || 50}`, `setr inventory:weight ${Math.trunc(s.invWeight) || 30000}`, `setr inventory:target ${s.invTarget}`);
      }
      const base = BASE.filter((r) => s.base.includes(r));
      if (base.length) { sec('Ressources par défaut'); base.forEach((r) => o.push('ensure ' + r)); }
      sec('Librairies');
      if (s.useDb || s.framework !== 'none') o.push('ensure oxmysql');
      if (s.oxlib) o.push('ensure ox_lib');
      if (f.core.length) { sec(`Framework : ${f.label}`); f.core.forEach((r) => o.push('ensure ' + r + (r === '[core]' ? ' # ressources esx_ du dossier [core]' : ''))); }
      if (s.oxtarget || s.oxinv) { sec('ox'); if (s.oxtarget) o.push('ensure ox_target'); if (s.oxinv) o.push('ensure ox_inventory'); }
      const extra = lines(s.extra);
      if (extra.length) { sec('Mes ressources'); extra.forEach((r) => o.push('ensure ' + r)); }
      sec('Permissions');
      if (s.framework === 'qb') {
        o.push('add_ace group.admin command allow # toutes les commandes', 'add_ace group.admin command.quit deny # sauf quit',
          'add_ace resource.qb-core command allow # qb-core peut exécuter des commandes', 'add_ace qbcore.god command allow',
          'add_principal qbcore.god group.admin', 'add_principal qbcore.god qbcore.admin', 'add_principal qbcore.admin qbcore.mod');
      } else {
        o.push('add_ace group.admin command allow # toutes les commandes', 'add_ace group.admin command.quit deny # sauf quit');
        if (s.framework === 'esx') ['add_ace', 'add_principal', 'remove_principal', 'stop'].forEach((c) => o.push(`add_ace resource.es_extended command.${c} allow`));
      }
      const admins = s.admins.filter((a) => a.id.trim());
      if (admins.length) {
        o.push('');
        const grp = (r) => (s.framework === 'qb' ? { god: 'qbcore.god', admin: 'qbcore.admin', mod: 'qbcore.mod' }[r] : r === 'mod' ? 'group.mod' : 'group.admin');
        if (s.framework !== 'qb' && admins.some((a) => a.role === 'mod')) o.push('# group.mod : ajoute ici les add_ace autorisés aux modérateurs (ex. add_ace group.mod command.kick allow)');
        admins.forEach((a) => o.push(`add_principal identifier.${a.type}:${a.id.trim().replace(/\s/g, '')} ${grp(a.role)}${a.name ? ' # ' + a.name.replace(/[\r\n]/g, ' ') : ''}`));
      }
      return o.join('\n') + '\n';
    }

    function warnings() {
      const w = [];
      if (!s.licenseKey.trim()) w.push('sv_licenseKey vide : remplace « changeme » par ta clé (portal.cfx.re) avant de lancer le serveur.');
      if (s.maxclients > 48 && s.onesync !== 'on' && s.onesync !== '') w.push('Plus de 48 joueurs : OneSync doit être activé (on).');
      if (s.maxclients > 48) w.push('Au-delà de 48 slots, vérifie que ta clé de licence le permet (palier Element Club).');
      if (s.build === 'custom' && !/^\d{4}$/.test(String(s.customBuild).trim())) w.push('Build personnalisé : indique un numéro (ex. 3407).');
      if (s.framework === 'qbx' && !(s.oxlib && s.oxinv && s.oxtarget)) w.push('Qbox s’appuie sur ox_lib, ox_inventory et ox_target.');
      if (s.oxinv && !s.oxlib) w.push('ox_inventory nécessite ox_lib.');
      if (s.oxinv && s.framework === 'qb') w.push('ox_inventory avec QBCore : retire qb-inventory (et ses dépendances) de [qb].');
      if (s.useDb && /[;"]/.test(s.dbPass) && s.dbFmt === 'kv') w.push('Mot de passe avec ; ou " : utilise le format mysql:// (encodé automatiquement).');
      if (s.onesync) w.push('Avec txAdmin, OneSync se règle aussi dans ses paramètres : évite les deux réglages contradictoires.');
      for (const a of s.admins.filter((x) => x.id.trim())) {
        const ok = { license: /^[a-f0-9]{40}$/i, discord: /^\d{15,21}$/, steam: /^[a-f0-9]{15}$/i, fivem: /^\d+$/ }[a.type];
        if (ok && !ok.test(a.id.trim())) w.push(`Identifiant ${a.type} « ${a.id} » : format inhabituel.`);
      }
      return w;
    }
    const preview = () => {
      let color = COLORS[7], html = '';
      for (const part of String(s.hostname).split(/(\^\d)/)) {
        if (/^\^\d$/.test(part)) color = COLORS[part[1]];
        else if (part) html += `<span style="color:${color}">${F.esc(part)}</span>`;
      }
      F.$('.host-prev', root).innerHTML = html || '<span class="muted">—</span>';
    };
    function render() {
      out.set(cfg()); preview();
      F.$('.warn-box', root).innerHTML = warnings().map((x) => `<div class="note warn">${F.esc(x)}</div>`).join('');
    }

    root.addEventListener('click', (e) => {
      const bb = e.target.closest('[data-base]');
      if (bb) { const r = bb.dataset.base; s.base = s.base.includes(r) ? s.base.filter((x) => x !== r) : [...s.base, r]; drawBase(); render(); return; }
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a, tr = b.closest('tr[data-i]');
      if (a === 'add-admin') s.admins.push({ type: 'license', id: '', name: '', role: 'admin' });
      else if (a === 'dup' && tr) s.admins.splice(+tr.dataset.i + 1, 0, { ...s.admins[tr.dataset.i] });
      else if (a === 'del' && tr) s.admins.splice(+tr.dataset.i, 1);
      else return;
      drawAdmins(); render();
    });

    drawBase(); drawAdmins(); render();
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v || {});
        if (!FW[s.framework]) s.framework = 'none';
        s.base = Array.isArray(s.base) ? s.base.filter((r) => BASE.includes(r)) : FW[s.framework].base.slice();
        s.admins = Array.isArray(s.admins) ? s.admins.filter((a) => a && typeof a === 'object').map((a) => ({ type: ['license', 'discord', 'steam', 'fivem'].includes(a.type) ? a.type : 'license', id: String(a.id || ''), name: String(a.name || ''), role: ROLES[a.role] ? a.role : 'admin' })) : [];
        for (const k of ['hostname', 'projectName', 'projectDesc', 'locale', 'tags', 'discord', 'ip', 'licenseKey', 'steamKey', 'dbHost', 'dbUser', 'dbPass', 'dbName', 'extra', 'bannerDetail', 'bannerConnecting', 'iconFile', 'oxLocale', 'customBuild']) s[k] = String(s[k] ?? '');
        refreshers.forEach((r) => r.refresh()); drawBase(); drawAdmins(); render();
      },
    };
  },
});
