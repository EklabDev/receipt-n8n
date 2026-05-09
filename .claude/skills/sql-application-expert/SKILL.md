---
name: sql-application-expert
description: Designs and implements PostgreSQL and MySQL access in Java, Node.js, and Python using JDBC/ORMs, query builders, and migrations. Use when writing repositories, tuning SQL, connection pools, transactions, or migration code for Postgres or MySQL; when the user mentions relational drivers, ORMs, or SQL beyond a one-off schema review.
license: MIT
compatibility: Claude Code skills; Vipecoding submodule pack.
metadata:
  skillId: sql-application-expert
  version: "1.0"
---

# SQL application expert (PostgreSQL, MySQL)

## When to use
Application and migration code for PostgreSQL or MySQL. Pair with `sql-schema-review` for DDL and rollout safety on schema changes.

## Default library map (prefer existing project choices)

| Concern | Java | Node.js | Python |
|---------|------|---------|--------|
| ORM / mapping | JPA/Hibernate; jOOQ if project uses it | Prisma; TypeORM; Knex/query builder layers | SQLAlchemy 2.x; Django ORM in Django apps |
| Driver / pooling | HikariCP + JDBC driver for the engine | `pg` / `mysql2` under the chosen stack | `asyncpg` / `psycopg` (Postgres); `mysqlclient` / `aiomysql` (MySQL) per project |
| Migrations | Flyway or Liquibase as declared | Prisma migrate; Knex migrations; node-pg-migrate if standard | Alembic; Django migrations |

## MUST
- **Transactions**: boundary clear (`@Transactional` scope, explicit `BEGIN`/`COMMIT` in scripts); avoid long-held locks; document isolation level if non-default.
- **SQL safety**: parameterized queries or ORM-bound parameters only; dynamic SQL built with bound parameters, not concatenation.
- **Migrations**: backward-compatible phases when zero-downtime matters (expand/contract); index creation concurrency options (`CONCURRENTLY` on Postgres where appropriate).
- **Pooling**: size pools per environment; validate timeouts and leak detection match runtime.
- **Dialect differences**: document JSON operators, `UPSERT` syntax, and sequence/identity behavior when supporting both engines.

## Performance
- Add or adjust indexes for new predicates and joins; capture `EXPLAIN (ANALYZE, BUFFERS)` or MySQL `EXPLAIN ANALYZE` when investigating regressions.
- Watch N+1 ORM patterns; use batch fetch or joins where the codebase style allows.

## Verification
- [ ] Rollback or expand/contract plan for DDL when production-sensitive
- [ ] Parameter binding verified for all user-controlled inputs
- [ ] Connection and statement timeouts aligned with upstream SLAs
- [ ] Tests hit real SQL against containers or approved test DBs—no mocked DB behavior in dev/uat/prod paths
