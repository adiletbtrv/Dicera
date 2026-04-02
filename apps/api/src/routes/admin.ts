import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ApiError } from '../middleware/error-handler.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin'));

const UserUpdateSchema = z.object({
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  is_verified: z.boolean().optional(),
});

router.get('/stats', async (req, res, next) => {
  try {
    const [usersCounts, campaignsCount, charactersCount, homebrewCount] = await Promise.all([
      query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
      query('SELECT COUNT(*) as count FROM campaigns'),
      query('SELECT COUNT(*) as count FROM characters'),
      query('SELECT COUNT(*) as count FROM homebrew'),
    ]);

    const usersByRole = usersCounts.rows.reduce(
      (acc, row) => ({ ...acc, [row.role]: Number(row.count) }),
      {} as Record<string, number>
    );

    res.json({
      users: {
        total: Object.values(usersByRole).reduce((a, b) => a + b, 0),
        by_role: usersByRole,
      },
      campaigns: Number(campaignsCount.rows[0]?.count || 0),
      characters: Number(charactersCount.rows[0]?.count || 0),
      homebrew: Number(homebrewCount.rows[0]?.count || 0),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const rows = await query(`
      SELECT id, email, username, display_name, role, is_verified, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(rows.rows);
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const updates = UserUpdateSchema.parse(req.body);
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${p}`);
        params.push(value);
        p++;
      }
    }

    if (setClauses.length === 0) {
      res.json({ id: req.params['id'] });
      return;
    }

    params.push(req.params['id']);
    const result = await query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${p} RETURNING id, email, username, role`,
      params
    );

    if (result.rowCount === 0) throw new ApiError(404, 'User not found');
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params['id'] === req.user?.id) {
      throw new ApiError(403, 'You cannot delete your own admin account');
    }

    const result = await query('DELETE FROM users WHERE id = $1', [req.params['id']]);
    if (result.rowCount === 0) throw new ApiError(404, 'User not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export { router as adminRouter };
