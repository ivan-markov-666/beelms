/**
 * API Health Check Test
 *
 * Basic test to verify API health endpoint is working correctly
 */

const axios = require('axios');

// Configurable API URL with default to localhost:3000
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('API Health Check', () => {
  it('should return 200 status code', async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'ok');
    } catch (error) {
      console.error('API health check failed:', error.message);
      throw error;
    }
  });
});
