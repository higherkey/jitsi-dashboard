const crypto = require('crypto');

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(':');
  const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  const derivedHashBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
  const originalHashBuffer = Buffer.from(originalHash, 'hex');

  if (derivedHashBuffer.length !== originalHashBuffer.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(derivedHashBuffer, originalHashBuffer);
}

function generateToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken
};
