require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedDemoData() {
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

  console.log('Connecting to ' + (process.env.DB_HOST || 'localhost') + '...');

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 1. Insert Demo Students (IDs 9001 - 9006)
    await conn.query(`
      INSERT INTO Student (student_id, name, email, contact_info, roll_no, branch, semester, linkedin_url, github_url, leetcode_url) VALUES
      (9001, 'Shresth Vishwakarma', 'svishwakarma@thapar.edu', 'Discord: @shresth_v | WhatsApp: +91 98123 45678', '102203001', 'COE', 5, 'https://linkedin.com/in/shresth-v', 'https://github.com/shresthvishwa', 'https://leetcode.com/shresthv'),
      (9002, 'Aarav Sharma', 'asharma@thapar.edu', 'Discord: @aarav_ml | Phone: +91 98765 43210', '102203011', 'COE', 5, 'https://linkedin.com', 'https://github.com', NULL),
      (9003, 'Diya Patel', 'dpatel@thapar.edu', 'Discord: @diya_dev | Phone: +91 98765 43211', '102203045', 'COE', 5, 'https://linkedin.com', 'https://github.com', NULL),
      (9004, 'Rohan Verma', 'rverma@thapar.edu', 'Discord: @rohan_db | Phone: +91 98765 43212', '102203102', 'COE', 5, NULL, 'https://github.com', 'https://leetcode.com'),
      (9005, 'Ananya Gupta', 'agupta@thapar.edu', 'Discord: @ananya_ai | Phone: +91 98765 43213', '102203189', 'ENC', 5, 'https://linkedin.com', NULL, NULL),
      (9006, 'Kabir Singh', 'ksingh@thapar.edu', 'Discord: @kabir_mobile | Phone: +91 98765 43214', '102203220', 'COE', 5, 'https://linkedin.com', 'https://github.com', NULL)
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // 2. Insert Student Skills & Credentials
    await conn.query(`
      INSERT INTO StudentSkill (student_id, skill_id, proficiency, credential_url) VALUES
      (9001, 5, 'advanced', 'https://coursera.org/verify/python-spec'),
      (9001, 1, 'advanced', 'https://hackerrank.com/certificates/sql-advanced'),
      (9001, 10, 'advanced', NULL),
      (9001, 16, 'intermediate', NULL),

      (9002, 5, 'advanced', NULL),
      (9002, 6, 'intermediate', 'https://coursera.org/verify/pytorch-dl'),
      (9002, 1, 'advanced', NULL),
      (9002, 8, 'intermediate', NULL),

      (9003, 9, 'advanced', 'https://coursera.org/verify/react-meta'),
      (9003, 10, 'advanced', NULL),
      (9003, 11, 'intermediate', NULL),

      (9004, 1, 'advanced', NULL),
      (9004, 2, 'intermediate', NULL),
      (9004, 18, 'intermediate', 'https://docker.com/verify/certified-associate'),

      (9005, 5, 'advanced', NULL),
      (9005, 6, 'advanced', NULL),
      (9005, 7, 'intermediate', NULL),

      (9006, 13, 'advanced', 'https://flutter.dev/proof'),
      (9006, 14, 'intermediate', NULL)
      ON DUPLICATE KEY UPDATE proficiency=VALUES(proficiency);
    `);

    // 3. Insert Demo Teams (IDs 9001 - 9003)
    await conn.query(`
      INSERT INTO Team (team_id, team_name, course_id, created_by, status) VALUES
      (9001, 'NeuralDB Innovators', 1, 9003, 'open'),
      (9002, 'Agile WebCrafters', 4, 9004, 'open'),
      (9003, 'Visionary ML Group', 3, 9005, 'open')
      ON DUPLICATE KEY UPDATE team_name=VALUES(team_name);
    `);

    // 4. Insert Team Memberships
    await conn.query(`
      INSERT INTO TeamMembership (team_id, student_id) VALUES
      (9001, 9003),
      (9002, 9004),
      (9002, 9006),
      (9003, 9005)
      ON DUPLICATE KEY UPDATE team_id=VALUES(team_id);
    `);

    // 5. Insert Open Slots (IDs 9001 - 9004)
    await conn.query(`
      INSERT INTO Slot (slot_id, team_id, slot_status) VALUES
      (9001, 9001, 'open'),
      (9002, 9001, 'open'),
      (9003, 9002, 'open'),
      (9004, 9003, 'open')
      ON DUPLICATE KEY UPDATE slot_status=VALUES(slot_status);
    `);

    // 6. Insert Slot Required Skills
    await conn.query(`
      INSERT INTO SlotRequiredSkill (slot_id, skill_id) VALUES
      (9001, 5), (9001, 1),
      (9002, 13),
      (9003, 5), (9003, 6),
      (9004, 9), (9004, 10)
      ON DUPLICATE KEY UPDATE slot_id=VALUES(slot_id);
    `);

    // 7. Insert Connection Requests
    await conn.query(`
      INSERT INTO ConnectionRequest (request_id, slot_id, student_id, sender_type, status, message) VALUES
      (9001, 9001, 9001, 'student', 'pending', 'Hi Diya, I have Python and MySQL skills from my DBMS coursework!'),
      (9002, 9003, 9002, 'student', 'pending', 'Hey Rohan, I can build the PyTorch ML models for Agile WebCrafters!')
      ON DUPLICATE KEY UPDATE status=VALUES(status);
    `);

    // 8. Insert Past Collaborations
    await conn.query(`
      INSERT INTO PastCollaboration (student_a_id, student_b_id, team_id) VALUES
      (9004, 9006, 9002)
      ON DUPLICATE KEY UPDATE team_id=VALUES(team_id);
    `);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('SUCCESS: Demo data seeded for LinkedIn showcase!');
  } catch (err) {
    console.error('Error seeding demo data:', err.message);
  } finally {
    await conn.end();
  }
}

seedDemoData();
