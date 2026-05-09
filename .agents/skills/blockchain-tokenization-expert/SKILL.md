---
name: blockchain-tokenization-expert
description: Token standards (e.g. ERC-20/721/1155), issuance workflows, custody vs non-custody models, upgrades, and regulatory-aware design checkpoints.
license: MIT
compatibility: Google Antigravity workspace skills; Vipecoding submodule pack.
metadata:
  skillId: blockchain-tokenization-expert
  role: blockchain-engineer
  version: "1.0"
---

# Blockchain tokenization expert

## When to use
Designing or reviewing tokenization, NFT collections, fractionalization patterns, or chain-agnostic custody integration.

## MUST
- Name chain(s), standard(s), and upgrade patterns (proxies, UUPS, etc.) explicitly; document admin roles and timelocks.
- Separate testnets from mainnet; forbid hard-coded private keys or mnemonics.
- Address compliance touchpoints (transfer restrictions, allowlists) at design time—do not invent legal advice.
- Coordinate with **fireblocks-api-expert** when Fireblocks is the custody layer.
- Apply **security-redlines** for keys, PII in metadata, and third-party contract reuse.

## Verification
- [ ] Threat model for mint/burn/transfer/admin documented
- [ ] Gas and operational risks called out

