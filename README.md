# Jitsi Dashboard 🎥

[![CI](https://github.com/higherkey/jitsi-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/higherkey/jitsi-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20-green.svg)](https://nodejs.org/)
[![Zero Runtime Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A lightweight, zero-dependency, open-source Web Dashboard and Lifecycle Controller for [Jitsi Meet](https://jitsi.org/) Docker environments with integrated administrative security and telemetry.

---

## Features

- 🟢 **Live Telemetry & Status:** Probes local HTTPS endpoints and container states in real time.
- 🔒 **Security Hardening (`/security-and-hardening-slim`):**
  - Timing-safe password comparison (`crypto.timingSafeEqual`) and PBKDF2 hashing.
  - Signed, `HttpOnly`, `SameSite=Strict` session cookies.
  - Sliding-window IP rate limiting (brute-force defense returning RFC 7807 `429 Too Many Requests`).
- 💾 **Universal Storage Adapter:** Defaults to Node 24 native `node:sqlite` out of the box (zero configuration, zero cold starts), with instant drop-in support for **Neon Postgres** via `DATABASE_URL`.
- ⏯️ **Full Fleet & Individual Controls:** Start, stop, or restart the entire Jitsi stack, or target individual microservices (`web`, `prosody`, `jicofo`, `jvb`).
- 🌐 **Tailscale Integration:** Access the dashboard over a private, encrypted Tailscale WireGuard mesh with zero public attack surface.
- 📊 **Observability & Grafana Support:** Pre-configured to co-exist harmoniously with Jitsi's bundled Prometheus and Grafana stack on port 3000.
- 🎨 **Modular UI Architecture:** Accessible, semantic HTML5, fluid responsive breakpoints, strict zero inline styles, zero `!important`, and Cumulative Layout Shift (CLS) prevention.

---

## Quickstart

### 1. Prerequisites
- [Node.js](https://nodejs.org/) >= 20.0.0 (Node 22+ recommended for native `node:sqlite`)
- Docker and Docker Compose running your Jitsi Meet stack

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
👉 **http://localhost:3001**

Default credentials:
- **Password**: `admin` (Configure via `ADMIN_PASSWORD` in your environment or `.env`)

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port for the dashboard interface. |
| `HOST` | `0.0.0.0` | Host interface to bind to. |
| `ADMIN_PASSWORD` | `admin` | Master password for dashboard administrative actions. |
| `DATABASE_URL` | *null* | Optional Neon / Postgres connection string. If omitted, uses local `node:sqlite`. |
| `JITSI_DIR` | `../../` | Path to the directory containing your Jitsi `docker-compose.yml`. |
| `HTTPS_URL` | `https://localhost:8443` | The meeting endpoint to probe for health telemetry. |
| `GRAFANA_URL` | `http://localhost:3000` | URL to open the Grafana monitoring console. |

---

## Cloud & WAN Guides

- [Oracle Cloud "Always Free" Deployment Guide](docs/cloud-hosting-guide.md)
- [Tailscale Private Mesh Remote Access Setup](scripts/start-tailscale.ps1)

---

## License

[MIT License](LICENSE) © 2026 higherkey
