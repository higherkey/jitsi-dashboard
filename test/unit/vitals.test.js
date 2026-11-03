const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { checkJitsiEnvironment, calculateReadiness } = require('../../src/services/vitals');

describe('System Vitals & Pre-Flight Checks Service', () => {
  it('checks jitsi environment when directory and compose exist', () => {
    // Current workspace has .env, let's test with this directory or mock
    const validDir = path.resolve(__dirname, '..', '..');
    const result = checkJitsiEnvironment(validDir);

    // Assert
    assert.equal(typeof result.exists, 'boolean');
    assert.equal(typeof result.hasCompose, 'boolean');
    assert.equal(typeof result.hasEnv, 'boolean');
    assert.equal(typeof result.configured, 'boolean');
  });

  it('reports configured false for non-existent directory', () => {
    const bogusDir = path.resolve(__dirname, 'non_existent_folder_xyz_123');
    const result = checkJitsiEnvironment(bogusDir);

    assert.equal(result.exists, false);
    assert.equal(result.hasCompose, false);
    assert.equal(result.hasEnv, false);
    assert.equal(result.configured, false);
    assert.ok(result.error.includes('does not exist'));
  });

  it('calculates readiness as blocked when docker is unavailable', () => {
    const readiness = calculateReadiness({
      docker: { available: false, error: 'Daemon offline', version: null },
      jitsiEnv: { configured: true, error: null },
      isAllRunning: false,
      isAnyRunning: false
    });

    assert.equal(readiness.readyToStart, false);
    assert.equal(readiness.status, 'blocked');
    assert.ok(readiness.reason.includes('Docker daemon is offline'));
  });

  it('calculates readiness as blocked when environment is missing compose', () => {
    const readiness = calculateReadiness({
      docker: { available: true, error: null, version: '29.9.2' },
      jitsiEnv: { configured: false, error: 'docker-compose.yml not found' },
      isAllRunning: false,
      isAnyRunning: false
    });

    assert.equal(readiness.readyToStart, false);
    assert.equal(readiness.status, 'blocked');
    assert.ok(readiness.reason.includes('docker-compose.yml not found'));
  });

  it('calculates readiness as ready when docker and env are valid and stack is stopped', () => {
    const readiness = calculateReadiness({
      docker: { available: true, error: null, version: '29.9.2' },
      jitsiEnv: { configured: true, error: null },
      isAllRunning: false,
      isAnyRunning: false
    });

    assert.equal(readiness.readyToStart, true);
    assert.equal(readiness.status, 'ready');
    assert.ok(readiness.reason.includes('Ready to start'));
  });

  it('calculates readiness as running when stack is already running', () => {
    const readiness = calculateReadiness({
      docker: { available: true, error: null, version: '29.9.2' },
      jitsiEnv: { configured: true, error: null },
      isAllRunning: true,
      isAnyRunning: true
    });

    assert.equal(readiness.readyToStart, false);
    assert.equal(readiness.status, 'running');
    assert.ok(readiness.reason.includes('Stack is already active'));
  });
});
