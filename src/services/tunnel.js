const { spawn } = require('child_process');
const EventEmitter = require('events');
const config = require('../config');

class TunnelService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.targetPort = options.targetPort || null;
    this.targetUrl = options.targetUrl || (options.targetPort ? `http://localhost:${options.targetPort}` : (config.TUNNEL_TARGET_URL || config.HTTPS_URL));
    this.spawnFn = options.spawnFn || spawn;
    this.process = null;
    this.publicUrl = null;
    this.status = 'stopped'; // 'stopped' | 'starting' | 'running' | 'error'
    this.errorMessage = null;
    this.startedAt = null;
    this.startTimeout = null;
    this.pendingStart = null;
  }

  getStatus() {
    return {
      status: this.status,
      publicUrl: this.publicUrl,
      errorMessage: this.errorMessage,
      targetUrl: this.targetUrl,
      startedAt: this.startedAt
    };
  }

  start(customTargetUrl = null) {
    if (this.status === 'running') {
      return Promise.resolve(this.getStatus());
    }

    if (this.status === 'starting' && this.pendingStart) {
      return this.pendingStart;
    }

    if (customTargetUrl) {
      try {
        const parsed = new URL(customTargetUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return Promise.reject(new Error('Invalid URL protocol: targetUrl must start with http: or https:'));
        }
      } catch (err) {
        return Promise.reject(new Error('Invalid targetUrl: must be a well-formed URL'));
      }
      this.targetUrl = customTargetUrl;
    }

    this.status = 'starting';
    this.errorMessage = null;
    this.publicUrl = null;
    this.startedAt = new Date().toISOString();
    this.emit('status_change', this.getStatus());

    this.pendingStart = new Promise((resolve, reject) => {
      let resolved = false;

      const clearTimer = () => {
        if (this.startTimeout) {
          clearTimeout(this.startTimeout);
          this.startTimeout = null;
        }
      };

      this.startTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.startTimeout = null;
          if (this.process) {
            try { this.process.kill(); } catch {}
            this.process = null;
          }
          if (this.publicUrl) {
            resolve(this.getStatus());
          } else {
            this.status = 'error';
            this.errorMessage = 'Tunnel initialization timed out';
            this.emit('status_change', this.getStatus());
            reject(new Error(this.errorMessage));
          }
        }
      }, 15000);

      try {
        const args = ['tunnel', '--url', this.targetUrl];
        if (this.targetUrl.startsWith('https://')) {
          args.push('--no-tls-verify');
        }

        // Spawn cloudflared directly without a shell interpreter to prevent injection
        this.process = this.spawnFn('cloudflared', args, {
          windowsHide: true
        });

        const handleData = (chunk) => {
          const text = chunk.toString();
          // Regex to capture trycloudflare.com URL from output:
          // e.g. "https://xxxx-xxxx.trycloudflare.com"
          const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
          if (match && !this.publicUrl) {
            this.publicUrl = match[0];
            this.status = 'running';
            clearTimer();
            this.emit('status_change', this.getStatus());
            if (!resolved) {
              resolved = true;
              resolve(this.getStatus());
            }
          }
        };

        this.process.stdout.on('data', handleData);
        this.process.stderr.on('data', handleData);

        this.process.on('error', (err) => {
          clearTimer();
          this.status = 'error';
          this.errorMessage = err.message;
          this.emit('status_change', this.getStatus());
          if (!resolved) {
            resolved = true;
            reject(err);
          }
        });

        this.process.on('close', (code) => {
          clearTimer();
          this.process = null;
          if (this.status !== 'error') {
            this.status = (code === 0) ? 'stopped' : 'error';
          }
          this.publicUrl = null;
          this.emit('status_change', this.getStatus());
          if (!resolved) {
            resolved = true;
            this.status = 'error';
            this.errorMessage = `cloudflared exited before establishing tunnel (exit code: ${code})`;
            reject(new Error(this.errorMessage));
          }
        });
      } catch (err) {
        clearTimer();
        this.status = 'error';
        this.errorMessage = err.message;
        this.emit('status_change', this.getStatus());
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      }
    }).finally(() => {
      this.pendingStart = null;
    });

    return this.pendingStart;
  }

  stop() {
    this.pendingStart = null;
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }

    return new Promise((resolve) => {
      if (!this.process) {
        this.status = 'stopped';
        this.publicUrl = null;
        this.emit('status_change', this.getStatus());
        return resolve(this.getStatus());
      }

      try {
        this.process.kill();
      } catch {
        // Process might already be terminated
      }
      this.process = null;
      this.status = 'stopped';
      this.publicUrl = null;
      this.emit('status_change', this.getStatus());
      resolve(this.getStatus());
    });
  }
}

const tunnelService = new TunnelService();

// Register clean process shutdown handlers to prevent orphaned child processes
if (typeof process !== 'undefined' && process.on) {
  const cleanup = () => {
    if (tunnelService.process) {
      try {
        tunnelService.process.kill();
      } catch {
        // Ignore errors during immediate shutdown
      }
      tunnelService.process = null;
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
}

module.exports = {
  TunnelService,
  tunnelService
};
