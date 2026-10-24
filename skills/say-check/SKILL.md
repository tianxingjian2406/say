---
name: say-check
description: >
  Audit and rewrite text or agent output to meet ASD-STE100 compliance (default >= 80%).
  Calculates quantitative STE100 score and outputs compliant version.
---

# ASD-STE100 Compliance Checker & Rewriter (/say-check)

When invoked via `/say-check [text]`:
1. If no text is provided, audit your most recent response in the conversation.
2. Run the bundled linter to get the exact quantitative score, or evaluate directly against the 5 STE100 metrics:
   - Standalone skill install (Codex / Hermes / OpenCode / pi): `node <skill-dir>/say-linter.js --text "<text>"` — the installer ships this file next to SKILL.md.
   - Claude Code / ZCode plugin install: `node "<plugin_root>/scripts/say-linter.js" --text "<text>"`.
   - **M1 Sentence Length** (EN <=20w/25w, CN <=25/35 chars) — Weight 25%
   - **M2 Active Voice** (Zero `be + past participle` or `被/由...所`) — Weight 25%
   - **M3 Controlled Vocabulary** (Zero banned verbs/dummy verbs like `utilize`/`进行`/`加以`) — Weight 20%
   - **M4 Single Instruction per Sentence** (No compound action clauses) — Weight 15%
   - **M5 Pronoun & Noun Cluster Clarity** (No standalone `this`/`这`, max 3-noun cluster) — Weight 15%
3. Output:
   - **Compliance Score**: `XX%` (Pass threshold: `>= 80%`)
   - **Violations Found**: Bullet list of specific offending sentences and rules triggered.
   - **STE100 Rewrite**: The corrected text achieving >= 80% (or 100%) compliance.