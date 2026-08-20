-- ============================================================
-- GroupBy: Campus Team Formation System
-- Demo-Worthy SQL Queries & Stored Procedures (MySQL 8+)
-- ============================================================

USE groupby;

-- ------------------------------------------------------------
-- QUERY 1: Bidirectional Search — Student -> Open Slots (ALL / Exact Match)
-- Relational Division via Double Negation (NOT EXISTS)
-- "Find open slots where there is NO required skill that student 1 lacks"
-- ------------------------------------------------------------
SELECT 
    s.slot_id, 
    t.team_id, 
    t.team_name, 
    c.course_code,
    GROUP_CONCAT(sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') AS required_skills
FROM Slot s
JOIN Team t ON s.team_id = t.team_id
LEFT JOIN Course c ON t.course_id = c.course_id
JOIN SlotRequiredSkill srs ON s.slot_id = srs.slot_id
JOIN Skill sk ON srs.skill_id = sk.skill_id
WHERE s.slot_status = 'open' 
  AND t.status = 'open'
  AND NOT EXISTS (
      SELECT 1
      FROM SlotRequiredSkill req
      WHERE req.slot_id = s.slot_id
        AND req.skill_id NOT IN (
            SELECT ss.skill_id
            FROM StudentSkill ss
            WHERE ss.student_id = 1  -- Student ID parameter
        )
  )
GROUP BY s.slot_id, t.team_id, t.team_name, c.course_code;


-- ------------------------------------------------------------
-- QUERY 2: Bidirectional Search — Team/Slot -> Matching Students (ALL / Exact Match)
-- "Find all students who possess ALL required skills for Slot 101"
-- Slot 101 requires [Python, MySQL]
-- Candidates: Aarav (1), Ananya (4)
-- ------------------------------------------------------------
SELECT 
    st.student_id, 
    st.name, 
    st.email, 
    st.branch, 
    st.semester,
    GROUP_CONCAT(sk.skill_name ORDER BY sk.skill_name SEPARATOR ', ') AS student_skills
FROM Student st
JOIN StudentSkill ss ON st.student_id = ss.student_id
JOIN Skill sk ON ss.skill_id = sk.skill_id
WHERE NOT EXISTS (
    SELECT 1
    FROM SlotRequiredSkill srs
    WHERE srs.slot_id = 101 -- Slot ID parameter
      AND srs.skill_id NOT IN (
          SELECT user_sk.skill_id
          FROM StudentSkill user_sk
          WHERE user_sk.student_id = st.student_id
      )
)
GROUP BY st.student_id, st.name, st.email, st.branch, st.semester;


-- ------------------------------------------------------------
-- QUERY 3: Partial Matching with Match Score (ANY match)
-- Returns slots ordered by number of skills matched
-- ------------------------------------------------------------
SELECT 
    s.slot_id, 
    t.team_id, 
    t.team_name,
    COUNT(DISTINCT srs.skill_id) AS matched_skill_count,
    (SELECT COUNT(*) FROM SlotRequiredSkill WHERE slot_id = s.slot_id) AS total_required_skills
FROM Slot s
JOIN Team t ON s.team_id = t.team_id
JOIN SlotRequiredSkill srs ON s.slot_id = srs.slot_id
JOIN StudentSkill ss ON srs.skill_id = ss.skill_id
WHERE ss.student_id = 1 -- Student ID parameter
  AND s.slot_status = 'open'
  AND t.status = 'open'
GROUP BY s.slot_id, t.team_id, t.team_name
ORDER BY matched_skill_count DESC;


-- ------------------------------------------------------------
-- QUERY 4: Team Skill Gap Analysis (Relational Aggregation)
-- Find skill categories not represented among current members of Team 1
-- ------------------------------------------------------------
SELECT 
    sc.category_id, 
    sc.category_name AS unrepresented_category
FROM SkillCategory sc
WHERE sc.category_id NOT IN (
    SELECT DISTINCT sk.category_id
    FROM TeamMembership tm
    JOIN StudentSkill ss ON tm.student_id = ss.student_id
    JOIN Skill sk ON ss.skill_id = sk.skill_id
    WHERE tm.team_id = 1 -- Team ID parameter
);


-- ------------------------------------------------------------
-- QUERY 5: Informational Past Collaboration Check
-- Check if applicant (Student 1) has previously worked with
-- any existing members of Team 2
-- ------------------------------------------------------------
SELECT 
    tm.student_id AS existing_member_id, 
    st.name AS existing_member_name,
    CASE 
        WHEN pc.team_id IS NOT NULL THEN TRUE 
        ELSE FALSE 
    END AS worked_together_before
FROM TeamMembership tm
JOIN Student st ON tm.student_id = st.student_id
LEFT JOIN PastCollaboration pc
  ON (pc.student_a_id = LEAST(1, tm.student_id) AND pc.student_b_id = GREATEST(1, tm.student_id))
WHERE tm.team_id = 2; -- Team ID parameter


-- ------------------------------------------------------------
-- STORED PROCEDURE: Transactional Slot Assignment & Request Resolution
-- Atomic operation: Fill slot + Add team member + Log past collaboration + Update ConnectionRequests
-- ------------------------------------------------------------
DELIMITER //

DROP PROCEDURE IF EXISTS sp_fill_slot //

CREATE PROCEDURE sp_fill_slot(
    IN p_slot_id INT,
    IN p_student_id INT
)
BEGIN
    DECLARE v_team_id INT;
    DECLARE v_slot_status VARCHAR(20);
    
    -- Rollback on any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    -- Lock slot for update
    SELECT team_id, slot_status INTO v_team_id, v_slot_status
    FROM Slot
    WHERE slot_id = p_slot_id FOR UPDATE;
    
    -- Validate slot availability
    IF v_slot_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot does not exist';
    ELSEIF v_slot_status <> 'open' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slot is no longer open';
    END IF;
    
    -- 1. Mark slot as filled
    UPDATE Slot
    SET slot_status = 'filled',
        filled_by = p_student_id,
        filled_at = NOW()
    WHERE slot_id = p_slot_id;
    
    -- 2. Add student to team membership
    INSERT INTO TeamMembership(team_id, student_id)
    VALUES (v_team_id, p_student_id);
    
    -- 3. Log past collaboration entries with existing members
    INSERT IGNORE INTO PastCollaboration(student_a_id, student_b_id, team_id)
    SELECT LEAST(tm.student_id, p_student_id),
           GREATEST(tm.student_id, p_student_id),
           v_team_id
    FROM TeamMembership tm
    WHERE tm.team_id = v_team_id AND tm.student_id <> p_student_id;

    -- 4. Mark target connection request as 'accepted'
    UPDATE ConnectionRequest
    SET status = 'accepted'
    WHERE slot_id = p_slot_id AND student_id = p_student_id;

    -- 5. Auto-close all other pending requests for this filled slot
    UPDATE ConnectionRequest
    SET status = 'closed'
    WHERE slot_id = p_slot_id 
      AND student_id <> p_student_id 
      AND status = 'pending';
    
    COMMIT;
END //

DELIMITER ;
