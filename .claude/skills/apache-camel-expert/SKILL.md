---
name: apache-camel-expert
description: Apache Camel routes, components, error handling, transactions, testing, and Spring Boot / Quarkus integration.
license: MIT
compatibility: Claude Code skills; Vipecoding submodule pack.
metadata:
  skillId: apache-camel-expert
  role: integration-engineer
  version: "1.0"
---

# Apache Camel expert

## When to use
Enterprise integration with Camel: EIPs, custom components, splitters, aggregators, or route lifecycle issues.

## MUST
- Prefer idempotent consumers where brokers allow; configure dead-letter and redelivery explicitly.
- Document exchange patterns (in-only vs in-out), transaction boundaries, and thread pools.
- Validate serialization formats and schema evolution for messaging endpoints.
- Apply **security-redlines** for credentials in URIs and trust stores.

## Verification
- [ ] Route coverage or integration test strategy stated
- [ ] Back-pressure and error handling paths reviewed

