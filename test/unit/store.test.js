const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createStore } = require('../../src/services/store');

describe('Storage Adapter', () => {
  let store;

  beforeEach(() => {
    // In-memory sqlite store
    store = createStore({ memory: true });
  });

  it('stores and retrieves valid sessions', () => {
    // Arrange
    const sessionId = 'test_token_12345';
    const expiresAt = Date.now() + 3600 * 1000;

    // Act
    store.createSession(sessionId, 'admin', expiresAt);
    const session = store.getSession(sessionId);

    // Assert
    assert.ok(session);
    assert.equal(session.username, 'admin');
    assert.equal(session.id, sessionId);
  });

  it('deletes sessions on logout', () => {
    // Arrange
    const sessionId = 'logout_token';
    store.createSession(sessionId, 'admin', Date.now() + 10000);

    // Act
    store.deleteSession(sessionId);
    const session = store.getSession(sessionId);

    // Assert
    assert.equal(session, null);
  });
});
