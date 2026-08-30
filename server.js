const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper for hashing passwords securely
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to validate official TIET email domain
function isValidThaparEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith('@thapar.edu');
}

async function seedRichSkillsTaxonomy(conn) {
  const categories = [
    { name: 'General Domain & Specializations', skills: ['Frontend Development', 'Backend Development', 'Full Stack Development', 'Cybersecurity', 'Mobile Development', 'DevOps', 'Cloud Computing', 'Data Science', 'Artificial Intelligence', 'Database Management', 'Embedded Systems', 'Game Development', 'Blockchain'] },
    { name: 'Software Engineering & Web', skills: ['Python', 'JavaScript', 'TypeScript', 'C++', 'Java', 'C#', 'Go', 'Rust', 'React.js', 'Node.js', 'Express.js', 'Angular', 'Vue.js', 'Django', 'Flask', 'Spring Boot', 'Next.js', 'GraphQL', 'REST API Architecture', 'Microservices'] },
    { name: 'Artificial Intelligence & Data Science', skills: ['Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Computer Vision', 'Natural Language Processing (NLP)', 'Large Language Models (LLMs)', 'Pandas', 'NumPy', 'Scikit-Learn', 'OpenCV', 'Reinforcement Learning', 'Data Mining'] },
    { name: 'Database Systems & Big Data', skills: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Apache Kafka', 'Neo4j', 'Snowflake', 'Apache Spark', 'Firebase', 'Cassandra', 'SQL Optimization'] },
    { name: 'Cloud, DevOps & Infrastructure', skills: ['Docker', 'Kubernetes', 'AWS', 'Google Cloud Platform (GCP)', 'Azure', 'Terraform', 'CI/CD Pipelines', 'Linux System Admin', 'Nginx', 'Serverless Computing'] },
    { name: 'Mobile Application Development', skills: ['React Native', 'Flutter', 'Swift (iOS)', 'Kotlin (Android)', 'Android SDK', 'iOS Development'] },
    { name: 'UI/UX Design & Frontend Architecture', skills: ['Figma', 'User Research', 'Wireframing & Prototyping', 'UI/UX Design', 'CSS3 / TailwindCSS', 'Web Accessibility (a11y)', 'Adobe XD', 'Responsive Web Design'] },
    { name: 'Cybersecurity & Networking', skills: ['Penetration Testing', 'Ethical Hacking', 'Cryptography', 'Network Security', 'Web Application Security', 'OAuth 2.0 / JWT Auth', 'Wireshark', 'Information Security'] },
    { name: 'Core Engineering & Embedded Systems', skills: ['MATLAB & Simulink', 'ROS (Robot Operating System)', 'Embedded C', 'Verilog / VHDL', 'IoT Architecture', 'PLC Programming', 'AutoCAD', 'SolidWorks'] }
  ];

  for (let cat of categories) {
    let catId;
    const [catRows] = await conn.query("SELECT category_id FROM SkillCategory WHERE category_name = ?", [cat.name]);
    if (catRows.length > 0) {
      catId = catRows[0].category_id;
    } else {
      const [res] = await conn.query("INSERT INTO SkillCategory (category_name) VALUES (?)", [cat.name]);
      catId = res.insertId;
    }

    for (let skillName of cat.skills) {
      await conn.query("INSERT IGNORE INTO Skill (skill_name, category_id) VALUES (?, ?)", [skillName, catId]);
    }
  }
}

// Automatic DB Schema Migrations for Credential Links & Skill Seeding
async function initSchemaMigrations() {
  try {
    const conn = await db.getConnection();
    const [cols] = await conn.query("SHOW COLUMNS FROM Student LIKE 'linkedin_url'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE Student ADD COLUMN linkedin_url VARCHAR(255) NULL");
      await conn.query("ALTER TABLE Student ADD COLUMN github_url VARCHAR(255) NULL");
      await conn.query("ALTER TABLE Student ADD COLUMN leetcode_url VARCHAR(255) NULL");
      console.log("[GroupBy Migration] Added linkedin_url, github_url, leetcode_url to Student table.");
    }
    const [ssCols] = await conn.query("SHOW COLUMNS FROM StudentSkill LIKE 'credential_url'");
    if (ssCols.length === 0) {
      await conn.query("ALTER TABLE StudentSkill ADD COLUMN credential_url VARCHAR(255) NULL");
      console.log("[GroupBy Migration] Added credential_url to StudentSkill table.");
    }
    await seedRichSkillsTaxonomy(conn);
    console.log("[GroupBy Taxonomy] Predefined skills taxonomy database initialized.");
    conn.release();
  } catch (err) {
    console.warn("[GroupBy Migration Notice]", err.message);
  }
}
initSchemaMigrations();

// ------------------------------------------------------------
// AUTHENTICATION ENDPOINTS (@thapar.edu restricted)
// ------------------------------------------------------------

