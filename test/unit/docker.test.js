const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseComposePs, validateServiceName, validateTailCount, ALLOWED_SERVICES } = require('../../src/services/docker');

describe('Docker Compose Service', () => {
  it('parses docker compose ps json lines correctly', () => {
    // Arrange
    const sampleOutput = `{"Name":"jitsi-meet-web-1","Service":"web","State":"running","Status":"Up 2 hours","Health":"healthy"}
{"Name":"jitsi-meet-prosody-1","Service":"prosody","State":"running","Status":"Up 2 hours","Health":""}
{"Name":"jitsi-meet-jicofo-1","Service":"jicofo","State":"running","Status":"Up 2 hours","Health":""}
{"Name":"jitsi-meet-jvb-1","Service":"jvb","State":"running","Status":"Up 2 hours","Health":""}`;

    // Act
    const containers = parseComposePs(sampleOutput);

    // Assert
    assert.equal(containers.length, 4);
    assert.equal(containers[0].name, 'jitsi-meet-web-1');
    assert.equal(containers[0].service, 'web');
    assert.equal(containers[0].state, 'running');
    assert.equal(containers[0].status, 'Up 2 hours');
    assert.equal(containers[0].health, 'healthy');
  });

  it('handles empty or malformed ps output gracefully', () => {
    // Arrange & Act
    const empty = parseComposePs('');
    const malformed = parseComposePs('not json at all');

    // Assert
    assert.deepEqual(empty, []);
    assert.deepEqual(malformed, []);
  });

  it('validates allowed service names against strict allowlist', () => {
    // Assert
    assert.equal(validateServiceName('web'), true);
    assert.equal(validateServiceName('prosody'), true);
    assert.equal(validateServiceName('jicofo'), true);
    assert.equal(validateServiceName('jvb'), true);
    assert.equal(validateServiceName(''), true); // empty means all services
    assert.equal(validateServiceName('malicious; rm -rf /'), false);
    assert.equal(validateServiceName('unknown_service'), false);
  });

  it('validates and clamps tail counts to positive bounded integers', () => {
    // Assert
    assert.equal(validateTailCount('100'), 100);
    assert.equal(validateTailCount('50'), 50);
    assert.equal(validateTailCount('1000'), 500); // capped at 500
    assert.equal(validateTailCount('-5'), 100);   // fallback default
    assert.equal(validateTailCount('invalid'), 100);
  });
});
