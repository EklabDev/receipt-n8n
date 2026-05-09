<!-- Fragment: append to consumer .github/copilot-instructions.md if appropriate. -->

## Vipecoding pack (submodule)

This project may include `vendor/agents-skills` (or similar) with enterprise prompts under `github/prompts/`. When assisting with code:

- Apply **security-redlines** rules from `github/prompts/security-redlines.md` (no secrets, respect PII and licenses).
- Prefer stack-specific implementer prompts when the stack is TypeScript + React, TypeScript + Node.js, Java + Spring Boot, or Python + FastAPI.
- For relational or NoSQL **application** code (Postgres/MySQL or document/key-value stores in Java, Node.js, or Python), use `github/prompts/sql-application-expert.md` or `github/prompts/nosql-application-expert.md` when relevant.
- For **batch/streaming data pipelines**, Spark or lakehouse work, **ELK**, or **BI connectivity** advice, use `github/prompts/data-pipeline-engineering.md` when relevant.
- For **n8n** workflow JSON, expressions, or Code nodes, use `github/prompts/n8n-workflow-expert.md` when relevant.
