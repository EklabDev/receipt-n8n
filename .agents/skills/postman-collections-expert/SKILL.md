---
name: postman-collections-expert
description: Postman Collection v2.1 authoring, environments, scripts, OpenAPI alignment, and safe reading of exported collection JSON.
license: MIT
compatibility: Google Antigravity workspace skills; Vipecoding submodule pack.
metadata:
  skillId: postman-collections-expert
  role: api-designer
  version: "1.0"
---

# Postman collections expert

## When to use
Building or reviewing Postman Collection v2.1 JSON, environments, collection runs or CLI automation, or syncing requests with an OpenAPI contract—not a one-off raw HTTP call.

## MUST
- Keep collection structure valid (folders, auth inheritance, variables at collection vs environment scope); document auth assumptions per folder or request.
- Prefer import or parity checks against **api-design-openapi-review** when an OpenAPI spec exists; flag drift between spec and collection.
- Scripts: pre-request and test code should be minimal, deterministic, and safe for CI (Newman-style runs); avoid side effects on shared environments.
- Treat exported collections and env files as sensitive: no secrets in committed initial values; apply **security-redlines** for tokens and credentials.

## Verification
- [ ] Collection format version and auth model stated
- [ ] Variables and secrets handling reviewed for repo and CI safety
