import { Router } from 'express';
import { z } from 'zod';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/client.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(100).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const dKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${dKey}`;
}

function verifyPassword(password: string, hash: string): boolean {
  try {
    const parts = hash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const existingKeyBuf = Buffer.from(key!, 'hex');
    const inputKeyBuf = scryptSync(password, salt!, 64);
    return timingSafeEqual(existingKeyBuf, inputKeyBuf);
  } catch {
    return false;
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const passwordHash = hashPassword(body.password);

    const existing = await queryOne(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [body.email, body.username],
    );
    if (existing) {
      throw new ApiError(409, 'Email or username already in use');
    }

    const id = uuidv4();
    await query(
      `INSERT INTO users (id, email, username, password_hash, display_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, body.email, body.username, passwordHash, body.displayName ?? body.username],
    );

    const token = await signToken({
      id,
      email: body.email,
      username: body.username,
      role: 'user',
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ userId: id, token });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    interface UserRow { id: string; email: string; username: string; role: string; password_hash: string }
    const user = await queryOne<UserRow>(
      'SELECT id, email, username, role, password_hash FROM users WHERE email = $1',
      [body.email],
    );

    if (!user || !verifyPassword(body.password, user.password_hash)) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ userId: user.id, token });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    interface MeRow { id: string; email: string; username: string; display_name: string; avatar_url: string | null; role: string; created_at: string }
    const user = await queryOne<MeRow>(
      'SELECT id, email, username, display_name, avatar_url, role, created_at FROM users WHERE id = $1',
      [req.user!.id],
    );

    if (!user) throw new ApiError(404, 'User not found');
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

export { router as authRouter };
