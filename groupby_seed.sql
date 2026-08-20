-- ============================================================
-- GroupBy: Campus Team Formation System
-- Seed Data Script (MySQL 8+)
-- Target Context: Thapar Institute of Engineering & Technology (TIET)
-- ============================================================

USE groupby;

-- Clean existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ConnectionRequest;
TRUNCATE TABLE PastCollaboration;
TRUNCATE TABLE SlotRequiredSkill;
TRUNCATE TABLE Slot;
TRUNCATE TABLE TeamMembership;
TRUNCATE TABLE Team;
TRUNCATE TABLE Course;
TRUNCATE TABLE StudentSkill;
TRUNCATE TABLE Skill;
TRUNCATE TABLE SkillCategory;
TRUNCATE TABLE Student;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. Insert Skill Categories & Skills
-- ------------------------------------------------------------
INSERT INTO SkillCategory (category_id, category_name) VALUES
(1, 'Databases & Big Data'),
(2, 'Machine Learning & AI'),
(3, 'Web Development'),
(4, 'Mobile Development'),
(5, 'Systems & Core CS');

INSERT INTO Skill (skill_id, skill_name, category_id) VALUES
-- Databases & Big Data
(1, 'MySQL', 1),
(2, 'PostgreSQL', 1),
(3, 'MongoDB', 1),
(4, 'Redis', 1),
-- Machine Learning & AI
(5, 'Python', 2),
(6, 'PyTorch', 2),
(7, 'TensorFlow', 2),
(8, 'Scikit-Learn', 2),
-- Web Development
(9, 'React.js', 3),
(10, 'Node.js', 3),
(11, 'TypeScript', 3),
(12, 'HTML/CSS/Tabler', 3),
-- Mobile Development
(13, 'Flutter', 4),
(14, 'React Native', 4),
(15, 'Kotlin', 4),
-- Systems & Core CS
(16, 'C++', 5),
(17, 'Operating Systems', 5),
(18, 'Docker', 5);

-- ------------------------------------------------------------
-- 2. Insert Courses (TIET Computer Engineering)
-- ------------------------------------------------------------
INSERT INTO Course (course_id, course_code, course_name) VALUES
(1, 'UCS416', 'Database Management Systems'),
(2, 'UCS505', 'Computer Networks'),
(3, 'UCS608', 'Machine Learning & Deep Learning'),
(4, 'UCS503', 'Software Engineering Project');

-- ------------------------------------------------------------
-- 3. Insert Students
-- ------------------------------------------------------------
INSERT INTO Student (student_id, name, email, contact_info, roll_no, branch, semester) VALUES
(1, 'Shresth Vishwakarma', 'svishwakarma@thapar.edu', 'Discord: @shresth_v | WhatsApp: +91 98123 45678', '102203001', 'COE', 5),
(2, 'Aarav Sharma', 'asharma@thapar.edu', 'Discord: @aarav_ml | Phone: +91 98765 43210', '102203011', 'COE', 5),
(3, 'Diya Patel', 'dpatel@thapar.edu', 'Discord: @diya_dev | Phone: +91 98765 43211', '102203045', 'COE', 5),
(4, 'Rohan Verma', 'rverma@thapar.edu', 'Discord: @rohan_db | Phone: +91 98765 43212', '102203102', 'COE', 5),
(5, 'Ananya Gupta', 'agupta@thapar.edu', 'Discord: @ananya_ai | Phone: +91 98765 43213', '102203189', 'ENC', 5),
(6, 'Kabir Singh', 'ksingh@thapar.edu', 'Discord: @kabir_mobile | Phone: +91 98765 43214', '102203220', 'COE', 5),
(7, 'Ishaan Kapoor', 'ikapoor@thapar.edu', 'Discord: @ishaan_web | Phone: +91 98765 43215', '102203301', 'DER', 5),
(8, 'Sneha Reddi', 'sreddi@thapar.edu', 'Discord: @sneha_cpp | Phone: +91 98765 43216', '102203355', 'COE', 5);

-- ------------------------------------------------------------
-- 4. Insert Student Skills
-- ------------------------------------------------------------
-- Shresth (1): Python, MySQL, Node.js, C++ (Fullstack & Systems)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(1, 5, 'advanced'),     -- Python
(1, 1, 'advanced'),     -- MySQL
(1, 10, 'advanced'),    -- Node.js
(1, 16, 'intermediate');-- C++

-- Aarav (2): Python, PyTorch, MySQL, Scikit-Learn (ML + DB focus)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(2, 5, 'advanced'),     -- Python
(2, 6, 'intermediate'), -- PyTorch
(2, 1, 'advanced'),     -- MySQL
(2, 8, 'intermediate'); -- Scikit-Learn

-- Diya (3): React.js, Node.js, TypeScript, HTML/CSS (Full stack web)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(3, 9, 'advanced'),     -- React.js
(3, 10, 'advanced'),    -- Node.js
(3, 11, 'intermediate'),-- TypeScript
(3, 12, 'advanced');    -- HTML/CSS

