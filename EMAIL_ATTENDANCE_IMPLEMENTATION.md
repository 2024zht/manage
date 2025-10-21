# 邮件通知与智能点名模块实现文档

## 📧 模块一：自动化邮件通知

### 功能概述
实现了请假申请与审批结果的自动化邮件通知系统。

### 已实现功能

#### 1. 邮件服务配置
- **文件**: `backend/src/services/email.ts`
- **邮件服务商**: 腾讯QQ邮箱
- **发件人**: roboticlab@qq.com
- **授权码**: ghujiouvebmdcieh

#### 2. 请假申请通知（流程A）
- **触发条件**: 用户成功提交请假申请
- **通知对象**: **所有管理员**（从数据库查询 `isAdmin = 1` 的用户邮箱）
- **邮件内容**:
  - 申请人姓名及学号
  - 请假类型
  - 请假起止时间
  - 请假时长
  - 请假事由
  - 审批页面直达链接

#### 3. 审批结果通知（流程B）
- **触发条件**: 管理员完成审批操作
- **通知对象**: 申请人注册邮箱
- **邮件内容**:
  - 申请人姓名
  - 原始请假信息
  - 审批结果（批准/驳回）
  - 管理员审批意见

### 配置说明

在 `backend/.env` 文件中添加：

```env
EMAIL_USER=roboticlab@qq.com
EMAIL_PASS=ghujiouvebmdcieh
ADMIN_EMAIL=roboticlab@qq.com
FRONTEND_URL=http://your-domain.com
```

---

## 🎯 模块二：智能化点名系统

### 功能概述
建立了基于地理围栏的自动化点名系统，支持定时任务和积分联动。

### 数据库表结构

#### attendances 表（点名任务）
- id: 主键
- name: 点名主题
- description: 描述
- startTime: 开始时间
- endTime: 结束时间
- locationName: 地点名称
- latitude: 纬度
- longitude: 经度
- radius: 签到半径（米）
- penaltyPoints: 缺席扣分
- createdBy: 创建人
- notificationSent: 是否已发送通知
- completed: 是否已完成

#### attendance_records 表（签到记录）
- id: 主键
- attendanceId: 点名任务ID
- userId: 用户ID
- latitude: 签到时的纬度
- longitude: 签到时的经度
- signedAt: 签到时间

### 已实现功能

#### 1. 地理围栏签到
- **算法**: Haversine公式计算两点距离
- **验证**: 签到时实时验证用户位置是否在允许范围内
- **精度**: 支持高精度定位（enableHighAccuracy）

#### 2. 定时点名任务
- **创建**: 管理员可设置点名主题、时间、地点、范围
- **调度**: 使用 node-cron 每分钟检查任务状态
- **通知**: 到达开始时间自动发送邮件给所有学生

#### 3. 自动通知
- **触发时机**: 点名开始时
- **通知对象**: **所有非管理员用户**（从数据库查询 `isAdmin = 0` 的用户邮箱）
- **通知内容**:
  - 点名主题
  - 签到截止时间
  - 地理位置要求
  - 签到范围
  - 签到链接

#### 4. 自动扣分
- **触发时机**: 点名结束时
- **扣分逻辑**:
  - 自动比对应签到与已签到用户
  - 对未签到用户扣除预设积分
  - 记录扣分日志到 point_logs 表
- **可配置**: 每个点名任务可设置不同的扣分值

### API 接口

#### 管理员接口
- `POST /api/attendances` - 创建点名任务
- `GET /api/attendances` - 获取所有点名任务
- `GET /api/attendances/:id` - 获取单个任务详情
- `PUT /api/attendances/:id` - 更新点名任务
- `DELETE /api/attendances/:id` - 删除点名任务

#### 学生接口
- `GET /api/attendances` - 获取点名任务列表（含签到状态）
- `POST /api/attendances/:id/sign` - 签到

### 前端组件

#### AttendanceManagement（管理员）
- **路径**: `frontend/src/components/AttendanceManagement.tsx`
- **功能**:
  - 创建/编辑/删除点名任务
  - 查看签到统计
  - 管理地理位置和扣分设置

