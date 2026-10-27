const SENSITIVE_KEY_PATTERN = /(_PASSWORD|_SECRET|_KEY|_TOKEN|AUTH_PASSWORD)$/i;
const SENSITIVE_STRING_PATTERN = /(password|token|secret|key)=([^&\s"']+)/gi;

function sanitizeSecrets(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data.replace(SENSITIVE_STRING_PATTERN, '$1=********');
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeSecrets(item));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEY_PATTERN.test(key) && typeof value === 'string') {
        sanitized[key] = '********';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeSecrets(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
}

module.exports = {
  sanitizeSecrets
};
