import { db } from './db';
import bcrypt from 'bcryptjs';

const initDatabase = async () => {
  try {
    // 创建用户表
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          isAdmin INTEGER DEFAULT 0,
          points INTEGER DEFAULT 0,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 创建规则表
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          points INTEGER NOT NULL,
          description TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 创建积分日志表
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS point_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          points INTEGER NOT NULL,
          reason TEXT,
          createdBy INTEGER NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (createdBy) REFERENCES users(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('Database tables created successfully');

    // 检查是否已有管理员
    const adminExists = await new Promise<boolean>((resolve) => {
      db.get('SELECT id FROM users WHERE isAdmin = 1', (err, row) => {
        if (err || !row) resolve(false);
        else resolve(true);
      });
    });

    // 如果没有管理员，创建默认管理员账户
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await new Promise<void>((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password, isAdmin, points) VALUES (?, ?, ?, ?, ?)',
          ['admin', 'admin@robotlab.com', hashedPassword, 1, 0],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
      console.log('Default admin user created (username: admin, password: admin123)');
    }

    // 检查是否已有规则
    const rulesExist = await new Promise<boolean>((resolve) => {
      db.get('SELECT id FROM rules LIMIT 1', (err, row) => {
        if (err || !row) resolve(false);
        else resolve(true);
      });
    });

    // 如果没有规则，创建一些示例规则
    if (!rulesExist) {
      const defaultRules = [
        { name: '完成实验报告', points: 10, description: '按时提交实验报告' },
        { name: '参加组会', points: 5, description: '参加每周组会' },
        { name: '发表论文', points: 100, description: '在会议或期刊发表论文' },
        { name: '协助实验室建设', points: 15, description: '参与实验室设备维护和建设' },
        { name: '迟到', points: -5, description: '组会或活动迟到' },
        { name: '未完成任务', points: -10, description: '未按时完成分配的任务' }
      ];

      for (const rule of defaultRules) {
        await new Promise<void>((resolve, reject) => {
          db.run(
            'INSERT INTO rules (name, points, description) VALUES (?, ?, ?)',
            [rule.name, rule.points, rule.description],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      console.log('Default rules created');
    }

    console.log('Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

initDatabase();

