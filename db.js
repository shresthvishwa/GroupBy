const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'groupby',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// Test DB Connection
pool.getConnection()
  .then(conn => {
    console.log(`[DB] Connected to MySQL database "${process.env.DB_NAME || 'groupby'}" successfully.`);
    conn.release();
  })
  .catch(err => {
    console.warn(`[DB Warning] Could not connect to MySQL database: ${err.message}`);
    console.warn(`[DB Warning] Please ensure MySQL is running and execute groupby_schema.sql & groupby_seed.sql`);
  });

module.exports = pool;
