'use strict';
/*
 * Interface de BL Forge : navigation (#/...), accueil, page d'outil, projets sauvegardés, compte Discord.
 * Les outils eux-mêmes sont dans js/tools/ (voir le contrat en tête de core.js).
 */
(function () {
  const F = window.Forge;
  const { esc, $, $$, h, icon } = F;
  const state = { me: null, auth: false, current: null, project: null };

  /* -------------------------------- thème -------------------------------- */
  const applyTheme = (t) => { document.documentElement.dataset.theme = t; F.local.set('theme', t); $('#theme-btn').innerHTML = icon(t === 'dark' ? 'sun' : 'moon'); };

  /* ------------------------------ compte ------------------------------ */
  async function loadMe() {
    try { const d = await F.api('GET', '/api/me'); state.auth = d.auth; state.me = d.user; } catch { state.auth = false; state.me = null; }
    renderUser();
  }
  const avatar = (u) => (u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : 'logo.png');
  function renderUser() {
    const box = $('#user-box');
    if (state.me) {
      box.innerHTML = `<a class="user" href="#/projets"><img src="${esc(avatar(state.me))}" alt=""><span><b>${esc(state.me.name)}</b><small>Mes projets</small></span></a>
        <a class="btn sm ghost" href="/auth/logout" title="Se déconnecter">${icon('x')}</a>`;
    } else if (state.auth) {
      box.innerHTML = `<a class="btn discord" href="${esc(loginUrl())}">${icon('discord')}Connexion Discord</a>`;
    } else {
      box.innerHTML = '<span class="muted small">Connexion indisponible</span>';
    }
  }
  const loginUrl = () => '/auth/discord?next=' + encodeURIComponent('/' + location.hash);

  /* ------------------------------ navigation ------------------------------ */
  function renderNav() {
    const nav = $('#nav');
    let html = `<a href="#/" data-route="home">${icon('home')}<span>Accueil</span></a>
      <a href="#/projets" data-route="projets">${icon('folder')}<span>Mes projets</span></a>`;
    for (const [key, c] of Object.entries(F.CATEGORIES)) {
      const list = F.tools.filter((t) => t.cat === key);
      if (!list.length) continue;
      html += `<div class="nav-group"><a class="nav-cat" href="#/categorie/${key}" data-route="cat-${key}">${icon(c.icon)}<span>${esc(c.name)}</span><em>${list.length}</em></a>`;
      html += list.map((t) => `<a class="nav-tool" href="#/outil/${t.id}" data-route="tool-${t.id}"><span>${esc(t.name)}</span></a>`).join('');
      html += '</div>';
    }
    nav.innerHTML = html;
  }
  function markNav(route) {
    $$('#nav a').forEach((a) => a.classList.toggle('on', a.dataset.route === route));
    const on = $('#nav a.on');
    if (on) on.scrollIntoView({ block: 'nearest' });
    document.body.classList.remove('nav-open');
  }

  /* -------------------------------- recherche -------------------------------- */
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function search(q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return F.tools.filter((t) => { const hay = norm([t.name, t.desc, t.tags.join(' '), F.CATEGORIES[t.cat]?.name].join(' ')); return words.every((w) => hay.includes(w)); });
  }
  function setupSearch() {
    const input = $('#search'), list = $('#search-results');
    let sel = 0, res = [];
    const draw = () => {
      res = search(input.value);
      list.hidden = !input.value.trim();
      list.innerHTML = res.length
        ? res.slice(0, 10).map((t, i) => `<a href="#/outil/${t.id}" class="${i === sel ? 'on' : ''}">${icon(t.icon)}<span><b>${esc(t.name)}</b><small>${esc(F.CATEGORIES[t.cat]?.name || '')}</small></span></a>`).join('')
        : '<div class="empty small">Aucun outil trouvé</div>';
    };
    input.addEventListener('input', () => { sel = 0; draw(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, Math.min(res.length, 10) - 1); draw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); draw(); e.preventDefault(); }
      else if (e.key === 'Enter' && res[sel]) { location.hash = '#/outil/' + res[sel].id; input.value = ''; draw(); input.blur(); }
      else if (e.key === 'Escape') { input.value = ''; draw(); input.blur(); }
    });
    list.addEventListener('click', () => { input.value = ''; draw(); });
    input.addEventListener('blur', () => setTimeout(() => { list.hidden = true; }, 150));
    input.addEventListener('focus', draw);
    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); input.focus(); input.select(); }
    });
  }

  /* -------------------------------- pages -------------------------------- */
  const toolCard = (t) => `<a class="tool-card" href="#/outil/${t.id}"><div class="tool-ico">${icon(t.icon)}</div><div><b>${esc(t.name)}</b><p>${esc(t.desc || '')}</p></div></a>`;

  function pageHome(main) {
    const cats = Object.entries(F.CATEGORIES).filter(([k]) => F.tools.some((t) => t.cat === k));
    main.innerHTML = `
      <section class="hero">
        <img src="logo.png" alt="" class="hero-logo">
        <div>
          <h1>BL Forge</h1>
          <p>La boîte à outils des créateurs de serveurs FiveM : véhicules, vêtements, scripts, textes et convertisseurs.
          Tout tourne dans ton navigateur ; connecte-toi avec Discord pour sauvegarder tes projets.</p>
          <div class="hero-stats"><span><b>${F.tools.length}</b> outils</span><span><b>${cats.length}</b> catégories</span><span><b>0</b> fichier envoyé au serveur</span></div>
        </div>
      </section>
      ${cats.map(([k, c]) => `
        <section class="cat-section">
          <div class="section-head"><h2>${icon(c.icon)}${esc(c.name)}</h2><span class="muted">${esc(c.desc)}</span></div>
          <div class="tool-cards">${F.tools.filter((t) => t.cat === k).map(toolCard).join('')}</div>
        </section>`).join('')}`;
    markNav('home');
    document.title = 'BL Forge — outils FiveM';
  }

  function pageCategory(main, key) {
    const c = F.CATEGORIES[key];
    if (!c) return pageNotFound(main);
    main.innerHTML = `<div class="page-head"><h1>${icon(c.icon)}${esc(c.name)}</h1><p class="muted">${esc(c.desc)}</p></div>
      <div class="tool-cards">${F.tools.filter((t) => t.cat === key).map(toolCard).join('')}</div>`;
    markNav('cat-' + key);
    document.title = c.name + ' — BL Forge';
  }

  function pageNotFound(main) {
    main.innerHTML = '<div class="empty big"><h2>Page introuvable</h2><p><a href="#/">Retour à l’accueil</a></p></div>';
    markNav('');
  }

  const fmtDate = (t) => new Date(t).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  const fmtSize = (n) => (n > 1024 ? (n / 1024).toFixed(1) + ' Ko' : n + ' o');

  async function pageProjects(main) {
    markNav('projets');
    document.title = 'Mes projets — BL Forge';
    if (!state.me) {
      main.innerHTML = `<div class="page-head"><h1>${icon('folder')}Mes projets</h1></div>
        <div class="empty big"><p>Connecte-toi avec Discord pour retrouver ici tous tes projets sauvegardés (véhicules, packs de vêtements, configs…).</p>
        ${state.auth ? `<a class="btn discord" href="${esc(loginUrl())}">${icon('discord')}Connexion Discord</a>` : '<p class="muted">La connexion n’est pas configurée sur ce site.</p>'}</div>`;
      return;
    }
    main.innerHTML = `<div class="page-head"><h1>${icon('folder')}Mes projets</h1><p class="muted">Chargement…</p></div>`;
    let d;
    try { d = await F.api('GET', '/api/projects'); } catch (e) { main.innerHTML = `<div class="empty big">Erreur : ${esc(e.message)}</div>`; return; }
    const byId = Object.fromEntries(F.tools.map((t) => [t.id, t]));
    main.innerHTML = `<div class="page-head"><h1>${icon('folder')}Mes projets</h1><p class="muted">${d.projects.length} / ${d.max} projets</p></div>
      ${d.projects.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Nom</th><th>Outil</th><th>Modifié</th><th>Taille</th><th></th></tr></thead><tbody>
      ${d.projects.map((p) => `<tr data-id="${p.id}"><td><a href="#/outil/${esc(p.tool)}?projet=${p.id}"><b>${esc(p.name)}</b></a></td>
        <td>${esc(byId[p.tool]?.name || p.tool)}</td><td>${fmtDate(p.updated_at)}</td><td>${fmtSize(p.size)}</td>
        <td class="actions"><button class="btn sm ghost" data-a="rename">Renommer</button><button class="btn sm ghost danger" data-a="del">${icon('trash')}</button></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty big"><p>Aucun projet pour l’instant. Ouvre un outil et clique « Sauvegarder ».</p></div>'}`;
    main.onclick = async (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const tr = b.closest('tr'), id = tr.dataset.id;
      try {
        if (b.dataset.a === 'del') {
          if (!confirm('Supprimer ce projet ? C’est définitif.')) return;
          await F.api('DELETE', '/api/projects/' + id);
          tr.remove(); F.toast('Projet supprimé');
        } else {
          const name = prompt('Nouveau nom', tr.querySelector('b').textContent);
          if (!name) return;
          await F.api('PUT', '/api/projects/' + id, { name });
          tr.querySelector('b').textContent = name.trim().slice(0, 80);
        }
      } catch (err) { F.toast(err.message, 'error'); }
    };
  }

  /* ------------------------------ page d'outil ------------------------------ */
  function pageTool(main, id, params) {
    const t = F.tools.find((x) => x.id === id);
    if (!t) return pageNotFound(main);
    markNav('tool-' + id);
    document.title = t.name + ' — BL Forge';
    main.innerHTML = `<div class="tool-head">
        <div class="tool-title"><div class="tool-ico">${icon(t.icon)}</div><div><h1>${esc(t.name)}</h1><p class="muted">${esc(t.desc || '')}</p></div></div>
        <div class="project-bar" hidden>
          <span class="project-name muted"></span>
          <button class="btn sm ghost" data-a="new">${icon('plus')}Nouveau</button>
          <button class="btn sm ghost" data-a="open">${icon('folder')}Ouvrir</button>
          <button class="btn sm primary" data-a="save">${icon('save')}Sauvegarder</button>
        </div>
      </div>
      <div class="tool-body"></div>`;
    const body = $('.tool-body', main);
    let api = null;
    try { api = t.mount(body, F) || null; } catch (e) { console.error(e); body.innerHTML = `<div class="empty big">Cet outil a planté : ${esc(e.message)}</div>`; return; }
    state.current = { tool: t, api };
    if (!api || typeof api.getState !== 'function') return;

    // Brouillon local + projets.
    const draftKey = 'draft:' + t.id;
    const bar = $('.project-bar', main);
    bar.hidden = false;
    const nameEl = $('.project-name', bar);
    const setProject = (p) => { state.project = p; nameEl.textContent = p ? 'Projet : ' + p.name : 'Non sauvegardé'; };
    setProject(null);

    let last = '';
    const snapshot = () => { try { return JSON.stringify(api.getState()); } catch { return ''; } };
    const saveDraft = F.debounce(() => {
      if (state.current?.api !== api) return;
      const s = snapshot();
      if (s && s !== last) { last = s; F.local.set(draftKey, { state: JSON.parse(s), project: state.project }); }
    }, 600);
    ['input', 'change', 'click'].forEach((ev) => body.addEventListener(ev, saveDraft));
    const timer = setInterval(() => { if (state.current?.api !== api) clearInterval(timer); else saveDraft(); }, 5000);

    const load = (s) => { try { api.setState(F.clone(s)); last = snapshot(); } catch (e) { console.error(e); F.toast('Impossible de charger ces données : ' + e.message, 'error'); } };

    const pid = parseInt(params.get('projet') || '', 10);
    if (pid > 0) {
      if (!state.me) F.toast('Connecte-toi pour ouvrir ce projet', 'error');
      else F.api('GET', '/api/projects/' + pid).then(({ project }) => { load(project.data); setProject({ id: project.id, name: project.name }); F.local.set(draftKey, { state: project.data, project: state.project }); })
        .catch((e) => F.toast(e.message, 'error'));
    } else {
      const draft = F.local.get(draftKey);
      if (draft && draft.state) { load(draft.state); setProject(draft.project || null); }
      else last = snapshot();
    }

    bar.onclick = async (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'new') {
        if (!confirm('Repartir de zéro ? Les modifications non sauvegardées de ce brouillon seront perdues.')) return;
        F.local.del(draftKey);
        history.replaceState(null, '', '#/outil/' + t.id);
        route(true);
        return;
      }
      if (!state.me) {
        if (!state.auth) return F.toast('La connexion Discord n’est pas configurée sur ce site', 'error');
        if (confirm('Il faut te connecter avec Discord pour sauvegarder. Ton brouillon reste gardé dans ce navigateur. Se connecter maintenant ?')) location.href = loginUrl();
        return;
      }
      if (b.dataset.a === 'open') return openDialog(t, (p) => { load(p.data); setProject({ id: p.id, name: p.name }); F.local.set(draftKey, { state: p.data, project: state.project }); history.replaceState(null, '', `#/outil/${t.id}?projet=${p.id}`); });
      // Sauvegarder
      const data = api.getState();
      try {
        if (state.project) {
          await F.api('PUT', '/api/projects/' + state.project.id, { name: state.project.name, data });
          F.toast('Projet sauvegardé');
        } else {
          const name = prompt('Nom du projet', (data && (data.name || data.resource || data.title)) || t.name);
          if (!name) return;
          const r = await F.api('POST', '/api/projects', { tool: t.id, name, data });
          setProject({ id: r.id, name: name.trim().slice(0, 80) });
          history.replaceState(null, '', `#/outil/${t.id}?projet=${r.id}`);
          F.toast('Projet créé');
        }
        F.local.set(draftKey, { state: data, project: state.project });
      } catch (err) {
        if (err.status === 404 && state.project) { setProject(null); F.toast('Ce projet n’existe plus : clique à nouveau pour en créer un', 'error'); }
        else F.toast(err.message, 'error');
      }
    };
  }

  async function openDialog(t, onPick) {
    let d;
    try { d = await F.api('GET', '/api/projects?tool=' + t.id); } catch (e) { return F.toast(e.message, 'error'); }
    const dlg = h(`<dialog class="modal"><div class="modal-head"><b>Ouvrir un projet — ${esc(t.name)}</b><button class="btn sm ghost" data-a="close">${icon('x')}</button></div>
      <div class="modal-body">${d.projects.length ? d.projects.map((p) => `<button class="list-item" data-id="${p.id}"><b>${esc(p.name)}</b><small>${fmtDate(p.updated_at)} · ${fmtSize(p.size)}</small></button>`).join('') : '<div class="empty">Aucun projet sauvegardé pour cet outil.</div>'}</div></dialog>`);
    document.body.append(dlg);
    dlg.addEventListener('close', () => dlg.remove());
    dlg.onclick = async (e) => {
      if (e.target === dlg || e.target.closest('[data-a=close]')) return dlg.close();
      const b = e.target.closest('[data-id]');
      if (!b) return;
      try { const { project } = await F.api('GET', '/api/projects/' + b.dataset.id); onPick(project); dlg.close(); F.toast('Projet ouvert'); }
      catch (err) { F.toast(err.message, 'error'); }
    };
    dlg.showModal();
  }

  /* -------------------------------- routeur -------------------------------- */
  let lastRoute = '';
  function route(force = false) {
    const raw = location.hash.replace(/^#/, '') || '/';
    // Retour de connexion Discord : #connexion=<raison>
    if (raw.startsWith('connexion=')) {
      const why = raw.slice(10);
      F.toast({ annulee: 'Connexion annulée', expiree: 'Connexion expirée, réessaie', refusee: 'Compte refusé', erreur: 'Erreur pendant la connexion Discord' }[why] || 'Connexion impossible', 'error');
      history.replaceState(null, '', location.pathname + '#/');
      return route(true);
    }
    if (!force && raw === lastRoute) return;
    lastRoute = raw;
    const [p, qs] = raw.split('?');
    const params = new URLSearchParams(qs || '');
    const parts = p.split('/').filter(Boolean);
    const main = $('#main');
    main.onclick = null;
    state.current = null;
    main.scrollTop = 0; window.scrollTo(0, 0);
    if (!parts.length) pageHome(main);
    else if (parts[0] === 'outil' && parts[1]) pageTool(main, parts[1], params);
    else if (parts[0] === 'categorie' && parts[1]) pageCategory(main, parts[1]);
    else if (parts[0] === 'projets') pageProjects(main);
    else pageNotFound(main);
  }

  /* -------------------------------- démarrage -------------------------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    applyTheme(F.local.get('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
    $('#theme-btn').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    $('#menu-btn').onclick = () => document.body.classList.toggle('nav-open');
    $('#scrim').onclick = () => document.body.classList.remove('nav-open');
    renderNav();
    setupSearch();
    window.addEventListener('hashchange', () => route());
    await loadMe(); // avant la première page : « Mes projets » et ?projet= ont besoin de savoir qui est connecté
    route();
  });
})();
