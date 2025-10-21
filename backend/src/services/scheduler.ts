import cron from 'node-cron';
import { db } from '../database/db';
import { sendAttendanceNotification } from './email';

// 每分钟检查一次点名任务
export const startAttendanceScheduler = () => {
  console.log('Attendance scheduler started');

  // 每分钟执行一次
  cron.schedule('* * * * *', async () => {
    try {
      await checkAndNotifyAttendances();
      await checkAndCompleteAttendances();
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });
};

// 检查并发送点名通知
async function checkAndNotifyAttendances() {
  try {
    const now = new Date();
    
    // 查找所有应该发送通知但还没发送的点名任务
    // 查找startTime已到，但notificationSent = 0的任务
    const attendances = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT * FROM attendances 
         WHERE datetime(startTime) <= datetime('now') 
         AND notificationSent = 0`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const attendance of attendances) {
      try {
        // 获取所有用户邮箱
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
          // 发送邮件通知
          await sendAttendanceNotification(
            userEmails,
            attendance.name,
            attendance.endTime,
            attendance.locationName,
            attendance.latitude,
            attendance.longitude,
            attendance.radius
          );

          // 标记为已发送通知
          await new Promise<void>((resolve, reject) => {
            db.run(
              'UPDATE attendances SET notificationSent = 1 WHERE id = ?',
              [attendance.id],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          console.log(`Attendance notification sent for: ${attendance.name}`);
        }
      } catch (error) {
        console.error(`Failed to send notification for attendance ${attendance.id}:`, error);
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
    
    // 查找所有应该完成但还没完成的点名任务
    // 查找endTime已过，但completed = 0的任务
    const attendances = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT * FROM attendances 
         WHERE datetime(endTime) <= datetime('now') 
         AND completed = 0`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    for (const attendance of attendances) {
      try {
        // 获取所有未签到的用户
        const allUsers = await new Promise<any[]>((resolve, reject) => {
          db.all(
            'SELECT id, username, name FROM users WHERE isAdmin = 0',
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });

        const signedUsers = await new Promise<any[]>((resolve, reject) => {
          db.all(
            'SELECT userId FROM attendance_records WHERE attendanceId = ?',
            [attendance.id],
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
                [attendance.penaltyPoints, user.id],
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
                  -attendance.penaltyPoints,
                  `未参加点名：${attendance.name}`,
                  attendance.createdBy
                ],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });

            console.log(`Penalty applied to user ${user.username} for attendance ${attendance.name}`);
          } catch (error) {
            console.error(`Failed to apply penalty to user ${user.id}:`, error);
          }
        }

        // 标记点名任务为已完成
        await new Promise<void>((resolve, reject) => {
          db.run(
            'UPDATE attendances SET completed = 1 WHERE id = ?',
            [attendance.id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        console.log(`Attendance completed: ${attendance.name}, ${unsignedUsers.length} users penalized`);
      } catch (error) {
        console.error(`Failed to complete attendance ${attendance.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Check and complete attendances error:', error);
  }
}

export default {
  startAttendanceScheduler
};

