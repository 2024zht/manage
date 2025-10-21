import { Router, Response } from 'express';
import { db } from '../database/db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// 计算两点间的距离（单位：米）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // 地球半径（米）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 距离（米）
}

// 创建点名任务（管理员）
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      startTime,
      endTime,
      locationName,
      latitude,
      longitude,
      radius,
      penaltyPoints
    } = req.body;
    const createdBy = req.user!.userId;

    if (!name || !startTime || !endTime || !locationName || latitude === undefined || longitude === undefined || !radius) {
      return res.status(400).json({ error: '所有字段都是必填的' });
    }

    const attendanceId = await new Promise<number>((resolve, reject) => {
      db.run(
        `INSERT INTO attendances (name, description, startTime, endTime, locationName, latitude, longitude, radius, penaltyPoints, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description || null, startTime, endTime, locationName, latitude, longitude, radius, penaltyPoints || 5, createdBy],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    res.status(201).json({
      message: '点名任务创建成功',
      id: attendanceId
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有点名任务
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const isAdmin = req.user!.isAdmin;
    const userId = req.user!.userId;
    
    const attendances = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT a.*, 
                u.username as createdByUsername,
                (SELECT COUNT(*) FROM attendance_records WHERE attendanceId = a.id) as signedCount
         FROM attendances a
         JOIN users u ON a.createdBy = u.id
         ORDER BY a.startTime DESC`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // 如果是普通用户，添加签到状态信息
    if (!isAdmin) {
      for (const attendance of attendances) {
        const record = await new Promise<any>((resolve, reject) => {
          db.get(
            'SELECT * FROM attendance_records WHERE attendanceId = ? AND userId = ?',
            [attendance.id, userId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
        attendance.hasSigned = !!record;
        attendance.signedAt = record?.signedAt;
      }
    }

    res.json(attendances);
  } catch (error) {
    console.error('Get attendances error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取单个点名任务详情
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.isAdmin;
    const userId = req.user!.userId;

    const attendance = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT a.*, u.username as createdByUsername
         FROM attendances a
         JOIN users u ON a.createdBy = u.id
         WHERE a.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!attendance) {
      return res.status(404).json({ error: '点名任务不存在' });
    }

    // 获取签到记录
    const records = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT ar.*, u.username, u.name, u.studentId
         FROM attendance_records ar
         JOIN users u ON ar.userId = u.id
         WHERE ar.attendanceId = ?
         ORDER BY ar.signedAt DESC`,
        [id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    attendance.records = records;
    attendance.signedCount = records.length;

    // 如果是普通用户，添加个人签到状态
    if (!isAdmin) {
      const myRecord = records.find(r => r.userId === userId);
      attendance.hasSigned = !!myRecord;
      attendance.mySignedAt = myRecord?.signedAt;
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新点名任务（管理员）
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      startTime,
      endTime,
      locationName,
      latitude,
      longitude,
      radius,
      penaltyPoints
    } = req.body;

    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE attendances 
         SET name = ?, description = ?, startTime = ?, endTime = ?, 
             locationName = ?, latitude = ?, longitude = ?, radius = ?, penaltyPoints = ?
         WHERE id = ?`,
        [name, description || null, startTime, endTime, locationName, latitude, longitude, radius, penaltyPoints || 5, id],
        function (err) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('点名任务不存在'));
          else resolve();
        }
      );
    });

    res.json({ message: '点名任务更新成功' });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除点名任务（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 删除相关的签到记录
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM attendance_records WHERE attendanceId = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 删除点名任务
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM attendances WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('点名任务不存在'));
        else resolve();
      });
    });

    res.json({ message: '点名任务删除成功' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户签到
router.post('/:id/sign', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const userId = req.user!.userId;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: '缺少位置信息' });
    }

    // 获取点名任务信息
    const attendance = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM attendances WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!attendance) {
      return res.status(404).json({ error: '点名任务不存在' });
    }

    // 检查是否在签到时间范围内
    const now = new Date();
    const startTime = new Date(attendance.startTime);
    const endTime = new Date(attendance.endTime);

    if (now < startTime) {
      return res.status(400).json({ error: '签到尚未开始' });
    }

    if (now > endTime) {
      return res.status(400).json({ error: '签到已截止' });
    }

    // 检查是否已签到
    const existingRecord = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT * FROM attendance_records WHERE attendanceId = ? AND userId = ?',
        [id, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingRecord) {
      return res.status(400).json({ error: '您已签到过了' });
    }

    // 验证地理位置
    const distance = calculateDistance(
      attendance.latitude,
      attendance.longitude,
      latitude,
      longitude
    );

    if (distance > attendance.radius) {
      return res.status(400).json({
        error: '您不在指定的签到区域内',
        distance: Math.round(distance),
        required: attendance.radius
      });
    }

    // 创建签到记录
    await new Promise<void>((resolve, reject) => {
      db.run(
        'INSERT INTO attendance_records (attendanceId, userId, latitude, longitude) VALUES (?, ?, ?, ?)',
        [id, userId, latitude, longitude],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({
      message: '签到成功',
      distance: Math.round(distance)
    });
  } catch (error) {
    console.error('Sign attendance error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;

