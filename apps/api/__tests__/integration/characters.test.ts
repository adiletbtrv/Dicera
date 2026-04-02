import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

let token: string;
let characterId: string;

const TEST_CHARACTER = {
  name: 'Test Character',
  race_id: 'test-race',
  race_name: 'Human',
  background_id: 'test-bg',
  background_name: 'Acolyte',
  alignment: 'true neutral',
  classes: [{ class_id: 'fighter', class_name: 'Fighter', level: 1 }],
  total_level: 1,
  ability_scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  max_hit_points: 10,
  current_hit_points: 10,
  hit_dice_total: '1d10',
  armor_class: 10,
  initiative_bonus: 0,
  speed: 30,
  proficiency_bonus: 2,
  passive_perception: 10,
};

describe('Characters API — CRUD', () => {
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `char_test_${Date.now()}@test.com`,
      username: `chartest_${Date.now()}`,
      password: 'Password123!',
    });
    token = res.body.token;
  });

  it('POST /api/characters creates a character', async () => {
    const res = await request(app).post('/api/characters')
      .set('Authorization', `Bearer ${token}`)
      .send(TEST_CHARACTER);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    characterId = res.body.id;
  });

  it('GET /api/characters returns the created character', async () => {
    const res = await request(app).get('/api/characters')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: { id: string }) => c.id === characterId)).toBe(true);
  });

  it('GET /api/characters/:id returns character detail', async () => {
    const res = await request(app).get(`/api/characters/${characterId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe(TEST_CHARACTER.name);
  });

  it('PATCH /api/characters/:id updates the character', async () => {
    const res = await request(app).patch(`/api/characters/${characterId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ current_hit_points: 7 });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/characters/:id removes the character', async () => {
    const res = await request(app).delete(`/api/characters/${characterId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it('GET /api/characters/:id returns 404 after deletion', async () => {
    const res = await request(app).get(`/api/characters/${characterId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
