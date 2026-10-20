'use strict';
// Générateur vehicles.meta (CVehicleModelInfo__InitDataList) pour véhicules addon : plusieurs véhicules, import, txdRelationships.
Forge.register({
  id: 'vehicles-meta',
  cat: 'vehicules',
  name: 'Générateur vehicles.meta',
  desc: 'Crée ou modifie le vehicles.meta d’un véhicule addon : modèle, handling, classe, layout, roues, flags, caméras.',
  tags: ['vehicles.meta', 'meta', 'addon', 'layout', 'flags', 'vehicleclass', 'gamename', 'txd'],
  icon: 'file',
  mount(root, F) {
    const X = F.xml;
    const L = {
      type: ['VEHICLE_TYPE_CAR', 'VEHICLE_TYPE_BIKE', 'VEHICLE_TYPE_QUADBIKE', 'VEHICLE_TYPE_HELI', 'VEHICLE_TYPE_PLANE', 'VEHICLE_TYPE_BOAT', 'VEHICLE_TYPE_BICYCLE', 'VEHICLE_TYPE_SUBMARINE', 'VEHICLE_TYPE_TRAILER', 'VEHICLE_TYPE_TRAIN'],
      vehicleClass: ['VC_COMPACT', 'VC_SEDAN', 'VC_SUV', 'VC_COUPE', 'VC_MUSCLE', 'VC_SPORT_CLASSIC', 'VC_SPORT', 'VC_SUPER', 'VC_MOTORCYCLE', 'VC_OFF_ROAD', 'VC_INDUSTRIAL', 'VC_UTILITY', 'VC_VAN', 'VC_CYCLE', 'VC_BOAT', 'VC_HELICOPTER', 'VC_PLANE', 'VC_SERVICE', 'VC_EMERGENCY', 'VC_MILITARY', 'VC_COMMERCIAL', 'VC_RAIL'],
      layout: ['LAYOUT_STANDARD', 'LAYOUT_LOW', 'LAYOUT_LOW_RESTRICTED', 'LAYOUT_VAN', 'LAYOUT_TRUCK', 'LAYOUT_RANGER', 'LAYOUT_BUS', 'LAYOUT_BIKE_SPORT', 'LAYOUT_BIKE_CHOPPER', 'LAYOUT_BIKE_DIRT', 'LAYOUT_BIKE_POLICE', 'LAYOUT_BICYCLE_ROAD', 'LAYOUT_BICYCLE_MTB', 'LAYOUT_BICYCLE_BMX', 'LAYOUT_BICYCLE_CRUISER'],
      wheelType: ['VWT_SPORT', 'VWT_MUSCLE', 'VWT_LOWRIDER', 'VWT_SUV', 'VWT_OFFROAD', 'VWT_TUNER', 'VWT_BIKE', 'VWT_HIEND', 'VWT_SUPERMOD1', 'VWT_SUPERMOD2', 'VWT_SUPERMOD3', 'VWT_SUPERMOD4', 'VWT_SUPERMOD5'],
      plateType: ['VPT_FRONT_AND_BACK_PLATES', 'VPT_BACK_PLATES', 'VPT_FRONT_PLATES', 'VPT_NONE'],
      dashboardType: ['VDT_BANSHEE', 'VDT_BOBCAT', 'VDT_CAVALCADE', 'VDT_COMET', 'VDT_DUKES', 'VDT_FACTION', 'VDT_FEROCI', 'VDT_FUTO', 'VDT_GENTAXI', 'VDT_INFERNUS', 'VDT_MAVERICK', 'VDT_PEYOTE', 'VDT_RACE', 'VDT_SPEEDO', 'VDT_SULTAN', 'VDT_SUPERGT', 'VDT_TAILGATER', 'VDT_TRUCK', 'VDT_TRUCKDIGI', 'VDT_ZTYPE', 'VDT_LAZER'],
      swankness: ['SWANKNESS_0', 'SWANKNESS_1', 'SWANKNESS_2', 'SWANKNESS_3', 'SWANKNESS_4', 'SWANKNESS_5'],
      cameraName: ['DEFAULT_FOLLOW_VEHICLE_CAMERA', 'FOLLOW_CHEETAH_CAMERA'],
      aimCameraName: ['MID_BOX_VEHICLE_AIM_CAMERA'],
      bonnetCameraName: ['VEHICLE_BONNET_CAMERA_LOW', 'VEHICLE_BONNET_CAMERA_STANDARD', 'VEHICLE_BONNET_CAMERA_HIGH'],
      povCameraName: ['DEFAULT_POV_CAMERA', 'REDUCED_NEAR_CLIP_POV_CAMERA'],
      txdParent: ['', 'vehicles_supergt_interior', 'vehicles_race_interior', 'vehicles_muscle_n_w_interior', 'vehicles_sultan_interior', 'vehicles_banshee_interior', 'vehicles_feroci_interior', 'vehicles_poorcar_interior', 'vehicles_jet_interior'],
    };
    const FLAGS = ['FLAG_SPORTS', 'FLAG_RICH_CAR', 'FLAG_AVERAGE_CAR', 'FLAG_POOR_CAR', 'FLAG_BIG', 'FLAG_NO_BOOT', 'FLAG_HAS_LIVERY', 'FLAG_EXTRAS_REQUIRE', 'FLAG_EXTRAS_STRONG', 'FLAG_EXTRAS_ALL', 'FLAG_EXTRAS_CONVERTIBLE', 'FLAG_SPAWN_ON_TRAILER', 'FLAG_RECESSED_HEADLIGHT_CORONAS', 'FLAG_RECESSED_TAILLIGHT_CORONAS', 'FLAG_HAS_INTERIOR_EXTRAS', 'FLAG_PEDS_CAN_STAND_ON_TOP', 'FLAG_GEN_NAVMESH', 'FLAG_LAW_ENFORCEMENT', 'FLAG_EMERGENCY_SERVICE', 'FLAG_ALLOWS_RAPPEL', 'FLAG_IS_VAN', 'FLAG_IS_BUS', 'FLAG_IS_OFFROAD_VEHICLE', 'FLAG_IS_ELECTRIC', 'FLAG_NO_RESPRAY', 'FLAG_DONT_SPAWN_IN_CARGEN', 'FLAG_DONT_SPAWN_AS_AMBIENT', 'FLAG_CAN_HAVE_NEONS'];
    // Item complet d'un vehicles.meta addon (structure du jeu de base) ; les valeurs éditables sont remplacées à l'export.
    const TEMPLATE = `<Item>
      <modelName /><txdName /><handlingId /><gameName /><vehicleMakeName /><expressionDictName>null</expressionDictName><expressionName>null</expressionName>
      <animConvRoofDictName>null</animConvRoofDictName><animConvRoofName>null</animConvRoofName><animConvRoofWindowsAffected /><ptfxAssetName>null</ptfxAssetName>
      <audioNameHash /><layout>LAYOUT_STANDARD</layout><coverBoundOffsets>STANDARD_COVER_OFFSET_INFO</coverBoundOffsets><explosionInfo>EXPLOSION_INFO_DEFAULT</explosionInfo>
      <scenarioLayout /><cameraName>DEFAULT_FOLLOW_VEHICLE_CAMERA</cameraName><aimCameraName>MID_BOX_VEHICLE_AIM_CAMERA</aimCameraName>
      <bonnetCameraName>VEHICLE_BONNET_CAMERA_STANDARD</bonnetCameraName><povCameraName>DEFAULT_POV_CAMERA</povCameraName>
      <FirstPersonDriveByIKOffset x="0.000000" y="-0.060000" z="-0.045000" /><FirstPersonDriveByUnarmedIKOffset x="0.000000" y="-0.100000" z="0.000000" />
      <FirstPersonProjectileDriveByIKOffset x="0.000000" y="0.000000" z="0.000000" /><FirstPersonProjectileDriveByPassengerIKOffset x="0.000000" y="0.000000" z="0.000000" />
      <FirstPersonDriveByRightPassengerIKOffset x="0.000000" y="-0.060000" z="-0.045000" /><FirstPersonDriveByRightPassengerUnarmedIKOffset x="0.000000" y="-0.100000" z="0.000000" />
      <FirstPersonMobilePhoneOffset x="0.146000" y="0.220000" z="0.500000" /><FirstPersonPassengerMobilePhoneOffset x="0.136000" y="0.223000" z="0.415000" />
      <PovCameraOffset x="0.000000" y="-0.195000" z="0.640000" /><PovCameraVerticalAdjustmentForRollCage value="0.000000" />
      <PovPassengerCameraOffset x="0.000000" y="0.000000" z="0.000000" /><PovRearPassengerCameraOffset x="0.000000" y="0.000000" z="0.000000" />
      <vfxInfoName>VFXVEHICLEINFO_CAR_GENERIC</vfxInfoName><shouldUseCinematicViewMode value="true" /><shouldCameraTransitionOnClimbUpDown value="false" />
      <shouldCameraIgnoreExiting value="false" /><AllowPretendOccupants value="true" /><AllowJoyriding value="true" /><AllowSundayDriving value="true" />
      <AllowBodyColorMapping value="true" /><wheelScale value="0.250000" /><wheelScaleRear value="0.250000" /><dirtLevelMin value="0.000000" />
      <dirtLevelMax value="0.300000" /><envEffScaleMin value="0.000000" /><envEffScaleMax value="1.000000" /><envEffScaleMin2 value="0.000000" />
      <envEffScaleMax2 value="1.000000" /><damageMapScale value="0.600000" /><damageOffsetScale value="1.000000" /><diffuseTint value="0x00FFFFFF" />
      <steerWheelMult value="1.000000" /><HDTextureDist value="5.000000" /><lodDistances content="float_array" /><minSeatHeight value="0.831" />
      <identicalModelSpawnDistance value="20" /><maxNumOfSameColor value="10" /><defaultBodyHealth value="1000.000000" /><pretendOccupantsScale value="1.000000" />
      <visibleSpawnDistScale value="1.000000" /><trackerPathWidth value="2.000000" /><weaponForceMult value="1.000000" /><frequency value="100" />
      <swankness>SWANKNESS_1</swankness><maxNum value="999" /><flags /><type>VEHICLE_TYPE_CAR</type><plateType>VPT_FRONT_AND_BACK_PLATES</plateType>
      <dashboardType>VDT_FEROCI</dashboardType><vehicleClass>VC_SEDAN</vehicleClass><wheelType>VWT_SPORT</wheelType><trailers /><additionalTrailers />
      <drivers /><extraIncludes /><doorsWithCollisionWhenClosed /><driveableDoors /><bumpersNeedToCollideWithMap value="false" /><needsRopeTexture value="false" />
      <requiredExtras /><rewards /><cinematicPartCamera><Item>WHEEL_FRONT_RIGHT_CAMERA</Item><Item>WHEEL_FRONT_LEFT_CAMERA</Item><Item>WHEEL_REAR_RIGHT_CAMERA</Item><Item>WHEEL_REAR_LEFT_CAMERA</Item></cinematicPartCamera>
      <NmBraceOverrideSet /><buoyancySphereOffset x="0.000000" y="0.000000" z="0.000000" /><buoyancySphereSizeScale value="1.000000" /><pOverrideRagdollThreshold type="NULL" />
      <firstPersonDrivebyData />
    </Item>`;
    const ORDER = [...X.parse(TEMPLATE).documentElement.children].map((e) => e.tagName);
    const DEF = {
      model: 'mycar', txdName: '', handlingId: '', gameName: '', makeName: '', audioNameHash: '',
      type: 'VEHICLE_TYPE_CAR', vehicleClass: 'VC_SPORT', layout: 'LAYOUT_LOW', wheelType: 'VWT_SPORT', plateType: 'VPT_FRONT_AND_BACK_PLATES', dashboardType: 'VDT_RACE', swankness: 'SWANKNESS_3',
      cameraName: 'FOLLOW_CHEETAH_CAMERA', aimCameraName: 'MID_BOX_VEHICLE_AIM_CAMERA', bonnetCameraName: 'VEHICLE_BONNET_CAMERA_LOW', povCameraName: 'DEFAULT_POV_CAMERA',
      vfxInfoName: 'VFXVEHICLEINFO_CAR_GENERIC', coverBoundOffsets: 'STANDARD_COVER_OFFSET_INFO', explosionInfo: 'EXPLOSION_INFO_DEFAULT',
      expressionDictName: 'null', expressionName: 'null', animConvRoofDictName: 'null', animConvRoofName: 'null', ptfxAssetName: 'null',
      wheelScale: 0.25, wheelScaleRear: 0.25, lod: '15 30 60 120 500 500', defaultBodyHealth: 1000, frequency: 100, maxNum: 999,
      flags: ['FLAG_SPORTS', 'FLAG_RICH_CAR', 'FLAG_RECESSED_HEADLIGHT_CORONAS'], flagsExtra: '', driveby: 'STD_ADDER_FRONT_LEFT\nSTD_ADDER_FRONT_RIGHT', txdParent: 'vehicles_race_interior', raw: '',
    };
    const BASES = {
      'Sport': { type: 'VEHICLE_TYPE_CAR', vehicleClass: 'VC_SPORT', layout: 'LAYOUT_LOW', wheelType: 'VWT_SPORT', dashboardType: 'VDT_RACE', swankness: 'SWANKNESS_3', cameraName: 'FOLLOW_CHEETAH_CAMERA', bonnetCameraName: 'VEHICLE_BONNET_CAMERA_LOW', plateType: 'VPT_FRONT_AND_BACK_PLATES', flags: ['FLAG_SPORTS', 'FLAG_RICH_CAR', 'FLAG_RECESSED_HEADLIGHT_CORONAS'] },
      'Super': { type: 'VEHICLE_TYPE_CAR', vehicleClass: 'VC_SUPER', layout: 'LAYOUT_LOW', wheelType: 'VWT_HIEND', dashboardType: 'VDT_SUPERGT', swankness: 'SWANKNESS_4', cameraName: 'FOLLOW_CHEETAH_CAMERA', bonnetCameraName: 'VEHICLE_BONNET_CAMERA_LOW', plateType: 'VPT_BACK_PLATES', flags: ['FLAG_SPORTS', 'FLAG_RICH_CAR', 'FLAG_NO_BOOT', 'FLAG_RECESSED_HEADLIGHT_CORONAS'] },
      'Berline': { type: 'VEHICLE_TYPE_CAR', vehicleClass: 'VC_SEDAN', layout: 'LAYOUT_STANDARD', wheelType: 'VWT_SPORT', dashboardType: 'VDT_FEROCI', swankness: 'SWANKNESS_2', cameraName: 'DEFAULT_FOLLOW_VEHICLE_CAMERA', bonnetCameraName: 'VEHICLE_BONNET_CAMERA_STANDARD', plateType: 'VPT_FRONT_AND_BACK_PLATES', flags: ['FLAG_AVERAGE_CAR'] },
      'SUV': { type: 'VEHICLE_TYPE_CAR', vehicleClass: 'VC_SUV', layout: 'LAYOUT_STANDARD', wheelType: 'VWT_SUV', dashboardType: 'VDT_CAVALCADE', swankness: 'SWANKNESS_3', cameraName: 'DEFAULT_FOLLOW_VEHICLE_CAMERA', bonnetCameraName: 'VEHICLE_BONNET_CAMERA_HIGH', plateType: 'VPT_FRONT_AND_BACK_PLATES', flags: ['FLAG_RICH_CAR', 'FLAG_BIG'] },
      'Moto': { type: 'VEHICLE_TYPE_BIKE', vehicleClass: 'VC_MOTORCYCLE', layout: 'LAYOUT_BIKE_SPORT', wheelType: 'VWT_BIKE', plateType: 'VPT_BACK_PLATES', swankness: 'SWANKNESS_3', flags: ['FLAG_SPORTS', 'FLAG_RICH_CAR'], driveby: '' },
    };
    const s = { residentTxd: 'vehshare', txdRel: true, sel: 0, vehicles: [{ ...F.clone(DEF), id: F.uid() }] };
    const cur = () => s.vehicles[s.sel];
    const up = (v) => String(v || '').toUpperCase();
    const ids = (v) => ({ txd: v.txdName || v.model, handling: up(v.handlingId || v.model), game: up(v.gameName || v.model) });

    root.append(F.h(`<div class="split wide-left">
      <div class="stack">
        <div class="panel stack">
          <div class="panel-head"><h3>Véhicules</h3>
            <button class="btn sm" data-a="import">${F.icon('upload')}Importer un vehicles.meta</button>
            <button class="btn sm ghost" data-a="add">${F.icon('plus')}Ajouter</button>
            <button class="btn sm ghost" data-a="dup">${F.icon('copy')}Dupliquer</button>
            <button class="btn sm ghost danger" data-a="del">${F.icon('trash')}Supprimer</button></div>
          <div class="row vlist"></div>
          <div class="row"><span class="muted small">Partir d’une base :</span>${Object.keys(BASES).map((k) => `<button class="chip" data-base="${k}">${k}</button>`).join('')}</div>
          <div class="msg"></div>
        </div>
        <div class="form stack"></div>
      </div>
      <div class="stack sticky side">
        <div class="panel"><div class="grid-fields opts"></div></div>
      </div></div>`));
    const out = F.output({ title: 'vehicles.meta', filename: 'vehicles.meta', lang: 'xml' });
    F.$('.side', root).append(out.el);
    const msg = F.$('.msg', root);

    // Liste déroulante avec saisie libre (« Autre… »).
    const combo = (box, key, label, list, hint, onChange) => {
      const id = 'c_' + F.uid();
      const w = F.h(`<div class="field"><label for="${id}">${F.esc(label)}${hint ? ` <span class="hint" title="${F.esc(hint)}">?</span>` : ''}</label>
        <select id="${id}">${list.map((o) => `<option value="${F.esc(o)}">${F.esc(o || '(aucun)')}</option>`).join('')}<option value="__">Autre (saisie libre)…</option></select>
        <input type="text" hidden spellcheck="false" placeholder="Valeur personnalisée"></div>`);
      const sel = F.$('select', w), inp = F.$('input', w);
      sel.onchange = () => { inp.hidden = sel.value !== '__'; if (sel.value === '__') inp.focus(); else cur()[key] = sel.value; onChange(); };
      inp.oninput = () => { cur()[key] = inp.value.trim(); onChange(); };
      box.append(w);
      return () => { const v = cur()[key] ?? ''; const known = list.includes(v); sel.value = known ? v : '__'; inp.hidden = known; inp.value = known ? '' : v; };
    };

    const render = F.debounce(() => out.set(build()), 150);
    const renderList = () => {
      F.$('.vlist', root).innerHTML = s.vehicles.map((v, i) => `<button class="chip${i === s.sel ? ' on' : ''}" data-i="${i}">${F.esc(v.model || '(sans nom)')}</button>`).join('');
      const models = s.vehicles.map((v) => v.model.toLowerCase()), dup = models.filter((m, i) => models.indexOf(m) !== i);
      msg.innerHTML = dup.length ? `<div class="note warn">Modèle en double : ${[...new Set(dup)].map(F.esc).join(', ')}.</div>` : '';
    };
    const renderForm = () => {
      const v = cur(), form = F.$('.form', root), refs = [];
      form.innerHTML = '';
      const change = (k) => { if (k === 'model') { renderList(); refs.forEach((r) => r()); } render(); };
      const sect = (title, extra = '') => { const p = F.h(`<div class="panel"><div class="panel-head"><h3>${title}</h3>${extra}</div><div class="grid-fields"></div></div>`); form.append(p); return F.$('.grid-fields', p); };
      let g = sect('Identité');
      F.fields(g, [
        { key: 'model', label: 'modelName (nom de spawn)', hint: 'Nom du modèle = nom des fichiers .yft/.ytd dans stream/ (minuscules, sans espaces).' },
        { key: 'txdName', label: 'txdName', placeholder: ids(v).txd, hint: 'Nom du .ytd des textures. Vide = identique au modèle.' },
        { key: 'handlingId', label: 'handlingId', placeholder: ids(v).handling, hint: 'Doit correspondre au <handlingName> du handling.meta. Vide = modèle en majuscules.' },
        { key: 'gameName', label: 'gameName', placeholder: ids(v).game, hint: 'Clé de texte du nom affiché (AddTextEntry). Vide = modèle en majuscules.' },
        { key: 'makeName', label: 'vehicleMakeName (marque)', placeholder: 'ex. TRUFFADE', hint: 'Clé de texte de la marque (AddTextEntry). Peut rester vide.' },
        { key: 'audioNameHash', label: 'audioNameHash (son)', placeholder: 'ex. adder', hint: 'Nom d’un véhicule de base dont on reprend le son moteur. Vide = son par défaut.' },
      ], v, (k) => change(k));
      const fixPh = () => { const i = ids(cur()); F.$$('input', g).slice(1, 4).forEach((el, n) => { el.placeholder = [i.txd, i.handling, i.game][n]; }); };
      refs.push(fixPh);
      g = sect('Type, classe et layout');
      for (const [k, l, h] of [['type', 'type', 'Type de véhicule (voiture, moto, hélico…).'], ['vehicleClass', 'vehicleClass', 'Classe : catégorie dans le jeu (compteur de vitesse, concession, LSC).'], ['layout', 'layout', 'Layout des sièges / animations (vehiclelayouts). Reprends celui du véhicule de base le plus proche.'], ['wheelType', 'wheelType', 'Catégorie de jantes proposée au Los Santos Customs.'], ['plateType', 'plateType', 'Plaques avant + arrière, arrière seule…'], ['dashboardType', 'dashboardType', 'Style des compteurs du tableau de bord.'], ['swankness', 'swankness', 'Niveau de « luxe » (0 à 5) utilisé par le jeu pour les PNJ.']])
        refs.push(combo(g, k, l, L[k], h, render));
      g = sect('Caméras et effets');
      for (const [k, h] of [['cameraName', 'Caméra de poursuite (3e personne).'], ['aimCameraName', 'Caméra de visée.'], ['bonnetCameraName', 'Caméra capot (hauteur selon le véhicule).'], ['povCameraName', 'Caméra vue intérieure.']])
        refs.push(combo(g, k, k, L[k], h, render));
      F.fields(g, [
        { key: 'vfxInfoName', label: 'vfxInfoName', hint: 'Effets visuels (VFXVEHICLEINFO_CAR_GENERIC pour une voiture).' },
        { key: 'coverBoundOffsets', label: 'coverBoundOffsets', hint: 'Zone de couverture autour du véhicule (vehiclelayouts).' },
        { key: 'explosionInfo', label: 'explosionInfo' },
        { key: 'ptfxAssetName', label: 'ptfxAssetName', hint: '« null » si aucun.' },
        { key: 'expressionDictName', label: 'expressionDictName', hint: '« null » si aucun.' },
        { key: 'expressionName', label: 'expressionName', hint: '« null » si aucun.' },
        { key: 'animConvRoofDictName', label: 'animConvRoofDictName', hint: 'Animation du toit de cabriolet, « null » si aucune.' },
        { key: 'animConvRoofName', label: 'animConvRoofName', hint: '« null » si aucune.' },
      ], v, render);
      g = sect('Valeurs');
      F.fields(g, [
        { key: 'wheelScale', label: 'wheelScale', type: 'number', hint: 'Rayon des roues avant (doit correspondre au modèle).' },
        { key: 'wheelScaleRear', label: 'wheelScaleRear', type: 'number', hint: 'Rayon des roues arrière.' },
        { key: 'defaultBodyHealth', label: 'defaultBodyHealth', type: 'number', hint: 'Santé de la carrosserie (1000 par défaut).' },
        { key: 'frequency', label: 'frequency', type: 'number', step: 1, hint: 'Fréquence d’apparition en circulation (0 à 100).' },
        { key: 'maxNum', label: 'maxNum', type: 'number', step: 1, hint: 'Nombre maximal en circulation en même temps.' },
        { key: 'lod', label: 'lodDistances (6 valeurs)', hint: 'Distances d’affichage des niveaux de détail, séparées par des espaces.' },
        { key: 'driveby', label: 'firstPersonDrivebyData (un par ligne)', type: 'textarea', rows: 2, wide: true, hint: 'Positions de tir à la 1re personne, reprises du véhicule de base (ex. STD_ADDER_FRONT_LEFT). Vide = aucune.' },
      ], v, render);
      g = sect('Flags');
      g.innerHTML = FLAGS.map((f) => `<label class="field check"><input type="checkbox" value="${f}"${v.flags.includes(f) ? ' checked' : ''}><span class="small">${f}</span></label>`).join('');
      g.onchange = (e) => { if (e.target.type !== 'checkbox') return; cur().flags = F.$$('input:checked', g).map((i) => i.value); render(); };
      F.fields(g, [{ key: 'flagsExtra', label: 'Autres flags (séparés par des espaces)', wide: true, placeholder: 'FLAG_…' }], v, render);
      g = sect('txdRelationships');
      refs.push(combo(g, 'txdParent', 'Parent du txd', L.txdParent, 'Dictionnaire de textures partagées (intérieur, etc.) dont hérite le txd du véhicule. Vide = pas d’entrée.', render));
      refs.forEach((r) => r());
    };
    F.fields(F.$('.opts', root), [
      { key: 'residentTxd', label: 'residentTxd', hint: 'vehshare dans les vehicles.meta addon.' },
      { key: 'txdRel', label: 'Générer <txdRelationships>', type: 'checkbox', wide: true },
    ], s, () => render());

    const nums = (str, digits = 6) => String(str).split(/[\s,;]+/).filter(Boolean).map((n) => F.num(n, digits));
    // Construit un Item à partir du modèle (ou de l'Item importé, pour garder les balises inconnues).
    const buildItem = (doc, v) => {
      let it;
      try { it = v.raw ? X.parse(v.raw).documentElement : null; } catch { it = null; }
      it = doc.importNode(it || X.parse(TEMPLATE).documentElement, true);
      const get = (tag) => {
        let el = X.kid(it, tag);
        if (!el) { el = doc.createElement(tag); const next = ORDER.slice(ORDER.indexOf(tag) + 1).map((n) => X.kid(it, n)).find(Boolean); it.insertBefore(el, next || null); }
        return el;
      };
      const text = (tag, val) => { get(tag).textContent = String(val ?? '').trim(); };
      const attr = (tag, val) => get(tag).setAttribute('value', val);
      const i = ids(v);
      text('modelName', v.model); text('txdName', i.txd); text('handlingId', i.handling); text('gameName', i.game); text('vehicleMakeName', up(v.makeName));
      for (const k of ['expressionDictName', 'expressionName', 'animConvRoofDictName', 'animConvRoofName', 'ptfxAssetName', 'audioNameHash', 'layout', 'coverBoundOffsets', 'explosionInfo', 'cameraName', 'aimCameraName', 'bonnetCameraName', 'povCameraName', 'vfxInfoName', 'swankness', 'type', 'plateType', 'dashboardType', 'vehicleClass', 'wheelType']) text(k, v[k]);
      attr('wheelScale', F.num(v.wheelScale)); attr('wheelScaleRear', F.num(v.wheelScaleRear)); attr('defaultBodyHealth', F.num(v.defaultBodyHealth));
      attr('frequency', String(Math.round(v.frequency))); attr('maxNum', String(Math.round(v.maxNum)));
      const lod = get('lodDistances'); lod.setAttribute('content', 'float_array'); lod.textContent = nums(v.lod).join(' ');
      text('flags', [...new Set([...v.flags, ...String(v.flagsExtra).split(/\s+/)].filter(Boolean))].join(' '));
      const db = get('firstPersonDrivebyData'); db.textContent = '';
      for (const n of String(v.driveby).split(/\s+/).filter(Boolean)) { const e = doc.createElement('Item'); e.textContent = n; db.append(e); }
      return it;
    };
    function build() {
      const doc = X.parse('<CVehicleModelInfo__InitDataList><residentTxd /><residentAnims /><InitDatas /></CVehicleModelInfo__InitDataList>');
      const r = doc.documentElement;
      X.kid(r, 'residentTxd').textContent = s.residentTxd || 'vehshare';
      for (const v of s.vehicles) X.kid(r, 'InitDatas').append(buildItem(doc, v));
      const rel = s.vehicles.filter((v) => v.txdParent);
      if (s.txdRel && rel.length) {
        const t = doc.createElement('txdRelationships');
        for (const v of rel) { const it = doc.createElement('Item'), p = doc.createElement('parent'), c = doc.createElement('child'); p.textContent = v.txdParent; c.textContent = ids(v).txd; it.append(p, c); t.append(it); }
        r.append(t);
      }
      // Tableaux de nombres : une valeur par ligne, comme dans les fichiers du jeu.
      return X.pretty(doc).replace(/^( *)(<lodDistances content="float_array">)([^<]*)(<\/lodDistances>)/gm, (_, pad, a, body, b) => `${pad}${a}\n${body.trim().split(/\s+/).map((n) => pad + '  ' + n).join('\n')}\n${pad}${b}`);
    }

    // Import : lit les champs principaux, garde l'Item d'origine pour l'export.
    const fromItem = (it, rels) => {
      const t = (k) => (X.kid(it, k) ? X.kid(it, k).textContent.trim() : '');
      const a = (k, d) => { const e = X.kid(it, k); const n = e ? Number(e.getAttribute('value')) : NaN; return Number.isFinite(n) ? n : d; };
      const v = { ...F.clone(DEF), id: F.uid(), raw: new XMLSerializer().serializeToString(it) };
      v.model = t('modelName'); v.makeName = t('vehicleMakeName');
      const i0 = ids({ model: v.model });
      v.txdName = t('txdName') === i0.txd ? '' : t('txdName'); v.handlingId = up(t('handlingId')) === i0.handling ? '' : t('handlingId'); v.gameName = up(t('gameName')) === i0.game ? '' : t('gameName');
      for (const k of ['expressionDictName', 'expressionName', 'animConvRoofDictName', 'animConvRoofName', 'ptfxAssetName', 'audioNameHash', 'layout', 'coverBoundOffsets', 'explosionInfo', 'cameraName', 'aimCameraName', 'bonnetCameraName', 'povCameraName', 'vfxInfoName', 'swankness', 'type', 'plateType', 'dashboardType', 'vehicleClass', 'wheelType']) if (X.kid(it, k)) v[k] = t(k);
      for (const k of ['wheelScale', 'wheelScaleRear', 'defaultBodyHealth', 'frequency', 'maxNum']) v[k] = a(k, v[k]);
      if (X.kid(it, 'lodDistances')) v.lod = t('lodDistances').split(/\s+/).filter(Boolean).map((n) => F.short(n)).join(' ');
      const fl = t('flags').split(/\s+/).filter(Boolean);
      v.flags = fl.filter((f) => FLAGS.includes(f)); v.flagsExtra = fl.filter((f) => !FLAGS.includes(f)).join(' ');
      v.driveby = X.kid(it, 'firstPersonDrivebyData') ? X.kids(X.kid(it, 'firstPersonDrivebyData'), 'Item').map((e) => e.textContent.trim()).join('\n') : '';
      v.txdParent = rels[(t('txdName') || v.model).toLowerCase()] || '';
      return v;
    };
    const importText = (text, name) => {
      try {
        const doc = X.parse(text), r = doc.documentElement;
        const list = r.getElementsByTagName('InitDatas')[0];
        if (!list) throw new Error('Pas de <InitDatas> : est-ce bien un vehicles.meta ?');
        const rels = {};
        for (const it of r.getElementsByTagName('txdRelationships')[0]?.children || []) { const c = X.val(it, 'child'); if (c) rels[c.toLowerCase()] = X.val(it, 'parent') || ''; }
        const vs = X.kids(list, 'Item').map((it) => fromItem(it, rels)).filter((v) => v.model);
        if (!vs.length) throw new Error('Aucun véhicule (<Item> avec <modelName>) trouvé.');
        if (X.val(r, 'residentTxd')) s.residentTxd = X.val(r, 'residentTxd');
        s.vehicles = vs; s.sel = 0; s.txdRel = Object.keys(rels).length > 0 || s.txdRel;
        refreshAll();
        F.toast(`${name} : ${vs.length} véhicule${vs.length > 1 ? 's' : ''} importé${vs.length > 1 ? 's' : ''}`);
      } catch (e) { F.toast(e.message, 'error'); msg.innerHTML = `<div class="note error">${F.esc(e.message)}</div>`; }
    };
    const importFiles = async (files) => { if (files[0]) importText(await F.readText(files[0]), files[0].name); };
    F.dropZone(root, importFiles);

    let optsRefresh;
    const refreshAll = () => { s.sel = Math.min(Math.max(0, s.sel), s.vehicles.length - 1); renderList(); renderForm(); optsRefresh(); out.set(build()); };
    optsRefresh = () => { F.$$('.opts input', root)[0].value = s.residentTxd; F.$$('.opts input', root)[1].checked = !!s.txdRel; };

    root.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-i]');
      if (chip) { s.sel = Number(chip.dataset.i); renderList(); renderForm(); return; }
      const base = e.target.closest('[data-base]');
      if (base) { Object.assign(cur(), F.clone(BASES[base.dataset.base])); renderForm(); render(); return F.toast(`Base « ${base.dataset.base} » appliquée`); }
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'import') F.pickFiles({ accept: '.meta,.xml,.txt' }).then(importFiles);
      else if (a === 'add' || a === 'dup') {
        const v = a === 'add' ? { ...F.clone(DEF), model: 'mycar' + (s.vehicles.length + 1) } : { ...F.clone(cur()), model: cur().model + '2', gameName: '', handlingId: '', txdName: '' };
        v.id = F.uid(); s.vehicles.splice(s.sel + 1, 0, v); s.sel++; refreshAll();
      } else if (a === 'del') {
        if (s.vehicles.length < 2) return F.toast('Il faut garder au moins un véhicule', 'error');
        if (confirm(`Supprimer ${cur().model} ?`)) { s.vehicles.splice(s.sel, 1); refreshAll(); }
      }
    });

    refreshAll();
    return {
      getState: () => F.clone(s),
      setState(v) {
        v = v || {};
        s.residentTxd = v.residentTxd || 'vehshare'; s.txdRel = v.txdRel ?? true; s.sel = Number(v.sel) || 0;
        s.vehicles = (Array.isArray(v.vehicles) && v.vehicles.length ? v.vehicles : [{}]).map((x) => ({ ...F.clone(DEF), id: F.uid(), ...x, flags: Array.isArray(x.flags) ? x.flags : F.clone(DEF.flags) }));
        refreshAll();
      },
    };
  },
});
