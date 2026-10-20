'use strict';
/*
 * Stockage de BL Forge : SQLite intégré à Node (node:sqlite, Node 22.5+), aucune dépendance.
 * Fichier : DATA_DIR/forge.db (sur Railway, monter un volume sur DATA_DIR sinon tout est perdu au redéploiement).
 */
const fs = require('fs');
const path = require('path');

// node:sqlite affiche un avertissement « experimental » au chargement : on le masque, lui seul.
const emit = process.emitWarning;
process.emitWarning = (w, ...a) => (String(w).includes('SQLite') ? undefined : emit.call(process, w, ...a));
const { DatabaseSync } = require('node:sqlite');
process.emitWarning = emit;

module.exports = function openDb(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, 'forge.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT PRIMARY KEY,
      username   TEXT NOT NULL,
      name       TEXT,
      avatar     TEXT,
      banned     INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      last_login INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      owner      TEXT NOT NULL REFERENCES users(discord_id),
      tool       TEXT NOT NULL,
      name       TEXT NOT NULL,
      data       TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS projects_owner ON projects(owner, updated_at DESC);
  `);

  const q = {
    upsertUser: db.prepare(`INSERT INTO users (discord_id, username, name, avatar, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET username = excluded.username, name = excluded.name, avatar = excluded.avatar, last_login = excluded.last_login`),
    user: db.prepare('SELECT discord_id, username, name, avatar, banned, created_at, last_login FROM users WHERE discord_id = ?'),
    list: db.prepare('SELECT id, tool, name, length(data) AS size, created_at, updated_at FROM projects WHERE owner = ? ORDER BY updated_at DESC'),
    listTool: db.prepare('SELECT id, tool, name, length(data) AS size, created_at, updated_at FROM projects WHERE owner = ? AND tool = ? ORDER BY updated_at DESC'),
    count: db.prepare('SELECT COUNT(*) AS n FROM projects WHERE owner = ?'),
    get: db.prepare('SELECT id, tool, name, data, created_at, updated_at FROM projects WHERE id = ? AND owner = ?'),
    insert: db.prepare('INSERT INTO projects (owner, tool, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'),
    update: db.prepare('UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ? AND owner = ?'),
    rename: db.prepare('UPDATE projects SET name = ?, updated_at = ? WHERE id = ? AND owner = ?'),
    remove: db.prepare('DELETE FROM projects WHERE id = ? AND owner = ?'),
    stats: db.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM projects) AS projects'),
  };

  return {
    saveUser(u) { const now = Date.now(); q.upsertUser.run(u.id, u.username, u.name, u.avatar, now, now); return q.user.get(u.id); },
    user: (id) => q.user.get(id),
    projects: (owner, tool) => (tool ? q.listTool.all(owner, tool) : q.list.all(owner)),
    count: (owner) => q.count.get(owner).n,
    project(owner, id) {
      const p = q.get.get(id, owner);
      if (!p) return null;
      try { p.data = JSON.parse(p.data); } catch { p.data = null; }
      return p;
    },
    create(owner, tool, name, data) { const now = Date.now(); return Number(q.insert.run(owner, tool, name, data, now, now).lastInsertRowid); },
    update: (owner, id, name, data) => q.update.run(name, data, Date.now(), id, owner).changes > 0,
    rename: (owner, id, name) => q.rename.run(name, Date.now(), id, owner).changes > 0,
    remove: (owner, id) => q.remove.run(id, owner).changes > 0,
    stats: () => q.stats.get(),
  };
};
