const http = require('http');
const { URL } = require('url');
const config = require('./config');
const dockerService = require('./services/docker');
const { probeEndpoint } = require('./services/health');
const { eventBroker } = require('./services/events');
const { formatProblemDetails } = require('./utils/rfc7807');
const { sanitizeSecrets } = require('./utils/sanitizer');
const { serveStatic } = require('./routes/static');

async function handleStatus(req, res) {
  try {
    const containers = await dockerService.getContainers();
    const health = await probeEndpoint(config.HTTPS_URL, 3000);

    const isAnyRunning = containers.some(c => c.state === 'running');
    const isAllRunning = containers.length >= 4 && containers.every(c => c.state === 'running');

    let overallState = 'offline';
    if (isAllRunning && health.healthy) {
      overallState = 'online';
    } else if (isAnyRunning) {
      overallState = 'partial';
    }

    const payload = sanitizeSecrets({
      state: overallState,
      isAllRunning,
      isAnyRunning,
      httpsHealthy: health.healthy,
      httpsStatus: health.statusCode,
      latencyMs: health.latencyMs,
      jitsiUrl: config.HTTPS_URL,
      containers,
      timestamp: new Date().toISOString()
    });

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(payload));
  } catch (err) {
    const problem = formatProblemDetails({
      status: 500,
      detail: err.message,
      instance: '/api/v1/status'
    });
    res.writeHead(500, { 'Content-Type': 'application/problem+json' });
    res.end(JSON.stringify(problem));
  }
}

async function handleAction(req, res, action, serviceName = null) {
  if (serviceName && !dockerService.validateServiceName(serviceName)) {
    const problem = formatProblemDetails({
      status: 400,
      title: 'Invalid Service Name',
      detail: `Service "${serviceName}" is not an allowed service.`,
      instance: req.url
    });
    res.writeHead(400, { 'Content-Type': 'application/problem+json' });
    return res.end(JSON.stringify(problem));
  }

  try {
    let result;
    if (action === 'start') {
      result = await dockerService.startServices(serviceName);
    } else if (action === 'stop') {
      result = await dockerService.stopServices(serviceName);
    } else if (action === 'restart') {
      result = await dockerService.restartServices(serviceName);
    }

    // Broadcast state change to connected SSE listeners if any
    if (eventBroker.clientCount() > 0) {
      setTimeout(async () => {
        try {
          const containers = await dockerService.getContainers();
          eventBroker.broadcast('status_update', { containers });
        } catch {}
      }, 1500).unref();
    }

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(sanitizeSecrets(result)));
  } catch (err) {
    const problem = formatProblemDetails({
      status: 500,
      detail: err.message,
      instance: req.url
    });
    res.writeHead(500, { 'Content-Type': 'application/problem+json' });
    res.end(JSON.stringify(problem));
  }
}

async function handleLogs(req, res, parsedUrl) {
  const service = parsedUrl.searchParams.get('service');
  const tail = parsedUrl.searchParams.get('tail') || '100';

  if (service && !dockerService.validateServiceName(service)) {
    const problem = formatProblemDetails({
      status: 400,
      title: 'Invalid Service Parameter',
      detail: `Service "${service}" is not recognized.`,
      instance: parsedUrl.pathname
    });
    res.writeHead(400, { 'Content-Type': 'application/problem+json' });
    return res.end(JSON.stringify(problem));
  }

  try {
    const result = await dockerService.getLogs(service, tail);
    const sanitized = sanitizeSecrets({
      service: service || 'all',
      tail: dockerService.validateTailCount(tail),
      logs: result.stdout || result.stderr || ''
    });

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(JSON.stringify(sanitized));
  } catch (err) {
    const problem = formatProblemDetails({
      status: 500,
      detail: err.message,
      instance: parsedUrl.pathname
    });
    res.writeHead(500, { 'Content-Type': 'application/problem+json' });
    res.end(JSON.stringify(problem));
  }
}

function handleEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(': connected\n\n');
  eventBroker.addClient(res);
}

function createServer() {
  return http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // API Routes
    if (pathname === '/api/v1/status' && req.method === 'GET') {
      return handleStatus(req, res);
    }

    if (pathname === '/api/v1/services/start' && req.method === 'POST') {
      return handleAction(req, res, 'start');
    }

    if (pathname === '/api/v1/services/stop' && req.method === 'POST') {
      return handleAction(req, res, 'stop');
    }

    if (pathname === '/api/v1/services/restart' && req.method === 'POST') {
      return handleAction(req, res, 'restart');
    }

    const singleRestartMatch = pathname.match(/^\/api\/v1\/services\/([a-zA-Z0-9_-]+)\/restart$/);
    if (singleRestartMatch && req.method === 'POST') {
      const serviceName = singleRestartMatch[1];
      return handleAction(req, res, 'restart', serviceName);
    }

    if (pathname === '/api/v1/logs' && req.method === 'GET') {
      return handleLogs(req, res, parsedUrl);
    }

    if (pathname === '/api/v1/events' && req.method === 'GET') {
      return handleEvents(req, res);
    }

    // Static Assets
    const handled = serveStatic(req, res, pathname);
    if (handled) return;

    // 404 Fallback
    const problem = formatProblemDetails({
      status: 404,
      detail: `Path ${pathname} not found`,
      instance: pathname
    });
    res.writeHead(404, { 'Content-Type': 'application/problem+json' });
    res.end(JSON.stringify(problem));
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(config.PORT, config.HOST, () => {
    console.log(`Jitsi Deck Control Center running at http://${config.HOST}:${config.PORT}`);
  });
}

module.exports = {
  createServer
};
