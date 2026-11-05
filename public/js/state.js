// Finite State Machine & Store
class DashboardState {
  constructor() {
    this.status = 'offline'; // 'online' | 'partial' | 'offline' | 'busy' | 'error'
    this.containers = [];
    this.httpsHealthy = false;
    this.latencyMs = 0;
    this.jitsiUrl = 'https://localhost:8443';
    this.network = {
      primaryIp: '127.0.0.1',
      port: 3001,
      addresses: [],
      localDashboardUrl: 'http://127.0.0.1:3001',
      localMeetingUrl: 'https://localhost:8443/jitsi-meeting'
    };
    this.tunnel = {
      status: 'stopped',
      publicUrl: null,
      errorMessage: null,
      targetUrl: 'http://localhost:3001'
    };
    this.vitals = {
      docker: { available: false, version: null, error: null },
      jitsiEnv: { configured: false, error: null },
      readiness: { readyToStart: false, status: 'blocked', reason: 'Checking vitals...' }
    };
    this.defaultRoomName = 'jitsi-meeting';
    this.listeners = new Set();
  }

  update(data) {
    if (data.state) this.status = data.state;
    if (data.containers) this.containers = data.containers;
    if (typeof data.httpsHealthy === 'boolean') this.httpsHealthy = data.httpsHealthy;
    if (typeof data.latencyMs === 'number') this.latencyMs = data.latencyMs;
    if (data.jitsiUrl) this.jitsiUrl = data.jitsiUrl;
    if (data.network) this.network = data.network;
    if (data.tunnel) this.tunnel = data.tunnel;
    if (data.vitals) this.vitals = data.vitals;
    if (data.defaultRoomName) this.defaultRoomName = data.defaultRoomName;
    this.notify();
  }

  setBusy(actionName) {
    this.status = 'busy';
    this.busyAction = actionName;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  }
}

const state = new DashboardState();
