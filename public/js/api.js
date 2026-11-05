// API Client Layer
const api = {
  async getStatus() {
    const res = await fetch('/api/v1/status');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async startServices(serviceName = null) {
    const url = serviceName ? `/api/v1/services/${serviceName}/start` : '/api/v1/services/start';
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async stopServices(serviceName = null) {
    const url = serviceName ? `/api/v1/services/${serviceName}/stop` : '/api/v1/services/stop';
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async restartServices(serviceName = null) {
    const url = serviceName ? `/api/v1/services/${serviceName}/restart` : '/api/v1/services/restart';
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getLogs(serviceName = '', tail = 100) {
    const query = new URLSearchParams();
    if (serviceName) query.set('service', serviceName);
    query.set('tail', tail);

    const res = await fetch(`/api/v1/logs?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getTunnelStatus() {
    const res = await fetch('/api/v1/tunnel/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getVitals() {
    const res = await fetch('/api/v1/vitals');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async startTunnel(targetUrl = null) {
    const payload = targetUrl ? { targetUrl } : {};
    const res = await fetch('/api/v1/tunnel/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async stopTunnel() {
    const res = await fetch('/api/v1/tunnel/stop', { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
};