-- Rohan (4): MySQL, PostgreSQL, Docker, Node.js (Backend + DB + DevOps)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(4, 1, 'advanced'),     -- MySQL
(4, 2, 'intermediate'), -- PostgreSQL
(4, 18, 'intermediate'),-- Docker
(4, 10, 'intermediate');-- Node.js

-- Ananya (5): Python, PyTorch, MySQL, Docker (ML + DB + Docker)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(5, 5, 'advanced'),     -- Python
(5, 6, 'advanced'),     -- PyTorch
(5, 1, 'intermediate'), -- MySQL
(5, 18, 'beginner');    -- Docker

-- Kabir (6): Flutter, React Native (Mobile Dev)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(6, 13, 'advanced'),    -- Flutter
(6, 14, 'intermediate');-- React Native

-- Ishaan (7): React.js, Node.js, MySQL (Web + DB)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(7, 9, 'intermediate'), -- React.js
(7, 10, 'intermediate'),-- Node.js
(7, 1, 'intermediate'); -- MySQL

-- Sneha (8): C++, Docker, MySQL (Systems + DB)
INSERT INTO StudentSkill (student_id, skill_id, proficiency) VALUES
(8, 16, 'advanced'),    -- C++
(8, 18, 'intermediate'),-- Docker
(8, 1, 'intermediate'); -- MySQL

-- ------------------------------------------------------------
-- 5. Insert Teams
-- ------------------------------------------------------------
-- Team 1: "NeuralDB Innovators" formed for UCS416 (DBMS), created by Diya (3)
INSERT INTO Team (team_id, team_name, course_id, created_by, status) VALUES
(1, 'NeuralDB Innovators', 1, 3, 'open'),
(2, 'Agile WebCrafters', 4, 4, 'open'),
(3, 'Visionary ML Group', 3, 5, 'open');

-- ------------------------------------------------------------
-- 6. Insert Team Memberships
-- ------------------------------------------------------------
-- Team 1 has Diya (Full Stack Web)
INSERT INTO TeamMembership (team_id, student_id) VALUES (1, 3);

-- Team 2 has Rohan (Backend/DB) and Ishaan (Web/DB)
INSERT INTO TeamMembership (team_id, student_id) VALUES (2, 4), (2, 7);

-- Team 3 has Ananya (ML + DB)
INSERT INTO TeamMembership (team_id, student_id) VALUES (3, 5);

-- ------------------------------------------------------------
-- 7. Insert Open Slots
-- ------------------------------------------------------------
-- Team 1 Needs:
-- Slot 101: Requires BOTH Python AND MySQL (Multi-skill requirements!)
-- Slot 102: Requires Flutter
INSERT INTO Slot (slot_id, team_id, slot_status) VALUES
(101, 1, 'open'),
(102, 1, 'open');

-- Team 2 Needs:
-- Slot 201: Requires BOTH PyTorch AND Python (ML Lead)
INSERT INTO Slot (slot_id, team_id, slot_status) VALUES
(201, 2, 'open');

-- Team 3 Needs:
-- Slot 301: Requires React.js AND Node.js (Frontend/Fullstack for ML App)
INSERT INTO Slot (slot_id, team_id, slot_status) VALUES
(301, 3, 'open');

-- ------------------------------------------------------------
-- 8. Insert Slot Required Skills
-- ------------------------------------------------------------
-- Slot 101 needs Python (5) AND MySQL (1)
INSERT INTO SlotRequiredSkill (slot_id, skill_id) VALUES
(101, 5), -- Python
(101, 1); -- MySQL

-- Slot 102 needs Flutter (13)
INSERT INTO SlotRequiredSkill (slot_id, skill_id) VALUES
(102, 13); -- Flutter

-- Slot 201 needs PyTorch (6) AND Python (5)
INSERT INTO SlotRequiredSkill (slot_id, skill_id) VALUES
(201, 5), -- Python
(201, 6); -- PyTorch

-- Slot 301 needs React.js (9) AND Node.js (10)
INSERT INTO SlotRequiredSkill (slot_id, skill_id) VALUES
(301, 9),  -- React.js
(301, 10); -- Node.js

-- ------------------------------------------------------------
-- 9. Insert Connection Requests (Sample Data)
-- ------------------------------------------------------------
-- Shresth (1) sent a pending connection request to Team 1 for Slot 101 [Python, MySQL]
INSERT INTO ConnectionRequest (request_id, slot_id, student_id, sender_type, status, message) VALUES
(1, 101, 1, 'student', 'pending', 'Hi Diya, I have Python and MySQL skills from my coursework!'),
-- Kabir (6) sent a pending connection request to Team 1 for Slot 102 [Flutter]
(2, 102, 6, 'student', 'pending', 'Interested in building the Flutter mobile UI for NeuralDB!');

-- ------------------------------------------------------------
-- 10. Insert Past Collaborations (Sample historical data)
-- ------------------------------------------------------------
-- Rohan (4) and Ishaan (7) worked together on a past project
INSERT INTO PastCollaboration (student_a_id, student_b_id, team_id) VALUES
(4, 7, 2);
