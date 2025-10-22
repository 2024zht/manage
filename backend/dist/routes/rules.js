"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../database/db");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// 获取所有规则
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const rules = await (0, db_1.getAll)('SELECT * FROM rules ORDER BY createdAt DESC');
        res.json(rules);
    }
    catch (error) {
        console.error('Get rules error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 获取单个规则
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    const ruleId = parseInt(req.params.id);
    try {
        const rule = await (0, db_1.getOne)('SELECT * FROM rules WHERE id = ?', [ruleId]);
        if (!rule) {
            return res.status(404).json({ error: '规则不存在' });
        }
        res.json(rule);
    }
    catch (error) {
        console.error('Get rule error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 创建规则（管理员）
router.post('/', auth_1.authenticateToken, auth_1.requireAdmin, (0, express_validator_1.body)('name').trim().notEmpty().withMessage('规则名称不能为空'), (0, express_validator_1.body)('points').isInt().withMessage('积分必须是整数'), (0, express_validator_1.body)('description').optional().trim(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, points, description } = req.body;
    try {
        await (0, db_1.runQuery)('INSERT INTO rules (name, points, description) VALUES (?, ?, ?)', [name, points, description || '']);
        res.status(201).json({ message: '规则已创建' });
    }
    catch (error) {
        console.error('Create rule error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 更新规则（管理员）
router.put('/:id', auth_1.authenticateToken, auth_1.requireAdmin, (0, express_validator_1.body)('name').trim().notEmpty().withMessage('规则名称不能为空'), (0, express_validator_1.body)('points').isInt().withMessage('积分必须是整数'), (0, express_validator_1.body)('description').optional().trim(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const ruleId = parseInt(req.params.id);
    const { name, points, description } = req.body;
    try {
        const rule = await (0, db_1.getOne)('SELECT * FROM rules WHERE id = ?', [ruleId]);
        if (!rule) {
            return res.status(404).json({ error: '规则不存在' });
        }
        await (0, db_1.runQuery)('UPDATE rules SET name = ?, points = ?, description = ? WHERE id = ?', [name, points, description || '', ruleId]);
        res.json({ message: '规则已更新' });
    }
    catch (error) {
        console.error('Update rule error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
// 删除规则（管理员）
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, async (req, res) => {
    const ruleId = parseInt(req.params.id);
    try {
        await (0, db_1.runQuery)('DELETE FROM rules WHERE id = ?', [ruleId]);
        res.json({ message: '规则已删除' });
    }
    catch (error) {
        console.error('Delete rule error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});
exports.default = router;
