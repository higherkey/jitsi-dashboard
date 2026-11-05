const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');
const { TunnelService } = require('../../src/services/tunnel');

test('Tunnel Service Unit Tests', async (t) => {
  await t.test('initializes with default stopped state', () => {
    // Arrange & Act
    const svc = new TunnelService({ targetPort: 3001 });
    const status = svc.getStatus();

    // Assert
    assert.equal(status.status, 'stopped');
    assert.equal(status.publicUrl, null);
    assert.equal(status.targetUrl, 'http://localhost:3001');
    assert.equal(status.errorMessage, null);
    assert.equal(status.startedAt, null);
  });

  await t.test('stop() when not running resolves safely', async () => {
    // Arrange
    const svc = new TunnelService();

    // Act
    const status = await svc.stop();

    // Assert
    assert.equal(status.status, 'stopped');
    assert.equal(status.publicUrl, null);
  });

  await t.test('start() captures trycloudflare URL and updates running state', async () => {
    // Arrange: Mock child process with stdout emitter
    class MockProcess extends EventEmitter {
      constructor() {
        super();
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
      }
      kill() {
        this.emit('close', 0);
      }
    }

    const mockProc = new MockProcess();
    const mockSpawn = () => mockProc;
    const svc = new TunnelService({ spawnFn: mockSpawn, targetPort: 3001 });

    let statusChangeEmitted = null;
    svc.on('status_change', (s) => {
      statusChangeEmitted = s;
    });

    // Act
    const startPromise = svc.start();

    // Simulate stdout output with Cloudflare tunnel URL
    mockProc.stdout.emit('data', Buffer.from(
      '2026-11-03 INF | Your quick Tunnel has been created! Visit it at: https://swift-test-tunnel.trycloudflare.com |'
    ));

    const result = await startPromise;

    // Assert
    assert.equal(result.status, 'running');
    assert.equal(result.publicUrl, 'https://swift-test-tunnel.trycloudflare.com');
    assert.ok(result.startedAt);
    assert.ok(statusChangeEmitted);
    assert.equal(statusChangeEmitted.status, 'running');
  });

  await t.test('start() handles process error event', async () => {
    // Arrange
    class MockProcess extends EventEmitter {
      constructor() {
        super();
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
      }
      kill() {}
    }

    const mockProc = new MockProcess();
    const mockSpawn = () => mockProc;
    const svc = new TunnelService({ spawnFn: mockSpawn });

    // Act
    const startPromise = svc.start();
    mockProc.emit('error', new Error('cloudflared executable not found'));

    // Assert
    await assert.rejects(startPromise, /cloudflared executable not found/);
    const status = svc.getStatus();
    assert.equal(status.status, 'error');
    assert.equal(status.errorMessage, 'cloudflared executable not found');
  });

  await t.test('start() when already running returns existing status immediately', async () => {
    // Arrange
    const svc = new TunnelService();
    svc.status = 'running';
    svc.publicUrl = 'https://existing-tunnel.trycloudflare.com';

    // Act
    const result = await svc.start();

    // Assert
    assert.equal(result.status, 'running');
    assert.equal(result.publicUrl, 'https://existing-tunnel.trycloudflare.com');
  });

  await t.test('start() when starting returns active pending promise for concurrent calls', async () => {
    // Arrange
    class MockProcess extends EventEmitter {
      constructor() {
        super();
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
      }
      kill() {}
    }

    const mockProc = new MockProcess();
    const svc = new TunnelService({ spawnFn: () => mockProc });

    // Act
    const call1 = svc.start();
    const call2 = svc.start();

    // Verify both are awaiting the same operation
    assert.equal(call1, call2);

    mockProc.stdout.emit('data', Buffer.from('https://concurrent.trycloudflare.com'));
    const [res1, res2] = await Promise.all([call1, call2]);

    // Assert
    assert.equal(res1.publicUrl, 'https://concurrent.trycloudflare.com');
    assert.equal(res2.publicUrl, 'https://concurrent.trycloudflare.com');
  });

  await t.test('stop() kills running process and transitions to stopped', async () => {
    // Arrange
    let killed = false;
    class MockProcess extends EventEmitter {
      constructor() {
        super();
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
      }
      kill() {
        killed = true;
      }
    }

    const svc = new TunnelService();
    svc.status = 'running';
    svc.publicUrl = 'https://existing-tunnel.trycloudflare.com';
    svc.process = new MockProcess();

    // Act
    const result = await svc.stop();

    // Assert
    assert.equal(killed, true);
    assert.equal(result.status, 'stopped');
    assert.equal(result.publicUrl, null);
  });

  await t.test('stop() cancels active initialization timer', async () => {
    // Arrange
    class MockProcess extends EventEmitter {
      constructor() {
        super();
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
      }
      kill() {}
    }

    const svc = new TunnelService({ spawnFn: () => new MockProcess() });
    const startPromise = svc.start();
    assert.ok(svc.startTimeout);

    // Act
    await svc.stop();

    // Assert
    assert.equal(svc.startTimeout, null);
    assert.equal(svc.status, 'stopped');
  });

  await t.test('spawns cloudflared with --no-tls-verify for https target without shell', async () => {
    // Arrange
    let capturedCmd = null;
    let capturedArgs = null;
    let capturedOpts = null;

    class MockProcess extends EventEmitter {
      constructor() {
        super();
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
      }
      kill() {}
    }

    const mockSpawn = (cmd, args, opts) => {
      capturedCmd = cmd;
      capturedArgs = args;
      capturedOpts = opts;
      return new MockProcess();
    };

    const svc = new TunnelService({
      spawnFn: mockSpawn,
      targetUrl: 'https://localhost:8443'
    });

    // Act
    const startPromise = svc.start();
    await svc.stop();

    // Assert
    assert.equal(capturedCmd, 'cloudflared');
    assert.deepEqual(capturedArgs, ['tunnel', '--url', 'https://localhost:8443', '--no-tls-verify']);
    assert.equal(capturedOpts.shell, undefined);
  });

  await t.test('rejects customTargetUrl with invalid protocol', async () => {
    // Arrange
    const svc = new TunnelService();

    // Act & Assert
    await assert.rejects(
      svc.start('ftp://evil.com'),
      /Invalid URL protocol/
    );
  });

  await t.test('rejects immediately when process closes before establishing URL', async () => {
    // Arrange
    class MockProcess extends EventEmitter {
      constructor() {
        super();
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
      }
      kill() {}
    }

    const mockProc = new MockProcess();
    const svc = new TunnelService({ spawnFn: () => mockProc });

    // Act
    const startPromise = svc.start();
    mockProc.emit('close', 1);

    // Assert
    await assert.rejects(startPromise, /cloudflared exited before establishing tunnel/);
    assert.equal(svc.status, 'error');
  });
});
