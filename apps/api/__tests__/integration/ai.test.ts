import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('AI API Endpoints', () => {
  it('GET /api/ai/status requires authentication', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/ai/rules requires authentication', async () => {
    const res = await request(app).post('/api/ai/rules').send({ question: 'How does stealth work?' });
    expect(res.status).toBe(401);
  });

  it('POST /api/ai/npc/dialogue requires authentication', async () => {
    const res = await request(app).post('/api/ai/npc/dialogue').send({
      message: 'Hello',
      history: [],
      persona: { name: 'Bob', personality: 'Happy' }
    });
    expect(res.status).toBe(401);
  });
});
