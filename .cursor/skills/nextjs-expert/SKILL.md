---
name: nextjs-expert
description: Next.js App Router: server and client boundaries, caching, routing, middleware, and deployment runtime choices.
license: MIT
compatibility: Cursor skills; Vipecoding submodule pack.
metadata:
  skillId: nextjs-expert
  role: implementer
  version: "1.0"
---

# Next.js expert

## When to use
Next.js App Router features, server and client boundaries, caching, routing, middleware, or deployment and runtime concerns—not generic React-only UI.

## MUST
- Be explicit about Server vs Client Components, `"use client"` boundaries, and data fetching semantics (cache, revalidate, dynamic vs static).
- Treat Server Actions and uncached server mutations carefully; justify security (CSRF, authz) and cache invalidation.
- Document middleware scope and edge vs Node runtime choice where it affects APIs or limits.
- Align with **implementer-typescript-react** for hooks, effects, and general TypeScript and React patterns; apply **security-redlines** for XSS and auth handling.

## Verification
- [ ] Next.js major version and App Router assumed or stated
- [ ] Caching, dynamic behavior, and any edge runtime constraints listed
