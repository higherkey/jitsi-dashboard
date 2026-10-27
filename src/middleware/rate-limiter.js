class RateLimiter {
  constructor({ maxAttempts = 5, windowMs = 15 * 60 * 1000 } = {}) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.records = new Map(); // ip -> [timestamps]
  }

  check(ip) {
    const now = Date.now();
    let timestamps = this.records.get(ip) || [];

    // Filter out timestamps outside window
    timestamps = timestamps.filter(t => now - t < this.windowMs);

    if (timestamps.length >= this.maxAttempts) {
      const oldest = timestamps[0];
      const retryAfterSeconds = Math.ceil((this.windowMs - (now - oldest)) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, retryAfterSeconds)
      };
    }

    timestamps.push(now);
    this.records.set(ip, timestamps);

    return {
      allowed: true,
      remaining: this.maxAttempts - timestamps.length,
      retryAfterSeconds: 0
    };
  }

  reset(ip) {
    this.records.delete(ip);
  }
}

module.exports = {
  RateLimiter
};
