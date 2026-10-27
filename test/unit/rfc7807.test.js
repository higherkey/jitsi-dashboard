const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { formatProblemDetails } = require('../../src/utils/rfc7807');

describe('RFC 7807 Problem Details Formatter', () => {
  it('formats standardized 400 error correctly', () => {
    // Arrange
    const status = 400;
    const title = 'Bad Request';
    const detail = 'Service parameter is missing or invalid';
    const instance = '/api/v1/services/restart';

    // Act
    const problem = formatProblemDetails({ status, title, detail, instance });

    // Assert
    assert.deepEqual(problem, {
      type: 'https://tools.ietf.org/html/rfc7807#section-3',
      title: 'Bad Request',
      status: 400,
      detail: 'Service parameter is missing or invalid',
      instance: '/api/v1/services/restart'
    });
  });

  it('provides default type and title based on HTTP status code', () => {
    // Arrange
    const status = 404;

    // Act
    const problem = formatProblemDetails({ status });

    // Assert
    assert.equal(problem.status, 404);
    assert.equal(problem.title, 'Not Found');
    assert.ok(problem.type.includes('rfc7807'));
  });
});
