'use strict';
// Convertisseurs FiveM en direct : vitesse, distance, temps, angles, poids, tâches planifiées et identifiants (steam, discord, license).
Forge.register({
  id: 'units',
  cat: 'convertisseurs',
  name: 'Unités & identifiants',
  desc: 'Vitesse (m/s ↔ km/h), distance, temps pour Wait, angles, poids ox_inventory et identifiants steam hex ↔ steam64, discord, license.',
  tags: ['unites', 'vitesse', 'kmh', 'mph', 'getentityspeed', 'wait', 'temps', 'radians', 'poids', 'steam', 'steam64', 'steamid', 'discord', 'license', 'identifiant', 'cron'],
  icon: 'gauge',
  mount(root, F) {
    const DEF = { speed: 100 / 3.6, dist: 1000, time: 60000, angle: 90, heading: 90, weight: 1500, cronH: 6, cronM: 0, steam: 'steam:1100001000056ba', discord: '', license: '' };
    const s = F.clone(DEF);
    const STEAM_BASE = 76561197960265728n;

    if (!document.getElementById('un-style')) document.head.append(F.h(`<style id="un-style">
      .un-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:14px;align-items:start}
      .un-in{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px}
      .un-res{display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--line);padding-top:8px}
      .un-res:empty{display:none}
      .un-res>div{display:flex;flex-direction:column;align-items:flex-start;gap:1px}
      .un-res .btn{white-space:normal;text-align:left;justify-content:flex-start;max-width:100%;padding:3px 6px;margin-left:-6px}
      .un-res code{overflow-wrap:anywhere}
    </style>`));

    const panel = (title, sub, body) => `<div class="panel stack"><div class="panel-head"><h3>${title}</h3>${sub ? `<span class="muted small">${sub}</span>` : ''}</div>${body}</div>`;
    const inputs = (key, units) => `<div class="un-in">${units.map(([u, l]) => `<div class="field"><label>${l}</label><input type="number" step="any" data-g="${key}" data-u="${u}"></div>`).join('')}</div>`;
    const res = (key) => `<div class="un-res" data-r="${key}"></div>`;
    const text = (key, label, ph) => `<div class="field"><label>${label}</label><input type="text" data-t="${key}" placeholder="${F.esc(ph)}" spellcheck="false"></div>`;

    // Groupes d'unités liées : [unité, libellé, facteur vers l'unité de base].
    const G = {
      speed: [['ms', 'm/s', 1], ['kmh', 'km/h', 1 / 3.6], ['mph', 'mph', 0.44704]],
      dist: [['m', 'mètres (unités GTA)', 1], ['km', 'km', 1000], ['ft', 'pieds', 0.3048], ['mi', 'miles', 1609.344]],
      time: [['ms', 'ms', 1], ['s', 'secondes', 1000], ['min', 'minutes', 60000], ['h', 'heures', 3600000]],
      angle: [['deg', 'degrés', 1], ['rad', 'radians', 180 / Math.PI]],
      heading: [['h', 'heading (0–360)', 1], ['rz', 'rotation Z (−180…180)', 1]],
      weight: [['g', 'grammes (ox_inventory)', 1], ['kg', 'kg', 1000]],
    };

    root.append(F.h(`<div class="un-grid">
      ${panel('Vitesse', 'GetEntitySpeed renvoie des m/s', inputs('speed', G.speed) + res('speed'))}
      ${panel('Distance', '1 unité GTA = 1 mètre', inputs('dist', G.dist) + res('dist'))}
      ${panel('Temps', 'Wait, SetTimeout, intervalles', inputs('time', G.time) + res('time'))}
      ${panel('Angles', '', inputs('angle', G.angle) + inputs('heading', G.heading) + res('angle'))}
      ${panel('Poids', 'ox_inventory compte en grammes', inputs('weight', G.weight) + res('weight'))}
      ${panel('Tâche planifiée', 'tous les jours à heure fixe', `<div class="un-in"><div class="field"><label>Heure (0–23)</label><input type="number" min="0" max="23" step="1" data-c="cronH"></div><div class="field"><label>Minute (0–59)</label><input type="number" min="0" max="59" step="1" data-c="cronM"></div></div>` + res('cron'))}
      ${panel('Steam', 'hex ↔ steam64 ↔ STEAM_0', text('steam', 'Identifiant Steam', 'steam:110000112345678, 76561198…, STEAM_0:1:…, [U:1:…]') + res('steam'))}
      ${panel('Discord', '', text('discord', 'ID Discord', '123456789012345678, discord:…, <@…>') + res('discord'))}
      ${panel('License Rockstar', '', text('license', 'License', 'license:abc123… (40 caractères hex)') + res('license'))}
    </div>`));

    /* ------------------------------ helpers ------------------------------ */
    const fmt = (v, d = 6) => (Number.isFinite(v) ? F.short(Math.round(v * 10 ** d) / 10 ** d) : '');
    const row = (label, value, warn) => `<div><span class="muted small">${label}</span>${warn ? `<span class="small" style="color:var(--warn)">${F.esc(value)}</span>` : `<button class="btn sm ghost" data-copy="${F.esc(value)}" title="Copier"><code>${F.esc(value)}</code></button>`}</div>`;
    const setRows = (key, rows) => { F.$(`[data-r="${key}"]`, root).innerHTML = rows.join(''); };
    const toUnit = (g, u, base) => {
      if (g === 'heading') { const h = ((base % 360) + 360) % 360; return u === 'h' ? h : h > 180 ? h - 360 : h; }
      return base / G[g].find((x) => x[0] === u)[2];
    };
    const fromUnit = (g, u, v) => (g === 'heading' ? ((v % 360) + 360) % 360 : v * G[g].find((x) => x[0] === u)[2]);

    /* ------------------------------ identifiants ------------------------------ */
    const steam = (raw) => {
      const t = String(raw || '').trim();
      if (!t) return null;
      let id = null, m;
      if ((m = /^(?:steam:)?([0-9a-f]{15,16})$/i.exec(t)) && /^0?11000/.test(m[1])) id = BigInt('0x' + m[1]);
      else if ((m = /(7656119\d{10})/.exec(t))) id = BigInt(m[1]);
      else if ((m = /^STEAM_[0-5]:([01]):(\d+)$/i.exec(t))) id = STEAM_BASE + BigInt(m[2]) * 2n + BigInt(m[1]);
      else if ((m = /^\[?U:1:(\d+)\]?$/i.exec(t))) id = STEAM_BASE + BigInt(m[1]);
      else if ((m = /^(?:steam:)?([0-9a-f]+)$/i.exec(t)) && /[a-f]/i.test(m[1])) id = BigInt('0x' + m[1]);
      if (id == null) return { err: 'Format non reconnu' };
      const acc = id - STEAM_BASE;
      if (acc < 0n || acc >= 2n ** 32n) return { err: 'Ce n’est pas un compte Steam individuel valide' };
      return { hex: id.toString(16), id: id.toString(), acc };
    };

    /* --------------------------------- rendu --------------------------------- */
    function render(skip) {
      F.$$('[data-g]', root).forEach((el) => { if (el !== skip) el.value = fmt(toUnit(el.dataset.g, el.dataset.u, Number(s[el.dataset.g]) || 0)); });
      F.$$('[data-t]', root).forEach((el) => { if (el !== skip) el.value = s[el.dataset.t]; });
      F.$$('[data-c]', root).forEach((el) => { if (el !== skip) el.value = s[el.dataset.c]; });

      const ms = Number(s.speed) || 0;
      setRows('speed', [row('Vitesse en km/h (Lua)', 'local kmh = GetEntitySpeed(vehicle) * 3.6'), row('Vitesse en mph (Lua)', 'local mph = GetEntitySpeed(vehicle) * 2.236936'),
        row('Limiter la vitesse', `SetVehicleMaxSpeed(vehicle, ${fmt(ms, 2)})`)]);
      const m = Number(s.dist) || 0;
      setRows('dist', [row('Comparer une distance', `if #(coordsA - coordsB) < ${fmt(m, 2)} then`), row('Au carré (plus rapide)', `${fmt(m * m, 2)}`)]);
      const t = Math.max(0, Math.round(Number(s.time) || 0));
      const mins = t / 60000, hrs = mins / 60;
      const cron = Number.isInteger(mins) && mins >= 1 && mins < 60 ? (mins === 1 ? '* * * * *' : `*/${mins} * * * *`) : Number.isInteger(hrs) && hrs >= 1 && hrs < 24 ? `0 */${hrs} * * *` : null;
      setRows('time', [row('Wait', `Wait(${t})`), row('SetTimeout', `SetTimeout(${t}, function() end)`),
        row('Cron (intervalle)', cron || 'minutes (1–59) ou heures (1–23) entières seulement', !cron)]);
      const deg = Number(s.angle) || 0, h = ((Number(s.heading) || 0) % 360 + 360) % 360;
      setRows('angle', [row('Lua', `math.rad(${fmt(deg, 4)}) -- ${fmt((deg * Math.PI) / 180)}`), row('Heading → entité', `SetEntityHeading(entity, ${fmt(h, 2)})`),
        row('Rotation complète', `SetEntityRotation(entity, 0.0, 0.0, ${fmt(h > 180 ? h - 360 : h, 2)}, 2, true)`)]);
      const g = Math.round(Number(s.weight) || 0);
      setRows('weight', [row('ox_inventory (items.lua)', `weight = ${g},`), row('Affichage', `${fmt(g / 1000, 3)} kg`)]);
      const H = Math.min(23, Math.max(0, Math.round(Number(s.cronH) || 0))), M = Math.min(59, Math.max(0, Math.round(Number(s.cronM) || 0)));
      setRows('cron', [row('Expression cron', `${M} ${H} * * *`), row('ESX (resource cron)', `TriggerEvent('cron:runAt', ${H}, ${M}, function(d, h, m) end)`), row('Heure', `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`)]);

      const st = steam(s.steam);
      setRows('steam', !st ? [] : st.err ? [row('Erreur', st.err, true)] : [row('Identifiant FiveM (hex)', 'steam:' + st.hex), row('Steam64 (décimal)', st.id),
        row('SteamID', `STEAM_0:${st.acc % 2n}:${st.acc / 2n}`), row('SteamID3', `[U:1:${st.acc}]`), row('Profil', 'https://steamcommunity.com/profiles/' + st.id)]);
      const dm = /^(?:discord:|<@!?)?(\d{17,20})>?$/.exec(String(s.discord).trim());
      setRows('discord', !String(s.discord).trim() ? [] : !dm ? [row('Erreur', 'Un ID Discord fait 17 à 20 chiffres', true)] : [row('Identifiant FiveM', 'discord:' + dm[1]), row('Mention', `<@${dm[1]}>`),
        row('Compte créé le', new Date(Number((BigInt(dm[1]) >> 22n) + 1420070400000n)).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })), row('Profil', 'https://discord.com/users/' + dm[1])]);
      const lm = /^(?:license2?:)?([0-9a-f]+)$/i.exec(String(s.license).trim());
      setRows('license', !String(s.license).trim() ? [] : !lm || lm[1].length !== 40 ? [row('Erreur', 'Une license est faite de 40 caractères hexadécimaux', true)]
        : [row('Identifiant FiveM', 'license:' + lm[1].toLowerCase()), row('SQL (users.identifier)', `WHERE identifier = 'license:${lm[1].toLowerCase()}'`)]);
    }

    root.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.g) { const v = Number(el.value); if (el.value === '' || !Number.isFinite(v)) return; s[el.dataset.g] = fromUnit(el.dataset.g, el.dataset.u, v); }
      else if (el.dataset.t) s[el.dataset.t] = el.value;
      else if (el.dataset.c) s[el.dataset.c] = Number(el.value) || 0;
      else return;
      render(el);
    });
    root.addEventListener('focusout', (e) => { if (e.target.dataset.g) render(); });
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-copy]'); if (b) F.copy(b.dataset.copy); });

    render();
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v && typeof v === 'object' ? v : {});
        for (const k of ['speed', 'dist', 'time', 'angle', 'heading', 'weight', 'cronH', 'cronM']) if (!Number.isFinite(Number(s[k]))) s[k] = DEF[k];
        for (const k of ['steam', 'discord', 'license']) s[k] = String(s[k] ?? '');
        render();
      },
    };
  },
});
