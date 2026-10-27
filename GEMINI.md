# Jitsi Deck Project Context & Assistant Guide

## Overview
**Jitsi Deck** is a lightweight, zero-dependency, open-source web dashboard and microservice controller for Jitsi Meet Docker environments.

## Architecture
- **Runtime:** Node.js standard library (`node:http`, `node:child_process`, `node:fs`, `node:path`, `node:test`, `node:assert`).
- **Backend (`src/`):**
  - `server.js`: HTTP request dispatching, static asset piping, SSE event subscription.
  - `config.js`: Discovery of `JITSI_DIR`, port definitions, and target HTTPS endpoints.
  - `services/docker.js`: `docker compose` execution layer with strict service allowlists (`['web', 'prosody', 'jicofo', 'jvb']`).
  - `services/health.js`: Endpoint ping probing and round-trip latency calculation.
  - `services/events.js`: EventSource / Server-Sent Events broker.
  - `utils/rfc7807.js`: Standardized problem details error formatter.
  - `utils/sanitizer.js`: Secret masking for password and token fields.
- **Frontend (`public/`):**
  - `index.html`: Accessible, semantic HTML5 structure.
  - `css/tokens.css`: Design token definitions (colors, typography, spacing).
  - `css/style.css`: Modular scoped stylesheet (zero inline styles, zero `!important`, responsive).
  - `js/api.js`: REST client communicating with `/api/v1/` endpoints.
  - `js/state.js`: Observable state store driving UI transitions.
  - `js/app.js`: Event handler binding, SSE streaming, and deterministic teardown.

## Development & Testing Commands
- **Run Tests:** `npm test`
- **Watch Tests:** `npm run test:watch`
- **Start Dashboard:** `npm start`
