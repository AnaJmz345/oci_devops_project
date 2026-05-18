workspace "Vantage" "Project management platform for developer teams — architecture model based on repository evidence." {

    !identifiers hierarchical

    model {

        # -------- Actors ----------------
        developer = person "Developer" "Team member who works on tasks, reports bugs, and updates progress."
        manager   = person "Manager"   "Team lead who creates sprints, assigns tasks, and monitors KPIs."
        system    = person "System / Automated Process" "Scheduled or event-driven processes: AI/NLP processing triggers, KPI aggregation, bot polling." "System"

        # ------- External systems ----------------------------------------------------
        telegramApi = softwareSystem "Telegram API" "Telegram Bot API — delivers and receives messages via long polling." "External"

        # ------- Vantage system ------------------------------
        vantage = softwareSystem "Vantage" "Role-based project management platform with web and Telegram bot interfaces." {

            # --- Containers ---

            webApp = container "Web Application" "React SPA providing dashboard, backlog, calendar, and analytics views. Built by frontend-maven-plugin and served as static resources from the backend." "React (JavaScript)" "WebApp"

            backend = container "Backend API" "Spring Boot application exposing REST endpoints and hosting the Telegram bot process. Single deployable JAR." "Java / Spring Boot 3.5" "Backend" {

                # --- Components: workflow / business-capability level ---

                taskManagement = component "Task Management" "Manages the full task lifecycle: creation, assignment, status transitions, story points, and hours tracking. Packages: task." "Spring (Controller + Service + Repository)"
                bugTracking    = component "Bug Tracking" "Handles bug reporting, resolution tracking, and linking bugs to tasks. Package: bug.*" "Spring (Controller + Service + Repository)"
                sprintMgmt     = component "Sprint Management" "Manages sprint lifecycle: creation, activation, completion, and duration calculation. Package: sprin." "Spring (Controller + Service + Repository)"
                authentication = component "Authentication / IAM" "User registration, login (BCrypt), role management (DEVELOPER / MANAGER). Spring Security config currently permits all requests, enforcement is in the frontend side." "Spring Security + Service + Repository"
                aiEstimation   = component "AI / NLP Feature" "Vector-based NLP feature for intent detection, structured task extraction from natural language, and story point estimation.
                chatbot        = component "Telegram Bot Interface" "Long-polling Telegram bot with conversational task draft flow. Active class: ToDoItemBotController (implements SpringLongPollingBot). Delegates to BotActions for command routing." "telegrambots + Spring"
                kpiAnalytics   = component "KPI / Analytics" "Computes productivity metrics: completion rates, status distribution, per-developer workload, defect density. Currently implemented entirely in the React frontend (AnalyticsPage.js)." "React (frontend-only)"
                persistence    = component "Persistence / Database Access" "JPA repositories for all domain entities. Oracle UCP connection pool with wallet  authentication to ATP." "Spring Data JPA + Oracle UCP"

                # TODO: Reporting Component — Sprint 1 lists this as a separate component
                # but the repository has no reporting-specific code (no PDF/CSV export, no
                # scheduled report generation). Add when implemented.
            }

            database = container "OCI Autonomous Database" "Oracle ATP with VANTAGE schema. Tables: TASK, TASK_ASSIGNEES, BUGS, SPRINTS, VANTAGE_USER." "Oracle Database" "Database"
        }

        # -- Relationships: Actors -> Containers ----------
        developer -> vantage.webApp "Views tasks, updates status, reports bugs" "HTTPS"
        developer -> telegramApi "Sends natural language commands" "HTTPS"
        manager   -> vantage.webApp "Creates sprints/tasks, assigns work, views analytics" "HTTPS"
        manager   -> telegramApi "Manages tasks via Telegram" "HTTPS"
        system    -> vantage.backend.aiEstimation "Triggers AI/NLP processing for incoming bot messages"
        system    -> vantage.backend.kpiAnalytics "Drives analytics data aggregation on page load"

        # -- Relationships: Containers --------------------
        vantage.webApp -> vantage.backend "API requests for tasks, bugs, sprints, users" "HTTP/JSON"
        vantage.backend -> vantage.database "Reads and writes application data" "JDBC / Oracle UCP"
        vantage.backend -> telegramApi "Sends bot responses" "HTTPS"
        telegramApi -> vantage.backend "Delivers user messages via long polling" "HTTPS"

        # ----- Relationships: Components ----

        # Web App → backend components
        vantage.webApp -> vantage.backend.taskManagement "Task CRUD, assignment, status updates" "REST"
        vantage.webApp -> vantage.backend.bugTracking "Bug reporting and resolution" "REST"
        vantage.webApp -> vantage.backend.sprintMgmt "Sprint CRUD and status filtering" "REST"
        vantage.webApp -> vantage.backend.authentication "Login, registration, user listing" "REST"
        vantage.webApp -> vantage.backend.kpiAnalytics "Fetches raw data for client-side KPI computation" "REST"

        # Telegram bot flow
        telegramApi -> vantage.backend.chatbot "Delivers messages to bot via long polling"
        vantage.backend.chatbot -> vantage.backend.aiEstimation "Delegates vector-based NLP intent detection and task extraction"
        vantage.backend.chatbot -> vantage.backend.taskManagement "Creates tasks after user confirms draft"
        vantage.backend.chatbot -> vantage.backend.authentication "Looks up users by email or Telegram chat ID"
        vantage.backend.chatbot -> vantage.backend.sprintMgmt "Resolves sprint references from natural language"
        vantage.backend.chatbot -> telegramApi "Sends responses back to user"

        # AI / NLP feature is planned as an internal vector-based capability; no external LLM API is modeled.

        # All domain components → persistence
        vantage.backend.taskManagement -> vantage.backend.persistence "Reads/writes Task and TaskAssignee entities"
        vantage.backend.bugTracking -> vantage.backend.persistence "Reads/writes Bug entities"
        vantage.backend.sprintMgmt -> vantage.backend.persistence "Reads/writes Sprint entities"
        vantage.backend.authentication -> vantage.backend.persistence "Reads/writes User entities"

        # Persistence → database
        vantage.backend.persistence -> vantage.database "SQL operations on VANTAGE schema tables"

        # -- Deployment ------------------------
        prodEnvironment = deploymentEnvironment "OCI Production" {

            deploymentNode "OKE Cluster" "Oracle Kubernetes Engine — 3-node pool " "Kubernetes" {

                deploymentNode "Backend Pod" "Runs the Spring Boot JAR (which includes the React SPA as static resources) as a Docker container on OpenJDK 22." "Docker" {
                    webAppInstance = containerInstance vantage.webApp
                    backendInstance = containerInstance vantage.backend
                    
                    # The Frontend React SPA is bundled inside this same JAR.
                    # It is NOT a separate deployed container its a logical
                    # container in C4 but shares this deployment node.
                }
            }

            deploymentNode "OCI Autonomous Database" "Oracle ATP" "Oracle ATP" {
                databaseInstance = containerInstance vantage.database
            }

            # TODO: OCI API Gateway — Terraform resource exists in apigateway.tf
            # but is entirely commented out. Backend serves requests directly.
        }
    }

    views {

        # -- System Context ------------------------------
        systemContext vantage "SystemContext" "Vantage system context — actors, external integrations" {
            include *
            autoLayout tb
        }

        # -- Container Diagram ----------------------------
        container vantage "Containers" "Containers within the Vantage system" {
            include *
            autoLayout tb
        }

        # -- Component Diagram ----------------------------
        component vantage.backend "Components" "Business-capability components of the Spring Boot backend" {
            include *
            autoLayout lr
        }

        # -- Deployment Diagram ---------------------------
        deployment vantage "OCI Production" "Deployment" "Production deployment on Oracle Cloud Infrastructure" {
            include *
            autoLayout tb
        }

        # --- Dynamic Diagram: Create Task via Telegram Bot ------------
        dynamic vantage.backend "CreateTaskViaTelegram" "Developer creates a task through natural language in the Telegram bot" {
            telegramApi -> vantage.backend.chatbot "1. Delivers user message via long polling"
            vantage.backend.chatbot -> vantage.backend.aiEstimation "2. Classifies intent using internal vector/NLP logic"
            vantage.backend.chatbot -> vantage.backend.aiEstimation "3. Extracts structured task fields using internal vector/NLP logic"
            vantage.backend.chatbot -> vantage.backend.authentication "4. Looks up assignee by email"
            vantage.backend.chatbot -> vantage.backend.sprintMgmt "5. Resolves sprint from extracted data"
            vantage.backend.chatbot -> vantage.backend.taskManagement "6. User confirmed draft — create task"
            vantage.backend.taskManagement -> vantage.backend.persistence "7. Persists new Task entity"
            vantage.backend.persistence -> vantage.database "8. INSERT into TASK table"
            vantage.backend.chatbot -> telegramApi "9. Sends success confirmation to user"
            autoLayout tb
        }

        # STYLES
        styles {
            element "Person" {
                shape Person
                background #cfac98
                color #000000
            }
            element "System" {
                shape Robot
                background #5A5A5A
                color #ffffff
            }
            element "Software System" {
                background #4d4fa1
                color #ffffff
            }
            element "External" {
                background #e86767
                color #ffffff
            }
            element "Container" {
                background #8850dc
                color #ffffff
            }
            element "WebApp" {
                shape WebBrowser
                background #d16715
                color #ffffff
            }
            element "Backend" {
                shape Hexagon
                background #438DD5
                color #ffffff
            }
            element "Database" {
                shape Cylinder
                background #1fd5c3
                color #ffffff
            }
            element "Component" {
                background #a1ebb1
                color #000000
            }
        }
    }

}
