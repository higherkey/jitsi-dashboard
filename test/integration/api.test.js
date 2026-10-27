const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createServer } = require('../../src/server');

describe('Jitsi Deck API Integration Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    server.closeAllConnections?.();
    await new Promise((resolve) => server.close(resolve));
  });

  function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, { method, headers: { 'Connection': 'close' } }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(body); } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body, json });
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  it('GET /api/v1/status returns 200 with structured status payload', async () => {
    // Act
    const res = await makeRequest('/api/v1/status');

    // Assert
    assert.equal(res.status, 200);
    assert.ok(res.json);
    assert.ok('state' in res.json);
    assert.ok('isAllRunning' in res.json);
    assert.ok(Array.isArray(res.json.containers));
  });

  it('GET /api/v1/logs validates invalid service names with RFC 7807 400 error', async () => {
    // Act
    const res = await makeRequest('/api/v1/logs?service=malicious;echo%20hacked');

    // Assert
    assert.equal(res.status, 400);
    assert.ok(res.json);
    assert.equal(res.json.status, 400);
    assert.equal(res.json.title, 'Invalid Service Parameter');
  });

  it('POST /api/v1/services/restart validates invalid service name with RFC 7807 400 error', async () => {
    // Act
    const res = await makeRequest('/api/v1/services/invalid_service/restart', 'POST');

    // Assert
    assert.equal(res.status, 400);
    assert.ok(res.json);
    assert.equal(res.json.title, 'Invalid Service Name');
  });

  it('GET non-existent endpoint returns RFC 7807 404 error', async () => {
    // Act
    const res = await makeRequest('/api/v1/nonexistent');

    // Assert
    assert.equal(res.status, 404);
    assert.ok(res.json);
    assert.equal(res.json.status, 404);
    assert.equal(res.json.title, 'Not Found');
  });
});
