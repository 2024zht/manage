import nodemailer from 'nodemailer';
import { db } from '../database/db';

// 配置邮件发送器
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'roboticlab@qq.com',
    pass: process.env.EMAIL_PASS || 'ghujiouvebmdcieh', // QQ邮箱授权码
  },
});

// 发送邮件的通用函数
export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: `"实验室管理系统" <${process.env.EMAIL_USER || 'roboticlab@qq.com'}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// 发送请假申请通知给所有管理员
export const sendLeaveApplicationNotification = async (
  applicantName: string,
  studentId: string,
  leaveType: string,
  startTime: string,
  endTime: string,
  duration: string,
  reason: string,
  leaveId: number
): Promise<void> => {
  // 从数据库获取所有管理员的邮箱
  const adminEmails = await new Promise<string[]>((resolve, reject) => {
    db.all('SELECT email FROM users WHERE isAdmin = 1', (err, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.email));
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
  await sendEmail(adminEmails, subject, html);
  console.log(`Leave application notification sent to ${adminEmails.length} admin(s)`);
};

// 发送审批结果通知给申请人
export const sendLeaveApprovalNotification = async (
  applicantEmail: string,
  applicantName: string,
  leaveType: string,
  startTime: string,
  endTime: string,
  reason: string,
  status: 'approved' | 'rejected',
  rejectReason?: string
): Promise<void> => {
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

  await sendEmail(applicantEmail, subject, html);
};

// 发送点名通知
export const sendAttendanceNotification = async (
  userEmails: string[],
  attendanceName: string,
  deadline: string,
  locationName: string,
  latitude: number,
  longitude: number,
  radius: number
): Promise<void> => {
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

  await sendEmail(userEmails, subject, html);
};

export default {
  sendEmail,
  sendLeaveApplicationNotification,
  sendLeaveApprovalNotification,
  sendAttendanceNotification,
};

