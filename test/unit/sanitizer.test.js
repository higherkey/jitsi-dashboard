const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeSecrets } = require('../../src/utils/sanitizer');

describe('Data Sanitizer Utility', () => {
  it('masks sensitive password and secret keys in objects', () => {
    // Arrange
    const input = {
      service: 'prosody',
      JICOFO_AUTH_PASSWORD: 'super_secret_password',
      JWT_APP_SECRET: 'secret_token_123',
      HTTP_PORT: 8000,
      nested: {
        JVB_AUTH_PASSWORD: 'nested_password_xyz',
        NORMAL_SETTING: 'safe'
      }
    };

    // Act
    const sanitized = sanitizeSecrets(input);

    // Assert
    assert.equal(sanitized.JICOFO_AUTH_PASSWORD, '********');
    assert.equal(sanitized.JWT_APP_SECRET, '********');
    assert.equal(sanitized.HTTP_PORT, 8000);
    assert.equal(sanitized.nested.JVB_AUTH_PASSWORD, '********');
    assert.equal(sanitized.nested.NORMAL_SETTING, 'safe');
  });

  it('masks password flags in log strings', () => {
    // Arrange
    const logLine = 'Connecting to XMPP with password=secret123456 and token=abcde';

    // Act
    const sanitized = sanitizeSecrets(logLine);

    // Assert
    assert.ok(!sanitized.includes('secret123456'));
    assert.ok(sanitized.includes('password=********'));
  });
});
