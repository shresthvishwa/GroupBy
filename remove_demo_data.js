require('dotenv').config();
const mysql = require('mysql2/promise');

async function removeDemoData() {
  const isRemoteDb = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1';
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'groupby',
    ssl: (isRemoteDb || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true
  });

  console.log('Purging demo data (IDs >= 9000) from ' + (process.env.DB_HOST || 'localhost') + '...');

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    await conn.query(`
      DELETE FROM ConnectionRequest WHERE request_id >= 9000 OR student_id >= 9000 OR slot_id >= 9000;
      DELETE FROM PastCollaboration WHERE student_a_id >= 9000 OR student_b_id >= 9000 OR team_id >= 9000;
      DELETE FROM SlotRequiredSkill WHERE slot_id >= 9000;
      DELETE FROM Slot WHERE slot_id >= 9000 OR team_id >= 9000 OR filled_by >= 9000;
      DELETE FROM TeamMembership WHERE team_id >= 9000 OR student_id >= 9000;
      DELETE FROM Team WHERE team_id >= 9000 OR created_by >= 9000;
      DELETE FROM StudentSkill WHERE student_id >= 9000;
      DELETE FROM Student WHERE student_id >= 9000;
    `);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('SUCCESS: All temporary demo data removed cleanly!');
  } catch (err) {
    console.error('Error removing demo data:', err.message);
  } finally {
    await conn.end();
  }
}

removeDemoData();
