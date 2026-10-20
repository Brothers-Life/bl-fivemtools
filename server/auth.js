'use strict';
/*
 * Connexion Discord (OAuth2) de BL Forge.
 * Ouverte à tout le monde : la connexion sert seulement à sauvegarder ses projets.
 * La session est un cookie HttpOnly signé ; les comptes sont dans la base (server/db.js).
 * Un compte « banni » (colonne banned = 1) ne peut plus se connecter ni sauvegarder.
 */
const crypto = require('crypto');

module.exports = function createAuth({ db, json }) {
  const D = {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || '',
    api: (process.env.DISCORD_API_BASE || 'https://discord.com/api/v10').replace(/\/$/, ''),
    authorize: process.env.DISCORD_AUTHORIZE_URL || 'https://discord.com/oauth2/authorize',
  };
  const secret = process.env.SESSION_SECRET || '';
  const REQUIRED = { DISCORD_CLIENT_ID: D.clientId, DISCORD_CLIENT_SECRET: D.clientSecret, DISCORD_REDIRECT_URI: D.redirectUri, SESSION_SECRET: secret };
  const missing = Object.entries(REQUIRED).filter(([, v]) => !v).map(([k]) => k);
  const enabled = missing.length === 0;
  const SESSION_DAYS = Math.max(1, parseInt(process.env.SESSION_DAYS || '30', 10) || 30);
  const COOKIE = 'blf_session';
  const origin = enabled ? new URL(D.redirectUri).origin : null;
  const secure = !origin || origin.startsWith('https:');

  if (!enabled) console.warn(`[auth] Connexion Discord DESACTIVEE (manque : ${missing.join(', ')}) — les outils marchent, la sauvegarde de projets non.`);
  else console.log('[auth] Connexion Discord active.');

  /* ------------------------------ jetons signés ------------------------------ */
  const hmac = (v) => crypto.createHmac('sha256', secret).update(v).digest('base64url');
  const signed = (obj) => { const p = Buffer.from(JSON.stringify(obj)).toString('base64url'); return p + '.' + hmac(p); };
  function verify(token) {
    if (!token || !secret) return null;
    const i = token.lastIndexOf('.');
    if (i < 1) return null;
    const p = token.slice(0, i), sig = Buffer.from(token.slice(i + 1)), exp = Buffer.from(hmac(p));
    if (sig.length !== exp.length || !crypto.timingSafeEqual(sig, exp)) return null;
    try {
      const o = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
      return o && o.exp && Date.now() < o.exp ? o : null;
    } catch { return null; }
  }
  function cookies(req) {
    const out = {};
    for (const part of (req.headers.cookie || '').split(';')) {
      const i = part.indexOf('=');
      if (i > 0) { try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* illisible */ } }
    }
    return out;
  }
  const cookie = (name, value, maxAge) => `${name}=${encodeURIComponent(value)}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${maxAge}`;
  function redirect(res, location, setCookies = []) {
    res.writeHead(302, { Location: location, 'Set-Cookie': setCookies, 'Cache-Control': 'no-store' });
    res.end();
  }

  function currentUser(req) {
    if (!enabled) return null;
    const s = verify(cookies(req)[COOKIE]);
    if (!s || !s.id) return null;
    const row = db.user(s.id);
    if (!row || row.banned) return null;
    return { id: row.discord_id, name: row.name || row.username, username: row.username, avatar: row.avatar };
  }

  /* -------------------------------- OAuth2 ---------------------------------- */
  const safeNext = (n) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/');

  function startLogin(req, res, u) {
    const state = crypto.randomBytes(16).toString('hex');
    const params = new URLSearchParams({ response_type: 'code', client_id: D.clientId, redirect_uri: D.redirectUri, state, prompt: 'none', scope: 'identify' });
    redirect(res, D.authorize + '?' + params, [cookie('blf_oauth', signed({ state, next: safeNext(u.searchParams.get('next')), exp: Date.now() + 600e3 }), 600)]);
  }

  async function callback(req, res, u) {
    const clear = cookie('blf_oauth', '', 0);
    const st = verify(cookies(req).blf_oauth);
    const fail = (why) => redirect(res, (st ? st.next.split('#')[0] : '/') + '#connexion=' + why, [clear]);
    if (u.searchParams.get('error')) return fail('annulee');
    if (!st || st.state !== u.searchParams.get('state') || !u.searchParams.get('code')) return fail('expiree');
    try {
      const tr = await fetch(D.api + '/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: D.clientId, client_secret: D.clientSecret, grant_type: 'authorization_code', code: u.searchParams.get('code'), redirect_uri: D.redirectUri }),
        signal: AbortSignal.timeout(8000),
      });
      if (!tr.ok) throw new Error('échange du code : HTTP ' + tr.status);
      const { access_token: token } = await tr.json();
      const mr = await fetch(D.api + '/users/@me', { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(8000) });
      if (!mr.ok) throw new Error('profil Discord : HTTP ' + mr.status);
      const me = await mr.json();
      const row = db.saveUser({ id: me.id, username: me.username, name: me.global_name || null, avatar: me.avatar || null });
      if (row.banned) return fail('refusee');
      const session = signed({ id: me.id, exp: Date.now() + SESSION_DAYS * 86400e3 });
      redirect(res, st.next, [clear, cookie(COOKIE, session, SESSION_DAYS * 86400)]);
    } catch (e) {
      console.error('[auth] connexion Discord :', e.message);
      fail('erreur');
    }
  }

  // Renvoie true si la requête a été traitée ici.
  async function handle(req, res, url) {
    const u = new URL(req.url, 'http://x');
    if ((url === '/auth/discord' || url === '/auth/discord/callback') && req.method === 'GET') {
      if (!enabled) { json(res, 503, { error: 'connexion Discord non configurée', missing }); return true; }
      if (url === '/auth/discord') startLogin(req, res, u); else await callback(req, res, u);
      return true;
    }
    if (url === '/auth/logout') { redirect(res, '/', [cookie(COOKIE, '', 0)]); return true; }
    if (url === '/api/me') {
      const user = currentUser(req);
      json(res, 200, { auth: enabled, user });
      return true;
    }
    return false;
  }

  return { enabled, origin, handle, currentUser };
};
