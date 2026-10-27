const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

class SQLiteStore {
  constructor(dbPath = ':memory:') {
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT
      );
    `);
  }

  createSession(id, username, expiresAt) {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO sessions (id, username, expires_at) VALUES (?, ?, ?)');
    stmt.run(id, username, expiresAt);
  }

  getSession(id) {
    const stmt = this.db.prepare('SELECT id, username, expires_at FROM sessions WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;
    if (row.expires_at < Date.now()) {
      this.deleteSession(id);
      return null;
    }
    return row;
  }

  deleteSession(id) {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
  }

  logAudit(action, details = '') {
    const stmt = this.db.prepare('INSERT INTO audit_logs (timestamp, action, details) VALUES (?, ?, ?)');
    stmt.run(Date.now(), action, details);
  }
}

function createStore(options = {}) {
  if (options.memory) {
    return new SQLiteStore(':memory:');
  }
  const defaultPath = path.resolve(__dirname, '../../data/dashboard.db');
  return new SQLiteStore(options.dbPath || defaultPath);
}

module.exports = {
  SQLiteStore,
  createStore
};
