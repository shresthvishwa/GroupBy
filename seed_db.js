require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function reseed() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('[Reseed] Connected to MySQL server.');

    // 1. Re-create database
    await conn.query('DROP DATABASE IF EXISTS groupby; CREATE DATABASE groupby; USE groupby;');

    // 2. Execute Student, Category, Skill, StudentSkill, Course, Team, TeamMembership, Slot, SlotRequiredSkill, ConnectionRequest, PastCollaboration
    const createTablesSql = `
    CREATE TABLE Student (
        student_id      INT PRIMARY KEY AUTO_INCREMENT,
        name            VARCHAR(100) NOT NULL,
        email           VARCHAR(100) UNIQUE NOT NULL,
        password_hash   VARCHAR(255) NOT NULL DEFAULT '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        contact_info    VARCHAR(150) NULL,
        roll_no         VARCHAR(20)  UNIQUE NOT NULL,
        branch          VARCHAR(100) NOT NULL,
        semester        TINYINT UNSIGNED NOT NULL CHECK (semester BETWEEN 1 AND 8),
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

    CREATE TABLE StudentSkill (
        student_id      INT NOT NULL,
        skill_id        INT NOT NULL,
        proficiency     ENUM('beginner','intermediate','advanced') DEFAULT 'intermediate',
        PRIMARY KEY (student_id, skill_id),
        FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id)   REFERENCES Skill(skill_id)      ON DELETE CASCADE
    );

    CREATE TABLE Course (
        course_id       INT PRIMARY KEY AUTO_INCREMENT,
        course_code     VARCHAR(20) UNIQUE NOT NULL,
        course_name     VARCHAR(100) NOT NULL
    );

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

    CREATE TABLE TeamMembership (
        team_id         INT NOT NULL,
        student_id      INT NOT NULL,
        joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, student_id),
        FOREIGN KEY (team_id)    REFERENCES Team(team_id)       ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE
    );

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

    CREATE TABLE SlotRequiredSkill (
        slot_id         INT NOT NULL,
        skill_id        INT NOT NULL,
        PRIMARY KEY (slot_id, skill_id),
        FOREIGN KEY (slot_id)  REFERENCES Slot(slot_id)  ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES Skill(skill_id) ON DELETE CASCADE
    );

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

    CREATE INDEX idx_student_branch_sem ON Student(branch, semester);
    CREATE INDEX idx_team_status        ON Team(status);
    CREATE INDEX idx_slot_status        ON Slot(slot_status);
    CREATE INDEX idx_team_course        ON Team(course_id);
    CREATE INDEX idx_req_slot_student   ON ConnectionRequest(slot_id, student_id, status);
    `;
    await conn.query(createTablesSql);
    console.log('[Reseed] Tables & Indexes created.');

    // 3. Create Trigger
    const triggerSql = `
    CREATE TRIGGER trg_team_disbanded_close_slots
    AFTER UPDATE ON Team
    FOR EACH ROW
    BEGIN
        IF NEW.status = 'disbanded' AND OLD.status <> 'disbanded' THEN
            UPDATE Slot SET slot_status = 'closed' WHERE team_id = NEW.team_id AND slot_status = 'open';
            UPDATE ConnectionRequest cr JOIN Slot s ON cr.slot_id = s.slot_id SET cr.status = 'closed' WHERE s.team_id = NEW.team_id AND cr.status = 'pending';
        END IF;
    END;
    `;
    await conn.query(triggerSql);
    console.log('[Reseed] Trigger created.');

    // 4. Create Stored Procedure sp_fill_slot
    const spSql = `
    CREATE PROCEDURE sp_fill_slot(
        IN p_slot_id INT,
        IN p_student_id INT
    )
    BEGIN
        DECLARE v_team_id INT;
        DECLARE v_slot_status VARCHAR(20);
        
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
            ROLLBACK;
            RESIGNAL;
        END;

        START TRANSACTION;
        
        SELECT team_id, slot_status INTO v_team_id, v_slot_status
        FROM Slot
        WHERE slot_id = p_slot_id FOR UPDATE;
        
        IF v_slot_status IS NULL THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot does not exist';
        ELSEIF v_slot_status <> 'open' THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot is no longer open';
        END IF;
        
        UPDATE Slot
        SET slot_status = 'filled',
            filled_by = p_student_id,
            filled_at = NOW()
        WHERE slot_id = p_slot_id;
        
        INSERT INTO TeamMembership(team_id, student_id)
        VALUES (v_team_id, p_student_id);
        
        INSERT IGNORE INTO PastCollaboration(student_a_id, student_b_id, team_id)
        SELECT LEAST(tm.student_id, p_student_id),
               GREATEST(tm.student_id, p_student_id),
               v_team_id
        FROM TeamMembership tm
        WHERE tm.team_id = v_team_id AND tm.student_id <> p_student_id;

        UPDATE ConnectionRequest
        SET status = 'accepted'
        WHERE slot_id = p_slot_id AND student_id = p_student_id;

        UPDATE ConnectionRequest
        SET status = 'closed'
        WHERE slot_id = p_slot_id 
          AND student_id <> p_student_id 
          AND status = 'pending';
        
        COMMIT;
    END;
    `;
    await conn.query(spSql);
    console.log('[Reseed] Stored procedure sp_fill_slot created.');

    // 5. Run Seed Inserts
    const seedSql = fs.readFileSync(path.join(__dirname, 'groupby_seed.sql'), 'utf8');
    const cleanSeedSql = seedSql.substring(seedSql.indexOf('INSERT INTO SkillCategory'));
    await conn.query(cleanSeedSql);
    console.log('[Reseed] Seed data inserted successfully!');

    console.log('[Reseed] ALL COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('[Reseed Error]', err);
  } finally {
    if (conn) await conn.end();
  }
}

reseed();
