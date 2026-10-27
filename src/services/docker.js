const { exec } = require('child_process');
const config = require('../config');

const ALLOWED_SERVICES = ['web', 'prosody', 'jicofo', 'jvb', 'etherpad', 'jibri', 'jigasi'];

function validateServiceName(service) {
  if (!service) return true; // Empty string or null means all services
  return ALLOWED_SERVICES.includes(service.toLowerCase().trim());
}

function validateTailCount(tail, defaultCount = 100, maxCount = 500) {
  const parsed = parseInt(tail, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultCount;
  }
  return Math.min(parsed, maxCount);
}

function parseComposePs(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return [];
  }

  const lines = rawOutput.split('\n').map(l => l.trim()).filter(Boolean);
  const containers = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      containers.push({
        name: parsed.Name || parsed.Service || 'unknown',
        service: parsed.Service || 'unknown',
        state: (parsed.State || '').toLowerCase(),
        status: parsed.Status || '',
        health: parsed.Health || 'none'
      });
    } catch {
      // Ignore non-json lines
    }
  }

  return containers;
}

function executeCommand(command, workingDir = config.JITSI_DIR) {
  return new Promise((resolve) => {
    exec(command, { cwd: workingDir, windowsHide: true }, (err, stdout, stderr) => {
      resolve({
        success: !err,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
        error: err ? err.message : null
      });
    });
  });
}

async function getContainers() {
  const res = await executeCommand('docker compose ps --format json');
  return parseComposePs(res.stdout);
}

async function startServices(service = null) {
  if (service && !validateServiceName(service)) {
    throw new Error(`Invalid service name: ${service}`);
  }
  const cmd = service ? `docker compose up -d ${service}` : 'docker compose up -d';
  return executeCommand(cmd);
}

async function stopServices(service = null) {
  if (service && !validateServiceName(service)) {
    throw new Error(`Invalid service name: ${service}`);
  }
  const cmd = service ? `docker compose stop ${service}` : 'docker compose down';
  return executeCommand(cmd);
}

async function restartServices(service = null) {
  if (service && !validateServiceName(service)) {
    throw new Error(`Invalid service name: ${service}`);
  }
  const cmd = service ? `docker compose restart ${service}` : 'docker compose restart';
  return executeCommand(cmd);
}

async function getLogs(service = null, tail = 100) {
  if (service && !validateServiceName(service)) {
    throw new Error(`Invalid service name: ${service}`);
  }
  const tailCount = validateTailCount(tail);
  const cmd = service
    ? `docker compose logs --tail=${tailCount} ${service}`
    : `docker compose logs --tail=${tailCount}`;
  return executeCommand(cmd);
}

module.exports = {
  ALLOWED_SERVICES,
  validateServiceName,
  validateTailCount,
  parseComposePs,
  executeCommand,
  getContainers,
  startServices,
  stopServices,
  restartServices,
  getLogs
};
