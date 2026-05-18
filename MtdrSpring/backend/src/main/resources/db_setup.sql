CREATE USER VANTAGE IDENTIFIED BY "CHECK FOR PASSWORD IN DEPLOYMENT Sprint2,Module 8 Deployment & Closure (Israel) FILE ";


-- 2. Darle permisos
GRANT CONNECT, RESOURCE TO VANTAGE;
GRANT CREATE SESSION TO VANTAGE;
GRANT UNLIMITED TABLESPACE TO VANTAGE;


-- 3. Conectarte como VANTAGE y ejecutar el DDL de tu PDF:
CREATE TABLE vantage_user (
    oracle_id NUMBER PRIMARY KEY,
    mail VARCHAR2(255) NOT NULL,
    name VARCHAR2(255) NOT NULL,
    password VARCHAR2(255) NOT NULL,
    role VARCHAR2(20) DEFAULT 'DEVELOPER' NOT NULL,


    CONSTRAINT uq_vantage_user_mail UNIQUE (mail),


    CONSTRAINT chk_vantage_user_role
        CHECK (role IN ('ADMIN', 'DEVELOPER', 'MANAGER'))
);


CREATE TABLE sprints (
    sprint_id NUMBER PRIMARY KEY,
    sprint_name VARCHAR2(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sprint_duration NUMBER NOT NULL,
    status VARCHAR2(30) DEFAULT 'PLANNED' NOT NULL,
    goal VARCHAR2(255),

    CONSTRAINT chk_sprints_status
        CHECK (status IN ('PLANNED', 'ACTIVE', 'COMPLETED')),


    CONSTRAINT chk_sprint_dates
        CHECK (end_date >= start_date)
);


CREATE TABLE task (
    task_id NUMBER PRIMARY KEY,
    task_name VARCHAR2(255) NOT NULL,
    status VARCHAR2(20) DEFAULT 'TODO' NOT NULL,
    description VARCHAR2(1000),
    due_date DATE,
    category VARCHAR2(20) DEFAULT 'FEATURE' NOT NULL,
    story_points NUMBER DEFAULT 1,
    sprint_id NUMBER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by NUMBER NOT NULL,


    CONSTRAINT chk_task_status
        CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED')),


    CONSTRAINT chk_task_category
        CHECK (category IN ('FEATURE', 'BUG', 'ISSUE')),


    CONSTRAINT fk_task_sprint
        FOREIGN KEY (sprint_id) REFERENCES sprints(sprint_id),


    CONSTRAINT fk_task_created_by
        FOREIGN KEY (created_by) REFERENCES vantage_user(oracle_id)
);


CREATE TABLE task_assignees (
    task_id NUMBER,
    oracle_id NUMBER,
    real_time_spent NUMBER,
    estimated_completion_time NUMBER,
    additional_comments VARCHAR2(1000),


    PRIMARY KEY (task_id, oracle_id),


    CONSTRAINT fk_task_assignees_task
        FOREIGN KEY (task_id) REFERENCES task(task_id),


    CONSTRAINT fk_task_assignees_user
        FOREIGN KEY (oracle_id) REFERENCES vantage_user(oracle_id)
);


CREATE TABLE bugs (
    bug_id NUMBER PRIMARY KEY,
    task_id NUMBER NOT NULL,
    reported_by NUMBER,
    solved_by NUMBER,
    description VARCHAR2(1000) NOT NULL,


    CONSTRAINT fk_bugs_task
        FOREIGN KEY (task_id) REFERENCES task(task_id),


    CONSTRAINT fk_bugs_reported_by
        FOREIGN KEY (reported_by) REFERENCES vantage_user(oracle_id),


    CONSTRAINT fk_bugs_solved_by
        FOREIGN KEY (solved_by) REFERENCES vantage_user(oracle_id)
);


CREATE SEQUENCE VANTAGE.VANTAGE_USER_SEQ
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;


CREATE SEQUENCE VANTAGE.TASK_SEQ
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;


CREATE SEQUENCE VANTAGE.SPRINT_SEQ
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;


CREATE SEQUENCE VANTAGE.BUG_SEQ
START WITH 1
INCREMENT BY 1
NOCACHE
NOCYCLE;
