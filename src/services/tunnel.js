const { spawn } = require('child_process');
const EventEmitter = require('events');

class TunnelService extends EventEmitter {
  constructor(options = {}) {
    super();
    this.targetPort = options.targetPort || 3001;
    this.targetUrl = options.targetUrl || `http://localhost:${this.targetPort}`;
    this.process = null;
    this.publicUrl = null;
    this.status = 'stopped'; // 'stopped' | 'starting' | 'running' | 'error'
    this.errorMessage = null;
    this.startedAt = null;
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
    if (this.status === 'running' || this.status === 'starting') {
      return Promise.resolve(this.getStatus());
    }

    if (customTargetUrl) {
      this.targetUrl = customTargetUrl;
    }

    this.status = 'starting';
    this.errorMessage = null;
    this.publicUrl = null;
    this.startedAt = new Date().toISOString();
    this.emit('status_change', this.getStatus());

    return new Promise((resolve, reject) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
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
        // Run cloudflared tunnel to expose the target URL
        this.process = spawn('cloudflared', ['tunnel', '--url', this.targetUrl], {
          shell: true,
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
            this.emit('status_change', this.getStatus());
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(this.getStatus());
            }
          }
        };

        this.process.stdout.on('data', handleData);
        this.process.stderr.on('data', handleData);

        this.process.on('error', (err) => {
          this.status = 'error';
          this.errorMessage = err.message;
          this.emit('status_change', this.getStatus());
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(err);
          }
        });

        this.process.on('close', (code) => {
          this.process = null;
          this.status = 'stopped';
          this.publicUrl = null;
          this.emit('status_change', this.getStatus());
          if (!resolved && code !== 0) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(`cloudflared exited with code ${code}`));
          }
        });
      } catch (err) {
        this.status = 'error';
        this.errorMessage = err.message;
        this.emit('status_change', this.getStatus());
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(err);
        }
      }
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (!this.process) {
        this.status = 'stopped';
        this.publicUrl = null;
        this.emit('status_change', this.getStatus());
        return resolve(this.getStatus());
      }

      this.process.kill();
      this.process = null;
      this.status = 'stopped';
      this.publicUrl = null;
      this.emit('status_change', this.getStatus());
      resolve(this.getStatus());
    });
  }
}

const tunnelService = new TunnelService();

module.exports = {
  TunnelService,
  tunnelService
};
