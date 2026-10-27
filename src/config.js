const path = require('path');

const JITSI_DIR = process.env.JITSI_DIR || path.resolve(__dirname, '..', '..');
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL, 10) || 5000;
const HTTPS_URL = process.env.HTTPS_URL || 'https://localhost:8443';

module.exports = {
  JITSI_DIR,
  PORT,
  HOST,
  POLL_INTERVAL,
  HTTPS_URL
};
