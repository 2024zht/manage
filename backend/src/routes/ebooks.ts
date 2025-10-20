import { Router, Response } from 'express';
import { db } from '../database/db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);
const router = Router();

// 从Cloudflare Worker获取电子书列表
const fetchBooksFromWorker = async () => {
  try {
    const workerUrl = process.env.CF_WORKER_URL || 'https://divine-glade-0efd.hengtangzhao.workers.dev/api';
    const response = await axios.get(workerUrl + '/');
    
    // 解析XML
    const xml = response.data;
    const books: any[] = [];
    
    // 简单的XML解析（提取Key和Size）
    const keyMatches = xml.matchAll(/<Key>(.*?)<\/Key>/g);
    const sizeMatches = xml.matchAll(/<Size>(.*?)<\/Size>/g);
    const modifiedMatches = xml.matchAll(/<LastModified>(.*?)<\/LastModified>/g);
    
    const keys = Array.from(keyMatches).map((m) => (m as RegExpMatchArray)[1]);
    const sizes = Array.from(sizeMatches).map((m) => parseInt((m as RegExpMatchArray)[1]));
    const dates = Array.from(modifiedMatches).map((m) => (m as RegExpMatchArray)[1]);
    
    for (let i = 0; i < keys.length; i++) {
      books.push({
        filename: keys[i],
        originalName: keys[i],
        fileSize: sizes[i],
        uploadedAt: dates[i],
        b2Synced: true
      });
    }
    
    return books;
  } catch (error) {
    console.error('Failed to fetch books from Worker:', error);
    return [];
  }
};

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'ebooks');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // 使用时间戳和原始文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  // 取消文件大小限制
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // 允许的文件类型
    const allowedTypes = ['.pdf', '.epub', '.mobi', '.azw3', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 获取所有电子书列表（从Cloudflare Worker）
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // 从Worker获取电子书列表
    const books = await fetchBooksFromWorker();
    res.json(books);
  } catch (error) {
    console.error('Get ebooks error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 上传电子书（管理员）
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const file = req.file;
    const userId = req.user!.userId;

    // 1. 保存文件信息到数据库
    const insertId = await new Promise<number>((resolve, reject) => {
      db.run(
        'INSERT INTO ebooks (filename, originalName, fileSize, uploadedBy) VALUES (?, ?, ?, ?)',
        [file.filename, file.originalname, file.size, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // 2. 尝试同步到 Backblaze B2
    let b2Synced = false;
    let b2Path = '';
    let syncError: string | null = null;

    try {
      // 检查环境变量
      const b2Bucket = process.env.B2_BUCKET_NAME || 'robotlib';

      if (b2Bucket) {
        // 构建安全的命令
        const localPath = file.path;
        const remotePath = `b2://${b2Bucket}/${file.originalname}`;

        console.log(`Syncing to B2: ${localPath} -> ${remotePath}`);

        // 执行b2 sync命令
        const { stdout, stderr } = await execAsync(
          `b2 sync "${localPath}" "${remotePath}"`,
          { timeout: 60000 } // 60秒超时
        );

        console.log('B2 sync stdout:', stdout);
        if (stderr) console.log('B2 sync stderr:', stderr);

        b2Synced = true;
        b2Path = remotePath;

        // 更新数据库
        await new Promise<void>((resolve, reject) => {
          db.run(
            'UPDATE ebooks SET b2Synced = 1, b2Path = ? WHERE id = ?',
            [b2Path, insertId],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // 删除本地临时文件
        fs.unlinkSync(file.path);
        console.log('Local file deleted after successful B2 sync');
      } else {
        console.warn('B2_BUCKET_NAME not configured, skipping B2 sync');
        syncError = 'B2存储未配置';
      }
    } catch (error: any) {
      console.error('B2 sync error:', error);
      syncError = error.message || 'B2同步失败';
      // 保留本地文件以便排查
    }

    res.status(201).json({
      message: '文件上传成功',
      id: insertId,
      filename: file.filename,
      originalName: file.originalname,
      b2Synced,
      b2Path,
      syncError
    });
  } catch (error) {
    console.error('Upload ebook error:', error);
    // 清理上传的文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: '上传失败' });
  }
});

// 删除电子书（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 获取电子书信息
    const ebook = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM ebooks WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!ebook) {
      return res.status(404).json({ error: '电子书不存在' });
    }

    // 删除本地文件（如果存在）
    const localPath = path.join(process.cwd(), 'uploads', 'ebooks', ebook.filename);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    // 从数据库删除
    await new Promise<void>((resolve, reject) => {
      db.run('DELETE FROM ebooks WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete ebook error:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

// 生成下载链接（直接使用文件名）
router.get('/download/:filename', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    
    // 生成Cloudflare Worker下载链接
    const workerUrl = process.env.CF_WORKER_URL || 'https://divine-glade-0efd.hengtangzhao.workers.dev/api';
    // URL编码文件名
    const encodedFilename = encodeURIComponent(decodeURIComponent(filename));
    const downloadUrl = `${workerUrl}/${encodedFilename}`;

    res.json({
      downloadUrl,
      filename: decodeURIComponent(filename)
    });
  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;

