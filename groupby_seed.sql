-- ============================================================
-- GroupBy: Campus Team Formation System
-- Seed Data Script (MySQL 8+)
-- Target Context: Thapar Institute of Engineering & Technology (TIET)
-- ============================================================

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
