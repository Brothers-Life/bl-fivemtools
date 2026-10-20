'use strict';
/*
 * Serveur de BL Forge (outils pour créateurs de serveurs FiveM).
 *  - sert le site (dossier public/) ; les outils tournent entièrement dans le navigateur ;
 *  - gère la connexion Discord (server/auth.js) ;
 *  - stocke les projets sauvegardés des personnes connectées (server/db.js, SQLite).
 * Aucune dépendance : node server.js. Configuration dans .env (voir .env.example).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Charge le fichier .env s'il existe ; les variables déjà définies gardent la priorité.
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch { /* pas de .env : variables de l'hébergeur */ }
// Nettoie les variables : espaces autour et commentaire en fin de ligne (" # ...") collés par erreur.
for (const [k, v] of Object.entries(process.env)) {
  if (typeof v === 'string') { const c = v.replace(/\s+#.*$/, '').trim(); if (c !== v) process.env[k] = c; }
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const PUBLIC = path.join(__dirname, 'public');
const MAX_BODY = 1024 * 1024;     // un projet sauvegardé : 1 Mo max
const MAX_PROJECTS = 300;         // par compte

const db = require('./server/db')(DATA_DIR);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
};

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...SECURITY_HEADERS });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { req.removeAllListeners('data'); req.resume(); reject(Object.assign(new Error('too large'), { code: 413 })); return; } chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const auth = require('./server/auth')({ db, json });

/* -------------------------------- projets -------------------------------- */

const TOOL_RE = /^[a-z0-9-]{1,40}$/;
const cleanName = (n) => String(n || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 80);

async function projects(req, res, url, user) {
  // Les requêtes qui modifient doivent venir du site lui-même.
  if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== auth.origin) return json(res, 403, { error: 'origine refusée' });
  const id = url === '/api/projects' ? null : parseInt(url.slice('/api/projects/'.length), 10);
  if (id !== null && !(id > 0)) return json(res, 404, { error: 'projet introuvable' });

  if (req.method === 'GET' && id === null) {
    const tool = new URL(req.url, 'http://x').searchParams.get('tool');
    return json(res, 200, { projects: db.projects(user.id, tool && TOOL_RE.test(tool) ? tool : null), max: MAX_PROJECTS });
  }
  if (req.method === 'GET') {
    const p = db.project(user.id, id);
    return p ? json(res, 200, { project: p }) : json(res, 404, { error: 'projet introuvable' });
  }
  if (req.method === 'DELETE' && id !== null) {
    return db.remove(user.id, id) ? json(res, 200, { ok: true }) : json(res, 404, { error: 'projet introuvable' });
  }
  if (req.method === 'POST' || req.method === 'PUT') {
    let b;
    try { b = JSON.parse((await readBody(req)).toString('utf8') || '{}'); }
    catch (e) { return json(res, e.code === 413 ? 413 : 400, { error: e.code === 413 ? 'projet trop gros (1 Mo max)' : 'JSON invalide' }); }
    const name = cleanName(b.name);
    if (!name) return json(res, 400, { error: 'nom du projet manquant' });
    if (req.method === 'PUT' && id !== null && b.data === undefined) {
      return db.rename(user.id, id, name) ? json(res, 200, { ok: true }) : json(res, 404, { error: 'projet introuvable' });
    }
    const data = JSON.stringify(b.data ?? null);
    if (req.method === 'PUT' && id !== null) {
      return db.update(user.id, id, name, data) ? json(res, 200, { ok: true, id }) : json(res, 404, { error: 'projet introuvable' });
    }
    if (req.method === 'POST' && id === null) {
      if (!TOOL_RE.test(String(b.tool || ''))) return json(res, 400, { error: 'outil inconnu' });
      if (db.count(user.id) >= MAX_PROJECTS) return json(res, 400, { error: `limite de ${MAX_PROJECTS} projets atteinte` });
      return json(res, 200, { ok: true, id: db.create(user.id, b.tool, name, data) });
    }
  }
  json(res, 405, { error: 'méthode non autorisée' });
}

/* --------------------------------- fichiers -------------------------------- */

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
function serveFile(req, res, url) {
  let rel;
  try { rel = decodeURIComponent(url); } catch { return false; }
  if (rel === '/') rel = '/index.html';
  const file = path.join(PUBLIC, path.normalize(rel));
  if (!file.startsWith(PUBLIC + path.sep)) return false;
  let st;
  try { st = fs.statSync(file); } catch { return false; }
  if (!st.isFile() || !TYPES[path.extname(file)]) return false;
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)],
    'Content-Length': st.size,
    // index.html toujours revalidé ; le reste est versionné (?v=) dans index.html
    'Cache-Control': rel === '/index.html' ? 'no-cache' : 'public, max-age=86400',
    ...SECURITY_HEADERS,
  });
  if (req.method === 'HEAD') return res.end(), true;
  fs.createReadStream(file).pipe(res);
  return true;
}

/* --------------------------------- serveur --------------------------------- */

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  try {
    if (url === '/health') return json(res, 200, { ok: true, auth: auth.enabled, ...db.stats() });
    if (await auth.handle(req, res, url)) return;

    if (url === '/api/projects' || url.startsWith('/api/projects/')) {
      const user = auth.currentUser(req);
      if (!user) return json(res, 401, { error: 'connexion requise' });
      return await projects(req, res, url, user);
    }
    if (url.startsWith('/api/')) return json(res, 404, { error: 'inconnu' });

    if ((req.method === 'GET' || req.method === 'HEAD') && serveFile(req, res, url)) return;
    json(res, 404, { error: 'introuvable' });
  } catch (e) {
    console.error('[forge] erreur :', e.message);
    if (!res.headersSent) json(res, 500, { error: 'erreur interne' });
  }
}).listen(PORT, () => console.log(`[forge] en ligne sur :${PORT} — données dans ${DATA_DIR}`));
