'use strict';
// Générateur carvariations.meta (+ carcols.meta minimal avec modkit) : couleurs par défaut, liveries, kits, plaques, lumières, sirènes.
Forge.register({
  id: 'carvariations',
  cat: 'vehicules',
  name: 'Générateur carvariations.meta',
  desc: 'Couleurs par défaut (palette GTA), liveries, modkit, plaques et sirènes ; carcols.meta minimal en option.',
  tags: ['carvariations', 'carcols', 'couleurs', 'peinture', 'modkit', 'livery', 'plaque', 'meta'],
  icon: 'palette',
  mount(root, F) {
    // Couleurs de véhicule GTA V (index, nom du jeu, teinte approximative pour l'aperçu).
    const PAL = `0 Metallic Black 0d1116|1 Metallic Graphite Black 1c1d21|2 Metallic Black Steel 32383d|3 Metallic Dark Silver 454b4f|4 Metallic Silver 999da0|5 Metallic Blue Silver c2c4c6|6 Metallic Steel Gray 979a97|7 Metallic Shadow Silver 637380|8 Metallic Stone Silver 63625c|9 Metallic Midnight Silver 3c3f47|10 Metallic Gun Metal 444e54|11 Metallic Anthracite Grey 1d2129|12 Matte Black 13181f|13 Matte Gray 26282a|14 Matte Light Grey 515554|15 Util Black 151921|16 Util Black Poly 1e2429|17 Util Dark Silver 333a3c|18 Util Silver 8c9095|19 Util Gun Metal 39434d|20 Util Shadow Silver 506272|21 Worn Black 1e232f|22 Worn Graphite 363a3f|23 Worn Silver Grey a0a199|24 Worn Silver d3d3d3|25 Worn Blue Silver b7bfca|26 Worn Shadow Silver 778794|27 Metallic Red c00e1a|28 Metallic Torino Red da1918|29 Metallic Formula Red b6111b|30 Metallic Blaze Red a51e23|31 Metallic Graceful Red 7b1a22|32 Metallic Garnet Red 8e1b1f|33 Metallic Desert Red 6f1818|34 Metallic Cabernet Red 49111d|35 Metallic Candy Red b60f25|36 Metallic Sunrise Orange d44a17|37 Metallic Classic Gold c2944f|38 Metallic Orange f78616|39 Matte Red cf1f21|40 Matte Dark Red 732021|41 Matte Orange f27d20|42 Matte Yellow ffc91f|43 Util Red 9c1016|44 Util Bright Red de0f18|45 Util Garnet Red 8f1e17|46 Worn Red a94744|47 Worn Golden Red b16c51|48 Worn Dark Red 371c25|49 Metallic Dark Green 132428|50 Metallic Racing Green 122e2b|51 Metallic Sea Green 12383c|52 Metallic Olive Green 31423f|53 Metallic Green 155c2d|54 Metallic Gasoline Blue Green 1b6770|55 Matte Lime Green 66b81f|56 Util Dark Green 22383e|57 Util Green 1d5a3f|58 Worn Dark Green 2d423f|59 Worn Green 45594b|60 Worn Sea Wash 65867f|61 Metallic Midnight Blue 222e46|62 Metallic Dark Blue 233155|63 Metallic Saxony Blue 304c7e|64 Metallic Blue 47578f|65 Metallic Mariner Blue 637ba7|66 Metallic Harbor Blue 394762|67 Metallic Diamond Blue d6e7f1|68 Metallic Surf Blue 76afbe|69 Metallic Nautical Blue 345e72|70 Metallic Bright Blue 0b9cf1|71 Metallic Purple Blue 2f2d52|72 Metallic Spinnaker Blue 282c4d|73 Metallic Ultra Blue 2354a1|74 Metallic Light Blue 6ea3c6|75 Util Dark Blue 112552|76 Util Midnight Blue 1b203e|77 Util Blue 275190|78 Util Sea Foam Blue 608592|79 Util Lightning Blue 2446a8|80 Util Maui Blue Poly 4271e1|81 Util Bright Blue 3b39e0|82 Matte Dark Blue 1f2852|83 Matte Blue 253aa7|84 Matte Midnight Blue 1c3551|85 Worn Dark Blue 4c5f81|86 Worn Blue 58688e|87 Worn Light Blue 74b5d8|88 Metallic Taxi Yellow ffcf20|89 Metallic Race Yellow fbe212|90 Metallic Bronze 916532|91 Metallic Yellow Bird e0e13d|92 Metallic Lime 98d223|93 Metallic Champagne 9b8c78|94 Metallic Pueblo Beige 503218|95 Metallic Dark Ivory 473f2b|96 Metallic Choco Brown 221b19|97 Metallic Golden Brown 653f23|98 Metallic Light Brown 775c3e|99 Metallic Straw Beige ac9975|100 Metallic Moss Brown 6c6b4b|101 Metallic Biston Brown 402e2b|102 Metallic Beechwood a4965f|103 Metallic Dark Beechwood 46231a|104 Metallic Choco Orange 752b19|105 Metallic Beach Sand bfae7b|106 Metallic Sun Bleached Sand dfd5b2|107 Metallic Cream f7edd5|108 Util Brown 3a2a1b|109 Util Medium Brown 785f33|110 Util Light Brown b5a079|111 Metallic White fffff6|112 Metallic Frost White eaeaea|113 Worn Honey Beige b0ab94|114 Worn Brown 453831|115 Worn Dark Brown 2a282b|116 Worn Straw Beige 726c57|117 Brushed Steel 6a747c|118 Brushed Black Steel 354158|119 Brushed Aluminium 9ba0a8|120 Chrome 5870a1|121 Worn Off White eae6de|122 Util Off White dfddd0|123 Worn Orange f2ad2e|124 Worn Light Orange f9a458|125 Metallic Securicor Green 83c566|126 Worn Taxi Yellow f1cc40|127 Police Car Blue 4cc3da|128 Matte Green 4e6443|129 Matte Brown bc9256|130 Worn Orange f8b658|131 Matte White fcf9f1|132 Worn White fffffb|133 Worn Olive Army Green 81844c|134 Pure White ffffff|135 Hot Pink f21f99|136 Salmon Pink fdd6cd|137 Metallic Vermillion Pink df5891|138 Orange f6ae20|139 Green b0ee6e|140 Blue 08e9fa|141 Metallic Black Blue 0a0c17|142 Metallic Black Purple 0c0d18|143 Metallic Black Red 0e0d14|144 Hunter Green 9f9e8a|145 Metallic Purple 621276|146 Metallic V Dark Blue 0b1421|147 Modshop Black 11141a|148 Matte Purple 6b1f7b|149 Matte Dark Purple 1e1d22|150 Metallic Lava Red bc1917|151 Matte Forest Green 2d362a|152 Matte Olive Drab 696748|153 Matte Desert Brown 7a6c55|154 Matte Desert Tan c3b492|155 Matte Foliage Green 5a6352|156 Default Alloy Color 81827f|157 Epsilon Blue afd6e4|158 Pure Gold 7a6440|159 Brushed Gold 7f6a48`
      .split('|').map((l) => { const m = l.match(/^(\d+) (.+) ([0-9a-f]{6})$/); return { i: +m[1], n: m[2], hex: '#' + m[3] }; });
    const PLATES = ['Standard White', 'Blue on White 1', 'Blue on White 2', 'Blue on White 3', 'Yellow on Black', 'Yellow on Blue'];
    const SLOTS = ['Primaire', 'Secondaire', 'Nacré', 'Jantes'];
    const DEFV = { model: 'mycar', colors: [[0, 0, 0, 156], [111, 111, 0, 156], [27, 27, 28, 156]], liveries: 0, kitId: 0, kitName: '', lightSettings: 1, sirenSettings: 0, plates: [{ name: 'Standard White', value: 100 }] };
    const s = { carcols: true, perf: true, kitType: 'MKT_SPECIAL', sel: 0, vehicles: [{ ...F.clone(DEFV), id: F.uid() }] };
    let active = [0, 0];
    const cur = () => s.vehicles[s.sel];
    const kitOf = (v) => (Number(v.kitId) > 0 ? (v.kitName.trim() || `${Math.round(v.kitId)}_${F.slug(v.model)}_modkit`) : '0_default_modkit');
    const col = (i) => PAL[i] || { i, n: 'Couleur ' + i, hex: '#888888' };

    root.append(F.h(`<div class="split wide-left cv">
      <style>.cv .cv-pal{display:grid;grid-template-columns:repeat(auto-fill,minmax(26px,1fr));gap:4px}
        .cv .cv-pal button{aspect-ratio:1;border-radius:6px;border:1px solid var(--line-strong);cursor:pointer;padding:0}
        .cv .cv-pal button:hover{transform:scale(1.15)}
        .cv .cv-slot{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:8px;border:1px solid var(--line-strong);background:var(--surface-2);color:var(--ink);font:12px var(--font);cursor:pointer;min-width:0}
        .cv .cv-slot.on{border-color:var(--brand-1);box-shadow:0 0 0 3px var(--glow)}</style>
      <div class="stack">
        <div class="panel stack">
          <div class="panel-head"><h3>Véhicules</h3>
            <button class="btn sm ghost" data-a="add">${F.icon('plus')}Ajouter</button>
            <button class="btn sm ghost" data-a="dup">${F.icon('copy')}Dupliquer</button>
            <button class="btn sm ghost danger" data-a="del">${F.icon('trash')}Supprimer</button></div>
          <div class="row vlist"></div>
          <div class="grid-fields vf"></div>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Couleurs par défaut</h3><span class="muted small">une ligne = une combinaison possible au spawn</span>
            <button class="btn sm ghost" data-a="addc">${F.icon('plus')}Combinaison</button></div>
          <div class="table-wrap"><table class="table"><thead><tr><th>#</th>${SLOTS.map((x) => `<th>${x}</th>`).join('')}<th></th></tr></thead><tbody class="combos"></tbody></table></div>
          <div class="row"><input type="search" class="pal-q" placeholder="Filtrer la palette (nom ou index)…" style="max-width:280px"><span class="muted small pal-info"></span></div>
          <div class="cv-pal"></div>
          <p class="muted small">Teintes d’aperçu approximatives : seul l’index compte dans le fichier.</p>
        </div>
        <div class="panel stack">
          <div class="panel-head"><h3>Plaques</h3><span class="muted small">probabilités (total conseillé : 100)</span><button class="btn sm ghost" data-a="addp">${F.icon('plus')}Plaque</button></div>
          <div class="plates stack"></div>
          <datalist id="cv-plates">${PLATES.map((p) => `<option value="${p}">`).join('')}</datalist>
        </div>
      </div>
      <div class="stack sticky side"><div class="panel"><div class="panel-head"><h3>carcols.meta</h3></div><div class="grid-fields opts"></div></div></div>
    </div>`));
    const outV = F.output({ title: 'carvariations.meta', filename: 'carvariations.meta', lang: 'xml' });
    const outC = F.output({ title: 'carcols.meta', filename: 'carcols.meta', lang: 'xml' });
    F.$('.side', root).append(outV.el, outC.el);
    const pal = F.$('.cv-pal', root);

    // ---------- sortie ----------
    const ind = (pad, nums) => nums.map((n) => `${pad}  ${n}`).join('\n');
    const buildVar = () => {
      const items = s.vehicles.map((v) => {
        const liv = Math.max(0, Math.round(v.liveries) || 0);
        const colors = v.colors.map((c) => `        <Item>
          <indices content="char_array">
${ind('          ', c.map((n) => Math.max(0, Math.min(255, Math.round(n) || 0))))}
          </indices>
          ${liv ? `<liveries>\n${Array.from({ length: liv }, () => '            <Item value="true" />').join('\n')}\n          </liveries>` : '<liveries />'}
        </Item>`).join('\n');
        const plates = v.plates.filter((p) => p.name.trim()).map((p) => `          <Item>
            <Name>${F.esc(p.name.trim())}</Name>
            <Value value="${Math.max(0, Math.round(p.value) || 0)}" />
          </Item>`).join('\n');
        return `    <Item>
      <modelName>${F.esc(v.model)}</modelName>
      ${v.colors.length ? `<colors>\n${colors}\n      </colors>` : '<colors />'}
      <kits>
        <Item>${F.esc(kitOf(v))}</Item>
      </kits>
      <windowsWithExposedEdges />
      <plateProbabilities>
        ${plates ? `<Probabilities>\n${plates}\n        </Probabilities>` : '<Probabilities />'}
      </plateProbabilities>
      <lightSettings value="${Math.round(v.lightSettings) || 0}" />
      <sirenSettings value="${Math.round(v.sirenSettings) || 0}" />
    </Item>`;
      }).join('\n');
      return `<?xml version="1.0" encoding="UTF-8"?>\n<CVehicleModelInfoVariation>\n  <variationData>\n${items}\n  </variationData>\n</CVehicleModelInfoVariation>\n`;
    };
    const PERF = [['VMT_ENGINE', [25, 50, 75, 100], 20], ['VMT_BRAKES', [25, 50, 100], 5], ['VMT_GEARBOX', [25, 50, 100], 5], ['VMT_SUSPENSION', [25, 50, 75, 100], 5], ['VMT_ARMOUR', [20, 40, 60, 80, 100], 0]];
    const buildCols = () => {
      const kits = s.vehicles.filter((v) => Number(v.kitId) > 0);
      const seen = new Set();
      const items = kits.filter((v) => !seen.has(kitOf(v)) && seen.add(kitOf(v))).map((v) => {
        const stat = s.perf ? `<statMods>\n${PERF.flatMap(([t, mods, w]) => mods.map((m) => `        <Item>
          <identifier />
          <modifier value="${m}" />
          <audioApply value="1.000000" />
          <weight value="${w}" />
          <type>${t}</type>
        </Item>`)).join('\n')}\n      </statMods>` : '<statMods />';
        return `    <Item>
      <kitName>${F.esc(kitOf(v))}</kitName>
      <id value="${Math.round(v.kitId)}" />
      <kitType>${F.esc(s.kitType)}</kitType>
      <visibleMods />
      <linkMods />
      ${stat}
      <slotNames />
      <liveryNames />
    </Item>`;
      }).join('\n');
      return `<?xml version="1.0" encoding="UTF-8"?>\n<CVehicleModelInfoVarGlobal>\n  ${items ? `<Kits>\n${items}\n  </Kits>` : '<Kits />'}\n  <Lights />\n</CVehicleModelInfoVarGlobal>\n`;
    };
    const render = () => {
      outV.set(buildVar());
      outC.el.hidden = !s.carcols;
      outC.set(buildCols());
      const noKit = s.carcols && !s.vehicles.some((v) => Number(v.kitId) > 0);
      outC.setTitle(noKit ? 'carcols.meta — aucun modkit personnalisé (id > 0)' : 'carcols.meta');
    };

    // ---------- interface ----------
    let vfRefresh;
    const renderList = () => { F.$('.vlist', root).innerHTML = s.vehicles.map((v, i) => `<button class="chip${i === s.sel ? ' on' : ''}" data-i="${i}">${F.esc(v.model || '(sans nom)')}</button>`).join(''); };
    const renderVF = () => {
      const box = F.$('.vf', root); box.innerHTML = '';
      vfRefresh = F.fields(box, [
        { key: 'model', label: 'modelName', hint: 'Nom du modèle (identique au vehicles.meta).' },
        { key: 'liveries', label: 'Nombre de liveries', type: 'number', min: 0, step: 1, hint: 'Nombre de liveries du modèle (0 = aucune). Chaque combinaison de couleurs les autorise toutes.' },
        { key: 'kitId', label: 'Id du modkit (0 = défaut)', type: 'number', min: 0, step: 1, hint: '0 = 0_default_modkit. Sinon un id unique sur ton serveur (ex. 1000 et plus) : le kit sera créé dans carcols.meta.' },
        { key: 'kitName', label: 'Nom du modkit', placeholder: '', hint: 'Vide = <id>_<modèle>_modkit. Doit commencer par l’id.' },
        { key: 'lightSettings', label: 'lightSettings', type: 'number', step: 1, hint: 'Id du réglage de phares (bloc <Lights> d’un carcols). Garde la valeur du véhicule de base.' },
        { key: 'sirenSettings', label: 'sirenSettings', type: 'number', step: 1, hint: 'Id des sirènes (carcols) ; 0 = pas de sirène.' },
      ], cur(), (k) => { if (k === 'model') renderList(); syncKitPh(); render(); });
      syncKitPh();
    };
    const syncKitPh = () => { const i = F.$$('.vf input', root)[3]; if (i) { i.placeholder = Number(cur().kitId) > 0 ? `${Math.round(cur().kitId)}_${F.slug(cur().model)}_modkit` : '0_default_modkit'; i.disabled = !(Number(cur().kitId) > 0); } };
    const renderCombos = () => {
      F.$('.combos', root).innerHTML = cur().colors.map((c, r) => `<tr><td class="muted">${r + 1}</td>${c.map((n, k) => `<td><button class="cv-slot${active[0] === r && active[1] === k ? ' on' : ''}" data-slot="${r},${k}" title="${F.esc(col(n).n)}"><span class="swatch" style="background:${col(n).hex}"></span>${n}</button></td>`).join('')}
        <td class="actions"><button class="btn sm ghost danger" data-delc="${r}" title="Supprimer">${F.icon('x')}</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">Aucune combinaison : le jeu choisira les couleurs au hasard.</td></tr>';
      const [r, k] = active, c = cur().colors[r];
      F.$('.pal-info', root).textContent = c ? `Clic sur une couleur → ${SLOTS[k].toLowerCase()} de la combinaison ${r + 1} (actuel : ${c[k]} · ${col(c[k]).n})` : '';
    };
    const renderPal = () => {
      const q = F.$('.pal-q', root).value.trim().toLowerCase();
      pal.innerHTML = PAL.filter((c) => !q || String(c.i) === q || c.n.toLowerCase().includes(q)).map((c) => `<button data-c="${c.i}" style="background:${c.hex}" title="${c.i} · ${F.esc(c.n)}" aria-label="${c.i} ${F.esc(c.n)}"></button>`).join('') || '<span class="muted small">Aucune couleur</span>';
    };
    const renderPlates = () => {
      F.$('.plates', root).innerHTML = cur().plates.map((p, i) => `<div class="row"><input type="text" list="cv-plates" data-pn="${i}" value="${F.esc(p.name)}" style="flex:1;min-width:160px"><input type="number" data-pv="${i}" value="${p.value}" min="0" step="1" style="width:90px"><button class="btn sm ghost danger" data-delp="${i}">${F.icon('x')}</button></div>`).join('') || '<span class="muted small">Aucune plaque : le jeu utilise sa répartition par défaut.</span>';
    };
    const renderAll = () => { s.sel = Math.min(Math.max(0, s.sel), s.vehicles.length - 1); active = [0, 0]; renderList(); renderVF(); renderCombos(); renderPlates(); optsRefresh(); render(); };

    const opts = F.fields(F.$('.opts', root), [
      { key: 'carcols', label: 'Générer carcols.meta', type: 'checkbox', wide: true },
      { key: 'kitType', label: 'kitType', type: 'select', options: ['MKT_SPECIAL', 'MKT_STANDARD', 'MKT_SPORT', 'MKT_SUV'], hint: 'Type de kit utilisé par le Los Santos Customs.' },
      { key: 'perf', label: 'Améliorations moteur, freins, boîte, suspension, blindage', type: 'checkbox', wide: true },
    ], s, render);
    const optsRefresh = opts.refresh;
    F.$('.opts', root).append(F.h('<p class="note small" style="grid-column:1/-1">Le carcols.meta contient un kit (modkit) par véhicule ayant un id &gt; 0. Sans kit, le véhicule utilise 0_default_modkit et n’a pas de pièces de tuning propres.</p>'));

    F.$('.pal-q', root).oninput = renderPal;
    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.pn != null) { cur().plates[t.dataset.pn].name = t.value; render(); }
      if (t.dataset.pv != null) { cur().plates[t.dataset.pv].value = Number(t.value) || 0; render(); }
    });
    root.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      const v = cur(), d = t.dataset;
      if (d.i != null) { s.sel = Number(d.i); active = [0, 0]; renderList(); renderVF(); renderCombos(); renderPlates(); }
      else if (d.slot) { active = d.slot.split(',').map(Number); renderCombos(); }
      else if (d.c != null) { if (!v.colors[active[0]]) return F.toast('Ajoute d’abord une combinaison', 'error'); v.colors[active[0]][active[1]] = Number(d.c); if (active[1] < 3) active[1]++; renderCombos(); render(); }
      else if (d.delc != null) { v.colors.splice(Number(d.delc), 1); active = [0, 0]; renderCombos(); render(); }
      else if (d.delp != null) { v.plates.splice(Number(d.delp), 1); renderPlates(); render(); }
      else if (d.a === 'addc') { v.colors.push([...(v.colors[v.colors.length - 1] || [0, 0, 0, 156])]); active = [v.colors.length - 1, 0]; renderCombos(); render(); }
      else if (d.a === 'addp') { v.plates.push({ name: PLATES[v.plates.length % PLATES.length], value: 0 }); renderPlates(); render(); }
      else if (d.a === 'add' || d.a === 'dup') {
        const n = d.a === 'add' ? { ...F.clone(DEFV), model: 'mycar' + (s.vehicles.length + 1) } : { ...F.clone(v), model: v.model + '2', kitId: v.kitId > 0 ? Number(v.kitId) + 1 : 0, kitName: '' };
        n.id = F.uid(); s.vehicles.splice(s.sel + 1, 0, n); s.sel++; renderAll();
      } else if (d.a === 'del') {
        if (s.vehicles.length < 2) return F.toast('Il faut garder au moins un véhicule', 'error');
        if (confirm(`Supprimer ${v.model} ?`)) { s.vehicles.splice(s.sel, 1); renderAll(); }
      }
    });

    renderPal(); renderAll();
    return {
      getState: () => F.clone(s),
      setState(v) {
        v = v || {};
        s.carcols = v.carcols ?? true; s.perf = v.perf ?? true; s.kitType = v.kitType || 'MKT_SPECIAL'; s.sel = Number(v.sel) || 0;
        s.vehicles = (Array.isArray(v.vehicles) && v.vehicles.length ? v.vehicles : [{}]).map((x) => {
          const o = { ...F.clone(DEFV), id: F.uid(), ...x };
          o.colors = Array.isArray(o.colors) ? o.colors.filter(Array.isArray).map((c) => [0, 1, 2, 3].map((k) => Number(c[k]) || 0)) : F.clone(DEFV.colors);
          o.plates = Array.isArray(o.plates) ? o.plates.map((p) => ({ name: String(p.name || ''), value: Number(p.value) || 0 })) : F.clone(DEFV.plates);
          return o;
        });
        renderAll();
      },
    };
  },
});