#### Attendance（学生）
- **路径**: `frontend/src/components/Attendance.tsx`
- **功能**:
  - 查看所有点名任务
  - 实时地理定位签到
  - 查看签到状态和历史

---

## 🚀 部署步骤

### 1. 安装依赖

```bash
cd backend
npm install nodemailer @types/nodemailer node-cron @types/node-cron
```

### 2. 初始化数据库

```bash
cd backend
npm run init-db
```

### 3. 配置环境变量

编辑 `backend/.env`：

```env
# 邮件配置
EMAIL_USER=roboticlab@qq.com
EMAIL_PASS=ghujiouvebmdcieh
ADMIN_EMAIL=roboticlab@qq.com
FRONTEND_URL=http://your-domain.com

# 其他配置...
PORT=3010
JWT_SECRET=your-secret-key
NODE_ENV=production
```

### 4. 构建项目

```bash
# 后端
cd backend
npm run build

# 前端
cd frontend
npm run build
```

### 5. 启动服务

```bash
# 使用 PM2
pm2 start dist/server.js --name robotlab-backend --cwd ~/manage/backend
pm2 start "npx serve -s dist -l 2111" --name robotlab-frontend --cwd ~/manage/frontend

# 保存 PM2 配置
pm2 save
pm2 startup
```

---

## 📝 使用指南

### 管理员操作

1. **创建点名任务**:
   - 登录管理员账户
   - 进入"点名管理"页面
   - 点击"创建点名任务"
   - 填写点名信息（主题、时间、地点、坐标、范围、扣分）
   - 提交创建

2. **查看签到情况**:
   - 在点名列表中查看"已签到人数"
   - 点击任务卡片查看详细签到记录

### 学生操作

1. **接收点名通知**:
   - 点名开始时会收到邮件通知
   - 邮件包含所有关键信息和签到链接

2. **进行签到**:
   - 登录系统或点击邮件链接
   - 进入"点名签到"页面
   - 找到对应的点名任务
   - 点击"立即签到"
   - 允许浏览器获取位置权限
   - 系统自动验证位置并完成签到

### 系统自动化

1. **点名开始**（自动）:
   - 到达 startTime 时自动发送邮件通知
   - 所有非管理员用户都会收到邮件

2. **点名结束**（自动）:
   - 到达 endTime 时自动执行扣分
   - 未签到用户自动扣除对应积分
   - 扣分记录保存到积分日志

---

## 🔧 技术细节

### 地理距离计算

使用 Haversine 公式计算球面两点距离：

```typescript
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

  return R * c;
}
```

### 定时任务调度

```typescript
// 每分钟执行一次
cron.schedule('* * * * *', async () => {
  await checkAndNotifyAttendances();  // 检查并发送通知
  await checkAndCompleteAttendances(); // 检查并完成扣分
});
```

### 前端地理定位

```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    // 发送签到请求
  },
  (error) => {
    // 处理错误
  },
  {
    enableHighAccuracy: true,  // 高精度
    timeout: 10000,             // 10秒超时
    maximumAge: 0               // 不使用缓存
  }
);
```

---

## ⚠️ 注意事项

1. **邮件发送**:
   - 确保服务器能访问 smtp.qq.com
   - QQ邮箱授权码不是邮箱密码
   - 生产环境建议将敏感信息存储在环境变量中

2. **地理定位**:
   - HTTPS环境下定位更准确
   - 需要用户授权位置权限
   - 室内定位可能不够精确

3. **定时任务**:
   - 服务器时区设置要正确
   - PM2 重启后定时任务会自动恢复
   - 建议使用 UTC 时间或统一时区

4. **性能优化**:
   - 大量用户时考虑批量发送邮件
   - 定时任务间隔可根据需求调整
   - 数据库查询建议添加索引

---

## 📞 技术支持

如有问题，请检查：
1. 后端日志: `pm2 logs robotlab-backend`
2. 数据库状态: `sqlite3 backend/database.sqlite`
3. 邮件配置: `backend/.env`
4. 定时任务: 查看后端控制台输出

---

**实现完成时间**: 2025年10月21日
**文档版本**: 1.0

