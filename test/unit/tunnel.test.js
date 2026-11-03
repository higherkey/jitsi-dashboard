const test = require('node:test');
const assert = require('node:assert/strict');
const { TunnelService } = require('../../src/services/tunnel');

test('Tunnel Service Unit Tests', async (t) => {
  await t.test('initializes with default stopped state', () => {
    const svc = new TunnelService({ targetPort: 3001 });
    const status = svc.getStatus();
    assert.equal(status.status, 'stopped');
    assert.equal(status.publicUrl, null);
    assert.equal(status.targetUrl, 'http://localhost:3001');
  });

  await t.test('stop() when not running resolves safely', async () => {
    const svc = new TunnelService();
    const status = await svc.stop();
    assert.equal(status.status, 'stopped');
  });
});
