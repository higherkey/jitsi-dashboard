# Jitsi Dashboard

[![CI](https://github.com/higherkey/jitsi-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/higherkey/jitsi-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D22.5.0-green.svg)](https://nodejs.org/)
[![Zero Runtime Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A lightweight, zero-dependency, open-source web dashboard, lifecycle manager, and telemetry controller for [Jitsi Meet](https://jitsi.org/) Docker environments with integrated administrative security and pre-flight vitals diagnostics.

---

## Features

- **Live Telemetry and Health Probing:** Real-time HTTPS endpoint ping probing, latency calculation, and container status monitoring.
- **Pre-Flight System Vitals:** Automatic validation of Docker engine reachability, Jitsi directory structure, and compose configuration files with aggregated readiness assessment.
- **Security Hardening:**
  - PBKDF2 password hashing with timing-safe comparison (`crypto.timingSafeEqual`).
  - Cryptographically signed, `HttpOnly`, `SameSite=Strict` session cookies.
  - Sliding-window IP rate limiting returning RFC 7807 Problem Details (`429 Too Many Requests`).
  - Automatic redaction of passwords and sensitive tokens in logs and payloads.
- **Zero-Dependency Native Storage:** Embedded session storage and audit logging powered by Node's built-in `node:sqlite` (`DatabaseSync`), requiring zero external database setup and zero cold starts.
- **Lifecycle Controls:** Start, stop, or restart the entire Jitsi compose fleet, or control individual microservices (`web`, `prosody`, `jicofo`, `jvb`).
- **Remote Access and Tunneling:** Built-in Cloudflare Tunnel integration (`cloudflared`) for instant public sharing, plus Tailscale wireguard mesh compatibility for secure private WAN management.
- **Observability and Monitoring:** Pre-configured for side-by-side operation with Jitsi's bundled Prometheus and Grafana stack on port 3000.
- **Modular Frontend Architecture:** Semantic HTML5, accessible interactions, responsive CSS design tokens, zero inline styles, and zero `!important`.

---

## Quickstart

### 1. Prerequisites
- [Node.js](https://nodejs.org/) >= 22.5.0 (required for native `node:sqlite`)
- Docker and Docker Compose running your Jitsi Meet stack
- Optional: [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) for public tunnel sharing

### 2. Installation
```bash
git clone https://github.com/higherkey/jitsi-dashboard.git
cd jitsi-dashboard
```

### 3. Launching
```bash
# Start on default port 3001 (leaves port 3000 free for Grafana)
npm start
```

Open your browser to:
**http://localhost:3001**

Default credentials:
- **Password**: `admin` (Configure via `ADMIN_PASSWORD` in your environment or `.env`)

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port for the dashboard interface. |
| `HOST` | `0.0.0.0` | Host interface to bind to. |
| `ADMIN_PASSWORD` | `admin` | Master password for dashboard administrative actions. |
| `SESSION_SECRET` | `jitsi_dashboard_default_secret_key_123` | Secret key used for signing session cookies. |
| `JITSI_DIR` | `../../` | Path to the directory containing your Jitsi `docker-compose.yml`. |
| `HTTPS_URL` | `https://localhost:8443` | The meeting endpoint to probe for health telemetry. |
| `GRAFANA_URL` | `http://localhost:3000` | URL to open the Grafana monitoring console. |
| `POLL_INTERVAL` | `5000` | Health and status polling interval in milliseconds. |
| `DEFAULT_ROOM_NAME` | `jitsi-meeting` | Default room name populated in meeting quick-links. |
| `AUTO_START_TUNNEL` | `false` | Automatically initialize Cloudflare tunnel on startup (`true` / `false`). |
| `DATABASE_URL` | *null* | Optional connection string placeholder. Defaults to embedded `node:sqlite` in `./data/dashboard.db`. |

---

## Cloud and WAN Guides

- [Oracle Cloud "Always Free" Deployment Guide](docs/cloud-hosting-guide.md)
- [Remote Management via Tailscale](docs/cloud-hosting-guide.md#3-remote-management-via-tailscale)

---

## License

[MIT License](LICENSE) - Copyright (c) 2026 eight1five design
