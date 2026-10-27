const http = require('http');
const https = require('https');
const { URL } = require('url');

function probeEndpoint(targetUrl, timeoutMs = 2000) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch (err) {
      return resolve({
        healthy: false,
        statusCode: 0,
        latencyMs: 0,
        error: `Invalid URL: ${err.message}`
      });
    }

    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;
    const startTime = Date.now();

    const options = {
      method: 'GET',
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname || '/',
      timeout: timeoutMs,
      rejectUnauthorized: false // Local self-signed SSL support
    };

    const req = client.request(options, (res) => {
      const latencyMs = Date.now() - startTime;
      const isOk = res.statusCode >= 200 && res.statusCode < 400;
      res.resume(); // Drain stream to release socket
      resolve({
        healthy: isOk,
        statusCode: res.statusCode,
        latencyMs,
        error: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        healthy: false,
        statusCode: 0,
        latencyMs: Date.now() - startTime,
        error: 'Connection timed out'
      });
    });

    req.on('error', (err) => {
      resolve({
        healthy: false,
        statusCode: 0,
        latencyMs: Date.now() - startTime,
        error: err.code || err.message
      });
    });

    req.end();
  });
}

module.exports = {
  probeEndpoint
};
