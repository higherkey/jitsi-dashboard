// UI Controller and Lifecycle
(function () {
  const elements = {
    globalBadge: document.getElementById('global-badge'),
    metricHealth: document.getElementById('metric-health'),
    metricContainers: document.getElementById('metric-containers'),
    servicesTbody: document.getElementById('services-tbody'),
    logTerminal: document.getElementById('log-terminal'),
    selectService: document.getElementById('select-service'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnRestart: document.getElementById('btn-restart'),
    btnRefresh: document.getElementById('btn-refresh'),
    btnFetchLogs: document.getElementById('btn-fetch-logs'),
    openJitsiLink: document.getElementById('open-jitsi-link')
  };

  let eventSource = null;

  // Render State Changes
  state.subscribe((s) => {
    // 1. Global Badge
    elements.globalBadge.className = 'status-badge';
    if (s.status === 'online') {
      elements.globalBadge.classList.add('badge-online');
      elements.globalBadge.textContent = 'ONLINE';
    } else if (s.status === 'partial') {
      elements.globalBadge.classList.add('badge-partial');
      elements.globalBadge.textContent = 'PARTIAL';
    } else if (s.status === 'busy') {
      elements.globalBadge.classList.add('badge-partial');
      elements.globalBadge.textContent = `${s.busyAction.toUpperCase()}...`;
    } else {
      elements.globalBadge.classList.add('badge-offline');
      elements.globalBadge.textContent = 'OFFLINE';
    }

    // 2. Health Metric
    elements.metricHealth.textContent = '';
    const healthDot = document.createElement('span');
    healthDot.className = `status-dot ${s.httpsHealthy ? 'dot-green' : 'dot-red'}`;
    const healthText = document.createTextNode(
      s.httpsHealthy ? `200 OK (${s.latencyMs}ms)` : 'Unreachable'
    );
    elements.metricHealth.appendChild(healthDot);
    elements.metricHealth.appendChild(healthText);

    // 3. Container Count Metric
    const runningCount = s.containers.filter((c) => c.state === 'running').length;
    elements.metricContainers.textContent = `${runningCount} / ${s.containers.length || 4} Active`;

    // 4. Services Table
    elements.servicesTbody.textContent = '';
    if (s.containers.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No containers detected. Click "Start Stack" to launch Jitsi.';
      tr.appendChild(td);
      elements.servicesTbody.appendChild(tr);
    } else {
      for (const container of s.containers) {
        const tr = document.createElement('tr');

        // Service
        const tdService = document.createElement('td');
        tdService.className = 'service-name';
        tdService.textContent = container.service;
        tr.appendChild(tdService);

        // Name
        const tdName = document.createElement('td');
        tdName.textContent = container.name;
        tr.appendChild(tdName);

        // State
        const tdState = document.createElement('td');
        const dot = document.createElement('span');
        dot.className = `status-dot ${container.state === 'running' ? 'dot-green' : 'dot-red'}`;
        tdState.appendChild(dot);
        tdState.appendChild(document.createTextNode(container.state));
        tr.appendChild(tdState);

        // Status
        const tdStatus = document.createElement('td');
        tdStatus.textContent = container.status || '--';
        tr.appendChild(tdStatus);

        // Action
        const tdAction = document.createElement('td');
        const restartBtn = document.createElement('button');
        restartBtn.className = 'btn table-action-btn';
        restartBtn.type = 'button';
        restartBtn.textContent = 'Restart';
        restartBtn.addEventListener('click', () => restartSingle(container.service));
        tdAction.appendChild(restartBtn);
        tr.appendChild(tdAction);

        elements.servicesTbody.appendChild(tr);
      }
    }

    // 5. Button States
    const isBusy = s.status === 'busy';
    elements.btnStart.disabled = isBusy || s.status === 'online';
    elements.btnStop.disabled = isBusy || s.status === 'offline';
    elements.btnRestart.disabled = isBusy;
  });

  // Action Dispatchers
  async function refreshTelemetry() {
    try {
      const data = await api.getStatus();
      state.update(data);
    } catch (err) {
      console.warn('Telemetry poll warning:', err);
      state.update({ state: 'offline', httpsHealthy: false });
    }
  }

  async function triggerStackAction(action, apiFn) {
    state.setBusy(action);
    try {
      await apiFn();
      setTimeout(async () => {
        await refreshTelemetry();
        await fetchLogs();
      }, 2000);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
      await refreshTelemetry();
    }
  }

  async function restartSingle(serviceName) {
    state.setBusy(`Restarting ${serviceName}`);
    try {
      await api.restartServices(serviceName);
      setTimeout(refreshTelemetry, 1500);
    } catch (err) {
      alert(`Failed to restart ${serviceName}: ${err.message}`);
      refreshTelemetry();
    }
  }

  async function fetchLogs() {
    const service = elements.selectService.value;
    try {
      const res = await api.getLogs(service, 100);
      elements.logTerminal.textContent = res.logs || 'No logs captured.';
      elements.logTerminal.scrollTop = elements.logTerminal.scrollHeight;
    } catch (err) {
      elements.logTerminal.textContent = `Log fetch error: ${err.message}`;
    }
  }

  // Setup EventSource for SSE real-time broadcast
  function setupSSE() {
    if (eventSource) eventSource.close();
    eventSource = new EventSource('/api/v1/events');
    eventSource.addEventListener('status_update', (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.containers) state.update({ containers: payload.containers });
      } catch {}
    });
  }

  // Bind Buttons
  elements.btnStart.addEventListener('click', () => triggerStackAction('Starting', () => api.startServices()));
  elements.btnStop.addEventListener('click', () => triggerStackAction('Stopping', () => api.stopServices()));
  elements.btnRestart.addEventListener('click', () => triggerStackAction('Restarting', () => api.restartServices()));
  elements.btnRefresh.addEventListener('click', refreshTelemetry);
  elements.btnFetchLogs.addEventListener('click', fetchLogs);
  elements.selectService.addEventListener('change', fetchLogs);

  // Teardown Hygiene
  window.addEventListener('beforeunload', () => {
    if (eventSource) eventSource.close();
  });

  // Initialization
  refreshTelemetry();
  fetchLogs();
  setupSSE();
  setInterval(refreshTelemetry, 6000);
})();
