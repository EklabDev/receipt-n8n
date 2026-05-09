---
name: kubernetes-expert
description: Kubernetes workloads, networking, RBAC, policies, rollouts, and operational safety beyond a single manifest tweak.
license: MIT
compatibility: Claude Code skills; Vipecoding submodule pack.
metadata:
  skillId: kubernetes-expert
  role: devops-sre
  version: "1.0"
---

# Kubernetes expert

## When to use
Cluster-facing design or manifests: workloads, networking, RBAC, policies, rollouts, or operational tuning—not only a single label tweak.

## MUST
- Name target environment (dev / UAT / prod); require explicit approval posture for prod-impacting changes; align with **devops-cicd-change-safety**.
- Prefer least-privilege RBAC, NetworkPolicy defaults where appropriate, and clear boundaries for namespaces and Secrets usage.
- Define probes, resource requests and limits, and rollout strategy (maxUnavailable, surge) with upgrade and rollback story.
- Use **yaml-config-expert** for structural YAML and Helm values rigor; apply **security-redlines** for credentials and sensitive data in manifests.

## Verification
- [ ] API versions and workload types identified
- [ ] Blast radius (namespace or cluster) and rollback path acknowledged
