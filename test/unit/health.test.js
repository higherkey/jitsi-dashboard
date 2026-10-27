const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { probeEndpoint } = require('../../src/services/health');

describe('Health Prober Service', () => {
  it('probes a mock responsive endpoint and returns status and latency', async () => {
    // Arrange: Create a temporary mock HTTP server
    const http = require('http');
    const mockServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });

    await new Promise((resolve) => mockServer.listen(0, '127.0.0.1', resolve));
    const port = mockServer.address().port;
    const testUrl = `http://127.0.0.1:${port}`;

    try {
      // Act
      const result = await probeEndpoint(testUrl, 2000);

      // Assert
      assert.equal(result.healthy, true);
      assert.equal(result.statusCode, 200);
      assert.ok(result.latencyMs >= 0);
    } finally {
      mockServer.close();
    }
  });

  it('handles unreachable endpoints gracefully with timeout/refused status', async () => {
    // Arrange: A non-existent port
    const unreachableUrl = 'http://127.0.0.1:59999';

    // Act
    const result = await probeEndpoint(unreachableUrl, 500);

    // Assert
    assert.equal(result.healthy, false);
    assert.equal(result.statusCode, 0);
    assert.ok(result.error);
  });
});
