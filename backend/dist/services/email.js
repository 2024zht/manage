"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPointRequestNotification = exports.sendPointRequestSubmitNotification = exports.sendAttendanceNotification = exports.sendLeaveApprovalNotification = exports.sendLeaveApplicationNotification = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = require("../database/db");
// 创建邮件发送器（延迟创建，确保环境变量已加载）
const getTransporter = () => {
    const emailUser = process.env.EMAIL_USER || 'roboticlab@qq.com';
    const emailPass = process.env.EMAIL_PASS || 'ghujiouvebmdcieh';
    console.log(`Creating email transporter with user: ${emailUser}`);
    return nodemailer_1.default.createTransport({
        host: 'smtp.qq.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });
};
// 发送邮件的通用函数
const sendEmail = async (to, subject, html) => {
    try {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        console.log(`Attempting to send email to ${to}`);
        console.log(`Email config - USER: ${emailUser ? 'SET' : 'NOT SET'}, PASS: ${emailPass ? 'SET' : 'NOT SET'}`);
        // 检查邮件配置是否有效
        if (!emailUser || !emailPass) {
            console.warn('⚠️ Email configuration not found in environment variables, skipping email sending');
            console.warn('Please set EMAIL_USER and EMAIL_PASS in .env file');
            return;
        }
        const transporter = getTransporter();
        const mailOptions = {
            from: `"实验室管理系统" <${emailUser}>`,
            to: Array.isArray(to) ? to.join(',') : to,
            subject,
            html,
        };
        console.log(`Sending email with subject: ${subject}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${to}`);
    }
    catch (error) {
        console.error('❌ Email sending failed:', error);
        // 不抛出错误，避免影响主流程
        console.warn('Email feature is currently unavailable. Please check your email configuration.');
    }
};
exports.sendEmail = sendEmail;
// 发送请假申请通知给所有管理员
const sendLeaveApplicationNotification = async (applicantName, studentId, leaveType, startTime, endTime, duration, reason, leaveId) => {
    // 从数据库获取所有管理员的邮箱
    const adminEmails = await new Promise((resolve, reject) => {
        db_1.db.all('SELECT email FROM users WHERE isAdmin = 1', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows.map(row => row.email));
        });
    });
    if (adminEmails.length === 0) {
        console.warn('No admin emails found, skipping notification');
        return;
    }
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:2111';
    const subject = `【请假申请提醒】用户 ${applicantName} 提交了新的请假申请`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">新的请假申请待审批</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>申请人姓名：</strong>${applicantName}</p>
        <p><strong>学号/ID：</strong>${studentId}</p>
        <p><strong>请假类型：</strong>${leaveType}</p>
        <p><strong>请假时间：</strong>${startTime} 至 ${endTime}</p>
        <p><strong>请假时长：</strong>${duration}</p>
        <p><strong>请假事由：</strong>${reason}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/admin/leave-approval" 
           style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          立即审批
        </a>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        此邮件由实验室管理系统自动发送，请勿回复。
      </p>
    </div>
  `;
    // 发送给所有管理员
    await (0, exports.sendEmail)(adminEmails, subject, html);
    console.log(`Leave application notification sent to ${adminEmails.length} admin(s)`);
};
exports.sendLeaveApplicationNotification = sendLeaveApplicationNotification;
// 发送审批结果通知给申请人
const sendLeaveApprovalNotification = async (applicantEmail, applicantName, leaveType, startTime, endTime, reason, status, rejectReason) => {
    const statusText = status === 'approved' ? '已批准' : '已驳回';
    const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
    const subject = `【审批结果通知】您的请假申请已处理`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">请假申请审批结果</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>申请人：</strong>${applicantName}</p>
        <p><strong>请假类型：</strong>${leaveType}</p>
        <p><strong>请假时间：</strong>${startTime} 至 ${endTime}</p>
        <p><strong>请假事由：</strong>${reason}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: white; border-left: 4px solid ${statusColor}; border-radius: 4px;">
          <p style="margin: 0;"><strong>审批结果：</strong><span style="color: ${statusColor}; font-size: 18px; font-weight: bold;">${statusText}</span></p>
          ${rejectReason ? `<p style="margin-top: 10px;"><strong>审批意见：</strong>${rejectReason}</p>` : ''}
        </div>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        此邮件由实验室管理系统自动发送，请勿回复。
      </p>
    </div>
  `;
    await (0, exports.sendEmail)(applicantEmail, subject, html);
};
exports.sendLeaveApprovalNotification = sendLeaveApprovalNotification;
// 发送点名通知
const sendAttendanceNotification = async (userEmails, attendanceName, deadline, locationName, latitude, longitude, radius) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:2111';
    const subject = `【点名提醒】${attendanceName} 已经开始`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">点名签到提醒</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>点名主题：</strong>${attendanceName}</p>
        <p><strong>签到截止时间：</strong><span style="color: #dc2626; font-weight: bold;">${deadline}</span></p>
        <p><strong>签到地点要求：</strong>${locationName}</p>
        <p><strong>签到范围：</strong>距离指定地点 ${radius} 米内</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
          坐标：${latitude}, ${longitude}
        </p>
      </div>
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          ⚠️ <strong>重要提示：</strong>请确保您在指定地点范围内进行签到，否则签到将无效。未签到者将自动扣除相应积分。
        </p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/attendance" 
           style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          立即签到
        </a>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        此邮件由实验室管理系统自动发送，请勿回复。
      </p>
    </div>
  `;
    await (0, exports.sendEmail)(userEmails, subject, html);
};
exports.sendAttendanceNotification = sendAttendanceNotification;
// 发送异议提交通知给管理员
const sendPointRequestSubmitNotification = async (applicantName, studentId, points, reason, requestId) => {
    // 从数据库获取所有管理员的邮箱
    const adminEmails = await new Promise((resolve, reject) => {
        db_1.db.all('SELECT email FROM users WHERE isAdmin = 1', (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows.map(row => row.email));
        });
    });
    if (adminEmails.length === 0) {
        console.warn('No admin emails found, skipping notification');
        return;
    }
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:2111';
    const subject = `【积分异议提醒】用户 ${applicantName} 提交了新的积分异议`;
    const pointsColor = points > 0 ? '#10b981' : '#ef4444';
    const pointsText = points > 0 ? `+${points}` : `${points}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">新的积分异议待处理</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>申请人姓名：</strong>${applicantName}</p>
        <p><strong>学号/ID：</strong>${studentId}</p>
        <p><strong>申请调整积分：</strong><span style="color: ${pointsColor}; font-weight: bold; font-size: 18px;">${pointsText} 分</span></p>
        <p><strong>异议理由：</strong>${reason}</p>
      </div>
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;">
          ⚠️ <strong>提示：</strong>请及时处理用户的积分异议申请。
        </p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${baseUrl}/admin?tab=requests" 
           style="background-color: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          立即处理
        </a>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        此邮件由实验室管理系统自动发送，请勿回复。
      </p>
    </div>
  `;
    await (0, exports.sendEmail)(adminEmails, subject, html);
    console.log(`Point request submit notification sent to ${adminEmails.length} admin(s)`);
};
exports.sendPointRequestSubmitNotification = sendPointRequestSubmitNotification;
// 发送异议处理结果通知
const sendPointRequestNotification = async (userEmail, userName, points, reason, status, adminComment) => {
    const statusText = status === 'approved' ? '已批准' : '已拒绝';
    const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
    const subject = `【异议处理结果】您的积分异议申请已处理`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">积分异议处理结果</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>申请人：</strong>${userName}</p>
        <p><strong>申请积分：</strong><span style="color: ${points > 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">${points > 0 ? '+' : ''}${points} 分</span></p>
        <p><strong>申请理由：</strong>${reason}</p>
        <div style="margin-top: 20px; padding: 15px; background-color: white; border-left: 4px solid ${statusColor}; border-radius: 4px;">
          <p style="margin: 0;"><strong>处理结果：</strong><span style="color: ${statusColor}; font-size: 18px; font-weight: bold;">${statusText}</span></p>
          ${adminComment ? `<p style="margin-top: 10px;"><strong>管理员备注：</strong>${adminComment}</p>` : ''}
        </div>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        此邮件由实验室管理系统自动发送，请勿回复。
      </p>
    </div>
  `;
    await (0, exports.sendEmail)(userEmail, subject, html);
};
exports.sendPointRequestNotification = sendPointRequestNotification;
exports.default = {
    sendEmail: exports.sendEmail,
    sendLeaveApplicationNotification: exports.sendLeaveApplicationNotification,
    sendLeaveApprovalNotification: exports.sendLeaveApprovalNotification,
    sendAttendanceNotification: exports.sendAttendanceNotification,
    sendPointRequestSubmitNotification: exports.sendPointRequestSubmitNotification,
    sendPointRequestNotification: exports.sendPointRequestNotification,
};
