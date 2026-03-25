# [Feature/Enhancement]: Add database-backed persistence for BAIO

## Summary
BAIO currently processes classification and chat requests in-memory and returns responses directly to the client, but it does not persist analysis runs, per-sequence results, or chat history. Adding a database layer would make the platform more reliable for reproducibility, auditing, and future product features like saved analyses and session history.

## Problem
- `POST /classify` generates a timestamped response but does not store the run or its results.
- `POST /chat` returns the latest reply without any durable conversation history.
- There is no database configuration, schema, or migration workflow in the backend.
- The current architecture cannot support saved reports, analysis history, comparisons across runs, or operational analytics.

## Proposed Scope
- Add a backend database integration with a local-development-friendly default and a production-ready path.
- Prefer a relational database design:
  - SQLite for local development and CI
  - PostgreSQL-ready configuration for deployed environments
- Introduce an ORM and migration workflow for schema management.
- Persist classification runs, including:
  - request source
  - model configuration used
  - processing timestamp
  - aggregate counts
  - per-sequence classification results
- Persist AI assistant chat sessions/messages if chat history is intended to survive refreshes or restarts.
- Add environment-based database configuration and a health check that validates database connectivity.
- Update developer documentation for setup, migrations, and local usage.

## Suggested Technical Approach
- Backend: SQLAlchemy + Alembic
- Configuration: `DATABASE_URL` via environment variables
- Initial schema candidates:
  - `analysis_runs`
  - `sequence_results`
  - `chat_sessions`
  - `chat_messages`

## Acceptance Criteria
- A developer can run the backend with a configured `DATABASE_URL`.
- Initial database migrations are committed and reproducible.
- Classification runs can be saved and linked to their per-sequence results.
- The API can return a persisted run identifier for saved analyses.
- Database connectivity is covered by backend health checks or targeted tests.
- README or backend docs explain how to configure and run the database locally.

## Out of Scope
- Full authentication and user account management
- Multi-tenant authorization rules
- Historical backfill of prior ad hoc runs

## Why This Matters
- Improves reproducibility for bioinformatics workflows
- Enables saved analysis history and future reporting features
- Creates a stable base for collaboration, auditability, and production deployment
