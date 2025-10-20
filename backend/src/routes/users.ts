import express, { Response } from 'express';
import { getAll, getOne, runQuery } from '../database/db';
import { User } from '../types';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();

// 获取所有用户及积分排名
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const users = await getAll<Omit<User, 'password'>>(
      'SELECT id, username, email, isAdmin, points, createdAt FROM users ORDER BY points DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getOne<Omit<User, 'password'>>(
      'SELECT id, username, email, isAdmin, points, createdAt FROM users WHERE id = ?',
      [req.user!.userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);

  if (userId === req.user!.userId) {
    return res.status(400).json({ error: '不能删除自己的账户' });
  }

  try {
    await runQuery('DELETE FROM users WHERE id = ?', [userId]);
    await runQuery('DELETE FROM point_logs WHERE userId = ?', [userId]);
    res.json({ message: '用户已删除' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 修改用户积分（管理员）
router.patch('/:id/points', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  const { points, reason } = req.body;

  if (typeof points !== 'number') {
    return res.status(400).json({ error: '积分必须是数字' });
  }

  try {
    // 获取当前用户积分
    const user = await getOne<User>('SELECT points FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const newPoints = user.points + points;

    // 更新积分
    await runQuery('UPDATE users SET points = ? WHERE id = ?', [newPoints, userId]);

    // 记录积分变动
    await runQuery(
      'INSERT INTO point_logs (userId, points, reason, createdBy) VALUES (?, ?, ?, ?)',
      [userId, points, reason || '管理员调整', req.user!.userId]
    );

    res.json({ message: '积分已更新', newPoints });
  } catch (error) {
    console.error('Update points error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 设置管理员权限（管理员）
router.patch('/:id/admin', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  const { isAdmin } = req.body;

  if (typeof isAdmin !== 'boolean') {
    return res.status(400).json({ error: 'isAdmin必须是布尔值' });
  }

  try {
    await runQuery('UPDATE users SET isAdmin = ? WHERE id = ?', [isAdmin ? 1 : 0, userId]);
    res.json({ message: '权限已更新' });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户积分日志
router.get('/:id/logs', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);

  // 只有管理员或本人可以查看积分日志
  if (!req.user!.isAdmin && req.user!.userId !== userId) {
    return res.status(403).json({ error: '没有权限查看此日志' });
  }

  try {
    const logs = await getAll(
      `SELECT pl.*, u.username as createdByUsername 
       FROM point_logs pl 
       LEFT JOIN users u ON pl.createdBy = u.id 
       WHERE pl.userId = ? 
       ORDER BY pl.createdAt DESC`,
      [userId]
    );
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;

