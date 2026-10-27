const STATUS_TITLES = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable'
};

function formatProblemDetails({
  status = 500,
  title = null,
  detail = null,
  instance = null,
  type = 'https://tools.ietf.org/html/rfc7807#section-3'
}) {
  return {
    type,
    title: title || STATUS_TITLES[status] || 'Error',
    status,
    ...(detail ? { detail } : {}),
    ...(instance ? { instance } : {})
  };
}

module.exports = {
  formatProblemDetails,
  STATUS_TITLES
};
