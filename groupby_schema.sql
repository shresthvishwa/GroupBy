-- ============================================================
-- GroupBy: Campus Team Formation System
-- Schema Design (MySQL 8+)
-- ============================================================

DROP DATABASE IF EXISTS groupby;
CREATE DATABASE groupby;
USE groupby;

-- ------------------------------------------------------------
-- Core entity: Student (Restricted to @thapar.edu domain)
-- ------------------------------------------------------------
CREATE TABLE Student (
    student_id      INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL DEFAULT '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', -- SHA-256 for 'thapar123'
    contact_info    VARCHAR(150) NULL,             -- Phone / Discord / WhatsApp (hidden until request accepted)
    roll_no         VARCHAR(20)  UNIQUE NOT NULL,
    branch          VARCHAR(100) NOT NULL,
    semester        TINYINT UNSIGNED NOT NULL CHECK (semester BETWEEN 1 AND 8),
    linkedin_url    VARCHAR(255) NULL,             -- Optional LinkedIn Profile
    github_url      VARCHAR(255) NULL,             -- Optional GitHub Profile
    leetcode_url    VARCHAR(255) NULL,             -- Optional LeetCode Profile
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_thapar_email CHECK (LOWER(email) LIKE '%@thapar.edu'),
    CONSTRAINT chk_thapar_branch CHECK (branch IN (
      'Chemical', 'Civil', 'Computer', 'Electrical', 'Mechanical', 'Mechatronics',
      'Electronics (Instrumentation & Control)', 'Electronics & Communication', 'Electronics & Computer',
      'Biomedical', 'Computer Science', 'Computer Science & Business Systems', 'BioTechnology',
      'Artificial Intelligence & Data Science', 'Electrical & Computer', 'Electronics (VLSI Design and Technology)',
      'Civil (IEP)', 'Computer (IEP)', 'Electronics & Communication (IEP)', 'Mechanical (IEP)',
      'COE', 'ENC', 'DER', 'CHE', 'CIE', 'ELE', 'MEE', 'MEC', 'EIC', 'ECE', 'BME', 'CSE', 'CSBS', 'BT', 'AIDS', 'ELC', 'EVL'
    ))
);

-- ------------------------------------------------------------
-- Skill taxonomy: category exists mainly to power the
-- "skill gap" aggregation feature (GROUP BY category).
-- ------------------------------------------------------------
CREATE TABLE SkillCategory (
    category_id     INT PRIMARY KEY AUTO_INCREMENT,
    category_name   VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Skill (
    skill_id        INT PRIMARY KEY AUTO_INCREMENT,
    skill_name      VARCHAR(100) UNIQUE NOT NULL,
    category_id     INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES SkillCategory(category_id)
);

-- ------------------------------------------------------------
-- Junction: Student <-> Skill (many-to-many)
-- ------------------------------------------------------------
CREATE TABLE StudentSkill (
    student_id      INT NOT NULL,
    skill_id        INT NOT NULL,
    proficiency     ENUM('beginner','intermediate','advanced') DEFAULT 'intermediate',
    credential_url  VARCHAR(255) NULL,             -- Optional proof / certificate link
    PRIMARY KEY (student_id, skill_id),
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)   REFERENCES Skill(skill_id)      ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Optional scoping: Course / elective a team is formed for
-- ------------------------------------------------------------
CREATE TABLE Course (
    course_id       INT PRIMARY KEY AUTO_INCREMENT,
    course_code     VARCHAR(20) UNIQUE NOT NULL,
    course_name     VARCHAR(100) NOT NULL
);

-- ------------------------------------------------------------
-- Core entity: Team
-- ------------------------------------------------------------
CREATE TABLE Team (
    team_id         INT PRIMARY KEY AUTO_INCREMENT,
    team_name       VARCHAR(100) NOT NULL,
    course_id       INT NULL,
    created_by      INT NOT NULL,
    status          ENUM('open','closed','disbanded') DEFAULT 'open',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id)  REFERENCES Course(course_id),
    FOREIGN KEY (created_by) REFERENCES Student(student_id)
);

-- ------------------------------------------------------------
-- Junction: Team <-> Student (confirmed membership)
-- ------------------------------------------------------------
CREATE TABLE TeamMembership (
    team_id         INT NOT NULL,
    student_id      INT NOT NULL,
    joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, student_id),
    FOREIGN KEY (team_id)    REFERENCES Team(team_id)       ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Slot: one open position within a team.
-- ------------------------------------------------------------
CREATE TABLE Slot (
    slot_id         INT PRIMARY KEY AUTO_INCREMENT,
    team_id         INT NOT NULL,
    slot_status     ENUM('open','filled','closed') DEFAULT 'open',
    filled_by       INT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    filled_at       TIMESTAMP NULL,
    FOREIGN KEY (team_id)    REFERENCES Team(team_id)       ON DELETE CASCADE,
    FOREIGN KEY (filled_by)  REFERENCES Student(student_id)
);

-- ------------------------------------------------------------
-- Junction: Slot <-> Skill (multi-skill requirements)
-- ------------------------------------------------------------
CREATE TABLE SlotRequiredSkill (
    slot_id         INT NOT NULL,
    skill_id        INT NOT NULL,
    PRIMARY KEY (slot_id, skill_id),
    FOREIGN KEY (slot_id)  REFERENCES Slot(slot_id)  ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skill(skill_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Connection Request System: Mutual interest flow prior to contact reveal
-- ------------------------------------------------------------
CREATE TABLE ConnectionRequest (
    request_id      INT PRIMARY KEY AUTO_INCREMENT,
    slot_id         INT NOT NULL,
    student_id      INT NOT NULL,
    sender_type     ENUM('student', 'team') NOT NULL DEFAULT 'student',
    status          ENUM('pending', 'accepted', 'declined', 'closed') NOT NULL DEFAULT 'pending',
    message         VARCHAR(255) NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id)    REFERENCES Slot(slot_id)    ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- Past collaboration history
-- ------------------------------------------------------------
CREATE TABLE PastCollaboration (
    student_a_id    INT NOT NULL,
    student_b_id    INT NOT NULL,
    team_id         INT NOT NULL,
    PRIMARY KEY (student_a_id, student_b_id, team_id),
    FOREIGN KEY (student_a_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (student_b_id) REFERENCES Student(student_id) ON DELETE CASCADE,
    FOREIGN KEY (team_id)      REFERENCES Team(team_id)       ON DELETE CASCADE,
    CHECK (student_a_id < student_b_id)
);

-- ============================================================
-- Triggers: Auto-close slots & requests when team is disbanded
-- ============================================================
DELIMITER //

CREATE TRIGGER trg_team_disbanded_close_slots
AFTER UPDATE ON Team
FOR EACH ROW
BEGIN
    IF NEW.status = 'disbanded' AND OLD.status <> 'disbanded' THEN
        UPDATE Slot
        SET slot_status = 'closed'
        WHERE team_id = NEW.team_id
          AND slot_status = 'open';

        UPDATE ConnectionRequest cr
        JOIN Slot s ON cr.slot_id = s.slot_id
        SET cr.status = 'closed'
        WHERE s.team_id = NEW.team_id
          AND cr.status = 'pending';
    END IF;
END //

DELIMITER ;

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_student_branch_sem ON Student(branch, semester);
CREATE INDEX idx_team_status        ON Team(status);
CREATE INDEX idx_slot_status        ON Slot(slot_status);
CREATE INDEX idx_team_course        ON Team(course_id);
CREATE INDEX idx_req_slot_student   ON ConnectionRequest(slot_id, student_id, status);
