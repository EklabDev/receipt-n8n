---
name: fireblocks-api-expert
description: Fireblocks REST/SDK flows: vaults, assets, transactions, webhooks, signing policies, and sandbox vs production separation.
license: MIT
compatibility: Claude Code skills; Vipecoding submodule pack.
metadata:
  skillId: fireblocks-api-expert
  role: custody-apis
  version: "1.0"
---

# Fireblocks API expert

## When to use
Integrating or debugging Fireblocks vault operations, transactions, gas management, or webhook handlers.

## MUST
- Use official SDKs and documented auth; never log API keys, signing material, or raw webhook secrets.
- Separate sandbox and production keys and base URLs; label code paths by environment.
- Handle idempotency, replay, and failed transaction states per Fireblocks semantics.
- Apply **security-redlines**; escalate policy gaps to human owners.

## Verification
- [ ] API version and network (sandbox/prod) explicit in plan
- [ ] Webhook signature verification and replay protection addressed

