"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../database/db");
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const router = (0, express_1.Router)();
// 用户提交请假申请
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { leaveType, startTime, endTime, duration, reason } = req.body;
        const userId = req.user.userId;
        if (!leaveType || !startTime || !endTime || !duration || !reason) {
            return res.status(400).json({ error: '所有字段都是必填的' });
        }
        // 获取用户信息
        const user = await new Promise((resolve, reject) => {
            db_1.db.get('SELECT name, studentId, email FROM users WHERE id = ?', [userId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        // 插入请假记录
        const leaveId = await new Promise((resolve, reject) => {
            db_1.db.run('INSERT INTO leaves (userId, leaveType, startTime, endTime, duration, reason) VALUES (?, ?, ?, ?, ?, ?)', [userId, leaveType, startTime, endTime, duration, reason], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
        });
        // 发送邮件通知管理员
        try {
            await (0, email_1.sendLeaveApplicationNotification)(user.name, user.studentId, leaveType, startTime, endTime, duration, reason, leaveId);
            console.log('Leave application email sent to admin');
        }
        catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // 邮件发送失败不影响请假申请提交
        }
        res.status(201).json({
            message: '请假申请已提交',
            id: leaveId
        });
    }
    catch (error) {
        console.error('Create leave error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 获取当前用户的请假记录
router.get('/my-leaves', auth_1.authenticateToken, (req, res) => {
    try {
        const userId = req.user.userId;
        db_1.db.all(`SELECT l.*, u.username as respondedByUsername
       FROM leaves l
       LEFT JOIN users u ON l.respondedBy = u.id
       WHERE l.userId = ?
       ORDER BY l.createdAt DESC`, [userId], (err, rows) => {
            if (err) {
                console.error('Get leaves error:', err);
                return res.status(500).json({ error: '获取请假记录失败' });
            }
            res.json(rows || []);
        });
    }
    catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 管理员获取所有请假记录
router.get('/', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    try {
        const status = req.query.status;
        let query = `
      SELECT l.*, 
             u.username, u.name, u.studentId, u.className,
             r.username as respondedByUsername
      FROM leaves l
      JOIN users u ON l.userId = u.id
      LEFT JOIN users r ON l.respondedBy = r.id
    `;
        const params = [];
        if (status) {
            query += ' WHERE l.status = ?';
            params.push(status);
        }
        query += ' ORDER BY l.createdAt DESC';
        db_1.db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Get all leaves error:', err);
                return res.status(500).json({ error: '获取请假记录失败' });
            }
            res.json(rows || []);
        });
    }
    catch (error) {
        console.error('Get all leaves error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 管理员审批请假申请
router.patch('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectReason } = req.body;
        const adminId = req.user.userId;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: '无效的状态' });
        }
        if (status === 'rejected' && !rejectReason) {
            return res.status(400).json({ error: '拒绝时必须提供理由' });
        }
        // 获取请假申请详情
        const leave = await new Promise((resolve, reject) => {
            db_1.db.get(`SELECT l.*, u.name, u.email 
         FROM leaves l 
         JOIN users u ON l.userId = u.id 
         WHERE l.id = ?`, [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!leave) {
            return res.status(404).json({ error: '请假记录不存在' });
        }
        // 更新审批状态
        await new Promise((resolve, reject) => {
            db_1.db.run('UPDATE leaves SET status = ?, respondedAt = CURRENT_TIMESTAMP, respondedBy = ?, rejectReason = ? WHERE id = ?', [status, adminId, rejectReason || null, id], function (err) {
                if (err)
                    reject(err);
                else if (this.changes === 0)
                    reject(new Error('请假记录不存在'));
                else
                    resolve();
            });
        });
        // 发送审批结果邮件给申请人
        try {
            await (0, email_1.sendLeaveApprovalNotification)(leave.email, leave.name, leave.leaveType, leave.startTime, leave.endTime, leave.reason, status, rejectReason);
            console.log('Leave approval email sent to applicant');
        }
        catch (emailError) {
            console.error('Failed to send approval email:', emailError);
            // 邮件发送失败不影响审批操作
        }
        res.json({ message: '审批成功' });
    }
    catch (error) {
        console.error('Approve leave error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
exports.default = router;
