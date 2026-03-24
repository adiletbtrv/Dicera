import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Spells API Endpoints', () => {
  it('GET /api/spells should return 200 and standard pagination payload', async () => {
    const res = await request(app).get('/api/spells');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');
  });

  it('GET /api/spells/invalid-id should return 404 or structured error', async () => {
    const res = await request(app).get('/api/spells/invalid-id');
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
