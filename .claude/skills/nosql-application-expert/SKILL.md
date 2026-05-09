---
name: nosql-application-expert
description: Designs and implements NoSQL access layers in Java, Node.js, and Python using mainstream drivers and ODM/ORM-style tools. Use when building or refactoring MongoDB, DynamoDB, Redis, Cassandra, or similar stores; when the user mentions NoSQL code, drivers, repositories, or data modeling beyond a one-off schema review.
license: MIT
compatibility: Claude Code skills; Vipecoding submodule pack.
metadata:
  skillId: nosql-application-expert
  version: "1.0"
---

# NoSQL application expert

## When to use
Application code touching document, wide-column, key-value, or managed NoSQL (not only a modeling review). Pair with `nosql-modeling-review` for greenfield schema design.

## Default library map (prefer existing project choices)

| Store (examples) | Java | Node.js | Python |
|------------------|------|---------|--------|
| MongoDB | MongoDB Java Sync/Reactive driver; Spring Data MongoDB | `mongodb` driver; Mongoose when document schemas fit | PyMongo; Motor for async; Beanie/ODMantic if project already uses them |
| DynamoDB | AWS SDK for Java v2 DynamoDbClient; DynamoDbEnhancedClient | `@aws-sdk/client-dynamodb`, `lib-dynamodb` | boto3 `resource`/`client`; PynamoDB if declared standard |
| Redis | Lettuce (Spring Boot default); Jedis if legacy | `ioredis` or `redis` (node-redis v4+) | `redis` asyncio; redis-py sync where appropriate |
| Cassandra / CQL | Java driver + mapping when used | `cassandra-driver` | `cassandra-driver` / scylla variants per stack |

If the repo already standardizes a library, follow it. Do not introduce a second parallel stack without a migration plan.

## MUST
- Model for **known access patterns**: partition keys, shard/hot-key risk, bounded fan-out, pagination cursors (not unbounded `skip` on large sets where inappropriate).
- State **consistency and idempotency**: retries, duplicate delivery, compare-and-set / conditional writes where the store supports them.
- **Secrets**: credentials via env/secret manager; never hardcode keys or connection strings (apply `security-redlines`).
- **Observability**: structured logs around slow queries and throttling; trace propagation if the service already uses it.
- **Migrations**: for Mongo, prefer explicit index creation scripts or migration tooling already in the repo; for Dynamo, one-table vs multi-table is an architecture decision—document assumptions.

## Code quality
- Keep repository/DAO boundaries thin; map domain types at the edge; avoid leaking driver types across layers unless the project already does.
- Use parameterized APIs / builders—no string-concatenated queries where injection or injection-like expression bugs are possible (Mongo filter objects, Dynamo `ExpressionAttributeNames`/`Values`).

## Verification
- [ ] Read path, write path, and failure modes (timeouts, throttling, partial batch) listed or obvious in code
- [ ] Indexes or access keys aligned with filters and sort requirements
- [ ] Load tests or back-of-envelope partition load considered for high-cardinality keys
- [ ] Tests use project test doubles or containers; no fake credentials in app config for non-test environments
