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

  console.log('Purging all demo data and student accounts from ' + (process.env.DB_HOST || 'localhost') + '...');

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    await conn.query(`
      TRUNCATE TABLE ConnectionRequest;
      TRUNCATE TABLE PastCollaboration;
      TRUNCATE TABLE SlotRequiredSkill;
      TRUNCATE TABLE Slot;
      TRUNCATE TABLE TeamMembership;
      TRUNCATE TABLE Team;
      TRUNCATE TABLE StudentSkill;
      TRUNCATE TABLE Student;
    `);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('SUCCESS: All temporary demo data and accounts removed cleanly!');
  } catch (err) {
    console.error('Error removing demo data:', err.message);
  } finally {
    await conn.end();
  }
}

removeDemoData();
