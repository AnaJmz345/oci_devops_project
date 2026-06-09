# ADR 0002: Component and domain partitioning

**Status:** Accepted
**Date:** 2026-05-16  
**Authors:** 
- Luisa Merlo Macias | A01067715
- Ana Paola Jiménez Sedano | A0164453
- Demmi Elizabeth Zepeda Rubio | A01709619
- Cesar Moran Macias | A01645209
- Ariana Guadalupe Rosales Villalobos | A01644773

## Context

When identifying the components of Vantage, the team needed to decide how to partition the system. Two main approaches were considered:

1. **Entity-based (CRUD) partitioning**: Define components around data. This is simple but leads to entity trap an anti-pattern where components have no meaningful business logic and become thin wrappers around database tables.

2. **Domain partitioning**:  Define components around business workflows and capabilities, where each component owns the logic for a complete user workflow rather than just data access for a single entity.


## Decision

The system is partitioned into the following domains, each corresponding to one or more workflows identified in Sprint 1:

### 1. Task Management Domain
**Workflows covered:** Task creation, assignment, categorization, status tracking, completion.  
**Package:** `com.springboot.MyTodoList.task`  
**Components:** TaskController, TaskService, TaskRepository, TaskAssigneeRepository  
**Why not just a CRUD wrapper?:** This domain owns the full task lifecycle, it handles multi-user assignment via TASK_ASSIGNEES, status transitions with validation, story point tracking, sprint linkage, and time logging (estimated vs. actual hours). These are workflow concerns, not simple entity persistence.

### 2. Bug Tracking Domain
**Workflows covered:** Bug reporting, resolution tracking, linking bugs to tasks.  

**Components:** BugController, BugService, BugRepository  
**Why separate from tasks:** Bugs have their own lifecycle (reported -> solved), their own actors (reported_by, solved_by), and their own metrics (defect density). Merging them into the *Task domain* would conflate two distinct business responsibilities.

### 3. Sprint Management Domain
**Workflows covered:** Sprint creation, task-to-sprint assignment, sprint progress monitoring.  
**Components:** SprintController, SprintService, SprintRepository  
**Why separate:** Sprints have their own lifecycle (PLANNED → ACTIVE → COMPLETED), duration calculation logic, and serve as an organizing concept that cuts across tasks. The Sprint domain provides the temporal structure that Task Management operates within.

### 4. User and Authentication Domain
**Workflows covered:** Login, registration, role-based access.  

**Components:** UserController, UserService, UserRepository, WebSecurityConfiguration  
**Note:** This domain is currently split across the legacy package structure rather than having its own dedicated package like the other domains. The security configuration permits all requests; role enforcement happens at the frontend level.

### 5. AI feature domain
**Workflows covered:** Story point estimation (planned), natural language intent detection, task data extraction from free text.  
**External dependency:** Currently uses Gemini 2.5 Flash, however this will change to an API building with vectors (In progress). 


### 6. Chatbot Domain
**Workflows covered:** Natural language commands via Telegram, conversational task creation with draft confirmation.  
**Components:** MyTodoListBot, TelegramTaskDraftService, BotHelper, ToDoItemBotController  
**External dependency:** Telegram Bot API.  
**Key behavior:** The bot implements a conversational draft flow, it extracts task fields from natural language, asks the user to confirm or fill missing fields, then creates the task once confirmed.

### 7. Analytics/KPI's domain
**Workflows covered:** Productivity metrics, sprint progress, bug tracking analytics.  
**Implementation:** Currently frontend-only (AnalyticsPage). The React frontend fetches raw data from the task, bug, sprint, and user endpoints and computes metrics in client-side.  
**No backend component:** There is no dedicated KPI or Reporting controller/service in the backend. This is a gap compared to Sprint 1 architecture, which planned separate KPI and Reporting components.

## Consequences

**Benefits:**
- Each domain has a clear owner and can be developed independently by a team member.
- The workflow-based approach avoids the entity trap, components have meaningful business logic rather than being thin CRUD wrappers.
- The separation makes future extraction to microservices possible along natural boundaries.

**Tradeoffs:**
- Some cross-domain queries exist (e.g., the Analytics frontend fetches from /tasks, /bugs, /users, and /sprints to compute KPIs). In a microservices world, these would require aggregation services or API composition.
- The authentication domain is not yet consolidated into its own package, creating an inconsistency with the other domains.
- The AI feature domain components live in the generic service package rather than their own domain package, making the boundary less explicit.


