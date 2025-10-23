import { db } from './db';

const migrate = async () => {
  try {
    // 检查 isManual 字段是否已存在
    const tableInfo = await new Promise<any[]>((resolve, reject) => {
      db.all('PRAGMA table_info(daily_attendance_triggers)', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const hasIsManual = tableInfo.some((col: any) => col.name === 'isManual');

    if (!hasIsManual) {
      // 添加 isManual 字段
      await new Promise<void>((resolve, reject) => {
        db.run('ALTER TABLE daily_attendance_triggers ADD COLUMN isManual INTEGER DEFAULT 0', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('Added isManual column to daily_attendance_triggers table');
    } else {
      console.log('isManual column already exists');
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();

