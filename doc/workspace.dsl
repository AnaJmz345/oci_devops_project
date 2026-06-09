workspace "Vantage" "Project management platform for developer teams — architecture model based on repository evidence." {

```
!identifiers hierarchical

model {

    # -------- Actors ----------------
    developer = person "Developer" "Team member who works on tasks, reports bugs, and updates progress."
    manager   = person "Manager" "Team lead who creates sprints, assigns tasks, and monitors KPIs."
    system    = person "System / Automated Process" "Scheduled or event-driven processes: AI/NLP processing triggers, KPI aggregation, bot polling, and productivity report generation." "System"

    # ------- External systems ----------------
    telegramApi = softwareSystem "Telegram API" "Telegram Bot API — delivers and receives messages via long polling." "External"

    # ------- Vantage system ----------------
    vantage = softwareSystem "Vantage" "Role-based project management platform with web and Telegram bot interfaces." {

        # --- Containers ---

        webApp = container "Web Application" "React SPA providing dashboard, backlog, calendar, analytics, and productivity views. Built by frontend-maven-plugin and served as static resources from the backend." "React (JavaScript)" "WebApp"

        backend = container "Backend API" "Spring Boot application exposing REST endpoints, hosting the Telegram bot process, running vector-based intent matching, and generating productivity reports. Single deployable JAR." "Java / Spring Boot 3.5" "Backend" {

            # --- Components: workflow / business-capability level ---

            taskManagement = component "Task Management" "Manages the full task lifecycle: creation, assignment, status transitions, story points, estimated hours, real hours, and task ownership. Packages: task, model, repository." "Spring Controller + Service + Repository" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/task-domain.puml"
            }

            bugTracking = component "Bug Tracking" "Handles bug reporting, resolution tracking, and linking bugs to tasks. Package: bug." "Spring Controller + Service + Repository" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/task-domain.puml"
            }

            sprintMgmt = component "Sprint Management" "Manages sprint lifecycle: creation, activation, completion, duration calculation, and sprint references from tasks. Package: sprint." "Spring Controller + Service + Repository" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/task-domain.puml"
            }

            authentication = component "Authentication / IAM" "Handles user registration, login, role management, password handling, and access-related configuration. Roles include DEVELOPER and MANAGER." "Spring Security + Service + Repository" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/security-config.puml"
            }

            aiEstimation = component "Vector Intent Matching / NLP" "Internal vector-based NLP capability that replaces external LLM/API usage. It classifies Telegram messages, matches user intent, supports task extraction, and routes natural language requests into application actions. Packages: botai, service." "Java Services + Local Vector Embeddings" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/natural-language.puml"
            }

            chatbot = component "Telegram Bot Interface" "Long-polling Telegram bot with conversational task draft flow. Active class: ToDoItemBotController. Delegates command routing and task actions to BotActions and NLP/vector services." "telegrambots + Spring" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/telegram-bot.puml"
            }

            kpiAnalytics = component "KPI / Productivity Analytics" "Computes productivity metrics, completion rates, workload distribution, status distribution, defect density, savings estimates, and recommendations for managers. Packages: productivity and frontend analytics views." "Spring Services + React Analytics" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/productivity-report.puml"
            }

            persistence = component "Persistence / Database Access" "JPA repositories for domain entities. Uses Oracle UCP connection pool with wallet authentication to Oracle Autonomous Database." "Spring Data JPA + Oracle UCP" {
                url "https://github.com/AnaJmz345/oci_devops_project/blob/main/docs/diagrams/task-domain.puml"
            }
        }

        database = container "OCI Autonomous Database" "Oracle ATP with VANTAGE schema. Tables include TASK, TASK_ASSIGNEES, BUGS, SPRINTS, VANTAGE_USER, and vector/NLP support tables for local intent matching." "Oracle Autonomous Database" "Database"
    }

    # -------- Relationships: Actors -> Systems / Containers --------
    developer -> vantage.webApp "Views tasks, updates status, reports bugs, and checks assigned work" "HTTPS"
    developer -> telegramApi "Sends natural language commands to the bot" "HTTPS"

    manager -> vantage.webApp "Creates sprints/tasks, assigns work, views analytics, and reviews productivity reports" "HTTPS"
    manager -> telegramApi "Manages tasks through Telegram commands" "HTTPS"

    system -> vantage.backend.aiEstimation "Triggers vector/NLP processing for incoming bot messages"
    system -> vantage.backend.kpiAnalytics "Triggers productivity report and KPI calculation"

    # -------- Relationships: Containers --------
    vantage.webApp -> vantage.backend "API requests for tasks, bugs, sprints, users, analytics, and productivity reports" "HTTP/JSON"
    vantage.backend -> vantage.database "Reads and writes application data" "JDBC / Oracle UCP"

    telegramApi -> vantage.backend "Delivers user messages via long polling" "HTTPS"
    vantage.backend -> telegramApi "Sends bot responses" "HTTPS"

    # -------- Relationships: Web App -> Backend Components --------
    vantage.webApp -> vantage.backend.taskManagement "Task CRUD, assignment, status updates, and hours tracking" "REST"
    vantage.webApp -> vantage.backend.bugTracking "Bug reporting and resolution" "REST"
    vantage.webApp -> vantage.backend.sprintMgmt "Sprint CRUD and status filtering" "REST"
    vantage.webApp -> vantage.backend.authentication "Login, registration, user listing, and role handling" "REST"
    vantage.webApp -> vantage.backend.kpiAnalytics "Requests KPI metrics, productivity reports, savings estimates, and recommendations" "REST"

    # -------- Relationships: Telegram bot flow --------
    telegramApi -> vantage.backend.chatbot "Delivers messages to bot via long polling"
    vantage.backend.chatbot -> vantage.backend.aiEstimation "Delegates vector-based intent detection and task extraction"
    vantage.backend.chatbot -> vantage.backend.taskManagement "Creates, lists, updates, or deletes tasks after user intent is confirmed"
    vantage.backend.chatbot -> vantage.backend.authentication "Looks up users by email, role, or Telegram chat context"
    vantage.backend.chatbot -> vantage.backend.sprintMgmt "Resolves sprint references from natural language"
    vantage.backend.chatbot -> telegramApi "Sends responses back to the user"

    # -------- Relationships: AI / NLP --------
    vantage.backend.aiEstimation -> vantage.backend.persistence "Reads intent catalog, examples, and task-related data"
    vantage.backend.aiEstimation -> vantage.backend.taskManagement "Maps detected task intents into task operations"
    vantage.backend.aiEstimation -> vantage.backend.sprintMgmt "Uses sprint information to enrich task drafts"
    vantage.backend.aiEstimation -> vantage.backend.authentication "Uses user data to resolve assignees and roles"

    # -------- Relationships: KPI / Analytics --------
    vantage.backend.kpiAnalytics -> vantage.backend.taskManagement "Reads task status, task dates, story points, estimated hours, and real hours"
    vantage.backend.kpiAnalytics -> vantage.backend.bugTracking "Reads bug data for defect density and quality indicators"
    vantage.backend.kpiAnalytics -> vantage.backend.sprintMgmt "Reads sprint data for sprint-level productivity metrics"
    vantage.backend.kpiAnalytics -> vantage.backend.authentication "Reads developer and manager information for per-member summaries"
    vantage.backend.kpiAnalytics -> vantage.backend.persistence "Reads stored productivity data and domain entities"

    # -------- Relationships: Domain Components -> Persistence --------
    vantage.backend.taskManagement -> vantage.backend.persistence "Reads/writes Task and TaskAssignee entities"
    vantage.backend.bugTracking -> vantage.backend.persistence "Reads/writes Bug entities"
    vantage.backend.sprintMgmt -> vantage.backend.persistence "Reads/writes Sprint entities"
    vantage.backend.authentication -> vantage.backend.persistence "Reads/writes User entities"

    # -------- Persistence -> Database --------
    vantage.backend.persistence -> vantage.database "SQL operations on VANTAGE schema tables"

    # -------- Deployment --------
    prodEnvironment = deploymentEnvironment "OCI Production" {

        deploymentNode "OKE Cluster" "Oracle Kubernetes Engine cluster for running the application workload." "Kubernetes" {

            deploymentNode "Backend Pod" "Runs the Spring Boot JAR as a Docker container. The React SPA is bundled and served from the same deployable artifact." "Docker + OpenJDK" {
                webAppInstance = containerInstance vantage.webApp
                backendInstance = containerInstance vantage.backend

                # The React SPA is a logical C4 container, but physically it is served by the Spring Boot backend JAR.
            }
        }

        deploymentNode "OCI Autonomous Database" "Oracle ATP used by the VANTAGE schema." "Oracle Autonomous Database" {
            databaseInstance = containerInstance vantage.database
        }
    }
}

views {

    # -------- System Landscape --------
    systemLandscape "SystemLandscape" "System landscape for Vantage and its external integrations." {
        include *
        autoLayout tb
    }

    # -------- System Context --------
    systemContext vantage "SystemContext" "Vantage system context — actors and external integrations." {
        include *
        autoLayout tb
    }

    # -------- Container Diagram --------
    container vantage "Containers" "Containers within the Vantage system." {
        include *
        autoLayout tb
    }

    # -------- Component Diagram --------
    component vantage.backend "Components" "Business-capability components of the Spring Boot backend." {
        include *
        autoLayout lr
    }

    # -------- Deployment Diagram --------
    deployment vantage "OCI Production" "Deployment" "Production deployment on Oracle Cloud Infrastructure." {
        include *
        autoLayout tb
    }

    # -------- Dynamic Diagram: Create Task via Telegram Bot --------
    dynamic vantage.backend "CreateTaskViaTelegram" "Developer creates a task through natural language in the Telegram bot." {
        telegramApi -> vantage.backend.chatbot "1. Delivers user message via long polling"
        vantage.backend.chatbot -> vantage.backend.aiEstimation "2. Classifies intent using internal vector/NLP logic"
        vantage.backend.chatbot -> vantage.backend.aiEstimation "3. Extracts structured task fields using local vector/NLP logic"
        vantage.backend.chatbot -> vantage.backend.authentication "4. Looks up assignee by email or role"
        vantage.backend.chatbot -> vantage.backend.sprintMgmt "5. Resolves sprint from extracted data"
        vantage.backend.chatbot -> vantage.backend.taskManagement "6. Creates task after user confirms draft"
        vantage.backend.taskManagement -> vantage.backend.persistence "7. Persists new Task entity"
        vantage.backend.persistence -> vantage.database "8. INSERT into task-related tables"
        vantage.backend.chatbot -> telegramApi "9. Sends success confirmation to user"
        autoLayout tb
    }

    # -------- Dynamic Diagram: Manager Reviews Productivity Report --------
    dynamic vantage "ManagerReviewsProductivityReport" "Manager opens the analytics view and reviews productivity reports and recommendations." {
        manager -> vantage.webApp "1. Opens analytics/productivity page"
        vantage.webApp -> vantage.backend.kpiAnalytics "2. Requests productivity report"
        vantage.backend.kpiAnalytics -> vantage.backend.taskManagement "3. Reads task progress, status, story points, and hours"
        vantage.backend.kpiAnalytics -> vantage.backend.bugTracking "4. Reads bug and defect data"
        vantage.backend.kpiAnalytics -> vantage.backend.sprintMgmt "5. Reads sprint information"
        vantage.backend.kpiAnalytics -> vantage.backend.authentication "6. Reads team member information"
        vantage.backend.kpiAnalytics -> vantage.backend.persistence "7. Queries required entities"
        vantage.backend.persistence -> vantage.database "8. SELECT from VANTAGE schema tables"
        vantage.backend.kpiAnalytics -> vantage.webApp "9. Returns KPIs, savings estimate, insights, and recommendations"
        vantage.webApp -> manager "10. Displays productivity dashboard"
        autoLayout tb
    }

    # -------- Dynamic Diagram: Vector-Based Intent Matching --------
    dynamic vantage.backend "VectorIntentMatching" "Telegram message is processed using local vector embeddings instead of an external API." {
        telegramApi -> vantage.backend.chatbot "1. Delivers natural language message"
        vantage.backend.chatbot -> vantage.backend.aiEstimation "2. Sends message for intent detection"
        vantage.backend.aiEstimation -> vantage.backend.persistence "3. Reads local intent catalog and stored examples"
        vantage.backend.persistence -> vantage.database "4. SELECT intent examples and vectors"
        vantage.backend.aiEstimation -> vantage.backend.aiEstimation "5. Generates local hash/vector representation"
        vantage.backend.aiEstimation -> vantage.backend.aiEstimation "6. Compares message vector against stored intent examples"
        vantage.backend.aiEstimation -> vantage.backend.chatbot "7. Returns best matching intent and confidence"
        vantage.backend.chatbot -> vantage.backend.taskManagement "8. Executes mapped task action when confidence is enough"
        autoLayout tb
    }

    # -------- Styles --------
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
```

}
