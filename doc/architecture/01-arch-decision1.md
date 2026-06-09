# ADR 0001: Architecture Style Selection

**Status:** Accepted  
**Date:** 2026-05-16  
**Authors:** 
- Luisa Merlo Macias | A01067715
- Ana Paola Jiménez Sedano | A0164453
- Demmi Elizabeth Zepeda Rubio | A01709619
- Cesar Moran Macias | A01645209
- Ariana Guadalupe Rosales Villalobos | A01644773

## Context

Vantage is a project management platform that serves two primary actors (Developer and Manager) through two interfaces: a React web application and a Telegram bot. The system manages tasks, bug tracking, creation of sprints, different types of users, performance analytics, and integrates with external AI services for undertansing of natural language processing.

During Sprint 1, the team evaluated architecture styles studied in class and identified domain partitioning combined with a microservices-oriented approach as the target architecture. The actual implementation needed to balance the team's academic timeline, the complexity of the OCI deployment stack, the available resources and the goal of keeping each business domain independently maintainable.

The architecture styles considered were:

- **Microservices architecture**: Each business domain deployed as an independent service.
- **Modular monolith**: A single deployable unit with clear internal module boundaries organized by domain.
- **Layered**: tHE Components ARE organized by technical role (presentation, business logic, persistence).
- **Domain partitioning**: Components organized around business capabilities and workflows rather than technical layers.

## Decision

The team adopts a **modular monolith with domain partitioning** as the primary architecture style. This is complemented by technical layering within each domain module (controller → service → repository).

Specifically:

1. **Modular monolith**   - The entire backend is a single Spring Boot application (MyTodoList) packaged as one JAR and deployed as one Docker container on OKE. This is what the repository actually implements, as evidenced by the single Dockerfile, and single `MyTodoListApplication` entry point.

2. **Domain partitioning** - Inside the monolith, the codebase is organized into domain packages that align with the business capabilities identified in Sprint 1:
   -Task Management domain
   - Bug Tracking domain
   - Sprint Management domain
   - User & Authentication domain
   - AI feature domain
   - Chatbot domain

3. **Technical layering within domains** — Each domain follows the standard Spring pattern of Controller → Service → Repository, providing separation of concerns at the component level.

4. **Presentation separation** — The React frontend is a separate codebase in the frontend subfolder built independently via the a maven-plugin.

* #### Where each style is applied

| Style | Where applied |
|---|---|
| Domain partitioning | Java package structure groups code by business capability (task, bug, sprint, etc.) |
| Modular monolith | Single deployable Spring Boot JAR containing all domains |
| Technical layering | Each domain uses Controller → Service → Repository internally |
| Client-server | React SPA (client) communicates with Spring Boot (server) via REST |

### Why not full microservices

It was originally planned to build microservices deployed independently on OKE. However, the repository implements a monolith because:

- The team size is 5 and semester timeline make operating multiple independent services impractical.
- We have only a single Oracle ATP database is shared across all domains with no schema-level isolation, which is a monolith data pattern.
- The Telegram bot runs in-process with the backend, not as a separate service.
- The OCI API Gateway Terraform resource is commented out, meaning there is no external routing layer to distribute traffic across services.

The modular monolith preserves the option to extract domains into true microservices later, since the package boundaries already follow domain lines.

## Consequences

**Benefits:**
- Simpler deployment and operations using one container, one build pipeline and one database.
- Domain packages provide clear ownership boundaries for team members.
- The Controller → Service → Repository pattern within each domain makes the codebase familiar to any Spring developer.
- Future extraction to microservices is feasible because domain boundaries are already established.

**Tradeoffs:**
- All domains share a single process, therefore a failure in one domain can affect the entire application.
- Scaling is all-or-nothing; individual domains cannot be scaled independently.
- The shared database with no schema isolation means domain data is coupled at the persistence layer.

**Risks:**
- As the application grows, the monolith could become harder to maintain if domain boundaries are not enforced through code review practices.
- The current security configuration permits all requests without authentication enforcement — this would need to be addressed before production use.
