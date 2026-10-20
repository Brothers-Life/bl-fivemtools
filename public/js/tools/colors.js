'use strict';
// Convertisseur de couleurs FiveM : HEX, RGB, HSL, décimal Discord, tables Lua, vecteur normalisé + palette des peintures véhicule GTA.
Forge.register({
  id: 'colors',
  cat: 'convertisseurs',
  name: 'Convertisseur de couleurs',
  desc: 'HEX, RGB, HSL, décimal (embeds Discord), tables Lua, vecteur 0–1 ; palette des peintures véhicule GTA avec la plus proche.',
  tags: ['couleur', 'color', 'hex', 'rgb', 'hsl', 'decimal', 'discord', 'peinture', 'vehicule', 'setvehiclecolours', 'drawmarker'],
  icon: 'palette',
  mount(root, F) {
    // Index des peintures (liste communautaire, ex. wiki RAGE) ; teintes HEX approximatives.
    const PAINT = `Metallic Black|0d1116,Metallic Graphite Black|1c1d21,Metallic Black Steel|32383d,Metallic Dark Silver|454b4f,Metallic Silver|999da0,Metallic Blue Silver|c2c4c6,Metallic Steel Gray|979a97,Metallic Shadow Silver|637380,Metallic Stone Silver|63625c,Metallic Midnight Silver|3c3f47,
Metallic Gun Metal|444e54,Metallic Anthracite Grey|1d2129,Matte Black|13181f,Matte Gray|26282a,Matte Light Grey|515554,Util Black|151921,Util Black Poly|1e2429,Util Dark Silver|333a3c,Util Silver|8c9095,Util Gun Metal|39434d,
Util Shadow Silver|506272,Worn Black|1e232f,Worn Graphite|363a3f,Worn Silver Grey|a0a199,Worn Silver|d3d3d3,Worn Blue Silver|b7bfca,Worn Shadow Silver|778794,Metallic Red|c00e1a,Metallic Torino Red|da1918,Metallic Formula Red|b6111b,
Metallic Blaze Red|a51e23,Metallic Graceful Red|7b1a22,Metallic Garnet Red|8e1b1f,Metallic Desert Red|6f1818,Metallic Cabernet Red|49111d,Metallic Candy Red|b60f25,Metallic Sunrise Orange|d44a17,Metallic Classic Gold|c2944f,Metallic Orange|f78616,Matte Red|cf1f21,
Matte Dark Red|732021,Matte Orange|f27d20,Matte Yellow|ffc91f,Util Red|9c1016,Util Bright Red|de0f18,Util Garnet Red|8f1e17,Worn Red|a94744,Worn Golden Red|b16c51,Worn Dark Red|371c25,Metallic Dark Green|132428,
Metallic Racing Green|122e2b,Metallic Sea Green|12383c,Metallic Olive Green|31423f,Metallic Green|155c2d,Metallic Gasoline Blue Green|1b6770,Matte Lime Green|66b81f,Util Dark Green|22383e,Util Green|1d5a3f,Worn Dark Green|2d423f,Worn Green|45594b,
Worn Sea Wash|65867f,Metallic Midnight Blue|222e46,Metallic Dark Blue|233155,Metallic Saxony Blue|304c7e,Metallic Blue|47578f,Metallic Mariner Blue|637ba7,Metallic Harbor Blue|394762,Metallic Diamond Blue|d6e7f1,Metallic Surf Blue|76afbe,Metallic Nautical Blue|345e72,
Metallic Bright Blue|0b9cf1,Metallic Purple Blue|2f2d52,Metallic Spinnaker Blue|282c4d,Metallic Ultra Blue|2354a1,Metallic Bright Blue|6ea3c6,Util Dark Blue|112552,Util Midnight Blue|1b203e,Util Blue|275190,Util Sea Foam Blue|608592,Util Lightning Blue|2446a8,
Util Maui Blue Poly|4271e1,Util Bright Blue|3b39e0,Matte Dark Blue|1f2852,Matte Blue|253aa7,Matte Midnight Blue|1c3551,Worn Dark Blue|4c5f81,Worn Blue|58688e,Worn Light Blue|74b5d8,Metallic Taxi Yellow|ffcf20,Metallic Race Yellow|fbe212,
Metallic Bronze|916532,Metallic Yellow Bird|e0e13d,Metallic Lime|98d223,Metallic Champagne|9b8c78,Metallic Pueblo Beige|503218,Metallic Dark Ivory|473f2b,Metallic Choco Brown|221b19,Metallic Golden Brown|653f23,Metallic Light Brown|775c3e,Metallic Straw Beige|ac9975,
Metallic Moss Brown|6c6b4b,Metallic Bison Brown|402e2b,Metallic Beechwood|a4965f,Metallic Dark Beechwood|46231a,Metallic Choco Orange|752b19,Metallic Beach Sand|bfae7b,Metallic Sun Bleached Sand|dfd5b2,Metallic Cream|f7edd5,Util Brown|3a2a1b,Util Medium Brown|785f33,
Util Light Brown|b5a079,Metallic White|fffff6,Metallic Frost White|eaeaea,Worn Honey Beige|b0ab94,Worn Brown|453831,Worn Dark Brown|2a282b,Worn Straw Beige|726c57,Brushed Steel|6a747c,Brushed Black Steel|354158,Brushed Aluminium|9ba0a8,
Chrome|5870a1,Worn Off White|eae6de,Util Off White|dfddd0,Worn Orange|f2ad2e,Worn Light Orange|f9a458,Metallic Securicor Green|83c566,Worn Taxi Yellow|f1cc40,Police Car Blue|4cc3da,Matte Green|4e6443,Matte Brown|bcac8f,
Worn Orange|f8b658,Matte White|fcf9f1,Worn White|fffffb,Worn Olive Army Green|81844c,Pure White|ffffff,Hot Pink|f21f99,Salmon Pink|fdd6cd,Metallic Vermillion Pink|df5891,Orange|f6ae20,Green|b0ee6e,
Blue|08e9fa,Metallic Black Blue|0a0c17,Metallic Black Purple|0c0d18,Metallic Black Red|0e0d14,Hunter Green|9f9e8a,Metallic Purple|621276,Metallic V Dark Blue|0b1421,Modshop Black|11141a,Matte Purple|6b1f7b,Matte Dark Purple|1e1d22,
Metallic Lava Red|bc1917,Matte Forest Green|2d362a,Matte Olive Drab|696748,Matte Desert Brown|7a6c55,Matte Desert Tan|c3b492,Matte Foliage Green|5a6352,Default Alloy Color|81827f,Epsilon Blue|afd6e4,Pure Gold|7a6440,Brushed Gold|7f6a48`
      .split(',').map((e, i) => { const [name, hex] = e.trim().split('|'); return { i, name, hex: '#' + hex }; });
    const FINISH = [['all', 'Toutes'], ['Metallic', 'Métallisé'], ['Matte', 'Mat'], ['Util', 'Utilitaire'], ['Worn', 'Usé'], ['metal', 'Chrome & métaux'], ['other', 'Autres']];
    const finishOf = (n) => (/^(Metallic|Matte|Util|Worn)\b/.exec(n)?.[1] || (/Chrome|Brushed|Gold|Alloy/.test(n) ? 'metal' : 'other'));
    const DEF = { hex: '#ff7a18', alpha: 255, input: '#ff7a18', q: '', fin: 'all' };
    const s = F.clone(DEF);

    if (!document.getElementById('cl-style')) document.head.append(F.h(`<style id="cl-style">
      .cl-big{height:120px;border-radius:var(--r);border:1px solid var(--line-strong);display:flex;align-items:flex-end;justify-content:space-between;padding:12px 14px;font:600 15px var(--mono);
        background-image:linear-gradient(var(--cl-c),var(--cl-c)),conic-gradient(#ccc 25%,#fff 0 50%,#ccc 0 75%,#fff 0);background-size:auto,16px 16px}
      .cl-big span{padding:3px 8px;border-radius:6px;background:rgba(0,0,0,.45);color:#fff}
      .cl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}
      .cl-tile{display:flex;align-items:center;gap:8px;padding:6px;border-radius:var(--r-sm);border:1px solid var(--line);background:var(--surface-2);color:var(--ink);cursor:pointer;text-align:left;font:12px/1.25 var(--font);min-width:0}
      .cl-tile:hover{border-color:var(--brand-1)}
      .cl-tile i{width:30px;height:30px;border-radius:6px;flex-shrink:0;border:1px solid var(--line-strong)}
      .cl-tile b{display:block;font:600 12px var(--mono)}
      .cl-tile span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;color:var(--ink-2)}
      .cl-tile em{font-style:normal;color:var(--ink-3);font-size:11px}
      .cl-fmt td:first-child{white-space:nowrap}
      .cl-fmt .btn{max-width:100%;overflow:hidden;text-overflow:ellipsis}
    </style>`));

    root.append(F.h(`<div class="stack">
      <div class="split">
        <div class="panel stack">
          <div class="panel-head"><h3>Couleur</h3></div>
          <div class="cl-big"><span class="cl-hex"></span><span class="cl-near small"></span></div>
          <div class="grid-fields">
            <div class="field"><label>Sélecteur</label><input type="color" class="cl-pick"></div>
            <div class="field"><label>Opacité (alpha 0–255)</label><input type="range" min="0" max="255" step="1" class="cl-alpha"><output class="cl-aout"></output></div>
            <div class="field wide"><label>Coller une couleur</label><input type="text" class="cl-in" spellcheck="false" placeholder="#ff7a18, rgb(255, 0, 0), 16742936, { r = 255, g = 0, b = 0 }, vector3(1.0, 0.5, 0.0)…"></div>
          </div>
          <div class="cl-err"></div>
        </div>
        <div class="table-wrap"><table class="table cl-fmt"><thead><tr><th>Format</th><th>Valeur (clic = copier)</th></tr></thead><tbody></tbody></table></div>
      </div>
      <div class="panel stack">
        <div class="panel-head"><h3>Peintures véhicule GTA</h3><span class="muted small">clic = copier l’index · teintes approximatives</span></div>
        <div class="stack" style="gap:6px"><span class="muted small">Les plus proches de la couleur choisie</span><div class="cl-grid cl-closest"></div></div>
        <hr style="margin:4px 0">
        <div class="row"><input type="search" class="cl-q" placeholder="Rechercher un nom ou un index…" style="max-width:280px"><div class="row cl-fins">${FINISH.map(([k, l]) => `<button class="chip" data-fin="${k}">${l}</button>`).join('')}</div></div>
        <div class="cl-grid cl-all"></div>
        <p class="muted small">En Lua : <code>SetVehicleColours(vehicle, primaire, secondaire)</code> ; pour une couleur RGB libre : <code>SetVehicleCustomPrimaryColour(vehicle, r, g, b)</code>.</p>
      </div>
    </div>`));
    const pick = F.$('.cl-pick', root), inp = F.$('.cl-in', root), alpha = F.$('.cl-alpha', root);

    /* ------------------------------ conversions ------------------------------ */
    const clamp = (v, a = 0, b = 255) => Math.min(b, Math.max(a, v));
    const toHex = ({ r, g, b }) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    const rgbOf = (hex) => { const n = parseInt(hex.slice(1), 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; };
    const hsl = ({ r, g, b }) => {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
      let h = 0;
      const sat = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
      if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return [Math.round((h * 60 + 360) % 360), Math.round(sat * 100), Math.round(l * 100)];
    };
    const fromHsl = (h, sa, l) => {
      sa /= 100; l /= 100;
      const k = (n) => (n + h / 30) % 12, a = sa * Math.min(l, 1 - l);
      const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
      return { r: f(0), g: f(8), b: f(4) };
    };
    // Lit n'importe quel format courant → { r, g, b, a? } ou null.
    const parse = (raw) => {
      const t = String(raw || '').trim();
      let m;
      if ((m = /^(#|0x)?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(t)) && (m[1] || /[a-f]/i.test(m[2]))) {
        const h = m[2].length <= 4 ? [...m[2]].map((c) => c + c).join('') : m[2];
        return { ...rgbOf('#' + h.slice(0, 6)), a: h.length === 8 ? parseInt(h.slice(6), 16) : undefined };
      }
      if (/^\d{1,8}$/.test(t)) { const n = Number(t); if (n > 0xffffff) return null; return rgbOf('#' + n.toString(16).padStart(6, '0')); }
      if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/i.exec(t))) {
        const c = fromHsl(Number(m[1]) % 360, clamp(Number(m[2]), 0, 100), clamp(Number(m[3]), 0, 100));
        return { ...c, a: m[4] != null ? alphaOf(m[4]) : undefined };
      }
      const lab = {};
      for (const [, k, v] of t.matchAll(/\b([rgba])\s*[=:]\s*([\d.]+)/gi)) lab[k.toLowerCase()] = Number(v);
      let nums = 'r' in lab && 'g' in lab && 'b' in lab ? [lab.r, lab.g, lab.b, ...('a' in lab ? [lab.a] : [])] : (t.replace(/^[a-z0-9]*\s*\(|\)$/gi, '').match(/-?[\d.]+%?/g) || []);
      nums = nums.map((v) => String(v));
      if (nums.length < 3 || nums.length > 4) return null;
      const isRgbFn = /^rgba?\(/i.test(t);
      const norm = !isRgbFn && nums.slice(0, 3).every((v) => Number(v) <= 1) && (/^vec/i.test(t) || nums.slice(0, 3).some((v) => v.includes('.')));
      const ch = nums.slice(0, 3).map((v) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : norm ? Number(v) * 255 : Number(v)));
      if (ch.some((v) => !Number.isFinite(v))) return null;
      const [r, g, b] = ch.map((v) => Math.round(clamp(v)));
      let a;
      if (nums[3] != null) a = isRgbFn || norm || nums[3].endsWith('%') ? alphaOf(nums[3]) : Math.round(clamp(Number(nums[3])));
      return { r, g, b, a };
    };
    const alphaOf = (v) => Math.round(clamp(String(v).endsWith('%') ? (parseFloat(v) / 100) * 255 : Number(v) * 255));
    const dist = (a, b) => { const rm = (a.r + b.r) / 2, dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db); };

    /* --------------------------------- rendu --------------------------------- */
    const n3 = (v) => F.short(Math.round((v / 255) * 1000) / 1000, true);
    const tile = (p, extra = '') => `<button class="cl-tile" data-idx="${p.i}" title="${F.esc(p.name)} · ${p.hex}"><i style="background:${p.hex}"></i><div style="min-width:0"><b>${p.i}</b><span>${F.esc(p.name)}</span>${extra}</div></button>`;
    function render() {
      const c = rgbOf(s.hex), a = Math.round(clamp(Number(s.alpha) || 0)), af = F.short(Math.round((a / 255) * 100) / 100), [h, sa, l] = hsl(c), dec = parseInt(s.hex.slice(1), 16);
      pick.value = s.hex; alpha.value = a; F.$('.cl-aout', root).textContent = `${a} (${Math.round((a / 255) * 100)} %)`;
      if (document.activeElement !== inp) inp.value = s.input;
      const big = F.$('.cl-big', root);
      big.style.setProperty('--cl-c', `rgba(${c.r}, ${c.g}, ${c.b}, ${af})`);
      F.$('.cl-hex', root).textContent = s.hex.toUpperCase();
      const rows = [
        ['HEX', s.hex], ['HEX + alpha', s.hex + a.toString(16).padStart(2, '0')], ['RGB', `rgb(${c.r}, ${c.g}, ${c.b})`], ['RGBA', `rgba(${c.r}, ${c.g}, ${c.b}, ${af})`],
        ['HSL', `hsl(${h}, ${sa}%, ${l}%)`], ['Décimal (embed Discord)', String(dec)], ['Hexadécimal Lua / C#', '0x' + s.hex.slice(1).toUpperCase()],
        ['Table Lua', `{ r = ${c.r}, g = ${c.g}, b = ${c.b} }`], ['Table Lua + alpha', `{ r = ${c.r}, g = ${c.g}, b = ${c.b}, a = ${a} }`],
        ['Chat (color =)', `{ ${c.r}, ${c.g}, ${c.b} }`], ['Vecteur normalisé 0–1', `vector3(${n3(c.r)}, ${n3(c.g)}, ${n3(c.b)})`],
        ['DrawMarker (r, g, b, a)', `${c.r}, ${c.g}, ${c.b}, ${a}`], ['Peinture RGB véhicule', `SetVehicleCustomPrimaryColour(vehicle, ${c.r}, ${c.g}, ${c.b})`],
      ];
      F.$('.cl-fmt tbody', root).innerHTML = rows.map(([k, v]) => `<tr><td class="muted small">${k}</td><td><button class="btn sm ghost" data-copy="${F.esc(v)}"><code>${F.esc(v)}</code></button></td></tr>`).join('');
      const near = [...PAINT].sort((p, q) => dist(c, rgbOf(p.hex)) - dist(c, rgbOf(q.hex))).slice(0, 6);
      F.$('.cl-closest', root).innerHTML = near.map((p) => tile(p, `<em>écart ${Math.round(dist(c, rgbOf(p.hex)))}</em>`)).join('');
      F.$('.cl-near', root).textContent = `≈ peinture ${near[0].i}`;
      const fg = l > 62 ? '#111' : '#fff';
      F.$$('.cl-big span', root).forEach((e) => { e.style.background = fg === '#111' ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)'; e.style.color = fg; });
    }
    function renderPalette() {
      const q = s.q.trim().toLowerCase();
      const list = PAINT.filter((p) => (s.fin === 'all' || finishOf(p.name) === s.fin) && (!q || p.name.toLowerCase().includes(q) || String(p.i) === q));
      F.$('.cl-all', root).innerHTML = list.map((p) => tile(p)).join('') || '<div class="empty">Aucune peinture trouvée</div>';
      F.$$('[data-fin]', root).forEach((b) => b.classList.toggle('on', b.dataset.fin === s.fin));
      const qi = F.$('.cl-q', root);
      if (qi.value !== s.q) qi.value = s.q;
    }

    /* ------------------------------ événements ------------------------------ */
    pick.addEventListener('input', () => { s.hex = pick.value; s.input = pick.value; F.$('.cl-err', root).innerHTML = ''; render(); });
    alpha.addEventListener('input', () => { s.alpha = Number(alpha.value); render(); });
    inp.addEventListener('input', () => {
      s.input = inp.value;
      const c = parse(inp.value);
      F.$('.cl-err', root).innerHTML = !c && inp.value.trim() ? '<div class="note warn">Format non reconnu : essaie #ff7a18, rgb(255, 122, 24), 16742936 ou { r = 255, g = 122, b = 24 }.</div>' : '';
      if (c) { s.hex = toHex(c); if (c.a != null) s.alpha = c.a; render(); }
    });
    inp.addEventListener('blur', () => { inp.value = s.input; });
    F.$('.cl-q', root).addEventListener('input', (e) => { s.q = e.target.value; renderPalette(); });
    root.addEventListener('click', (e) => {
      const cp = e.target.closest('[data-copy]'), t = e.target.closest('[data-idx]'), f = e.target.closest('[data-fin]');
      if (cp) F.copy(cp.dataset.copy);
      else if (t) F.copy(t.dataset.idx, `Index ${t.dataset.idx} copié`);
      else if (f) { s.fin = f.dataset.fin; renderPalette(); }
    });

    render(); renderPalette();
    return {
      getState: () => F.clone(s),
      setState(v) {
        Object.assign(s, F.clone(DEF), v && typeof v === 'object' ? v : {});
        if (!/^#[0-9a-f]{6}$/i.test(s.hex)) s.hex = DEF.hex;
        s.hex = s.hex.toLowerCase(); s.input = String(s.input ?? s.hex); s.q = String(s.q ?? '');
        if (!FINISH.some(([k]) => k === s.fin)) s.fin = 'all';
        render(); renderPalette();
      },
    };
  },
});
