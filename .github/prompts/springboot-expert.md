# Prompt: springboot-expert

**Skill id:** `springboot-expert`

Spring Boot ecosystem: Boot 3.x, configuration, Actuator, observability, resilience, data access, and production hardening beyond a single feature patch.

---

Spring Boot expert

## When to use
Service architecture, multi-module Boot apps, upgrades, performance, or cross-cutting Spring concerns—not only a single endpoint change.

## MUST
- Prefer explicit configuration profiles (dev/test/prod), externalized secrets, and health/readiness signals.
- Use Spring Security and CORS defaults; justify any relaxation with threat context.
- Observability: structured logging, metrics, tracing hooks where the stack supports them.
- Align with **implementer-java-spring-boot** for narrow code edits; use this skill for broader Boot design and ops readiness.
- Apply **security-redlines** for credentials and PII.

## Verification
- [ ] Boot version and Java baseline stated
- [ ] Tests or smoke steps for critical paths identified
