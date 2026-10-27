const auth = {
  async getAuthStatus() {
    try {
      const res = await fetch('/api/v1/auth/me');
      if (!res.ok) return { authenticated: false };
      return res.json();
    } catch {
      return { authenticated: false };
    }
  },

  async login(password) {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.title || 'Login failed');
    }
    return data;
  },

  async logout() {
    const res = await fetch('/api/v1/auth/logout', { method: 'POST' });
    return res.ok;
  }
};
