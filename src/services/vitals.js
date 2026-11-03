const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('../config');

/**
 * Checks if the Docker daemon engine is reachable and responsive.
 * @param {number} timeoutMs
 * @returns {Promise<{ available: boolean, version: string|null, error: string|null }>}
 */
function checkDockerEngine(timeoutMs = 3000) {
  return new Promise((resolve) => {
    exec('docker info --format "{{.ServerVersion}}"', { timeout: timeoutMs, windowsHide: true }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({
          available: false,
          version: null,
          error: 'Docker daemon is offline. Please launch Docker Desktop.'
        });
      } else {
        resolve({
          available: true,
          version: stdout.trim(),
          error: null
        });
      }
    });
  });
}

/**
 * Verifies that the designated Jitsi directory exists and contains necessary compose files.
 * @param {string} jitsiDir
 * @returns {{ path: string, exists: boolean, hasCompose: boolean, hasEnv: boolean, configured: boolean, error: string|null }}
 */
function checkJitsiEnvironment(jitsiDir = config.JITSI_DIR) {
  const targetDir = jitsiDir || config.JITSI_DIR;
  const exists = fs.existsSync(targetDir);

  if (!exists) {
    return {
      path: targetDir,
      exists: false,
      hasCompose: false,
      hasEnv: false,
      configured: false,
      error: `Jitsi directory does not exist: ${targetDir}`
    };
  }

  const hasCompose = fs.existsSync(path.join(targetDir, 'docker-compose.yml')) ||
                     fs.existsSync(path.join(targetDir, 'compose.yaml')) ||
                     fs.existsSync(path.join(targetDir, 'compose.yml'));
  const hasEnv = fs.existsSync(path.join(targetDir, '.env'));

  let error = null;
  if (!hasCompose) {
    error = 'docker-compose.yml not found in Jitsi directory.';
  } else if (!hasEnv) {
    error = '.env configuration file not found in Jitsi directory.';
  }

  return {
    path: targetDir,
    exists: true,
    hasCompose,
    hasEnv,
    configured: hasCompose && hasEnv,
    error
  };
}

/**
 * Computes stack readiness for launch based on vital prerequisites.
 * @param {{ docker: { available: boolean, error?: string|null }, jitsiEnv: { configured: boolean, error?: string|null }, isAllRunning?: boolean, isAnyRunning?: boolean }} vitals
 * @returns {{ readyToStart: boolean, status: 'ready'|'running'|'blocked', reason: string }}
 */
function calculateReadiness({ docker, jitsiEnv, isAllRunning = false, isAnyRunning = false }) {
  if (isAllRunning) {
    return {
      readyToStart: false,
      status: 'running',
      reason: 'Stack is already active and running.'
    };
  }

  if (!docker || !docker.available) {
    return {
      readyToStart: false,
      status: 'blocked',
      reason: 'Docker daemon is offline. Launch Docker Desktop before starting.'
    };
  }

  if (!jitsiEnv || !jitsiEnv.configured) {
    return {
      readyToStart: false,
      status: 'blocked',
      reason: jitsiEnv?.error || 'Jitsi environment is not properly configured.'
    };
  }

  return {
    readyToStart: true,
    status: isAnyRunning ? 'partial' : 'ready',
    reason: isAnyRunning
      ? 'Some containers are stopped. Ready to launch remaining services.'
      : 'All pre-flight checks passed. Ready to start stack.'
  };
}

/**
 * Aggregates all system vitals into a structured payload.
 * @param {{ isAllRunning?: boolean, isAnyRunning?: boolean }} context
 * @returns {Promise<{ docker: object, jitsiEnv: object, readiness: object }>}
 */
async function getSystemVitals(context = {}) {
  const [docker] = await Promise.all([
    checkDockerEngine()
  ]);
  const jitsiEnv = checkJitsiEnvironment();
  const readiness = calculateReadiness({
    docker,
    jitsiEnv,
    isAllRunning: context.isAllRunning,
    isAnyRunning: context.isAnyRunning
  });

  return {
    docker,
    jitsiEnv,
    readiness
  };
}

module.exports = {
  checkDockerEngine,
  checkJitsiEnvironment,
  calculateReadiness,
  getSystemVitals
};