// Google OAuth Config Endpoint
app.get('/api/auth/google/config', (req, res) => {
  res.json({
    success: true,
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

// Google OAuth Login & Verification Endpoint (@thapar.edu restricted)
app.post('/api/auth/google', async (req, res) => {
  const { credential, testEmail, testName } = req.body;

  let email = '';
  let name = '';

  try {
    if (credential && process.env.GOOGLE_CLIENT_ID) {
      // Real Google OAuth ID Token verification
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.email_verified) {
        return res.status(400).json({ success: false, error: 'Google authentication failed or email is unverified.' });
      }
      email = payload.email;
      name = payload.name || payload.given_name || 'Thapar Student';
    } else if (credential && !process.env.GOOGLE_CLIENT_ID) {
      // Decode JWT payload without signature check if Client ID is not configured in .env
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadStr);
          email = payload.email || '';
          name = payload.name || payload.given_name || 'Thapar Student';
        }
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid Google credential token format.' });
      }
    } else if (testEmail) {
      // Developer / Demo trigger mode
      email = testEmail;
      name = testName || 'Thapar Student';
    } else {
      return res.status(400).json({ success: false, error: 'Google credential token or email is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // STRICT DOMAIN ENFORCEMENT FOR @thapar.edu
    if (!isValidThaparEmail(cleanEmail)) {
      return res.status(403).json({
        success: false,
        rejectedEmail: cleanEmail,
        error: `Access Restricted: Personal or unauthorized email (${cleanEmail}) is rejected. Only official email addresses ending with @thapar.edu are permitted to log in.`
      });
    }

    // Check if student exists in database
    const [students] = await db.query(
      'SELECT student_id, name, email, roll_no, branch, semester, contact_info, linkedin_url, github_url, leetcode_url, created_at FROM Student WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (students.length > 0) {
      const student = students[0];

      // Fetch student skills
      const [skills] = await db.query(`
        SELECT sk.skill_id, sk.skill_name, sc.category_id, sc.category_name, ss.proficiency, ss.credential_url
        FROM StudentSkill ss
        JOIN Skill sk ON ss.skill_id = sk.skill_id
        JOIN SkillCategory sc ON sk.category_id = sc.category_id
        WHERE ss.student_id = ?
      `, [student.student_id]);
      student.skills = skills;

      return res.json({
        success: true,
        message: 'Your future self says thanks for logging in.',
        user: student
      });
    } else {
      // Verified @thapar.edu email, but student record does not exist in DB yet
      return res.json({
        success: true,
        requiresRegistration: true,
        email: cleanEmail,
        name: name,
        message: `Google account (${cleanEmail}) verified! Please complete setting up your Thapar student profile (Roll No, Branch, Semester).`
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Google OAuth verification error: ' + err.message });
  }
});


// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Strict domain enforcement
  if (!isValidThaparEmail(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Access Restricted: Only official email addresses ending with @thapar.edu are permitted to sign in.'
    });
  }

  try {
    const hashed = hashPassword(password);
    const [students] = await db.query(
      'SELECT student_id, name, email, roll_no, branch, semester, contact_info, linkedin_url, github_url, leetcode_url, created_at FROM Student WHERE LOWER(email) = ? AND password_hash = ?',
      [cleanEmail, hashed]
    );

    if (students.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email address or password.' });
    }

    const student = students[0];

    // Attach student skills
    const [skills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sc.category_id, sc.category_name, ss.proficiency, ss.credential_url
      FROM StudentSkill ss
      JOIN Skill sk ON ss.skill_id = sk.skill_id
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      WHERE ss.student_id = ?
    `, [student.student_id]);
    student.skills = skills;

    res.json({
      success: true,
      message: 'Your future self says thanks for logging in.',
      user: student
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, roll_no, branch, semester, contact_info = '', linkedin_url = '', github_url = '', leetcode_url = '', skill_ids = [] } = req.body;

  if (!name || !email || !password || !roll_no || !branch || !semester) {
    return res.status(400).json({ success: false, error: 'All registration fields (name, email, password, roll_no, branch, semester) are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Strict domain enforcement
  if (!isValidThaparEmail(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Access Restricted: Registration is strictly reserved for official TIET emails ending with @thapar.edu.'
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check existing email or roll number
    const [existing] = await conn.query(
      'SELECT student_id FROM Student WHERE LOWER(email) = ? OR roll_no = ?',
      [cleanEmail, roll_no.trim()]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, error: 'An account with this email address or roll number already exists.' });
    }

    const hashedPassword = hashPassword(password);
    const [result] = await conn.query(`
      INSERT INTO Student (name, email, password_hash, roll_no, branch, semester, contact_info, linkedin_url, github_url, leetcode_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(), cleanEmail, hashedPassword, roll_no.trim(), branch.trim().toUpperCase(), parseInt(semester),
      contact_info.trim(), linkedin_url ? linkedin_url.trim() : null, github_url ? github_url.trim() : null, leetcode_url ? leetcode_url.trim() : null
    ]);

    const studentId = result.insertId;

    // Attach initial skills if provided
    if (Array.isArray(skill_ids) && skill_ids.length > 0) {
      for (let skId of skill_ids) {
        await conn.query(`
          INSERT INTO StudentSkill (student_id, skill_id, proficiency)
          VALUES (?, ?, 'intermediate')
        `, [studentId, skId]);
      }
    }

    await conn.commit();

    // Fetch newly created user payload
    const [newUsers] = await db.query(
      'SELECT student_id, name, email, roll_no, branch, semester, contact_info, linkedin_url, github_url, leetcode_url, created_at FROM Student WHERE student_id = ?',
      [studentId]
    );

    const newUser = newUsers[0];
    const [skills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sc.category_id, sc.category_name, ss.proficiency, ss.credential_url
      FROM StudentSkill ss
      JOIN Skill sk ON ss.skill_id = sk.skill_id
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      WHERE ss.student_id = ?
    `, [studentId]);
    newUser.skills = skills;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: newUser
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ------------------------------------------------------------
// PROFILE & SKILL MANAGEMENT ENDPOINTS
// ------------------------------------------------------------

// Update profile details
app.put('/api/students/:id/profile', async (req, res) => {
  const studentId = parseInt(req.params.id);
  const { name, branch, semester, contact_info, linkedin_url = '', github_url = '', leetcode_url = '' } = req.body;

  if (!studentId || !name || !branch || !semester) {
    return res.status(400).json({ success: false, error: 'name, branch, and semester are required' });
  }

  try {
    await db.query(`
      UPDATE Student
      SET name = ?, branch = ?, semester = ?, contact_info = ?, linkedin_url = ?, github_url = ?, leetcode_url = ?
      WHERE student_id = ?
    `, [
      name.trim(), branch.trim().toUpperCase(), parseInt(semester),
      contact_info ? contact_info.trim() : '',
      linkedin_url ? linkedin_url.trim() : null,
      github_url ? github_url.trim() : null,
      leetcode_url ? leetcode_url.trim() : null,
      studentId
    ]);

    const [updated] = await db.query(
      'SELECT student_id, name, email, roll_no, branch, semester, contact_info, linkedin_url, github_url, leetcode_url, created_at FROM Student WHERE student_id = ?',
      [studentId]
    );

    const [skills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sc.category_id, sc.category_name, ss.proficiency, ss.credential_url
      FROM StudentSkill ss
      JOIN Skill sk ON ss.skill_id = sk.skill_id
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      WHERE ss.student_id = ?
    `, [studentId]);
    updated[0].skills = skills;

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updated[0]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add skill to student profile (with optional credential proof URL)
app.post('/api/students/:id/skills', async (req, res) => {
  const studentId = parseInt(req.params.id);
  const { skill_id, proficiency = 'intermediate', credential_url = '' } = req.body;

  if (!studentId || !skill_id) {
    return res.status(400).json({ success: false, error: 'skill_id is required' });
  }

  try {
    await db.query(`
      INSERT INTO StudentSkill (student_id, skill_id, proficiency, credential_url)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE proficiency = VALUES(proficiency), credential_url = VALUES(credential_url)
    `, [studentId, skill_id, proficiency, credential_url ? credential_url.trim() : null]);

    const [skills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sc.category_id, sc.category_name, ss.proficiency, ss.credential_url
      FROM StudentSkill ss
      JOIN Skill sk ON ss.skill_id = sk.skill_id
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      WHERE ss.student_id = ?
    `, [studentId]);

    res.json({
      success: true,
      message: 'Skill added to profile!',
      skills
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete skill from student profile
app.delete('/api/students/:id/skills/:skill_id', async (req, res) => {
  const studentId = parseInt(req.params.id);
  const skillId = parseInt(req.params.skill_id);

  if (!studentId || !skillId) {
    return res.status(400).json({ success: false, error: 'Invalid parameters' });
  }

  try {
    await db.query('DELETE FROM StudentSkill WHERE student_id = ? AND skill_id = ?', [studentId, skillId]);

    const [skills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sc.category_id, sc.category_name, ss.proficiency
      FROM StudentSkill ss
      JOIN Skill sk ON ss.skill_id = sk.skill_id
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      WHERE ss.student_id = ?
    `, [studentId]);

    res.json({
      success: true,
      message: 'Skill removed from profile!',
      skills
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// META ENDPOINTS (Privacy Enforced)
// ------------------------------------------------------------

// Get all students with their skills (contact info hidden for others until accepted request)
app.get('/api/students', async (req, res) => {
  const requesterId = req.query.requester_id ? parseInt(req.query.requester_id) : null;
  try {
    const [students] = await db.query(`
      SELECT s.student_id, s.name, s.email, s.roll_no, s.branch, s.semester, s.contact_info, s.linkedin_url, s.github_url, s.leetcode_url, s.created_at
      FROM Student s
      ORDER BY s.student_id ASC
    `);

    // Fetch accepted connections for requester if requesterId is provided
    const acceptedMap = new Set();
    if (requesterId) {
      const [acceptedConnections] = await db.query(`
        SELECT DISTINCT IF(cr.student_id = ?, t.created_by, cr.student_id) as conn_id
        FROM ConnectionRequest cr
        JOIN Slot s ON cr.slot_id = s.slot_id
        JOIN Team t ON s.team_id = t.team_id
        WHERE cr.status = 'accepted'
          AND (cr.student_id = ? OR t.created_by = ?)
      `, [requesterId, requesterId, requesterId]);
      acceptedConnections.forEach(c => acceptedMap.add(c.conn_id));
    }

    for (let st of students) {
      const [skills] = await db.query(`
        SELECT sk.skill_id, sk.skill_name, sc.category_name, ss.proficiency, ss.credential_url
        FROM StudentSkill ss
        JOIN Skill sk ON ss.skill_id = sk.skill_id
        JOIN SkillCategory sc ON sk.category_id = sc.category_id
        WHERE ss.student_id = ?
        ORDER BY sk.skill_name
      `, [st.student_id]);
      st.skills = skills;

      // Do NOT hide contact info if requester is self or has an accepted connection
      const isSelf = requesterId && requesterId === st.student_id;
      const isConnected = acceptedMap.has(st.student_id);

      if (!isSelf && !isConnected) {
        st.contact_info = '[Hidden until request accepted]';
      }
    }

    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single student details (Contact info & email strictly masked until request is accepted)
app.get('/api/students/:id', async (req, res) => {
  const targetStudentId = parseInt(req.params.id);
  const requesterId = req.query.requester_id ? parseInt(req.query.requester_id) : null;

  try {
    const [students] = await db.query(
      'SELECT student_id, name, email, roll_no, branch, semester, contact_info, linkedin_url, github_url, leetcode_url, created_at FROM Student WHERE student_id = ?',
      [targetStudentId]
    );
    if (students.length === 0) return res.status(404).json({ success: false, error: 'Student not found' });
    
    const student = students[0];

    // PRIVACY ENFORCEMENT: Strictly mask email & contact_info unless requester is self or has an accepted connection request
    let isAuthorizedToViewContact = false;
    if (requesterId && requesterId === targetStudentId) {
      isAuthorizedToViewContact = true;
    } else if (requesterId) {
      const [acceptedConnections] = await db.query(`
        SELECT cr.request_id 
        FROM ConnectionRequest cr
        JOIN Slot s ON cr.slot_id = s.slot_id
        JOIN Team t ON s.team_id = t.team_id
        WHERE cr.status = 'accepted'
          AND (
            (cr.student_id = ? AND t.created_by = ?) OR
            (cr.student_id = ? AND t.created_by = ?)
          )
        LIMIT 1
      `, [requesterId, targetStudentId, targetStudentId, requesterId]);

      if (acceptedConnections.length > 0) {
        isAuthorizedToViewContact = true;
      }
    }

    if (!isAuthorizedToViewContact) {
      student.email = '[Hidden until connection request accepted]';
      student.contact_info = '[Hidden until connection request accepted]';
    }

    const [skills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sc.category_id, sc.category_name, ss.proficiency, ss.credential_url
      FROM StudentSkill ss
      JOIN Skill sk ON ss.skill_id = sk.skill_id
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      WHERE ss.student_id = ?
    `, [student.student_id]);
    student.skills = skills;

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get past collaborations for a student
app.get('/api/students/:id/collaborations', async (req, res) => {
  const studentId = parseInt(req.params.id);
  if (!studentId) return res.status(400).json({ success: false, error: 'Invalid student ID' });

  try {
    const [rows] = await db.query(`
      SELECT 
        pc.collaboration_id,
        CASE WHEN pc.student_a_id = ? THEN st_b.student_id ELSE st_a.student_id END AS partner_id,
        CASE WHEN pc.student_a_id = ? THEN st_b.name ELSE st_a.name END AS partner_name,
        COALESCE(pc.project_name, t.team_name, 'Group Collaboration') AS project_name,
        pc.created_at
      FROM PastCollaboration pc
      JOIN Student st_a ON pc.student_a_id = st_a.student_id
      JOIN Student st_b ON pc.student_b_id = st_b.student_id
      LEFT JOIN Team t ON pc.team_id = t.team_id
      WHERE pc.student_a_id = ? OR pc.student_b_id = ?
      ORDER BY pc.created_at DESC
    `, [studentId, studentId, studentId, studentId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all skill categories and skills taxonomy
app.get('/api/skills', async (req, res) => {
  try {
    let [categories] = await db.query('SELECT * FROM SkillCategory ORDER BY category_name');
    let [skills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sk.category_id, sc.category_name
      FROM Skill sk
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      ORDER BY sk.skill_name ASC
    `);
    
    if (!skills || skills.length === 0) {
      try {
        await seedRichSkillsTaxonomy(db);
        const [recheckCategories] = await db.query('SELECT * FROM SkillCategory ORDER BY category_name');
        const [recheckSkills] = await db.query(`
          SELECT sk.skill_id, sk.skill_name, sk.category_id, sc.category_name
          FROM Skill sk
          JOIN SkillCategory sc ON sk.category_id = sc.category_id
          ORDER BY sk.skill_name ASC
        `);
        categories = recheckCategories;
        skills = recheckSkills;
      } catch (seedErr) {
        console.warn('[GroupBy Taxonomy] Auto-seed on /api/skills failed:', seedErr.message);
      }
    }
    
    res.json({ success: true, data: { categories, skills } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const [courses] = await db.query('SELECT * FROM Course ORDER BY course_code');
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// CORE BIDIRECTIONAL SEARCH ENDPOINTS
// ------------------------------------------------------------

// 1. Student searching for open slots (Relational Division)
app.get('/api/search/slots-for-student', async (req, res) => {
  const studentId = parseInt(req.query.student_id);
  const matchMode = req.query.match_mode || 'exact';
  const courseId = req.query.course_id ? parseInt(req.query.course_id) : null;
  const branch = req.query.branch || null;
  const semester = req.query.semester ? parseInt(req.query.semester) : null;

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'student_id parameter is required' });
  }

  try {
    let query = '';
    let params = [];

    if (matchMode === 'all') {
      query = `
        SELECT 
            s.slot_id, 
            t.team_id, 
            t.team_name, 
            c.course_code,
            c.course_name,
            creator.name AS creator_name,
            creator.branch AS creator_branch,
            creator.semester AS creator_semester,
            t.created_at AS team_created_at
        FROM Slot s
        JOIN Team t ON s.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        JOIN Student creator ON t.created_by = creator.student_id
        WHERE s.slot_status = 'open' 
          AND t.status = 'open'
          AND (? IS NULL OR t.course_id = ?)
          AND (? IS NULL OR creator.branch = ?)
          AND (? IS NULL OR creator.semester = ?)
        ORDER BY s.slot_id ASC
      `;
      params = [courseId, courseId, branch, branch, semester, semester];
    } else if (matchMode === 'exact') {
      // PURE RELATIONAL DIVISION QUERY (Double Negation NOT EXISTS)
      query = `
        SELECT 
            s.slot_id, 
            t.team_id, 
            t.team_name, 
            c.course_code,
            c.course_name,
            creator.name AS creator_name,
            creator.branch AS creator_branch,
            creator.semester AS creator_semester,
            t.created_at AS team_created_at
        FROM Slot s
        JOIN Team t ON s.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        JOIN Student creator ON t.created_by = creator.student_id
        WHERE s.slot_status = 'open' 
          AND t.status = 'open'
          AND (? IS NULL OR t.course_id = ?)
          AND (? IS NULL OR creator.branch = ?)
          AND (? IS NULL OR creator.semester = ?)
          AND NOT EXISTS (
              SELECT 1
              FROM SlotRequiredSkill req
              WHERE req.slot_id = s.slot_id
                AND req.skill_id NOT IN (
                    SELECT ss.skill_id
                    FROM StudentSkill ss
                    WHERE ss.student_id = ?
                )
          )
        ORDER BY s.slot_id ASC
      `;
      params = [courseId, courseId, branch, branch, semester, semester, studentId];
    } else {
      // PARTIAL MATCH WITH SKILL AGGREGATION SCORE
      query = `
        SELECT 
            s.slot_id, 
            t.team_id, 
            t.team_name, 
            c.course_code,
            c.course_name,
            creator.name AS creator_name,
            creator.branch AS creator_branch,
            creator.semester AS creator_semester,
            COUNT(DISTINCT srs.skill_id) AS matched_skill_count,
            (SELECT COUNT(*) FROM SlotRequiredSkill WHERE slot_id = s.slot_id) AS total_required_skills
        FROM Slot s
        JOIN Team t ON s.team_id = t.team_id
        LEFT JOIN Course c ON t.course_id = c.course_id
        JOIN Student creator ON t.created_by = creator.student_id
        JOIN SlotRequiredSkill srs ON s.slot_id = srs.slot_id
        JOIN StudentSkill ss ON srs.skill_id = ss.skill_id
        WHERE ss.student_id = ?
          AND s.slot_status = 'open'
          AND t.status = 'open'
          AND (? IS NULL OR t.course_id = ?)
          AND (? IS NULL OR creator.branch = ?)
          AND (? IS NULL OR creator.semester = ?)
        GROUP BY s.slot_id, t.team_id, t.team_name, c.course_code, c.course_name, creator.name, creator.branch, creator.semester
        ORDER BY matched_skill_count DESC, s.slot_id ASC
      `;
      params = [studentId, courseId, courseId, branch, branch, semester, semester];
    }

    const [slots] = await db.query(query, params);

    for (let slot of slots) {
      const [reqSkills] = await db.query(`
        SELECT sk.skill_id, sk.skill_name, sc.category_name,
               CASE WHEN ss.student_id IS NOT NULL THEN TRUE ELSE FALSE END AS student_has_skill
        FROM SlotRequiredSkill srs
        JOIN Skill sk ON srs.skill_id = sk.skill_id
        JOIN SkillCategory sc ON sk.category_id = sc.category_id
        LEFT JOIN StudentSkill ss ON srs.skill_id = ss.skill_id AND ss.student_id = ?
        WHERE srs.slot_id = ?
      `, [studentId, slot.slot_id]);

      slot.required_skills = reqSkills;

      const [collaborations] = await db.query(`
        SELECT tm.student_id AS member_id, 
               st.name AS member_name,
               CASE 
                   WHEN pc.team_id IS NOT NULL THEN TRUE 
                   ELSE FALSE 
               END AS has_worked_together
        FROM TeamMembership tm
        JOIN Student st ON tm.student_id = st.student_id
        LEFT JOIN PastCollaboration pc
          ON (pc.student_a_id = LEAST(?, tm.student_id) AND pc.student_b_id = GREATEST(?, tm.student_id))
        WHERE tm.team_id = ?
      `, [studentId, studentId, slot.team_id]);

      slot.team_members = collaborations;
      slot.has_past_collaborator = collaborations.some(c => c.has_worked_together);

      const [reqStatus] = await db.query(`
        SELECT request_id, status, sender_type, created_at
        FROM ConnectionRequest
        WHERE slot_id = ? AND student_id = ?
        ORDER BY request_id DESC
        LIMIT 1
      `, [slot.slot_id, studentId]);

      slot.connection_request = reqStatus.length > 0 ? reqStatus[0] : null;
    }

    res.json({ success: true, data: slots, match_mode: matchMode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Team/Slot searching for candidates (Relational Division)
app.get('/api/search/students-for-slot', async (req, res) => {
  const slotId = parseInt(req.query.slot_id);
  const branch = req.query.branch || null;
  const semester = req.query.semester ? parseInt(req.query.semester) : null;

  if (!slotId) {
    return res.status(400).json({ success: false, error: 'slot_id parameter is required' });
  }

  try {
    const [slotInfo] = await db.query(`
      SELECT s.slot_id, s.team_id, s.slot_status, t.team_name
      FROM Slot s
      JOIN Team t ON s.team_id = t.team_id
      WHERE s.slot_id = ?
    `, [slotId]);

    if (slotInfo.length === 0) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }

    const [requiredSkills] = await db.query(`
      SELECT sk.skill_id, sk.skill_name, sc.category_name
      FROM SlotRequiredSkill srs
      JOIN Skill sk ON srs.skill_id = sk.skill_id
      JOIN SkillCategory sc ON sk.category_id = sc.category_id
      WHERE srs.slot_id = ?
    `, [slotId]);

    const query = `
      SELECT 
          st.student_id, 
          st.name, 
          st.roll_no,
          st.branch, 
          st.semester
      FROM Student st
      WHERE (? IS NULL OR st.branch = ?)
        AND (? IS NULL OR st.semester = ?)
        AND st.student_id NOT IN (
            SELECT student_id FROM TeamMembership WHERE team_id = ?
        )
        AND NOT EXISTS (
            SELECT 1
            FROM SlotRequiredSkill srs
            WHERE srs.slot_id = ?
              AND srs.skill_id NOT IN (
                  SELECT ss.skill_id
                  FROM StudentSkill ss
                  WHERE ss.student_id = st.student_id
              )
        )
      ORDER BY st.name ASC
    `;

    const [candidates] = await db.query(query, [
      branch, branch, 
      semester, semester, 
      slotInfo[0].team_id, 
      slotId
    ]);

    for (let candidate of candidates) {
      const [candSkills] = await db.query(`
        SELECT sk.skill_id, sk.skill_name, sc.category_name, ss.proficiency
        FROM StudentSkill ss
        JOIN Skill sk ON ss.skill_id = sk.skill_id
        JOIN SkillCategory sc ON sk.category_id = sc.category_id
        WHERE ss.student_id = ?
      `, [candidate.student_id]);
      candidate.skills = candSkills;

      const [collaborations] = await db.query(`
        SELECT tm.student_id AS member_id, 
               st.name AS member_name,
               CASE 
                   WHEN pc.team_id IS NOT NULL THEN TRUE 
                   ELSE FALSE 
               END AS has_worked_together
        FROM TeamMembership tm
        JOIN Student st ON tm.student_id = st.student_id
        LEFT JOIN PastCollaboration pc
          ON (pc.student_a_id = LEAST(?, tm.student_id) AND pc.student_b_id = GREATEST(?, tm.student_id))
        WHERE tm.team_id = ?
      `, [candidate.student_id, candidate.student_id, slotInfo[0].team_id]);

      candidate.past_collaborations = collaborations;
      candidate.has_past_collaborator = collaborations.some(c => c.has_worked_together);

      const [reqStatus] = await db.query(`
        SELECT request_id, status, sender_type, created_at
        FROM ConnectionRequest
        WHERE slot_id = ? AND student_id = ?
        ORDER BY request_id DESC
        LIMIT 1
      `, [slotId, candidate.student_id]);
      candidate.connection_request = reqStatus.length > 0 ? reqStatus[0] : null;
    }

    res.json({
      success: true,
      slot_id: slotId,
      team_name: slotInfo[0].team_name,
      required_skills: requiredSkills,
      candidates
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Team-to-Team Merge Suggestions Endpoint (Relational Complementarity Algorithm)
app.get('/api/search/team-merges', async (req, res) => {
  const studentId = req.query.student_id ? parseInt(req.query.student_id) : null;
  const targetTeamId = req.query.team_id ? parseInt(req.query.team_id) : null;

  try {
    // 1. Fetch all open teams with their members & open slots
    const [openTeams] = await db.query(`
      SELECT t.team_id, t.team_name, t.course_id, c.course_code, c.course_name, t.created_by, st.name AS creator_name, st.email AS creator_email
      FROM Team t
      LEFT JOIN Course c ON t.course_id = c.course_id
      JOIN Student st ON t.created_by = st.student_id
      WHERE t.status = 'open'
    `);

    // Attach skills possessed by members and skills required by open slots for each team
    for (let team of openTeams) {
      // Members' skills (M)
      const [memberSkills] = await db.query(`
        SELECT DISTINCT sk.skill_id, sk.skill_name, sc.category_name
        FROM TeamMembership tm
        JOIN StudentSkill ss ON tm.student_id = ss.student_id
        JOIN Skill sk ON ss.skill_id = sk.skill_id
        JOIN SkillCategory sc ON sk.category_id = sc.category_id
        WHERE tm.team_id = ?
      `, [team.team_id]);
      team.member_skills = memberSkills;

      // Members info
      const [members] = await db.query(`
        SELECT st.student_id, st.name, st.branch, st.semester
        FROM TeamMembership tm
        JOIN Student st ON tm.student_id = st.student_id
        WHERE tm.team_id = ?
      `, [team.team_id]);
      team.members = members;

      // Required skills for open slots (R)
      const [requiredSkills] = await db.query(`
        SELECT s.slot_id, sk.skill_id, sk.skill_name, sc.category_name
        FROM Slot s
        JOIN SlotRequiredSkill srs ON s.slot_id = srs.slot_id
        JOIN Skill sk ON srs.skill_id = sk.skill_id
        JOIN SkillCategory sc ON sk.category_id = sc.category_id
        WHERE s.team_id = ? AND s.slot_status = 'open'
      `, [team.team_id]);
      team.required_skills = requiredSkills;
    }

    // 2. Determine target team(s) to find merge suggestions for
    let focalTeams = [];
    if (studentId) {
      // Strictly restrict to open teams that studentId belongs to/created
      focalTeams = openTeams.filter(t => t.created_by === studentId || t.members.some(m => m.student_id === studentId));
    } else if (targetTeamId) {
      focalTeams = openTeams.filter(t => t.team_id === targetTeamId);
    } else {
      focalTeams = openTeams;
    }

    const mergeSuggestions = [];
    const processedPairs = new Set();

    for (let teamA of focalTeams) {
      for (let teamB of openTeams) {
        if (teamA.team_id === teamB.team_id) continue;

        const pairKey = [teamA.team_id, teamB.team_id].sort((a,b) => a-b).join('-');
        if (processedPairs.has(pairKey)) continue;

        // Skills Team A has that Team B needs: M_A intersect R_B
        const skills_A_provides_to_B = teamA.member_skills.filter(skA => 
          teamB.required_skills.some(skB => skB.skill_id === skA.skill_id)
        );

        // Skills Team B has that Team A needs: M_B intersect R_A
        const skills_B_provides_to_A = teamB.member_skills.filter(skB => 
          teamA.required_skills.some(skA => skA.skill_id === skB.skill_id)
        );

        const totalNeeded = (teamA.required_skills.length || 1) + (teamB.required_skills.length || 1);
        const totalSatisfied = skills_A_provides_to_B.length + skills_B_provides_to_A.length;

        if (totalSatisfied === 0) continue; // No complementarity

        const matchScore = Math.min(100, Math.round((totalSatisfied / totalNeeded) * 100));

        // Check if there is an existing team merge connection request between slot(s) of Team A and Team B
        let requestStatus = null;
        if (teamA.required_skills.length > 0 && teamB.members.length > 0) {
          const slotIdsA = teamA.required_skills.map(s => s.slot_id);
          const memberIdsB = teamB.members.map(m => m.student_id);
          
          if (slotIdsA.length > 0 && memberIdsB.length > 0) {
            const [reqs] = await db.query(`
              SELECT request_id, slot_id, student_id, sender_type, status, message
              FROM ConnectionRequest
              WHERE slot_id IN (?) AND student_id IN (?)
              ORDER BY request_id DESC
              LIMIT 1
            `, [slotIdsA, memberIdsB]);

            if (reqs.length > 0) requestStatus = reqs[0];
          }
        }

        processedPairs.add(pairKey);

        mergeSuggestions.push({
          pair_key: pairKey,
          team_a: {
            team_id: teamA.team_id,
            team_name: teamA.team_name,
            course_code: teamA.course_code,
            creator_name: teamA.creator_name,
            member_count: teamA.members.length,
            target_slot_id: teamA.required_skills.length > 0 ? teamA.required_skills[0].slot_id : null
          },
          team_b: {
            team_id: teamB.team_id,
            team_name: teamB.team_name,
            course_code: teamB.course_code,
            creator_name: teamB.creator_name,
            member_count: teamB.members.length,
            creator_email: teamB.creator_email,
            target_slot_id: teamB.required_skills.length > 0 ? teamB.required_skills[0].slot_id : null,
            target_student_id: teamB.members.length > 0 ? teamB.members[0].student_id : null
          },
          skills_a_provides_to_b: skills_A_provides_to_B,
          skills_b_provides_to_a: skills_B_provides_to_A,
          match_percentage: matchScore,
          is_exact_match: matchScore >= 90,
          is_partial_match: matchScore < 90,
          connection_request: requestStatus
        });
      }
    }

    // Sort by match percentage descending
    mergeSuggestions.sort((a,b) => b.match_percentage - a.match_percentage);

    res.json({
      success: true,
      total_suggestions: mergeSuggestions.length,
      suggestions: mergeSuggestions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// CONNECTION REQUEST SYSTEM ENDPOINTS
// ------------------------------------------------------------

app.post('/api/requests', async (req, res) => {
  const { slot_id, student_id, sender_type = 'student', message = '' } = req.body;

  if (!slot_id || !student_id) {
    return res.status(400).json({ success: false, error: 'slot_id and student_id are required' });
  }

  try {
    const [slots] = await db.query('SELECT slot_id, slot_status FROM Slot WHERE slot_id = ?', [slot_id]);
    if (slots.length === 0) {
      return res.status(404).json({ success: false, error: 'Target slot does not exist' });
    }
    if (slots[0].slot_status !== 'open') {
      return res.status(400).json({ success: false, error: 'Target slot is no longer open' });
    }

    const [existingPending] = await db.query(`
      SELECT request_id FROM ConnectionRequest
      WHERE slot_id = ? AND student_id = ? AND status = 'pending'
    `, [slot_id, student_id]);

    if (existingPending.length > 0) {
      return res.status(400).json({ success: false, error: 'A pending connection request already exists for this slot.' });
    }

    const [result] = await db.query(`
      INSERT INTO ConnectionRequest (slot_id, student_id, sender_type, status, message)
      VALUES (?, ?, ?, 'pending', ?)
    `, [slot_id, student_id, sender_type, message]);

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully!',
      request_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/requests/student/:student_id', async (req, res) => {
  const studentId = parseInt(req.params.student_id);

  if (!studentId) {
    return res.status(400).json({ success: false, error: 'Invalid student_id parameter' });
  }

  try {
    const [outgoing] = await db.query(`
      SELECT 
          cr.request_id, cr.slot_id, cr.student_id, cr.sender_type, cr.status, cr.message, cr.created_at, cr.updated_at,
          t.team_id, t.team_name, c.course_code,
          creator.student_id AS team_creator_id,
          creator.name AS team_creator_name,
          CASE WHEN cr.status = 'accepted' THEN creator.email ELSE '[Hidden]' END AS team_creator_email,
          CASE WHEN cr.status = 'accepted' THEN creator.contact_info ELSE '[Hidden until request accepted]' END AS team_creator_contact,
          (SELECT COUNT(*) FROM TeamMembership WHERE team_id = t.team_id AND student_id = cr.student_id) AS is_added_to_team
      FROM ConnectionRequest cr
      JOIN Slot s ON cr.slot_id = s.slot_id
      JOIN Team t ON s.team_id = t.team_id
      LEFT JOIN Course c ON t.course_id = c.course_id
      JOIN Student creator ON t.created_by = creator.student_id
      WHERE cr.student_id = ?
      ORDER BY cr.created_at DESC
    `, [studentId]);

    for (let reqObj of outgoing) {
      const [skills] = await db.query(`
        SELECT sk.skill_name FROM SlotRequiredSkill srs
        JOIN Skill sk ON srs.skill_id = sk.skill_id
        WHERE srs.slot_id = ?
      `, [reqObj.slot_id]);
      reqObj.slot_required_skills = skills.map(s => s.skill_name);
    }

    const [incoming] = await db.query(`
      SELECT 
          cr.request_id, cr.slot_id, cr.student_id, cr.sender_type, cr.status, cr.message, cr.created_at, cr.updated_at,
          t.team_id, t.team_name, c.course_code, s.slot_status,
          t.created_by AS team_creator_id,
          applicant.name AS applicant_name, applicant.branch AS applicant_branch, applicant.semester AS applicant_semester,
          CASE WHEN cr.status = 'accepted' THEN applicant.email ELSE '[Hidden]' END AS applicant_email,
          CASE WHEN cr.status = 'accepted' THEN applicant.contact_info ELSE '[Hidden until request accepted]' END AS applicant_contact,
          (SELECT COUNT(*) FROM TeamMembership WHERE team_id = t.team_id AND student_id = cr.student_id) AS is_added_to_team
      FROM ConnectionRequest cr
      JOIN Slot s ON cr.slot_id = s.slot_id
      JOIN Team t ON s.team_id = t.team_id
      LEFT JOIN Course c ON t.course_id = c.course_id
      JOIN Student applicant ON cr.student_id = applicant.student_id
      WHERE t.team_id IN (
          SELECT team_id FROM TeamMembership WHERE student_id = ?
      )
      ORDER BY cr.created_at DESC
    `, [studentId]);

    for (let reqObj of incoming) {
      const [skills] = await db.query(`
        SELECT sk.skill_name FROM SlotRequiredSkill srs
        JOIN Skill sk ON srs.skill_id = sk.skill_id
        WHERE srs.slot_id = ?
      `, [reqObj.slot_id]);
      reqObj.slot_required_skills = skills.map(s => s.skill_name);

      const [appSkills] = await db.query(`
        SELECT sk.skill_name FROM StudentSkill ss
        JOIN Skill sk ON ss.skill_id = sk.skill_id
        WHERE ss.student_id = ?
      `, [reqObj.student_id]);
      reqObj.applicant_skills = appSkills.map(s => s.skill_name);
    }

    res.json({
      success: true,
      data: {
        outgoing,
        incoming,
        pending_incoming_count: incoming.filter(r => r.status === 'pending').length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Respond to Connection Request (Accept unmasks contact details; does NOT auto-fill team slot)
app.post('/api/requests/:request_id/respond', async (req, res) => {
  const requestId = parseInt(req.params.request_id);
  const { action } = req.body;

  if (!requestId || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid parameters.' });
  }

  try {
    const [requests] = await db.query(`
      SELECT cr.request_id, cr.slot_id, cr.student_id, cr.status, s.slot_status, s.team_id
      FROM ConnectionRequest cr
      JOIN Slot s ON cr.slot_id = s.slot_id
      WHERE cr.request_id = ?
    `, [requestId]);

    if (requests.length === 0) {
      return res.status(404).json({ success: false, error: 'Connection request not found' });
    }

    const reqObj = requests[0];

    if (reqObj.status !== 'pending') {
      return res.status(400).json({ success: false, error: `This request has already been ${reqObj.status}.` });
    }

    if (action === 'accept') {
      await db.query(`
        UPDATE ConnectionRequest
        SET status = 'accepted'
        WHERE request_id = ?
      `, [requestId]);

      const [applicantInfo] = await db.query('SELECT name, email, contact_info FROM Student WHERE student_id = ?', [reqObj.student_id]);

      return res.json({
        success: true,
        message: 'Connection request accepted! Contact details unlocked so you can communicate.',
        contact_info: applicantInfo[0]
      });
    } else {
      await db.query(`
        UPDATE ConnectionRequest
        SET status = 'declined'
        WHERE request_id = ?
      `, [requestId]);

      return res.json({
        success: true,
        message: 'Connection request declined.'
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Explicitly add candidate to team roster after communication (Executes sp_fill_slot)
app.post('/api/requests/:request_id/add-to-team', async (req, res) => {
  const requestId = parseInt(req.params.request_id);

  if (!requestId) {
    return res.status(400).json({ success: false, error: 'request_id is required' });
  }

  try {
    const [requests] = await db.query(`
      SELECT cr.request_id, cr.slot_id, cr.student_id, cr.status, s.slot_status, s.team_id, t.team_name, st.name AS student_name
      FROM ConnectionRequest cr
      JOIN Slot s ON cr.slot_id = s.slot_id
      JOIN Team t ON s.team_id = t.team_id
      JOIN Student st ON cr.student_id = st.student_id
      WHERE cr.request_id = ?
    `, [requestId]);

    if (requests.length === 0) {
      return res.status(404).json({ success: false, error: 'Connection request not found' });
    }

    const reqObj = requests[0];

    if (reqObj.status !== 'accepted') {
      return res.status(400).json({ success: false, error: 'You can only add candidates to your team after accepting their request and unmasking contact info.' });
    }

    // Call stored procedure to fill slot and add candidate to TeamMembership
    await db.query('CALL sp_fill_slot(?, ?)', [reqObj.slot_id, reqObj.student_id]);

    res.json({
      success: true,
      message: `${reqObj.student_name} was successfully added to ${reqObj.team_name}! Slot #${reqObj.slot_id} is now filled.`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ------------------------------------------------------------
// TEAMS & SKILL GAP ANALYSIS ENDPOINTS
// ------------------------------------------------------------

app.get('/api/teams', async (req, res) => {
  try {
    const [teams] = await db.query(`
      SELECT t.team_id, t.team_name, t.description, t.project_type, t.max_members, t.deadline, t.status, t.created_at,
             c.course_id, c.course_code, c.course_name,
             creator.name AS creator_name, creator.student_id AS creator_id
      FROM Team t
      LEFT JOIN Course c ON t.course_id = c.course_id
      JOIN Student creator ON t.created_by = creator.student_id
      ORDER BY t.team_id DESC
    `);

    for (let team of teams) {
      const [members] = await db.query(`
        SELECT st.student_id, st.name, st.branch, st.semester, tm.joined_at
        FROM TeamMembership tm
        JOIN Student st ON tm.student_id = st.student_id
        WHERE tm.team_id = ?
      `, [team.team_id]);
      team.members = members;

      const [slots] = await db.query(`
        SELECT s.slot_id, s.role_title, s.slot_status, s.filled_by, s.created_at, s.filled_at,
               st.name AS filled_by_name
        FROM Slot s
        LEFT JOIN Student st ON s.filled_by = st.student_id
        WHERE s.team_id = ?
        ORDER BY s.slot_id ASC
      `, [team.team_id]);

      for (let slot of slots) {
        const [skills] = await db.query(`
          SELECT sk.skill_id, sk.skill_name, sc.category_name
          FROM SlotRequiredSkill srs
          JOIN Skill sk ON srs.skill_id = sk.skill_id
          JOIN SkillCategory sc ON sk.category_id = sc.category_id
          WHERE srs.slot_id = ?
        `, [slot.slot_id]);
        slot.required_skills = skills;
      }
      team.slots = slots;

      const [unrepresentedCategories] = await db.query(`
        SELECT sc.category_id, sc.category_name
        FROM SkillCategory sc
        WHERE sc.category_id NOT IN (
            SELECT DISTINCT sk.category_id
            FROM TeamMembership tm
            JOIN StudentSkill ss ON tm.student_id = ss.student_id
            JOIN Skill sk ON ss.skill_id = sk.skill_id
            WHERE tm.team_id = ?
        )
        ORDER BY sc.category_name ASC
      `, [team.team_id]);
      team.skill_gaps = unrepresentedCategories;
    }

    res.json({ success: true, data: teams });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/teams', async (req, res) => {
  const { team_name, description = '', project_type = 'Course Project', max_members = 4, deadline = null, course_id = null, created_by, slots = [] } = req.body;
  if (!team_name || !created_by) {
    return res.status(400).json({ success: false, error: 'team_name and created_by are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Auto-migrate columns if missing
    await conn.query("ALTER TABLE Team ADD COLUMN IF NOT EXISTS description TEXT NULL").catch(() => {});
    await conn.query("ALTER TABLE Team ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'Course Project'").catch(() => {});
    await conn.query("ALTER TABLE Team ADD COLUMN IF NOT EXISTS max_members INT DEFAULT 4").catch(() => {});
    await conn.query("ALTER TABLE Team ADD COLUMN IF NOT EXISTS deadline DATE NULL").catch(() => {});
    await conn.query("ALTER TABLE Slot ADD COLUMN IF NOT EXISTS role_title VARCHAR(100) DEFAULT 'Team Member'").catch(() => {});

    const [result] = await conn.query(`
      INSERT INTO Team (team_name, description, project_type, max_members, deadline, course_id, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
    `, [team_name, description, project_type, parseInt(max_members) || 4, deadline || null, course_id || null, created_by]);

    const teamId = result.insertId;

    // Creator becomes first member
    await conn.query(`
      INSERT INTO TeamMembership (team_id, student_id)
      VALUES (?, ?)
    `, [teamId, created_by]);

    // Create open slots defined in Step 2 of wizard
    if (Array.isArray(slots) && slots.length > 0) {
      for (let slotDef of slots) {
        const roleTitle = slotDef.role_title || 'Team Member';
        const count = Math.max(1, parseInt(slotDef.count) || 1);
        const skillIds = Array.isArray(slotDef.skill_ids) ? slotDef.skill_ids : [];

        for (let i = 0; i < count; i++) {
          const [slotResult] = await conn.query(`
            INSERT INTO Slot (team_id, role_title, slot_status)
            VALUES (?, ?, 'open')
          `, [teamId, roleTitle]);

          const slotId = slotResult.insertId;

          for (let skillId of skillIds) {
            await conn.query(`
              INSERT INTO SlotRequiredSkill (slot_id, skill_id)
              VALUES (?, ?)
            `, [slotId, parseInt(skillId)]);
          }
        }
      }
    }

    await conn.commit();
    res.json({ success: true, message: 'Team and open slots created successfully', team_id: teamId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/slots', async (req, res) => {
  const { team_id, skill_ids } = req.body;
  if (!team_id || !Array.isArray(skill_ids) || skill_ids.length === 0) {
    return res.status(400).json({ success: false, error: 'team_id and skill_ids array are required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [slotResult] = await conn.query(`
      INSERT INTO Slot (team_id, slot_status)
      VALUES (?, 'open')
    `, [team_id]);

    const slotId = slotResult.insertId;

    for (let skillId of skill_ids) {
      await conn.query(`
        INSERT INTO SlotRequiredSkill (slot_id, skill_id)
        VALUES (?, ?)
      `, [slotId, skillId]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Slot created successfully', slot_id: slotId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/slots/fill', async (req, res) => {
  const { slot_id, student_id } = req.body;
  if (!slot_id || !student_id) {
    return res.status(400).json({ success: false, error: 'slot_id and student_id are required' });
  }

  try {
    await db.query('CALL sp_fill_slot(?, ?)', [slot_id, student_id]);
    res.json({ 
      success: true, 
      message: `Slot #${slot_id} filled successfully by Student #${student_id}.` 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[GroupBy Server] Running on http://localhost:${PORT}`);
});
