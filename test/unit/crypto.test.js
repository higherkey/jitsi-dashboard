const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, generateToken } = require('../../src/utils/crypto');

describe('Cryptographic Utilities', () => {
  it('hashes passwords using PBKDF2 with salt and verifies successfully', () => {
    // Arrange
    const password = 'my_super_secure_admin_password';

    // Act
    const hash = hashPassword(password);
    const isValid = verifyPassword(password, hash);
    const isInvalid = verifyPassword('wrong_password', hash);

    // Assert
    assert.ok(hash.includes(':'), 'Hash must contain salt delimiter');
    assert.equal(isValid, true, 'Valid password must verify');
    assert.equal(isInvalid, false, 'Invalid password must fail verification');
  });

  it('generates cryptographically secure hex session tokens of requested byte length', () => {
    // Act
    const token = generateToken(32);

    // Assert
    assert.equal(typeof token, 'string');
    assert.equal(token.length, 64); // 32 bytes in hex = 64 characters
  });
});
