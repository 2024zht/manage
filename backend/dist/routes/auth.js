"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_validator_1 = require("express-validator");
const db_1 = require("../database/db");
const router = express_1.default.Router();
// 注册
router.post('/register', (0, express_validator_1.body)('username').trim().isLength({ min: 3, max: 30 }).withMessage('用户名长度必须在3-30个字符之间'), (0, express_validator_1.body)('name').trim().notEmpty().withMessage('姓名不能为空'), (0, express_validator_1.body)('studentId').trim().notEmpty().withMessage('学号不能为空'), (0, express_validator_1.body)('className').trim().notEmpty().withMessage('班级不能为空'), (0, express_validator_1.body)('grade').trim().notEmpty().withMessage('年级不能为空'), (0, express_validator_1.body)('email').isEmail().withMessage('邮箱格式不正确'), (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('密码长度至少为6个字符'), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, name, studentId, className, grade, email, password } = req.body;
    try {
        // 检查用户名、学号或邮箱是否已存在
        const existingUser = await (0, db_1.getOne)('SELECT * FROM users WHERE username = ? OR email = ? OR studentId = ?', [username, email, studentId]);
        if (existingUser) {
            return res.status(400).json({ error: '用户名、学号或邮箱已存在' });
        }
        // 加密密码
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // 创建用户
        await (0, db_1.runQuery)('INSERT INTO users (username, name, studentId, className, grade, email, password, isAdmin, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [username, name, studentId, className, grade, email, hashedPassword, 0, 0]);
        res.status(201).json({ message: '注册成功' });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 登录
router.post('/login', (0, express_validator_1.body)('username').trim().notEmpty().withMessage('用户名不能为空'), (0, express_validator_1.body)('password').notEmpty().withMessage('密码不能为空'), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    try {
        // 查找用户
        const user = await (0, db_1.getOne)('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        // 验证密码
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        // 生成JWT
        const secret = process.env.JWT_SECRET || 'default-secret-key';
        const payload = {
            userId: user.id,
            username: user.username,
            isAdmin: Boolean(user.isAdmin)
        };
        const token = jsonwebtoken_1.default.sign(payload, secret, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                studentId: user.studentId,
                className: user.className,
                grade: user.grade,
                email: user.email,
                isAdmin: Boolean(user.isAdmin),
                points: user.points
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
exports.default = router;
