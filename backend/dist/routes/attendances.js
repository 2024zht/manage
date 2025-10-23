"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../database/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 计算两点间的距离（单位：米）
function calculateDistance(lat1, lon1, lat2, lon2) {
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
// 创建点名任务（管理员）- 支持日期范围，每天晚上9:15-9:25随机时间触发
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { name, description, dateStart, dateEnd, locationName, latitude, longitude, radius, penaltyPoints, targetGrades, targetUserIds } = req.body;
        const createdBy = req.user.userId;
        if (!name || !dateStart || !dateEnd || !locationName || latitude === undefined || longitude === undefined || !radius) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }
        // 验证日期范围
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        if (start > end) {
            return res.status(400).json({ error: '开始日期不能晚于结束日期' });
        }
        // 处理面向人群，默认为2024级和2025级
        const grades = targetGrades && targetGrades.length > 0 ? targetGrades : ['2024', '2025'];
        const userIds = targetUserIds || [];
        const attendanceId = await new Promise((resolve, reject) => {
            db_1.db.run(`INSERT INTO attendances (name, description, dateStart, dateEnd, locationName, latitude, longitude, radius, penaltyPoints, targetGrades, targetUserIds, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name, description || null, dateStart, dateEnd, locationName, latitude, longitude, radius, penaltyPoints || 5, JSON.stringify(grades), JSON.stringify(userIds), createdBy], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
        });
        res.status(201).json({
            message: '点名任务创建成功',
            id: attendanceId
        });
    }
    catch (error) {
        console.error('Create attendance error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 获取所有点名任务
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const isAdmin = req.user.isAdmin;
        const userId = req.user.userId;
        const attendances = await new Promise((resolve, reject) => {
            db_1.db.all(`SELECT a.*, 
                u.username as createdByUsername
         FROM attendances a
         JOIN users u ON a.createdBy = u.id
         ORDER BY a.dateStart DESC`, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
        // 为每个点名任务获取触发记录和签到统计
        for (const attendance of attendances) {
            // 获取所有触发记录
            const triggers = await new Promise((resolve, reject) => {
                db_1.db.all(`SELECT t.*,
                  (SELECT COUNT(*) FROM attendance_records WHERE triggerId = t.id) as signedCount
           FROM daily_attendance_triggers t
           WHERE t.attendanceId = ?
           ORDER BY t.triggerDate DESC`, [attendance.id], (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows || []);
                });
            });
            attendance.triggers = triggers;
            attendance.totalTriggers = triggers.length;
            // 如果是普通用户，添加个人签到状态
            if (!isAdmin && triggers.length > 0) {
                for (const trigger of triggers) {
                    const record = await new Promise((resolve, reject) => {
                        db_1.db.get('SELECT * FROM attendance_records WHERE triggerId = ? AND userId = ?', [trigger.id, userId], (err, row) => {
                            if (err)
                                reject(err);
                            else
                                resolve(row);
                        });
                    });
                    trigger.hasSigned = !!record;
                    trigger.signedAt = record?.signedAt;
                }
            }
        }
        res.json(attendances);
    }
    catch (error) {
        console.error('Get attendances error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 获取单个点名任务详情
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const isAdmin = req.user.isAdmin;
        const userId = req.user.userId;
        const attendance = await new Promise((resolve, reject) => {
            db_1.db.get(`SELECT a.*, u.username as createdByUsername
         FROM attendances a
         JOIN users u ON a.createdBy = u.id
         WHERE a.id = ?`, [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!attendance) {
            return res.status(404).json({ error: '点名任务不存在' });
        }
        // 获取所有触发记录及其签到记录
        const triggers = await new Promise((resolve, reject) => {
            db_1.db.all(`SELECT * FROM daily_attendance_triggers WHERE attendanceId = ? ORDER BY triggerDate DESC`, [id], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
        for (const trigger of triggers) {
            const records = await new Promise((resolve, reject) => {
                db_1.db.all(`SELECT ar.*, u.username, u.name, u.studentId
           FROM attendance_records ar
           JOIN users u ON ar.userId = u.id
           WHERE ar.triggerId = ?
           ORDER BY ar.signedAt DESC`, [trigger.id], (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows || []);
                });
            });
            trigger.records = records;
            trigger.signedCount = records.length;
            // 如果是普通用户，添加个人签到状态
            if (!isAdmin) {
                const myRecord = records.find(r => r.userId === userId);
                trigger.hasSigned = !!myRecord;
                trigger.mySignedAt = myRecord?.signedAt;
            }
        }
        attendance.triggers = triggers;
        res.json(attendance);
    }
    catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 更新点名任务（管理员）
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, dateStart, dateEnd, locationName, latitude, longitude, radius, penaltyPoints, targetGrades, targetUserIds } = req.body;
        // 验证日期范围
        const start = new Date(dateStart);
        const end = new Date(dateEnd);
        if (start > end) {
            return res.status(400).json({ error: '开始日期不能晚于结束日期' });
        }
        // 处理面向人群
        const grades = targetGrades && targetGrades.length > 0 ? targetGrades : ['2024', '2025'];
        const userIds = targetUserIds || [];
        await new Promise((resolve, reject) => {
            db_1.db.run(`UPDATE attendances 
         SET name = ?, description = ?, dateStart = ?, dateEnd = ?, 
             locationName = ?, latitude = ?, longitude = ?, radius = ?, penaltyPoints = ?,
             targetGrades = ?, targetUserIds = ?
         WHERE id = ?`, [name, description || null, dateStart, dateEnd, locationName, latitude, longitude, radius, penaltyPoints || 5, JSON.stringify(grades), JSON.stringify(userIds), id], function (err) {
                if (err)
                    reject(err);
                else if (this.changes === 0)
                    reject(new Error('点名任务不存在'));
                else
                    resolve();
            });
        });
        res.json({ message: '点名任务更新成功' });
    }
    catch (error) {
        console.error('Update attendance error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 删除点名任务（管理员）
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // 获取所有触发记录
        const triggers = await new Promise((resolve, reject) => {
            db_1.db.all('SELECT id FROM daily_attendance_triggers WHERE attendanceId = ?', [id], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
        // 删除所有触发记录的签到记录
        for (const trigger of triggers) {
            await new Promise((resolve, reject) => {
                db_1.db.run('DELETE FROM attendance_records WHERE triggerId = ?', [trigger.id], (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        }
        // 删除所有触发记录
        await new Promise((resolve, reject) => {
            db_1.db.run('DELETE FROM daily_attendance_triggers WHERE attendanceId = ?', [id], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        // 删除点名任务
        await new Promise((resolve, reject) => {
            db_1.db.run('DELETE FROM attendances WHERE id = ?', [id], function (err) {
                if (err)
                    reject(err);
                else if (this.changes === 0)
                    reject(new Error('点名任务不存在'));
                else
                    resolve();
            });
        });
        res.json({ message: '点名任务删除成功' });
    }
    catch (error) {
        console.error('Delete attendance error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 管理员手动触发点名（立即触发或设置特定时间）
router.post('/:id/trigger', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { immediate = false, customTime } = req.body;
        // 获取点名任务信息
        const attendance = await new Promise((resolve, reject) => {
            db_1.db.get('SELECT * FROM attendances WHERE id = ?', [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!attendance) {
            return res.status(404).json({ error: '点名任务不存在' });
        }
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        console.log(`[Trigger] Attempting to trigger attendance ${id} for date: ${today}`);
        // 检查今天是否已经触发过
        const existingTrigger = await new Promise((resolve, reject) => {
            db_1.db.get('SELECT id FROM daily_attendance_triggers WHERE attendanceId = ? AND triggerDate = ?', [id, today], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (existingTrigger) {
            console.log(`[Trigger] Already triggered today for attendance ${id}`);
            return res.status(400).json({ error: '今天已经触发过点名了' });
        }
        let triggerTime;
        if (immediate) {
            // 立即触发：设置为当前时间
            triggerTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            console.log(`[Trigger] Immediate trigger at: ${triggerTime}`);
        }
        else if (customTime) {
            // 使用自定义时间（格式：HH:MM）
            triggerTime = `${customTime}:00`;
            console.log(`[Trigger] Custom time trigger scheduled for: ${triggerTime}`);
        }
        else {
            return res.status(400).json({ error: '请指定触发方式' });
        }
        // 创建触发记录
        const triggerId = await new Promise((resolve, reject) => {
            db_1.db.run(`INSERT INTO daily_attendance_triggers (attendanceId, triggerDate, triggerTime, notificationSent, completed, isManual)
         VALUES (?, ?, ?, 0, 0, 1)`, [id, today, triggerTime], function (err) {
                if (err) {
                    console.error(`[Trigger] Failed to create trigger record:`, err);
                    reject(err);
                }
                else {
                    console.log(`[Trigger] Created trigger record with ID: ${this.lastID}`);
                    resolve(this.lastID);
                }
            });
        });
        if (immediate) {
            // 立即发送通知
            const { sendAttendanceNotification } = await Promise.resolve().then(() => __importStar(require('../services/email')));
            // 获取目标用户邮箱
            const targetGrades = JSON.parse(attendance.targetGrades || '[]');
            const targetUserIds = JSON.parse(attendance.targetUserIds || '[]');
            let sql = 'SELECT email FROM users WHERE isAdmin = 0';
            const params = [];
            if (targetUserIds.length > 0 && targetGrades.length > 0) {
                sql += ' AND (grade IN (' + targetGrades.map(() => '?').join(',') + ') OR id IN (' + targetUserIds.map(() => '?').join(',') + '))';
                params.push(...targetGrades, ...targetUserIds);
            }
            else if (targetUserIds.length > 0) {
                sql += ' AND id IN (' + targetUserIds.map(() => '?').join(',') + ')';
                params.push(...targetUserIds);
            }
            else if (targetGrades.length > 0) {
                sql += ' AND grade IN (' + targetGrades.map(() => '?').join(',') + ')';
                params.push(...targetGrades);
            }
            const users = await new Promise((resolve, reject) => {
                db_1.db.all(sql, params, (err, rows) => {
                    if (err)
                        reject(err);
                    else
                        resolve(rows || []);
                });
            });
            const userEmails = users.map(u => u.email);
            if (userEmails.length > 0) {
                const deadline = new Date();
                deadline.setMinutes(deadline.getMinutes() + 1);
                const deadlineStr = deadline.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                try {
                    await sendAttendanceNotification(userEmails, attendance.name, deadlineStr, attendance.locationName, attendance.latitude, attendance.longitude, attendance.radius);
                    // 标记为已发送通知
                    await new Promise((resolve, reject) => {
                        db_1.db.run('UPDATE daily_attendance_triggers SET notificationSent = 1 WHERE id = ?', [triggerId], (err) => {
                            if (err)
                                reject(err);
                            else
                                resolve();
                        });
                    });
                }
                catch (emailError) {
                    console.error('Failed to send immediate notification:', emailError);
                }
            }
            res.json({
                message: '点名已立即触发，通知已发送',
                triggerId
            });
        }
        else {
            res.json({
                message: `点名已设置在 ${customTime} 触发`,
                triggerId
            });
        }
    }
    catch (error) {
        console.error('Trigger attendance error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 用户签到（签到到今天的触发记录）
router.post('/:triggerId/sign', auth_1.authenticateToken, async (req, res) => {
    try {
        const { triggerId } = req.params;
        const { latitude, longitude } = req.body;
        const userId = req.user.userId;
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: '缺少位置信息' });
        }
        // 获取触发记录和点名任务信息
        const trigger = await new Promise((resolve, reject) => {
            db_1.db.get(`SELECT t.*, a.locationName, a.latitude, a.longitude, a.radius, a.penaltyPoints
         FROM daily_attendance_triggers t
         JOIN attendances a ON t.attendanceId = a.id
         WHERE t.id = ?`, [triggerId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!trigger) {
            return res.status(404).json({ error: '点名记录不存在' });
        }
        // 检查是否已完成
        if (trigger.completed) {
            return res.status(400).json({ error: '该点名已截止' });
        }
        // 检查是否已签到
        const existingRecord = await new Promise((resolve, reject) => {
            db_1.db.get('SELECT * FROM attendance_records WHERE triggerId = ? AND userId = ?', [triggerId, userId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (existingRecord) {
            return res.status(400).json({ error: '您已签到过了' });
        }
        // 验证地理位置
        const distance = calculateDistance(trigger.latitude, trigger.longitude, latitude, longitude);
        if (distance > trigger.radius) {
            return res.status(400).json({
                error: '您不在指定的签到区域内',
                distance: Math.round(distance),
                required: trigger.radius
            });
        }
        // 创建签到记录
        await new Promise((resolve, reject) => {
            db_1.db.run('INSERT INTO attendance_records (triggerId, userId, latitude, longitude) VALUES (?, ?, ?, ?)', [triggerId, userId, latitude, longitude], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        res.json({
            message: '签到成功',
            distance: Math.round(distance)
        });
    }
    catch (error) {
        console.error('Sign attendance error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
exports.default = router;
