const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  checkDockerEngine,
  checkJitsiEnvironment,
  calculateReadiness,
  getSystemVitals
} = require('../../src/services/vitals');

describe('System Vitals & Pre-Flight Checks Service', () => {
  it('checks jitsi environment when directory and compose exist', () => {
    // Arrange: Mock fsModule that returns true for all files
    const mockFs = {
      existsSync: () => true
    };

    // Act
    const result = checkJitsiEnvironment('/mock/jitsi', mockFs);

    // Assert
    assert.equal(result.exists, true);
    assert.equal(result.hasCompose, true);
    assert.equal(result.hasEnv, true);
    assert.equal(result.configured, true);
    assert.equal(result.error, null);
  });

  it('reports configured false for non-existent directory', () => {
    // Arrange: Mock fsModule where directory does not exist
    const mockFs = {
      existsSync: () => false
    };

    // Act
    const result = checkJitsiEnvironment('/non/existent', mockFs);

    // Assert
    assert.equal(result.exists, false);
    assert.equal(result.hasCompose, false);
    assert.equal(result.hasEnv, false);
    assert.equal(result.configured, false);
    assert.ok(result.error.includes('does not exist'));
  });

  it('reports error when directory exists but .env is missing', () => {
    // Arrange: Mock fsModule where dir and compose exist, but .env does not
    const mockFs = {
      existsSync: (filePath) => !filePath.endsWith('.env')
    };

    // Act
    const result = checkJitsiEnvironment('/mock/jitsi', mockFs);

    // Assert
    assert.equal(result.exists, true);
    assert.equal(result.hasCompose, true);
    assert.equal(result.hasEnv, false);
    assert.equal(result.configured, false);
    assert.ok(result.error.includes('.env configuration file not found'));
  });

  it('checks docker engine and handles success response', async () => {
    // Arrange: Mock exec function returning version
    const mockExec = (cmd, opts, callback) => {
      callback(null, '29.9.2\n', '');
    };

    // Act
    const result = await checkDockerEngine(3000, mockExec);

    // Assert
    assert.equal(result.available, true);
    assert.equal(result.version, '29.9.2');
    assert.equal(result.error, null);
  });

  it('checks docker engine and handles error response', async () => {
    // Arrange: Mock exec function returning error
    const mockExec = (cmd, opts, callback) => {
      callback(new Error('daemon stopped'), '', 'error');
    };

    // Act
    const result = await checkDockerEngine(3000, mockExec);

    // Assert
    assert.equal(result.available, false);
    assert.equal(result.version, null);
    assert.ok(result.error.includes('Docker daemon is offline'));
  });

  it('calculates readiness as blocked when docker is unavailable', () => {
    // Arrange & Act
    const readiness = calculateReadiness({
      docker: { available: false, error: 'Daemon offline', version: null },
      jitsiEnv: { configured: true, error: null },
      isAllRunning: false,
      isAnyRunning: false
    });

    // Assert
    assert.equal(readiness.readyToStart, false);
    assert.equal(readiness.status, 'blocked');
    assert.ok(readiness.reason.includes('Docker daemon is offline'));
  });

  it('calculates readiness as blocked when environment is missing compose', () => {
    // Arrange & Act
    const readiness = calculateReadiness({
      docker: { available: true, error: null, version: '29.9.2' },
      jitsiEnv: { configured: false, error: 'docker-compose.yml not found' },
      isAllRunning: false,
      isAnyRunning: false
    });

    // Assert
    assert.equal(readiness.readyToStart, false);
    assert.equal(readiness.status, 'blocked');
    assert.ok(readiness.reason.includes('docker-compose.yml not found'));
  });

  it('calculates readiness as ready when docker and env are valid and stack is stopped', () => {
    // Arrange & Act
    const readiness = calculateReadiness({
      docker: { available: true, error: null, version: '29.9.2' },
      jitsiEnv: { configured: true, error: null },
      isAllRunning: false,
      isAnyRunning: false
    });

    // Assert
    assert.equal(readiness.readyToStart, true);
    assert.equal(readiness.status, 'ready');
    assert.ok(readiness.reason.includes('Ready to start'));
  });

  it('calculates readiness as partial when some containers are running', () => {
    // Arrange & Act
    const readiness = calculateReadiness({
      docker: { available: true, error: null, version: '29.9.2' },
      jitsiEnv: { configured: true, error: null },
      isAllRunning: false,
      isAnyRunning: true
    });

    // Assert
    assert.equal(readiness.readyToStart, true);
    assert.equal(readiness.status, 'partial');
    assert.ok(readiness.reason.includes('Some containers are stopped'));
  });

  it('calculates readiness as running when stack is already running', () => {
    // Arrange & Act
    const readiness = calculateReadiness({
      docker: { available: true, error: null, version: '29.9.2' },
      jitsiEnv: { configured: true, error: null },
      isAllRunning: true,
      isAnyRunning: true
    });

    // Assert
    assert.equal(readiness.readyToStart, false);
    assert.equal(readiness.status, 'running');
    assert.ok(readiness.reason.includes('Stack is already active'));
  });

  it('getSystemVitals aggregates docker, jitsiEnv, and readiness with injected boundaries', async () => {
    // Arrange
    const mockExec = (cmd, opts, cb) => {
      const callback = typeof opts === 'function' ? opts : cb;
      callback(null, '29.9.2', '');
    };
    const mockFs = {
      existsSync: () => true
    };

    // Act
    const vitals = await getSystemVitals(
      { isAllRunning: false, isAnyRunning: false },
      { execFn: mockExec, fsModule: mockFs }
    );

    // Assert
    assert.ok('docker' in vitals);
    assert.ok('jitsiEnv' in vitals);
    assert.ok('readiness' in vitals);
    assert.equal(vitals.docker.available, true);
    assert.equal(vitals.docker.version, '29.9.2');
    assert.equal(vitals.jitsiEnv.configured, true);
    assert.equal(vitals.readiness.readyToStart, true);
    assert.equal(vitals.readiness.status, 'ready');
  });
});
