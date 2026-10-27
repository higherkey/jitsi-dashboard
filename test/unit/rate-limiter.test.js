const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { RateLimiter } = require('../../src/middleware/rate-limiter');

describe('Sliding-Window Rate Limiter', () => {
  it('allows requests within limit and blocks when threshold is exceeded', () => {
    // Arrange: max 3 attempts within 1000ms
    const limiter = new RateLimiter({ maxAttempts: 3, windowMs: 1000 });
    const ip = '192.168.1.100';

    // Act & Assert
    assert.equal(limiter.check(ip).allowed, true); // 1
    assert.equal(limiter.check(ip).allowed, true); // 2
    assert.equal(limiter.check(ip).allowed, true); // 3

    const fourth = limiter.check(ip);
    assert.equal(fourth.allowed, false); // 4 - blocked
    assert.ok(fourth.retryAfterSeconds >= 1);
  });

  it('resets attempts after reset() is called on successful login', () => {
    // Arrange
    const limiter = new RateLimiter({ maxAttempts: 3, windowMs: 1000 });
    const ip = '10.0.0.5';

    limiter.check(ip);
    limiter.check(ip);

    // Act
    limiter.reset(ip);

    // Assert: should start fresh
    assert.equal(limiter.check(ip).remaining, 2);
  });
});
