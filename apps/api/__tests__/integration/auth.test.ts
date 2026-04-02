import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

const TEST_USER = {
  email: `test_${Date.now()}@dicera.test`,
  username: `testuser_${Date.now()}`,
  password: 'TestPassword123!',
};

let authToken: string;
let userId: string;

describe('Auth API — full lifecycle', () => {
  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a JWT', async () => {
      const res = await request(app).post('/api/auth/register').send(TEST_USER);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('userId');
      expect(typeof res.body.token).toBe('string');
      authToken = res.body.token;
      userId = res.body.userId;
    });

    it('rejects duplicate email with 409', async () => {
      const res = await request(app).post('/api/auth/register').send(TEST_USER);
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('rejects short password with 400', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'other@test.com', username: 'other123', password: 'short',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns JWT for valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: TEST_USER.email, password: TEST_USER.password,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: TEST_USER.email, password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('returns 401 for unknown email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com', password: 'anything',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user profile with valid token', async () => {
      const res = await request(app).get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(TEST_USER.email);
      expect(res.body.username).toBe(TEST_USER.username);
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed token', async () => {
      const res = await request(app).get('/api/auth/me')
        .set('Authorization', 'Bearer notavalidtoken');
      expect(res.status).toBe(401);
    });
  });

  describe('Role-based access control', () => {
    it('rejects access to /api/admin/stats for regular user with 403', async () => {
      const res = await request(app).get('/api/admin/stats')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 401 for /api/characters without auth', async () => {
      const res = await request(app).get('/api/characters');
      expect(res.status).toBe(401);
    });
  });
});
