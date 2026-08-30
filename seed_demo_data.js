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

    // Truncate to ensure clean slate for demo IDs
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

    // 1. Insert Demo Students (IDs 1 to 6)
    await conn.query(`
      INSERT INTO Student (student_id, name, email, contact_info, roll_no, branch, semester, linkedin_url, github_url, leetcode_url) VALUES
      (1, 'Shresth Vishwakarma', 'svishwakarma@thapar.edu', 'Discord: @shresth_v | WhatsApp: +91 98123 45678', '102203001', 'COE', 5, 'https://linkedin.com/in/shresth-v', 'https://github.com/shresthvishwa', 'https://leetcode.com/shresthv'),
      (2, 'Aarav Sharma', 'asharma@thapar.edu', 'Discord: @aarav_ml | Phone: +91 98765 43210', '102203011', 'COE', 5, 'https://linkedin.com', 'https://github.com', NULL),
      (3, 'Diya Patel', 'dpatel@thapar.edu', 'Discord: @diya_dev | Phone: +91 98765 43211', '102203045', 'COE', 5, 'https://linkedin.com', 'https://github.com', NULL),
      (4, 'Rohan Verma', 'rverma@thapar.edu', 'Discord: @rohan_db | Phone: +91 98765 43212', '102203102', 'COE', 5, NULL, 'https://github.com', 'https://leetcode.com'),
      (5, 'Ananya Gupta', 'agupta@thapar.edu', 'Discord: @ananya_ai | Phone: +91 98765 43213', '102203189', 'ENC', 5, 'https://linkedin.com', NULL, NULL),
      (6, 'Kabir Singh', 'ksingh@thapar.edu', 'Discord: @kabir_mobile | Phone: +91 98765 43214', '102203220', 'COE', 5, 'https://linkedin.com', 'https://github.com', NULL);
    `);

    // 2. Insert Student Skills & Credentials
    await conn.query(`
      INSERT INTO StudentSkill (student_id, skill_id, proficiency, credential_url) VALUES
      (1, 5, 'advanced', 'https://coursera.org/verify/python-spec'),
      (1, 1, 'advanced', 'https://hackerrank.com/certificates/sql-advanced'),
      (1, 10, 'advanced', NULL),
      (1, 16, 'intermediate', NULL),

      (2, 5, 'advanced', NULL),
      (2, 6, 'intermediate', 'https://coursera.org/verify/pytorch-dl'),
      (2, 1, 'advanced', NULL),
      (2, 8, 'intermediate', NULL),

      (3, 9, 'advanced', 'https://coursera.org/verify/react-meta'),
      (3, 10, 'advanced', NULL),
      (3, 11, 'intermediate', NULL),

      (4, 1, 'advanced', NULL),
      (4, 2, 'intermediate', NULL),
      (4, 18, 'intermediate', 'https://docker.com/verify/certified-associate'),

      (5, 5, 'advanced', NULL),
      (5, 6, 'advanced', NULL),
      (5, 7, 'intermediate', NULL),

      (6, 13, 'advanced', 'https://flutter.dev/proof'),
      (6, 14, 'intermediate', NULL);
    `);

    // 3. Insert Demo Teams
    // Team 1 created by Shresth (1) for DBMS (UCS416)
    // Team 2 created by Rohan (4) for Software Engineering (UCS503)
    // Team 3 created by Ananya (5) for ML & DL (UCS608)
    await conn.query(`
      INSERT INTO Team (team_id, team_name, course_id, created_by, status) VALUES
      (1, 'NeuralDB Innovators', 1, 1, 'open'),
      (2, 'Agile WebCrafters', 4, 4, 'open'),
      (3, 'Visionary ML Group', 3, 5, 'open');
    `);

    // 4. Insert Team Memberships
    await conn.query(`
      INSERT INTO TeamMembership (team_id, student_id) VALUES
      (1, 1),
      (2, 4),
      (2, 6),
      (3, 5);
    `);

    // 5. Insert Open Slots
    await conn.query(`
      INSERT INTO Slot (slot_id, team_id, slot_status) VALUES
      (1, 1, 'open'),
      (2, 1, 'open'),
      (3, 2, 'open'),
      (4, 3, 'open');
    `);

    // 6. Insert Slot Required Skills
    await conn.query(`
      INSERT INTO SlotRequiredSkill (slot_id, skill_id) VALUES
      (1, 5), (1, 1),
      (2, 13),
      (3, 5), (3, 6),
      (4, 9), (4, 10);
    `);

    // 7. Insert Connection Requests
    await conn.query(`
      INSERT INTO ConnectionRequest (request_id, slot_id, student_id, sender_type, status, message) VALUES
      (1, 1, 3, 'student', 'pending', 'Hi Shresth, I have React.js and Node.js skills for NeuralDB!'),
      (2, 2, 6, 'student', 'pending', 'Hey Shresth, interested in building the Flutter mobile UI for NeuralDB!'),
      (3, 3, 2, 'student', 'pending', 'Hey Rohan, I can build the PyTorch ML models for Agile WebCrafters!');
    `);

    // 8. Insert Past Collaborations
    await conn.query(`
      INSERT INTO PastCollaboration (student_a_id, student_b_id, team_id) VALUES
      (1, 4, 2),
      (1, 6, 2);
    `);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('SUCCESS: Demo data seeded cleanly!');
  } catch (err) {
    console.error('Error seeding demo data:', err.message);
  } finally {
    await conn.end();
  }
}

seedDemoData();
