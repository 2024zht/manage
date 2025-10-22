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
const db_1 = require("./db");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// 清空书籍数据
async function clearEbooks() {
    try {
        // 删除数据库中的所有书籍记录
        await new Promise((resolve, reject) => {
            db_1.db.run('DELETE FROM ebooks', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        console.log('✓ 已清空数据库中的书籍记录');
        // 删除上传的文件
        const uploadsDir = path.join(__dirname, '../../uploads/ebooks');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                fs.unlinkSync(path.join(uploadsDir, file));
            }
            console.log(`✓ 已删除 ${files.length} 个书籍文件`);
        }
        console.log('\n书籍数据已全部清空！');
        process.exit(0);
    }
    catch (error) {
        console.error('清空失败:', error);
        process.exit(1);
    }
}
clearEbooks();
