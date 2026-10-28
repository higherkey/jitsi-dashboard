const path = require('path');
const fs = require('fs');

// Attempt to load .env if present (zero external dependencies)
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  } catch {
    // Ignore .env read errors and fall back to environment / defaults
  }
}

const JITSI_DIR = process.env.JITSI_DIR || path.resolve(__dirname, '..', '..');
const PORT = parseInt(process.env.PORT, 10) || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL, 10) || 5000;
const HTTPS_URL = process.env.HTTPS_URL || 'https://localhost:8443';
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3000';
const DATABASE_URL = process.env.DATABASE_URL || null;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const SESSION_SECRET = process.env.SESSION_SECRET || 'jitsi_dashboard_default_secret_key_123';

module.exports = {
  JITSI_DIR,
  PORT,
  HOST,
  POLL_INTERVAL,
  HTTPS_URL,
  GRAFANA_URL,
  DATABASE_URL,
  ADMIN_PASSWORD,
  SESSION_SECRET
};
