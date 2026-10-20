'use strict';
// Créateur de pack de vêtements addon : dépose tes .ydd/.ytd/.yld, choisis les composants → ressource FiveM renommée (stream + .meta + fxmanifest + .ymt.xml).
Forge.register({
  id: 'clothing-pack',
  cat: 'vetements',
  name: 'Créateur de pack de vêtements',
  desc: 'Renomme tes .ydd/.ytd selon la convention addon FiveM, génère fxmanifest, ShopPedApparel .meta et le .ymt (XML CodeWalker) en .zip.',
  tags: ['vetements', 'clothes', 'addon', 'ydd', 'ytd', 'yld', 'ymt', 'stream', 'freemode', 'jbib', 'props', 'shop_ped_apparel'],
  icon: 'shirt',
  mount(root, F) {
    /* ------------------------------ données GTA ------------------------------ */
    // [clé, id GTA, libellé] — composants (SetPedComponentVariation) puis props (SetPedPropIndex / ancre).
    const COMPS = [['head', 0, 'Tête'], ['berd', 1, 'Masques'], ['hair', 2, 'Cheveux'], ['uppr', 3, 'Torse / bras'], ['lowr', 4, 'Jambes'], ['hand', 5, 'Sacs / parachutes'],
      ['feet', 6, 'Chaussures'], ['teef', 7, 'Accessoires (cou)'], ['accs', 8, 'Sous-haut'], ['task', 9, 'Gilets'], ['decl', 10, 'Décals'], ['jbib', 11, 'Hauts']];
    const PROPS = [['p_head', 0, 'Chapeaux', 'ANCHOR_HEAD'], ['p_eyes', 1, 'Lunettes', 'ANCHOR_EYES'], ['p_ears', 2, 'Oreilles', 'ANCHOR_EARS'],
      ['p_lwrist', 6, 'Montres', 'ANCHOR_LEFT_WRIST'], ['p_rwrist', 7, 'Bracelets', 'ANCHOR_RIGHT_WRIST']];
    const ALL = [...COMPS, ...PROPS];
    const META = Object.fromEntries(ALL.map(([k, id, l, a]) => [k, { id, label: l, anchor: a, prop: k.startsWith('p_') }]));
    const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
    const STRUCT = /(^|[^a-z])(p_(?:head|eyes|ears|lwrist|rwrist)|head|berd|hair|uppr|lowr|hand|feet|teef|accs|task|decl|jbib)_(?:diff_)?(\d{3})(?=[_.])/;
    const GUESS = [ // nom de fichier « libre » → composant
      ['p_head', /chapeau|casquette|bonnet|beanie|(^|[^a-z])(hat|cap|helmet|casque)/], ['p_eyes', /lunette|glass/], ['p_ears', /earring|boucle|oreille|(^|[^a-z])ears?([^a-z]|$)/],
      ['p_lwrist', /montre|watch/], ['p_rwrist', /bracelet/], ['berd', /mask|masque|cagoule/], ['hair', /hair|cheveu|coiffure/],
      ['lowr', /pant|jean|pantalon|short|jupe|skirt|jogging|legging/], ['feet', /shoe|chaussure|boot|botte|basket|sneaker|sandal/],
      ['task', /gilet|vest|armou?r|kevlar/], ['hand', /(^|[^a-z])(bag|sac)|backpack|parachute/], ['teef', /chain|collier|necklace|chaine|tie|cravate/],
      ['accs', /undershirt|sous[-_ ]?haut|tank|debardeur/], ['decl', /decal|badge|patch/], ['uppr', /glove|gant|arms?([^a-z]|$)|bras/],
      ['jbib', /shirt|veste|jacket|hoodie|sweat|top|manteau|coat|pull/],
    ];
    const SUFFIX = { u: { ydd: 'u', ytd: 'uni', texId: 0 }, r: { ydd: 'r', ytd: 'whi', texId: 1 } };

    /* -------------------------------- état -------------------------------- */
    const DEF = { pack: 'bl_clothes', gender: 'm', suffix: 'u', folders: true, rockstar: false, creature: true, items: [], orphans: [] };
    // item : { id, g: 'm'|'f', comp, ydd: {n,k}|null, yld: {n,k}|null, tex: [{n,k}] }  — n = nom d'origine ('' si « noms seulement »), k = clé du File en mémoire.
    const s = F.clone(DEF);
    const files = new Map(); // k → File (jamais sauvegardé)
    const ext = (n) => (n.match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
    const entry = (file) => { const k = F.uid(); files.set(k, file); return { n: file.name, k }; };
    const guessG = (n) => (s.gender !== 'mf' ? s.gender : /mp_f_|(^|[^a-z])(f|female|femme|woman|women|girl)([^a-z]|$)/.test(n.toLowerCase()) ? 'f' : 'm');
    const info = (name) => {
      const low = name.toLowerCase(), base = low.replace(/\.[a-z0-9]+$/, ''), m = low.match(STRUCT);
      if (m) return { base, comp: m[2], key: low.slice(0, m.index + m[1].length) + '|' + m[2] + '|' + m[3] };
      const g = GUESS.find(([, re]) => re.test(base));
      return { base, comp: g ? g[0] : 'jbib', key: null };
    };

    /* ------------------------------ interface ------------------------------ */
    root.append(F.h(`<div class="stack cp-root">
      <style>.cp-root .cp-files{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.cp-root .cp-files .chip{max-width:260px}.cp-root .cp-files .chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .cp-root .chip.miss{border-color:color-mix(in srgb,var(--warn) 50%,transparent)}.cp-root .chip button{border:0;background:none;color:var(--ink-3);cursor:pointer;padding:0;font-size:14px;line-height:1}
      .cp-root td code{font-size:12px;word-break:break-all}.cp-root .table td select{min-width:150px}.cp-root .cp-tree{max-height:420px;overflow:auto}.cp-root .cp-num{width:64px}</style>
      <div class="split wide-left">
        <div class="stack">
          <div class="panel"><div class="panel-head"><h3>Pack</h3><span class="muted small">ressource FiveM</span></div><div class="grid-fields f-pack"></div></div>
          <div class="panel stack">
            <div class="panel-head"><h3>Fichiers</h3><span class="chip cp-count"></span><button class="btn sm ghost danger" data-a="clear">${F.icon('trash')}Tout vider</button></div>
            <div class="drop">${F.icon('upload')}<br><b>Glisse tes .ydd, .ytd (et .yld) ici</b> ou clique pour choisir<br><span class="small muted">Lus dans ton navigateur, jamais envoyés au serveur. Les textures sont regroupées avec leur modèle d'après le nom.</span></div>
            <details><summary class="small muted" style="cursor:pointer">Pas encore de fichiers ? Générer seulement les noms (modèles vides)</summary>
              <div class="row" style="margin-top:10px"><select class="v-comp" style="width:auto"></select><select class="v-g" style="width:auto"><option value="m">Homme</option><option value="f">Femme</option></select>
              <label class="small muted">modèles <input class="v-n cp-num" type="number" min="1" max="200" value="1"></label>
              <label class="small muted">textures chacun <input class="v-t cp-num" type="number" min="1" max="26" value="1"></label>
              <button class="btn sm" data-a="virtual">${F.icon('plus')}Ajouter</button></div></details>
            <div class="cp-issues stack"></div>
            <div class="table-wrap"><table class="table"><thead><tr><th>N°</th><th class="th-g">Genre</th><th>Composant / prop</th><th>Modèle et textures (noms d'origine)</th><th></th></tr></thead><tbody class="cp-rows"></tbody></table></div>
            <div class="cp-orphans"></div>
            <div class="row cp-stats"></div>
          </div>
        </div>
        <div class="stack sticky">
          <div class="panel stack">
            <div class="panel-head"><h3>Exporter</h3></div>
            <div class="row"><button class="btn primary" data-a="zip">${F.icon('download')}Télécharger le .zip</button>
              <button class="btn sm" data-a="bat">Script .bat</button><button class="btn sm" data-a="sh">Script .sh</button><button class="btn sm ghost" data-a="txt">Liste des noms</button></div>
            <p class="small muted">Les scripts renomment/copient tes fichiers d'origine directement sur ton PC (à lancer dans le dossier qui les contient) : pratique pour les gros packs.</p>
            <div class="note warn">Le <b>.ymt</b> est fourni en <b>XML</b> (<code>…ymt.xml</code>) : il faut le convertir en .ymt binaire (procédure dans <code>LISEZMOI.txt</code> du zip). Sans .ymt dans <code>stream/</code>, les vêtements n'apparaissent pas. Vérifie-le dans CodeWalker avant de l'utiliser.</div>
          </div>
          <div class="row"><select class="cp-pick" style="width:auto;max-width:100%"></select></div>
          <div class="cp-out"></div>
        </div>
      </div>
      <div class="panel stack"><div class="panel-head"><h3>Arborescence finale</h3><span class="muted small">ancien nom → nouveau nom</span></div><div class="table-wrap cp-tree"><table class="table"><thead><tr><th>Fichier d'origine</th><th>Chemin dans la ressource</th></tr></thead><tbody class="cp-map"></tbody></table></div></div>
    </div>`));
    const $ = (sel) => F.$(sel, root);
    const out = F.output({ title: 'fxmanifest.lua', filename: () => outName, lang: 'lua' });
    $('.cp-out').append(out.el);
    let outName = 'fxmanifest.lua', gen = [];
    const compOpts = (sel) => `<optgroup label="Composants">${COMPS.map(([k, id, l]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${k} — ${l} (${id})</option>`).join('')}</optgroup>
      <optgroup label="Props">${PROPS.map(([k, id, l]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${k} — ${l} (${id})</option>`).join('')}</optgroup>`;
    $('.v-comp').innerHTML = compOpts('jbib');

    const packFields = F.fields($('.f-pack'), [
      { key: 'pack', label: 'Nom du pack', placeholder: 'bl_clothes', hint: 'Minuscules, chiffres et _ uniquement. Sert de nom de ressource et de nom de collection (dlcName).' },
      { key: 'gender', label: 'Genre', type: 'select', options: [['m', 'Homme (mp_m_freemode_01)'], ['f', 'Femme (mp_f_freemode_01)'], ['mf', 'Les deux (choix par modèle)']] },
      { key: 'suffix', label: 'Suffixes', type: 'select', options: [['u', '_u / _uni (universel, le plus courant)'], ['r', '_r / _whi (variante « race »)']], hint: '_u + _uni : un modèle pour toutes les carnations. _r + _whi : ancienne convention par carnation.' },
      { key: 'folders', label: 'Sous-dossiers [collection] dans stream/', type: 'checkbox', hint: 'Simple rangement : FiveM lit tout stream/ quel que soit le sous-dossier.' },
      { key: 'rockstar', label: 'Préfixer la collection par mp_m_ / mp_f_', type: 'checkbox', hint: 'Style Rockstar / Durty Cloth Tool : mp_m_freemode_01_mp_m_<pack>. Recommandé si tu fais un pack homme + femme.' },
      { key: 'creature', label: 'Ligne creatureMetaData dans le .meta', type: 'checkbox' },
    ], s, () => render());

    /* ------------------------------ ajout de fichiers ------------------------------ */
    const allEntries = () => s.items.flatMap((it) => [it.ydd, it.yld, ...it.tex]).concat(s.orphans).filter(Boolean);
    function addFiles(list) {
      const ok = list.filter((f) => ['ydd', 'ytd', 'yld'].includes(ext(f.name)));
      if (ok.length < list.length) F.toast(`${list.length - ok.length} fichier(s) ignoré(s) : seuls .ydd, .ytd et .yld sont acceptés`, 'error');
      // 1) fichiers ré-ajoutés après rechargement d'un projet : on les rattache par nom.
      const fresh = [];
      for (const f of ok) {
        const e = allEntries().find((x) => x.n === f.name && !files.has(x.k));
        if (e) files.set(e.k, f); else fresh.push(f);
      }
      // 2) nouveaux modèles
      const news = fresh.filter((f) => ext(f.name) === 'ydd').sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))
        .map((f) => { const i = info(f.name); return { id: F.uid(), g: guessG(f.name), comp: i.comp, ydd: entry(f), yld: null, tex: [], _i: i }; });
      const pool = [...news, ...s.items.filter((it) => it.ydd?.n).map((it) => ({ it, _i: info(it.ydd.n) }))].map((x) => ({ it: x.it || x, i: x._i }));
      const find = (n) => {
        const i = info(n);
        const same = (p) => s.gender !== 'mf' || p.it.g === guessG(n);
        if (i.key) { const m = pool.find((p) => p.i.key === i.key && same(p)); if (m) return m.it; }
        const c = pool.filter((p) => same(p) && i.base.startsWith(p.i.base)).sort((a, b) => b.i.base.length - a.i.base.length);
        return c[0]?.it || null;
      };
      let orph = 0;
      for (const f of fresh.filter((x) => ext(x.name) === 'yld')) { const it = find(f.name); if (it && !it.yld) it.yld = entry(f); else { orph++; F.toast(`${f.name} : aucun .ydd correspondant, ignoré`, 'error'); } }
      for (const f of fresh.filter((x) => ext(x.name) === 'ytd').sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))) {
        const it = find(f.name);
        if (it) it.tex.push(entry(f)); else { s.orphans.push(entry(f)); orph++; }
      }
      news.forEach((it) => { delete it._i; it.tex.sort((a, b) => a.n.localeCompare(b.n, 'fr', { numeric: true })); });
      s.items.push(...news);
      F.toast(`${ok.length} fichier(s) : ${news.length} modèle(s) ajouté(s)${orph ? `, ${orph} texture(s) à associer` : ''}`);
      render();
    }
    const drop = $('.drop');
    F.dropZone(drop, addFiles);
    drop.onclick = async () => addFiles(await F.pickFiles({ accept: '.ydd,.ytd,.yld', multiple: true }));

    /* ------------------------------ plan de renommage ------------------------------ */
    const pack = () => F.slug(s.pack) || 'pack';
    const dlc = (g) => (s.rockstar ? `mp_${g}_` : '') + pack();
    const coll = (g, prop) => `mp_${g}_freemode_01_${prop ? 'p_' : ''}${dlc(g)}`;
    const dir = (g, prop) => 'stream/' + (s.folders ? `[${coll(g, prop)}]/` : '');
    const genders = () => (s.gender === 'mf' ? ['m', 'f'] : [s.gender]);
    function plan() {
      const cnt = {}, sfx = SUFFIX[s.suffix] || SUFFIX.u;
      return s.items.map((it) => {
        const g = s.gender === 'mf' ? it.g : s.gender, m = META[it.comp] || META.jbib, key = g + it.comp;
        const n = (cnt[key] = (cnt[key] ?? -1) + 1), num = F.pad(n), c = coll(g, m.prop), d = dir(g, m.prop);
        const model = m.prop ? `${c}^${it.comp}_${num}` : `${c}^${it.comp}_${num}_${sfx.ydd}`;
        const tex = it.tex.map((t, i) => d + (m.prop ? `${c}^${it.comp}_diff_${num}_${LETTERS[i] || '?'}.ytd` : `${c}^${it.comp}_diff_${num}_${LETTERS[i] || '?'}_${sfx.ytd}.ytd`));
        return { it, g, m, n, ydd: d + model + '.ydd', yld: it.yld ? d + model + '.yld' : null, tex };
      });
    }

    /* ------------------------------ fichiers texte générés ------------------------------ */
    const metaName = (g) => `mp_${g}_freemode_01_${dlc(g)}.meta`;
    const ymtName = (g) => `mp_${g}_freemode_01_${dlc(g)}.ymt`;
    const usedG = (p) => genders().filter((g) => p.some((r) => r.g === g));
    function fxmanifest(p) {
      const gs = usedG(p).length ? usedG(p) : genders();
      return `fx_version 'cerulean'
game 'gta5'

author 'BL Forge'
description ${F.luaStr(`Pack de vêtements addon ${pack()}`)}
version '1.0.0'

-- Les .ydd / .ytd / .yld et le .ymt dans stream/ sont chargés automatiquement.
files {
${gs.map((g) => `    ${F.luaStr(metaName(g))},`).join('\n')}
}

${gs.map((g) => `data_file 'SHOP_PED_APPAREL_META_FILE' ${F.luaStr(metaName(g))}`).join('\n')}
`;
    }
    const meta = (g) => `<?xml version="1.0" encoding="UTF-8"?>
<ShopPedApparel>
  <pedName>mp_${g}_freemode_01</pedName>
  <dlcName>${dlc(g)}</dlcName>
  <fullDlcName>mp_${g}_freemode_01_${dlc(g)}</fullDlcName>
  <eCharacter>SCR_CHAR_MULTIPLAYER</eCharacter>
${s.creature ? `  <creatureMetaData>mp_creaturemetadata_${dlc(g)}</creatureMetaData>\n` : ''}  <pedOutfits />
  <pedComponents />
  <pedProps />
</ShopPedApparel>
`;
    function ymt(g, p) {
      const rows = p.filter((r) => r.g === g), texId = (SUFFIX[s.suffix] || SUFFIX.u).texId;
      const comps = COMPS.map(([k, id]) => ({ k, id, rows: rows.filter((r) => r.it.comp === k) })).filter((c) => c.rows.length);
      const props = PROPS.map(([k, id, , anchor]) => ({ k, id, anchor, rows: rows.filter((r) => r.it.comp === k) })).filter((c) => c.rows.length);
      const avail = Array(12).fill('FF');
      comps.forEach((c, i) => { avail[c.id] = F.pad(i.toString(16).toUpperCase(), 2); });
      const L = [];
      const w = (d, t) => L.push('  '.repeat(d) + t);
      w(0, '<?xml version="1.0" encoding="UTF-8"?>'); w(0, '<CPedVariationInfo>');
      w(1, '<bHasTexVariations value="true" />'); w(1, '<bHasDrawblVariations value="true" />'); w(1, '<bHasLowLODs value="false" />'); w(1, '<bIsSuperLOD value="false" />');
      w(1, `<availComp>${avail.join(' ')}</availComp>`);
      w(1, '<aComponentData3 itemType="CPVComponentData">');
      for (const c of comps) {
        w(2, '<Item>'); w(3, `<numAvailTex value="${c.rows.reduce((a, r) => a + r.tex.length, 0)}" />`); w(3, '<aDrawblData3 itemType="CPVDrawblData">');
        for (const r of c.rows) {
          w(4, '<Item>'); w(5, '<propMask value="1" />'); w(5, '<numAlternatives value="0" />'); w(5, '<aTexData itemType="CPVTextureData">');
          r.tex.forEach(() => { w(6, '<Item>'); w(7, `<texId value="${texId}" />`); w(7, '<distribution value="255" />'); w(6, '</Item>'); });
          w(5, '</aTexData>'); w(5, '<clothData>'); w(6, `<ownsCloth value="${r.yld ? 'true' : 'false'}" />`); w(5, '</clothData>'); w(4, '</Item>');
        }
        w(3, '</aDrawblData3>'); w(2, '</Item>');
      }
      w(1, '</aComponentData3>');
      w(1, '<aSelectionSets itemType="CPedSelectionSet" />');
      w(1, '<compInfos itemType="CComponentInfo">');
      for (const c of comps) for (const r of c.rows) {
        w(2, '<Item>'); w(3, '<pedXml_audioID>none</pedXml_audioID>'); w(3, '<pedXml_audioID2>none</pedXml_audioID2>'); w(3, '<pedXml_expressionMods content="char_array">0 0 0 0 0</pedXml_expressionMods>');
        w(3, '<flags value="0" />'); w(3, '<inclusions>0</inclusions>'); w(3, '<exclusions>0</exclusions>'); w(3, `<pedXml_vfxComps>PV_COMP_${c.k.toUpperCase()}</pedXml_vfxComps>`);
        w(3, '<pedXml_flags value="0" />'); w(3, `<pedXml_compIdx value="${c.id}" />`); w(3, `<pedXml_drawblIdx value="${r.n}" />`); w(2, '</Item>');
      }
      w(1, '</compInfos>');
      w(1, '<propInfo>'); w(2, `<numAvailProps value="${props.reduce((a, c) => a + c.rows.length, 0)}" />`);
      if (!props.length) { w(2, '<aPropMetaData itemType="CPedPropMetaData" />'); w(2, '<aAnchors itemType="CAnchorProps" />'); } else {
        w(2, '<aPropMetaData itemType="CPedPropMetaData">');
        for (const c of props) for (const r of c.rows) {
          w(3, '<Item>'); w(4, '<audioId>none</audioId>'); w(4, '<expressionMods content="char_array">0 0 0 0 0</expressionMods>'); w(4, '<texData itemType="CPedPropTexData">');
          r.tex.forEach(() => { w(5, '<Item>'); w(6, '<inclusions>0</inclusions>'); w(6, '<exclusions>0</exclusions>'); w(6, '<texId value="0" />'); w(6, '<inclusionId value="0" />'); w(6, '<exclusionId value="0" />'); w(6, '<distribution value="255" />'); w(5, '</Item>'); });
          w(4, '</texData>'); w(4, '<renderFlags />'); w(4, '<propFlags value="0" />'); w(4, '<flags value="0" />'); w(4, `<anchorId value="${c.id}" />`); w(4, `<propId value="${r.n}" />`); w(4, '<stickyness value="0" />'); w(3, '</Item>');
        }
        w(2, '</aPropMetaData>'); w(2, '<aAnchors itemType="CAnchorProps">');
        for (const c of props) { w(3, '<Item>'); w(4, `<props content="char_array">${c.rows.map((r) => r.tex.length).join(' ')}</props>`); w(4, `<anchor>${c.anchor}</anchor>`); w(3, '</Item>'); }
        w(2, '</aAnchors>');
      }
      w(1, '</propInfo>'); w(1, `<dlcName>${dlc(g)}</dlcName>`); w(0, '</CPedVariationInfo>');
      return L.join('\n') + '\n';
    }
    const readme = (p) => `PACK DE VÊTEMENTS ${pack()} — généré avec BL Forge
${'='.repeat(50)}

1. INSTALLATION
   - Copie le dossier « ${pack()} » dans resources/ de ton serveur.
   - Ajoute dans server.cfg :  ensure ${pack()}

2. LE .YMT (OBLIGATOIRE)
   Le fichier .ymt décrit les modèles et le nombre de textures de chaque modèle.
   BL Forge le fournit en XML dans _ymt_a_convertir/ : il faut le convertir en .ymt binaire.

   Avec CodeWalker (RPF Explorer) :
     a) Lance « CodeWalker RPF Explorer » et active le mode édition (Edit mode).
     b) Ouvre (ou crée : clic droit → New → RPF Archive) un .rpf de travail, par ex. dans mods/.
     c) Clic droit → « Import XML… » → choisis ${usedG(p).map(ymtName).map((n) => n + '.xml').join(' et ') || ymtName(genders()[0]) + '.xml'}.
        Le fichier devient ${usedG(p).map(ymtName).join(' / ') || ymtName(genders()[0])}.
     d) Clic droit sur le .ymt → « Extract (raw) » et place-le dans ${pack()}/stream/
     e) Rouvre-le dans CodeWalker pour vérifier : nombre de modèles et de textures par composant.
   Alternative : ouvre les fichiers de stream/ dans Durty Cloth Tool, grzyClothTool ou ymteditor,
   qui (re)génèrent un .ymt binaire. Garde alors exactement les mêmes noms de fichiers.

   Une fois le .ymt en place, tu peux supprimer le dossier _ymt_a_convertir/.

3. CONVENTION DE NOMS (streaming addon FiveM)
   Composants : mp_m_freemode_01_<collection>^jbib_000_u.ydd
                mp_m_freemode_01_<collection>^jbib_diff_000_a_uni.ytd  (a, b, c… = textures)
   Props      : mp_m_freemode_01_p_<collection>^p_head_000.ydd
                mp_m_freemode_01_p_<collection>^p_head_diff_000_a.ytd
   .ymt       : stream/mp_m_freemode_01_<collection>.ymt
   Collection(s) de ce pack : ${usedG(p).map((g) => dlc(g)).join(', ') || dlc(genders()[0])}
   La numérotation (000, 001…) est propre à ce pack : en jeu, les modèles addon sont ajoutés
   APRÈS ceux de GTA et des autres packs, donc leur numéro en jeu dépend de l'ordre de chargement.

4. CONTENU
${p.map((r) => `   ${r.ydd}  (${r.tex.length} texture(s))${r.yld ? ' + .yld' : ''}`).join('\n')}
`;

    /* ------------------------------ problèmes ------------------------------ */
    function issues(p) {
      const err = [], warn = [];
      if (!/^[a-z0-9_]+$/.test(s.pack || '')) err.push(`Nom de pack invalide : utilise seulement minuscules, chiffres et _ (sera exporté comme « ${pack()} »).`);
      const over = p.filter((r) => r.tex.length > 26);
      if (over.length) err.push(`Plus de 26 textures (a → z) pour : ${over.map((r) => r.it.comp + '_' + F.pad(r.n)).join(', ')}.`);
      const none = p.filter((r) => !r.tex.length);
      if (none.length) err.push(`Modèle(s) sans texture : ${none.map((r) => r.it.comp + '_' + F.pad(r.n)).join(', ')} — chaque modèle a besoin d'au moins une .ytd.`);
      const miss = allEntries().filter((e) => e.n && !files.has(e.k)).length;
      if (miss) warn.push(`${miss} fichier(s) connu(s) seulement par leur nom (projet rechargé) : glisse-les à nouveau, ils seront rattachés automatiquement.`);
      const other = s.gender === 'mf' ? [] : p.filter((r) => new RegExp(`mp_${s.gender === 'm' ? 'f' : 'm'}_freemode`).test(r.it.ydd?.n || ''));
      if (other.length) warn.push(`${other.length} modèle(s) semblent être pour l'autre genre (${other[0].it.ydd.n}) : choisis « Les deux » ou retire-les.`);
      const virt = p.filter((r) => !r.it.ydd).length;
      if (virt && virt < p.length) warn.push(`${virt} modèle(s) vide(s) (sans fichier) : ils comptent dans la numérotation et le .ymt mais ne seront pas dans le .zip — ajoute leurs fichiers ou utilise la liste des noms.`);
      if (s.orphans.length) warn.push(`${s.orphans.length} texture(s) sans modèle : associe-les ci-dessous.`);
      if (s.suffix === 'r') warn.push('Mode _r/_whi : texId = 1 dans le .ymt (carnation « whi »). Convention moins courante : vérifie dans CodeWalker.');
      if (p.some((r) => r.it.comp === 'head' || r.it.comp === 'hair')) warn.push('Tête/cheveux addon : souvent besoin de réglages supplémentaires (creature metadata, coupes de cheveux). À tester en jeu.');
      const names = allEntries().map((e) => e.n).filter(Boolean), dup = names.filter((n, i) => names.indexOf(n) !== i);
      if (dup.length) warn.push(`Noms d'origine en double (${[...new Set(dup)].slice(0, 3).join(', ')}…) : le .zip est correct, mais les scripts .bat/.sh seraient ambigus.`);
      return { err, warn };
    }

    /* -------------------------------- rendu -------------------------------- */
    const chip = (e, a, id, i) => `<span class="chip${e.n && !files.has(e.k) ? ' miss' : ''}" title="${F.esc(e.n || 'à fournir')}${e.n && !files.has(e.k) ? ' — à ré-ajouter' : ''}"><span>${e.n ? F.esc(e.n) : '<i>texture ' + LETTERS[i] + '</i>'}</span>${a ? `<button data-a="${a}" data-id="${id}" data-i="${i}" title="Retirer">×</button>` : ''}</span>`;
    function render() {
      const p = plan(), mf = s.gender === 'mf';
      F.$$('.th-g', root).forEach((th) => { th.hidden = !mf; });
      $('.v-g').hidden = !mf;
      $('.cp-rows').innerHTML = p.map(({ it, n, ydd, tex, g }, idx) => `<tr data-id="${it.id}">
        <td><b>${F.pad(n)}</b></td>
        ${mf ? `<td><select data-a="g" style="width:auto"><option value="m"${g === 'm' ? ' selected' : ''}>Homme</option><option value="f"${g === 'f' ? ' selected' : ''}>Femme</option></select></td>` : ''}
        <td><select data-a="comp">${compOpts(it.comp)}</select></td>
        <td><div class="cp-files">${it.ydd ? chip(it.ydd) : '<span class="chip"><i>modèle à fournir</i></span>'}${it.yld ? chip(it.yld, 'rmyld', it.id, 0) : ''}
          ${it.tex.map((t, i) => chip(t, 'rmtex', it.id, i)).join('')}
          ${it.ydd ? `<button class="btn sm ghost" data-a="addtex">${F.icon('plus')}.ytd</button>` : `<label class="small muted">textures <input data-a="vcount" class="cp-num" type="number" min="0" max="26" value="${tex.length}"></label>`}</div>
          <div class="small muted" title="${F.esc(ydd)}">→ <code>${F.esc(ydd.split('/').pop())}</code></div></td>
        <td class="actions"><button class="btn sm ghost" data-a="up"${idx ? '' : ' disabled'} title="Monter">↑</button><button class="btn sm ghost" data-a="down"${idx < p.length - 1 ? '' : ' disabled'} title="Descendre">↓</button><button class="btn sm ghost danger" data-a="del" title="Supprimer">${F.icon('trash')}</button></td></tr>`).join('')
        || `<tr><td colspan="${mf ? 5 : 4}" class="empty">Aucun modèle pour l'instant : glisse tes fichiers ci-dessus.</td></tr>`;
      const opts = p.map(({ it, n, g }) => `<option value="${it.id}">${it.comp}_${F.pad(n)}${mf ? ' (' + g.toUpperCase() + ')' : ''}${it.ydd?.n ? ' — ' + F.esc(it.ydd.n) : ''}</option>`).join('');
      $('.cp-orphans').innerHTML = s.orphans.length ? `<div class="panel-head" style="margin-top:6px"><h3>Textures sans modèle</h3></div><div class="table-wrap"><table class="table"><tbody>${s.orphans.map((o, i) => `<tr><td>${chip(o)}</td>
        <td><select data-a="attach" data-i="${i}"><option value="">Associer à…</option>${opts}</select></td><td class="actions"><button class="btn sm ghost danger" data-a="rmorph" data-i="${i}">${F.icon('trash')}</button></td></tr>`).join('')}</tbody></table></div>` : '';
      const st = {};
      p.forEach((r) => { const k = (mf ? r.g.toUpperCase() + ' ' : '') + r.it.comp; st[k] = st[k] || [0, 0]; st[k][0]++; st[k][1] += r.tex.length; });
      $('.cp-stats').innerHTML = Object.entries(st).map(([k, [d, t]]) => `<span class="chip on"><b>${F.esc(k)}</b> ${d} modèle${d > 1 ? 's' : ''} · ${t} texture${t > 1 ? 's' : ''}</span>`).join('');
      $('.cp-count').textContent = `${p.length} modèle(s) · ${p.reduce((a, r) => a + r.tex.length, 0)} texture(s)`;
      const { err, warn } = issues(p);
      $('.cp-issues').innerHTML = err.map((e) => `<div class="note error">${F.esc(e)}</div>`).join('') + warn.map((e) => `<div class="note warn">${F.esc(e)}</div>`).join('');
      // arborescence
      const P = pack() + '/', gs = usedG(p);
      const rows = [['', P + 'fxmanifest.lua'], ...gs.map((g) => ['', P + metaName(g)]), ...gs.map((g) => ['(à convertir)', P + 'stream/' + ymtName(g)])];
      p.forEach((r) => { rows.push([r.it.ydd?.n || '—', P + r.ydd]); if (r.yld) rows.push([r.it.yld.n, P + r.yld]); r.tex.forEach((t, i) => rows.push([r.it.tex[i].n || '—', P + t])); });
      $('.cp-map').innerHTML = rows.map(([a, b]) => `<tr><td class="small muted">${F.esc(a)}</td><td><code>${F.esc(b)}</code></td></tr>`).join('');
      // fichiers texte
      gen = [['fxmanifest.lua', fxmanifest(p), 'lua'], ...gs.map((g) => [metaName(g), meta(g), 'xml']), ...gs.map((g) => [ymtName(g) + '.xml', ymt(g, p), 'xml']), ['LISEZMOI.txt', readme(p), 'txt']];
      const pick = $('.cp-pick'), cur = pick.value;
      pick.innerHTML = gen.map(([n]) => `<option>${F.esc(n)}</option>`).join('');
      if (gen.some(([n]) => n === cur)) pick.value = cur;
      showOut();
    }
    const showOut = () => { const g = gen.find(([n]) => n === $('.cp-pick').value) || gen[0]; outName = g[0]; out.setTitle(g[0]); out.set(g[1]); };
    $('.cp-pick').onchange = showOut;

    /* ------------------------------ actions ------------------------------ */
    const byId = (id) => s.items.find((x) => x.id === id);
    root.addEventListener('change', (e) => {
      const t = e.target, a = t.dataset.a, it = byId(t.closest('tr')?.dataset.id);
      if (a === 'comp' && it) it.comp = t.value;
      else if (a === 'g' && it) it.g = t.value;
      else if (a === 'vcount' && it) { const n = Math.max(0, Math.min(26, parseInt(t.value, 10) || 0)); it.tex = Array.from({ length: n }, (_, i) => it.tex[i] || { n: '', k: F.uid() }); }
      else if (a === 'attach' && t.value) { const o = s.orphans.splice(+t.dataset.i, 1)[0]; byId(t.value).tex.push(o); }
      else return;
      render();
    });
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a, tr = b.closest('tr'), id = b.dataset.id || tr?.dataset.id, it = byId(id), i = s.items.indexOf(it);
      if (a === 'del') s.items.splice(i, 1);
      else if (a === 'up' && i > 0) [s.items[i - 1], s.items[i]] = [s.items[i], s.items[i - 1]];
      else if (a === 'down' && i < s.items.length - 1) [s.items[i + 1], s.items[i]] = [s.items[i], s.items[i + 1]];
      else if (a === 'rmtex') files.delete(it.tex.splice(+b.dataset.i, 1)[0].k);
      else if (a === 'rmyld') { files.delete(it.yld.k); it.yld = null; }
      else if (a === 'rmorph') files.delete(s.orphans.splice(+b.dataset.i, 1)[0].k);
      else if (a === 'addtex') { const l = await F.pickFiles({ accept: '.ytd', multiple: true }); l.filter((f) => ext(f.name) === 'ytd').forEach((f) => it.tex.push(entry(f))); }
      else if (a === 'virtual') {
        const comp = $('.v-comp').value, n = Math.max(1, Math.min(200, +$('.v-n').value || 1)), t = Math.max(1, Math.min(26, +$('.v-t').value || 1));
        for (let k = 0; k < n; k++) s.items.push({ id: F.uid(), g: s.gender === 'mf' ? $('.v-g').value : s.gender, comp, ydd: null, yld: null, tex: Array.from({ length: t }, () => ({ n: '', k: F.uid() })) });
      } else if (a === 'clear') { if (!s.items.length && !s.orphans.length) return; if (!confirm('Retirer tous les fichiers et modèles ?')) return; s.items = []; s.orphans = []; files.clear(); }
      else if (a === 'zip') return exportZip();
      else if (a === 'bat' || a === 'sh') return exportScript(a);
      else if (a === 'txt') { const p = plan(); if (!p.length) return F.toast('Ajoute au moins un modèle', 'error'); return F.download(pack() + '_noms.txt', p.flatMap((r) => [r.ydd, r.yld, ...r.tex]).filter(Boolean).map((x) => x.split('/').pop()).join('\r\n') + '\r\n'); }
      else return;
      render();
    });

    async function exportZip() {
      const p = plan(), { err } = issues(p);
      if (!p.length) return F.toast('Ajoute au moins un modèle', 'error');
      if (err.length) return F.toast('Corrige d’abord : ' + err[0], 'error');
      const list = p.flatMap((r) => [[r.it.ydd, r.ydd], [r.it.yld, r.yld], ...r.tex.map((t, i) => [r.it.tex[i], t])]).filter(([e]) => e && e.n);
      const missing = list.filter(([e]) => !files.has(e.k));
      if (missing.length) return F.toast(`${missing.length} fichier(s) à ré-ajouter avant d'exporter (ex. ${missing[0][0].n})`, 'error');
      try {
        const P = pack() + '/', zf = [{ name: P + 'fxmanifest.lua', data: fxmanifest(p) }, { name: P + 'LISEZMOI.txt', data: readme(p) }];
        usedG(p).forEach((g) => { zf.push({ name: P + metaName(g), data: meta(g) }, { name: P + '_ymt_a_convertir/' + ymtName(g) + '.xml', data: ymt(g, p) }); });
        for (const [e, path] of list) zf.push({ name: P + path, data: await F.readBytes(files.get(e.k)) });
        if (!list.length) zf.push({ name: P + 'NOMS_DES_FICHIERS.txt', data: p.flatMap((r) => [r.ydd, ...r.tex]).join('\r\n') + '\r\n' });
        F.download(pack() + '.zip', F.zip(zf));
        F.toast(list.length ? `${pack()}.zip : ${list.length} fichier(s) renommé(s)` : `${pack()}.zip : structure seule (aucun fichier déposé)`);
      } catch (ex) { F.toast('Export impossible : ' + ex.message, 'error'); }
    }
    function exportScript(kind) {
      const p = plan(), pairs = p.flatMap((r) => [[r.it.ydd, r.ydd], [r.it.yld, r.yld], ...r.tex.map((t, i) => [r.it.tex[i], t])]).filter(([e]) => e && e.n).map(([e, to]) => [e.n, pack() + '/' + to]);
      if (!pairs.length) return F.toast('Aucun fichier d’origine : dépose tes fichiers (ou utilise « Liste des noms »)', 'error');
      const dirs = [...new Set(pairs.map(([, to]) => to.replace(/\/[^/]+$/, '')))];
      if (kind === 'bat') {
        const q = (x) => '"' + x.replace(/\//g, '\\').replace(/%/g, '%%') + '"';
        F.download(pack() + '_renommer.bat', ['@echo off', 'chcp 65001 >nul', 'cd /d "%~dp0"', `rem Copie les fichiers d'origine vers ${pack()}\\stream avec les bons noms (les originaux sont conservés).`,
          ...dirs.map((d) => `if not exist ${q(d)} mkdir ${q(d)}`), ...pairs.map(([a, b]) => `copy /Y ${q(a)} ${q(b)} >nul || echo Introuvable : ${a.replace(/[%&<>|^]/g, '')}`), 'echo Termine.', 'pause', ''].join('\r\n'));
      } else {
        const q = (x) => "'" + x.replace(/'/g, "'\\''") + "'";
        F.download(pack() + '_renommer.sh', ['#!/bin/sh', '# Copie les fichiers d\'origine vers ' + pack() + '/stream avec les bons noms (les originaux sont conservés).', 'cd "$(dirname "$0")" || exit 1',
          ...dirs.map((d) => `mkdir -p ${q(d)}`), ...pairs.map(([a, b]) => `cp -- ${q(a)} ${q(b)} || echo ${q('Introuvable : ' + a)}`), 'echo "Terminé."', ''].join('\n'));
      }
    }

    render();
    return {
      getState: () => F.clone(s),
      setState(v) {
        const d = { ...F.clone(DEF), ...(v || {}) };
        const e = (x) => (x && typeof x === 'object' ? { n: String(x.n || ''), k: String(x.k || F.uid()) } : null);
        d.items = (Array.isArray(d.items) ? d.items : []).map((it) => ({ id: String(it.id || F.uid()), g: it.g === 'f' ? 'f' : 'm', comp: META[it.comp] ? it.comp : 'jbib', ydd: e(it.ydd), yld: e(it.yld), tex: (Array.isArray(it.tex) ? it.tex : []).map(e).filter(Boolean) }));
        d.orphans = (Array.isArray(d.orphans) ? d.orphans : []).map(e).filter(Boolean);
        if (!['m', 'f', 'mf'].includes(d.gender)) d.gender = 'm';
        if (!SUFFIX[d.suffix]) d.suffix = 'u';
        Object.keys(s).forEach((k) => delete s[k]);
        Object.assign(s, d);
        files.clear();
        packFields.refresh();
        render();
      },
    };
  },
});
