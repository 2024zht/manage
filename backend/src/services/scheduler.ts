import cron from 'node-cron';
import { db } from '../database/db';
import { sendAttendanceNotification } from './email';

// 生成9:15-9:25之间的随机时间
function generateRandomTime(): string {
  const minutes = 15 + Math.floor(Math.random() * 11); // 15-25之间的随机分钟
  const seconds = Math.floor(Math.random() * 60); // 0-59之间的随机秒
  return `21:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 每天晚上9点检查并创建当天的点名触发记录
export const startAttendanceScheduler = () => {
  console.log('Attendance scheduler started');

  // 每天晚上9:00创建当天的触发记录
  cron.schedule('0 21 * * *', async () => {
    try {
      await createDailyTriggers();
    } catch (error) {
      console.error('Create daily triggers error:', error);
    }
  });

  // 每分钟检查是否需要发送通知和完成点名
  cron.schedule('* * * * *', async () => {
    try {
      await checkAndNotifyAttendances();
      await checkAndCompleteAttendances();
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
};

// 创建每日触发记录
async function createDailyTriggers() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
    
    // 查找所有在日期范围内的点名任务
    const attendances = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT * FROM attendances 
         WHERE date(dateStart) <= date(?) 
         AND date(dateEnd) >= date(?)
         AND completed = 0`,
        [today, today],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const attendance of attendances) {
      try {
        // 检查今天是否已经创建了触发记录
        const existingTrigger = await new Promise<any>((resolve, reject) => {
          db.get(
            'SELECT id FROM daily_attendance_triggers WHERE attendanceId = ? AND triggerDate = ?',
            [attendance.id, today],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        if (!existingTrigger) {
          // 生成随机触发时间（9:15-9:25）
          const triggerTime = generateRandomTime();
          
          // 创建触发记录
          await new Promise<void>((resolve, reject) => {
            db.run(
              `INSERT INTO daily_attendance_triggers (attendanceId, triggerDate, triggerTime, notificationSent, completed)
               VALUES (?, ?, ?, 0, 0)`,
              [attendance.id, today, triggerTime],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          console.log(`Created daily trigger for ${attendance.name} at ${triggerTime}`);
        }
      } catch (error) {
        console.error(`Failed to create trigger for attendance ${attendance.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Create daily triggers error:', error);
  }
}

// 检查并发送点名通知
async function checkAndNotifyAttendances() {
  try {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];
    
    // 查找所有应该发送通知但还没发送的触发记录
    const triggers = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT t.*, a.name, a.locationName, a.latitude, a.longitude, a.radius
         FROM daily_attendance_triggers t
         JOIN attendances a ON t.attendanceId = a.id
         WHERE t.triggerDate = ?
         AND t.triggerTime <= ?
         AND t.notificationSent = 0`,
        [today, currentTime],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const trigger of triggers) {
      try {
        // 获取所有非管理员用户的邮箱
        const users = await new Promise<any[]>((resolve, reject) => {
          db.all(
            'SELECT email FROM users WHERE isAdmin = 0',
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });

        const userEmails = users.map(u => u.email);

        if (userEmails.length > 0) {
          // 计算截止时间（触发时间 + 1分钟）
          const [hours, minutes, seconds] = trigger.triggerTime.split(':').map(Number);
          const deadline = new Date();
          deadline.setHours(hours, minutes + 1, seconds);
          const deadlineStr = deadline.toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit', 
            minute: '2-digit'
          });

          // 发送邮件通知
          await sendAttendanceNotification(
            userEmails,
            trigger.name,
            deadlineStr,
            trigger.locationName,
            trigger.latitude,
            trigger.longitude,
            trigger.radius
          );

          // 标记为已发送通知
          await new Promise<void>((resolve, reject) => {
            db.run(
              'UPDATE daily_attendance_triggers SET notificationSent = 1 WHERE id = ?',
              [trigger.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          console.log(`Attendance notification sent for: ${trigger.name} on ${trigger.triggerDate}`);
        }
      } catch (error) {
        console.error(`Failed to send notification for trigger ${trigger.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Check and notify attendances error:', error);
  }
}

// 检查并完成点名任务（扣分）
async function checkAndCompleteAttendances() {
  try {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];
    
    // 查找所有应该完成但还没完成的触发记录（触发时间 + 10分钟后）
    const triggers = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT t.*, a.name, a.penaltyPoints, a.createdBy
         FROM daily_attendance_triggers t
         JOIN attendances a ON t.attendanceId = a.id
         WHERE t.triggerDate = ?
         AND t.notificationSent = 1
         AND t.completed = 0`,
        [today],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const trigger of triggers) {
      try {
        // 计算截止时间（触发时间 + 1分钟）
        const [hours, minutes, seconds] = trigger.triggerTime.split(':').map(Number);
        const deadline = new Date();
        deadline.setHours(hours, minutes + 1, seconds);
        
        // 检查是否已过截止时间
        if (now < deadline) {
          continue;
        }

        // 获取所有非管理员用户
        const allUsers = await new Promise<any[]>((resolve, reject) => {
          db.all(
            'SELECT id, username, name FROM users WHERE isAdmin = 0',
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });

        // 获取已签到的用户
        const signedUsers = await new Promise<any[]>((resolve, reject) => {
          db.all(
            'SELECT userId FROM attendance_records WHERE triggerId = ?',
            [trigger.id],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });

        const signedUserIds = new Set(signedUsers.map(u => u.userId));
        const unsignedUsers = allUsers.filter(u => !signedUserIds.has(u.id));

        // 扣除未签到用户的积分
        for (const user of unsignedUsers) {
          try {
            // 扣除积分
            await new Promise<void>((resolve, reject) => {
              db.run(
                'UPDATE users SET points = points - ? WHERE id = ?',
                [trigger.penaltyPoints, user.id],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });

            // 记录积分日志
            await new Promise<void>((resolve, reject) => {
              db.run(
                `INSERT INTO point_logs (userId, points, reason, createdBy) 
                 VALUES (?, ?, ?, ?)`,
                [
                  user.id,
                  -trigger.penaltyPoints,
                  `未参加点名：${trigger.name}（${trigger.triggerDate}）`,
                  trigger.createdBy
                ],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });

            console.log(`Penalty applied to user ${user.username} for attendance ${trigger.name} on ${trigger.triggerDate}`);
          } catch (error) {
            console.error(`Failed to apply penalty to user ${user.id}:`, error);
          }
        }

        // 标记触发记录为已完成
        await new Promise<void>((resolve, reject) => {
          db.run(
            'UPDATE daily_attendance_triggers SET completed = 1 WHERE id = ?',
            [trigger.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        console.log(`Attendance completed: ${trigger.name} on ${trigger.triggerDate}, ${unsignedUsers.length} users penalized`);
      } catch (error) {
        console.error(`Failed to complete trigger ${trigger.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Check and complete attendances error:', error);
  }
}

export default {
  startAttendanceScheduler
};

