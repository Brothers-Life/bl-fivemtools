'use strict';
// Calculateur de hash GTA (joaat / GetHashKey) : un nom par ligne → hash signé, non signé, hexadécimal.
Forge.register({
  id: 'hash',
  cat: 'convertisseurs',
  name: 'Calculateur de hash (joaat)',
  desc: 'GetHashKey / `model` en signé, non signé et hexadécimal, plusieurs noms à la fois.',
  tags: ['hash', 'joaat', 'gethashkey', 'model', 'backtick', 'hex'],
  icon: 'hash',
  mount(root, F) {
    const s = { input: 'adder\nWEAPON_PISTOL\nmp_m_freemode_01' };
    root.append(F.h(`<div class="split">
      <div class="panel stack"><div class="panel-head"><h3>Noms</h3><span class="muted small">un par ligne, insensible à la casse</span></div><div class="f"></div></div>
      <div class="stack res"></div></div>`));
    const res = F.$('.res', root);
    const table = F.h('<div class="table-wrap"><table class="table"><thead><tr><th>Nom</th><th>Non signé</th><th>Signé</th><th>Hex</th></tr></thead><tbody></tbody></table></div>');
    const out = F.output({ title: 'Lua', filename: 'hashes.lua', lang: 'lua' });
    res.append(table, out.el);

    const render = () => {
      const names = s.input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const rows = names.map((n) => { const u = F.joaat(n); return { n, u, i: F.signed32(u), x: F.hex32(u) }; });
      F.$('tbody', table).innerHTML = rows.map((r) => `<tr><td><code>${F.esc(r.n)}</code></td>${[r.u, r.i, r.x].map((v) => `<td><button class="btn sm ghost" data-v="${v}">${v}</button></td>`).join('')}</tr>`).join('')
        || '<tr><td colspan="4" class="empty">Tape un nom à gauche</td></tr>';
      out.set(rows.map((r) => `[\`${r.n}\`] = ${r.i}, -- ${r.x}`).join('\n'));
    };
    F.fields(F.$('.f', root), [{ key: 'input', label: 'Noms de modèles, armes, peds…', type: 'textarea', rows: 12, wide: true }], s, render);
    table.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) F.copy(b.dataset.v); });
    render();
    return { getState: () => ({ ...s }), setState(v) { Object.assign(s, v); F.$$('textarea', root)[0].value = s.input; render(); } };
  },
});
