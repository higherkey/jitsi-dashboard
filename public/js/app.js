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
    openJitsiLink: document.getElementById('open-jitsi-link'),
    btnLoginToggle: document.getElementById('btn-login-toggle'),
    authModal: document.getElementById('auth-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    loginForm: document.getElementById('login-form'),
    adminPasswordInput: document.getElementById('admin-password'),
    authErrorBanner: document.getElementById('auth-error-banner'),
    openGrafanaLink: document.getElementById('open-grafana-link'),
    tunnelBadge: document.getElementById('tunnel-badge'),
    btnToggleTunnel: document.getElementById('btn-toggle-tunnel'),
    tunnelBtnIcon: document.getElementById('tunnel-btn-icon'),
    tunnelBtnLabel: document.getElementById('tunnel-btn-label'),
    inputLocalLink: document.getElementById('input-local-link'),
    btnCopyLocal: document.getElementById('btn-copy-local'),
    inputPublicLink: document.getElementById('input-public-link'),
    btnCopyPublic: document.getElementById('btn-copy-public'),
    tunnelStatusHint: document.getElementById('tunnel-status-hint'),
    inputMeetingRoom: document.getElementById('input-meeting-room'),
    btnUpdateRoom: document.getElementById('btn-update-room'),
    readinessChip: document.getElementById('readiness-chip'),
    vitalDockerBadge: document.getElementById('vital-docker-badge'),
    vitalDockerDetail: document.getElementById('vital-docker-detail'),
    vitalEnvBadge: document.getElementById('vital-env-badge'),
    vitalEnvDetail: document.getElementById('vital-env-detail'),
    vitalReadinessState: document.getElementById('vital-readiness-state'),
    vitalReadinessAdvice: document.getElementById('vital-readiness-advice')
  };

  let eventSource = null;
  let currentUser = null;

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

    // 5. Button States & Vitals Readiness
    const isBusy = s.status === 'busy';
    const vitals = s.vitals || {};
    const readiness = vitals.readiness || { readyToStart: true, status: 'ready', reason: '' };

    const canStart = !isBusy && s.status !== 'online' && (readiness.readyToStart || s.status === 'partial');
    elements.btnStart.disabled = !canStart;
    if (!canStart && !isBusy && s.status !== 'online' && !readiness.readyToStart) {
      elements.btnStart.title = readiness.reason || 'Stack cannot be started';
    } else {
      elements.btnStart.removeAttribute('title');
    }
    elements.btnStop.disabled = isBusy || s.status === 'offline';
    elements.btnRestart.disabled = isBusy || (!readiness.readyToStart && s.status === 'offline');

    // 6. System Vitals & Pre-Flight Checks Render
    if (elements.readinessChip) {
      elements.readinessChip.className = 'status-badge';
      if (readiness.status === 'running') {
        elements.readinessChip.classList.add('badge-online');
        elements.readinessChip.textContent = 'STACK ACTIVE';
      } else if (readiness.status === 'ready') {
        elements.readinessChip.classList.add('badge-online');
        elements.readinessChip.textContent = 'READY TO LAUNCH';
      } else if (readiness.status === 'partial') {
        elements.readinessChip.classList.add('badge-partial');
        elements.readinessChip.textContent = 'PARTIAL RUNNING';
      } else {
        elements.readinessChip.classList.add('badge-offline');
        elements.readinessChip.textContent = 'START BLOCKED';
      }
    }

    if (elements.vitalDockerBadge && vitals.docker) {
      elements.vitalDockerBadge.className = 'status-badge';
      if (vitals.docker.available) {
        elements.vitalDockerBadge.classList.add('badge-online');
        elements.vitalDockerBadge.textContent = 'ONLINE';
        elements.vitalDockerDetail.textContent = `Docker Engine v${vitals.docker.version || 'active'} (Daemon responsive)`;
      } else {
        elements.vitalDockerBadge.classList.add('badge-offline');
        elements.vitalDockerBadge.textContent = 'OFFLINE';
        elements.vitalDockerDetail.textContent = vitals.docker.error || 'Docker daemon is not running. Launch Docker Desktop.';
      }
    }

    if (elements.vitalEnvBadge && vitals.jitsiEnv) {
      elements.vitalEnvBadge.className = 'status-badge';
      if (vitals.jitsiEnv.configured) {
        elements.vitalEnvBadge.classList.add('badge-online');
        elements.vitalEnvBadge.textContent = 'CONFIGURED';
        elements.vitalEnvDetail.textContent = `Compose & .env verified in ${vitals.jitsiEnv.path || 'target dir'}`;
      } else {
        elements.vitalEnvBadge.classList.add('badge-offline');
        elements.vitalEnvBadge.textContent = 'INCOMPLETE';
        elements.vitalEnvDetail.textContent = vitals.jitsiEnv.error || 'Jitsi environment files are incomplete.';
      }
    }

    if (elements.vitalReadinessState) {
      elements.vitalReadinessState.className = 'status-badge';
      if (readiness.status === 'ready') {
        elements.vitalReadinessState.classList.add('badge-online');
        elements.vitalReadinessState.textContent = 'READY';
      } else if (readiness.status === 'running') {
        elements.vitalReadinessState.classList.add('badge-online');
        elements.vitalReadinessState.textContent = 'ACTIVE';
      } else {
        elements.vitalReadinessState.classList.add('badge-offline');
        elements.vitalReadinessState.textContent = 'BLOCKED';
      }
      elements.vitalReadinessAdvice.textContent = readiness.reason || 'System is ready.';
    }

    // 7. Invite & Network Links
    const currentRoom = elements.inputMeetingRoom.value.trim() || s.defaultRoomName || 'jitsi-meeting';
    if (s.network && s.network.primaryIp) {
      const localBase = `http://${s.network.primaryIp}:${s.network.port}`;
      elements.inputLocalLink.value = `${localBase} (Room: ${currentRoom})`;
    }

    // Tunnel UI state
    const tunnel = s.tunnel || { status: 'stopped' };
    elements.tunnelBadge.className = 'status-badge';
    if (tunnel.status === 'running') {
      elements.tunnelBadge.classList.add('badge-online');
      elements.tunnelBadge.textContent = 'TUNNEL: ACTIVE';
      elements.tunnelBtnLabel.textContent = 'Stop Public Link';
      elements.tunnelBtnIcon.textContent = '⏹';
      elements.inputPublicLink.value = `${tunnel.publicUrl} (Room: ${currentRoom})`;
      elements.btnCopyPublic.disabled = false;
      elements.tunnelStatusHint.textContent = `Public link online. Share with friends anywhere in the world!`;
    } else if (tunnel.status === 'starting') {
      elements.tunnelBadge.classList.add('badge-partial');
      elements.tunnelBadge.textContent = 'TUNNEL: STARTING...';
      elements.tunnelBtnLabel.textContent = 'Starting...';
      elements.tunnelBtnIcon.textContent = '⏳';
      elements.inputPublicLink.value = 'Starting Cloudflare tunnel...';
      elements.btnCopyPublic.disabled = true;
      elements.tunnelStatusHint.textContent = 'Allocating secure Cloudflare edge connection...';
    } else {
      elements.tunnelBadge.classList.add('badge-offline');
      elements.tunnelBadge.textContent = 'TUNNEL: OFF';
      elements.tunnelBtnLabel.textContent = 'Enable Public Link';
      elements.tunnelBtnIcon.textContent = '🌐';
      elements.inputPublicLink.value = '';
      elements.inputPublicLink.placeholder = "Tunnel disabled (Click 'Enable Public Link')";
      elements.btnCopyPublic.disabled = true;
      elements.tunnelStatusHint.textContent = 'Accessible from anywhere on the internet without router port forwarding.';
    }
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

  async function checkAuth() {
    const authStatus = await auth.getAuthStatus();
    if (authStatus.authenticated) {
      currentUser = authStatus.user;
      elements.btnLoginToggle.innerHTML = '<span>🔓</span> Logout (Admin)';
    } else {
      currentUser = null;
      elements.btnLoginToggle.innerHTML = '<span>🔒</span> Admin Login';
    }
  }

  async function triggerStackAction(action, apiFn) {
    if (!currentUser) {
      openAuthModal();
      return;
    }
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
    if (!currentUser) {
      openAuthModal();
      return;
    }
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
      elements.logTerminal.textContent = `Log fetch info: ${err.message} (Admin authentication may be required for full logs).`;
    }
  }

  // Auth Modal Controls
  function openAuthModal() {
    elements.authErrorBanner.classList.add('banner-hidden');
    elements.authModal.classList.remove('modal-hidden');
    elements.adminPasswordInput.value = '';
    elements.adminPasswordInput.focus();
  }

  function closeAuthModal() {
    elements.authModal.classList.add('modal-hidden');
  }

  elements.btnLoginToggle.addEventListener('click', async () => {
    if (currentUser) {
      await auth.logout();
      await checkAuth();
      await refreshTelemetry();
    } else {
      openAuthModal();
    }
  });

  elements.btnCloseModal.addEventListener('click', closeAuthModal);

  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = elements.adminPasswordInput.value;
    try {
      await auth.login(password);
      closeAuthModal();
      await checkAuth();
      await refreshTelemetry();
      await fetchLogs();
    } catch (err) {
      elements.authErrorBanner.textContent = err.message;
      elements.authErrorBanner.classList.remove('banner-hidden');
    }
  });

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

  // Tunnel Controls
  async function toggleTunnel() {
    if (!currentUser) {
      openAuthModal();
      return;
    }

    const currentTunnel = state.tunnel || {};
    if (currentTunnel.status === 'running' || currentTunnel.status === 'starting') {
      try {
        await api.stopTunnel();
        await refreshTelemetry();
      } catch (err) {
        alert(`Failed to stop tunnel: ${err.message}`);
      }
    } else {
      try {
        state.update({ tunnel: { status: 'starting' } });
        await api.startTunnel();
        await refreshTelemetry();
      } catch (err) {
        alert(`Failed to start tunnel: ${err.message}`);
        await refreshTelemetry();
      }
    }
  }

  function copyToClipboard(inputElement, btnElement) {
    if (!inputElement.value) return;
    navigator.clipboard.writeText(inputElement.value).then(() => {
      const originalText = btnElement.textContent;
      btnElement.textContent = 'Copied!';
      setTimeout(() => {
        btnElement.textContent = originalText;
      }, 2000);
    }).catch(() => {
      inputElement.select();
      document.execCommand('copy');
    });
  }

  // Bind Buttons
  elements.btnStart.addEventListener('click', () => triggerStackAction('Starting', () => api.startServices()));
  elements.btnStop.addEventListener('click', () => triggerStackAction('Stopping', () => api.stopServices()));
  elements.btnRestart.addEventListener('click', () => triggerStackAction('Restarting', () => api.restartServices()));
  elements.btnRefresh.addEventListener('click', refreshTelemetry);
  elements.btnFetchLogs.addEventListener('click', fetchLogs);
  elements.selectService.addEventListener('change', fetchLogs);
  elements.btnToggleTunnel.addEventListener('click', toggleTunnel);
  elements.btnCopyLocal.addEventListener('click', () => copyToClipboard(elements.inputLocalLink, elements.btnCopyLocal));
  elements.btnCopyPublic.addEventListener('click', () => copyToClipboard(elements.inputPublicLink, elements.btnCopyPublic));
  elements.btnUpdateRoom.addEventListener('click', () => {
    state.notify();
  });

  // Teardown Hygiene
  window.addEventListener('beforeunload', () => {
    if (eventSource) eventSource.close();
  });

  // Initialization
  checkAuth();
  refreshTelemetry();
  fetchLogs();
  setupSSE();
  setInterval(refreshTelemetry, 6000);
})();
