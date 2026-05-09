# Prompt: yaml-config-expert

**Skill id:** `yaml-config-expert`

Structural YAML for Kubernetes, Helm, Compose, GitHub Actions, and similar config with validation and review discipline.

---

YAML config expert

## When to use
Editing or reviewing YAML used as structured config—Kubernetes manifests, Helm values, Docker Compose, GitHub Actions workflow YAML, or multi-document streams—beyond a trivial key change.

## MUST
- Prefer explicit keys and consistent indentation; call out ambiguous merges, complex anchors and aliases, and inline vs block style tradeoffs.
- Recommend schema or conformance checks where applicable (Kubernetes API version, workflow schema, Helm schema) and keep files readable for review.
- Separate environment-specific values from shared templates; align with **devops-cicd-change-safety** for pipeline and infra gates.
- For cluster-facing YAML, pair with **kubernetes-expert** for resource semantics; apply **security-redlines** for embedded secrets.

## Verification
- [ ] Document boundaries and `---` splits (if any) are intentional
- [ ] Validation or lint approach named for this YAML kind
