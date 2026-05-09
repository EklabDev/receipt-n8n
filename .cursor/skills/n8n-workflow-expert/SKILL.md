---
name: n8n-workflow-expert
description: Operates and extends n8n workflows from exported JSON, including expressions, the Code node (JavaScript), filesystem nodes, HTTP and AI nodes, credentials, and error workflows. Use when the user shares n8n workflow JSON, asks about n8n nodes, prompts inside n8n, or automation debugging in self-hosted or cloud n8n.
license: MIT
compatibility: Cursor skills; Vipecoding submodule pack.
metadata:
  skillId: n8n-workflow-expert
  version: "1.0"
---

# n8n workflow expert

## When to use
Authoring, reviewing, or troubleshooting n8n workflows—especially from **exported JSON**—including integrations that use **expressions**, **Code** nodes, or **prompt** payloads to LLM/HTTP nodes.

## JSON and structure
- Treat exported workflow JSON as **versioned config**: respect `nodes`, `connections`, `pinData`, `meta`, and credential references—never strip credential ids blindly; consumers re-bind credentials in target environments.
- After edits, validate graph coherence: no dangling connections; trigger node present; **error workflow** linked when production-critical.

## Expressions
- Use n8n expression syntax: `{{$json["field"]}}`, `$input.item.json`, `$node["NodeName"].json`—mind **paired items** and **binary** data when moving between nodes.
- Prefer **Set** and native node fields over Code node when logic stays declarative.

## Code node (JavaScript)
- Runs on **server** in n8n’s Node VM: **no** browser DOM; limited globals—use `items` / `return` patterns per n8n version docs.
- Keep synchronous where possible; `async` only with proper error propagation; **never** embed secrets—use Credentials or env indirection.
- Unit-test complex transforms outside n8n when feasible (extract pure functions, import pattern aligned with project).

## Filesystem and IO
- **Read/Write Binary File** nodes: enforce **allowed paths** and sandboxing for self-hosted deployments; avoid path traversal from user-controlled filenames.
- Large files: stream or chunk; watch memory on self-hosted workers.

## Prompt engineering inside n8n
- Centralize system and user prompts in **Set** or template nodes for readability; document model parameters (temperature, max tokens) alongside **PII handling** and `security-redlines`.
- Log **redacted** prompts in production when audit is required.

## Reliability
- Retries and backoff on HTTP; respect API rate limits; use **Split In Batches** for bulk operations.
- Store **execution metadata** (run id, correlation id) in downstream systems when debugging cross-service flows.

## Verification
- [ ] Credential references are environment-appropriate; no secrets in JSON or Code node literals
- [ ] Error branch or error workflow defined for production paths
- [ ] Sample input JSON documented or pinned for regression checks
- [ ] Rate limits and idempotency considered for external APIs
