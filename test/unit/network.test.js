const test = require('node:test');
const assert = require('node:assert/strict');
const { getLocalNetworkAddresses, getPrimaryLocalIp } = require('../../src/utils/network');

test('Network Discovery Utilities', async (t) => {
  await t.test('discovers non-internal IPv4 addresses', () => {
    const addresses = getLocalNetworkAddresses();
    assert.ok(Array.isArray(addresses), 'should return an array');
    for (const item of addresses) {
      assert.ok(item.name, 'item should have interface name');
      assert.match(item.address, /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, 'should be valid IPv4');
      assert.notEqual(item.address, '127.0.0.1', 'should not be loopback');
    }
  });

  await t.test('returns primary local IP address', () => {
    const ip = getPrimaryLocalIp();
    assert.match(ip, /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, 'should be valid IPv4');
  });
});
