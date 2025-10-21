import { Router, Response } from 'express';
import { db } from '../database/db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { Leave } from '../types';

const router = Router();

// 用户提交请假申请
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { leaveType, startTime, endTime, duration, reason } = req.body;
    const userId = req.user!.userId;

    if (!leaveType || !startTime || !endTime || !duration || !reason) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    db.run(
      'INSERT INTO leaves (userId, leaveType, startTime, endTime, duration, reason) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, leaveType, startTime, endTime, duration, reason],
      function (err) {
        if (err) {
          console.error('Create leave error:', err);
          return res.status(500).json({ error: '提交请假申请失败' });
        }
        res.status(201).json({ 
          message: '请假申请已提交',
          id: this.lastID 
        });
      }
    );
  } catch (error) {
    console.error('Create leave error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前用户的请假记录
router.get('/my-leaves', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    db.all(
      `SELECT l.*, u.username as respondedByUsername
       FROM leaves l
       LEFT JOIN users u ON l.respondedBy = u.id
       WHERE l.userId = ?
       ORDER BY l.createdAt DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Get leaves error:', err);
          return res.status(500).json({ error: '获取请假记录失败' });
        }
        res.json(rows || []);
      }
    );
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员获取所有请假记录
router.get('/', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    
    let query = `
      SELECT l.*, 
             u.username, u.name, u.studentId, u.className,
             r.username as respondedByUsername
      FROM leaves l
      JOIN users u ON l.userId = u.id
      LEFT JOIN users r ON l.respondedBy = r.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE l.status = ?';
      params.push(status);
    }

    query += ' ORDER BY l.createdAt DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Get all leaves error:', err);
        return res.status(500).json({ error: '获取请假记录失败' });
      }
      res.json(rows || []);
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员审批请假申请
router.patch('/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;
    const adminId = req.user!.userId;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }

    if (status === 'rejected' && !rejectReason) {
      return res.status(400).json({ error: '拒绝时必须提供理由' });
    }

    db.run(
      'UPDATE leaves SET status = ?, respondedAt = CURRENT_TIMESTAMP, respondedBy = ?, rejectReason = ? WHERE id = ?',
      [status, adminId, rejectReason || null, id],
      function (err) {
        if (err) {
          console.error('Approve leave error:', err);
          return res.status(500).json({ error: '审批失败' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: '请假记录不存在' });
        }
        res.json({ message: '审批成功' });
      }
    );
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;

