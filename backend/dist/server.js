"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const rules_1 = __importDefault(require("./routes/rules"));
const leaves_1 = __importDefault(require("./routes/leaves"));
const ebooks_1 = __importDefault(require("./routes/ebooks"));
const attendances_1 = __importDefault(require("./routes/attendances"));
const scheduler_1 = require("./services/scheduler");
// 加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 中间件
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 路由
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/rules', rules_1.default);
app.use('/api/leaves', leaves_1.default);
app.use('/api/ebooks', ebooks_1.default);
app.use('/api/attendances', attendances_1.default);
// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: '服务器内部错误' });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // 启动点名定时任务调度器
    (0, scheduler_1.startAttendanceScheduler)();
});
