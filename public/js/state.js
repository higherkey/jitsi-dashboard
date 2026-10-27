// Finite State Machine & Store
class DashboardState {
  constructor() {
    this.status = 'offline'; // 'online' | 'partial' | 'offline' | 'busy' | 'error'
    this.containers = [];
    this.httpsHealthy = false;
    this.latencyMs = 0;
    this.jitsiUrl = 'https://localhost:8443';
    this.listeners = new Set();
  }

  update(data) {
    if (data.state) this.status = data.state;
    if (data.containers) this.containers = data.containers;
    if (typeof data.httpsHealthy === 'boolean') this.httpsHealthy = data.httpsHealthy;
    if (typeof data.latencyMs === 'number') this.latencyMs = data.latencyMs;
    if (data.jitsiUrl) this.jitsiUrl = data.jitsiUrl;
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
