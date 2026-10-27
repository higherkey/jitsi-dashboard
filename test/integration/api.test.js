const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createServer } = require('../../src/server');

describe('Jitsi Dashboard API Integration Tests', () => {
  let server;
  let baseUrl;
  let authCookie = '';

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

  function makeRequest(path, method = 'GET', body = null, cookie = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const headers = { 'Connection': 'close' };
      if (body) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(body);
      }
      if (cookie) {
        headers['Cookie'] = cookie;
      }

      const req = http.request(url, { method, headers }, (res) => {
        let resBody = '';
        res.on('data', chunk => resBody += chunk);
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(resBody); } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body: resBody, json });
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  it('GET /api/v1/status returns 200 with structured status payload', async () => {
    const res = await makeRequest('/api/v1/status');
    assert.equal(res.status, 200);
    assert.ok(res.json);
    assert.ok('state' in res.json);
    assert.ok('isAllRunning' in res.json);
    assert.ok(Array.isArray(res.json.containers));
  });

  it('rejects unauthenticated mutating action with RFC 7807 401 Unauthorized', async () => {
    const res = await makeRequest('/api/v1/services/restart', 'POST');
    assert.equal(res.status, 401);
    assert.ok(res.json);
    assert.equal(res.json.status, 401);
    assert.equal(res.json.title, 'Unauthorized');
  });

  it('authenticates admin password via POST /api/v1/auth/login and sets session cookie', async () => {
    const loginPayload = JSON.stringify({ password: 'admin' });
    const res = await makeRequest('/api/v1/auth/login', 'POST', loginPayload);

    assert.equal(res.status, 200);
    assert.ok(res.json.success);
    const setCookie = res.headers['set-cookie'];
    assert.ok(setCookie);
    assert.ok(setCookie[0].includes('jitsi_session='));
    authCookie = setCookie[0].split(';')[0];
  });

  it('rejects invalid password with 401', async () => {
    const loginPayload = JSON.stringify({ password: 'wrong_password' });
    const res = await makeRequest('/api/v1/auth/login', 'POST', loginPayload);

    assert.equal(res.status, 401);
    assert.equal(res.json.title, 'Authentication Failed');
  });

  it('allows authenticated admin to request action endpoint', async () => {
    // With authCookie, the endpoint should pass auth guard and validate service name
    const res = await makeRequest('/api/v1/services/web/restart', 'POST', null, authCookie);
    // Should be 200 (if docker runs) or 500 if docker error, but NOT 401!
    assert.notEqual(res.status, 401);
  });
});
