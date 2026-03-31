import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js'; // Assuming app is exported from app.ts

describe('API Health Check', () => {
  it('should return 200 OK from /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route-12345');
    expect(response.status).toBe(404);
  });
});
