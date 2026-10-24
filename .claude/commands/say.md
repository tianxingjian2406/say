---
description: "Switch ASD-STE100 controlled language intensity (60 | 80 | 100 | off | status | default <tier>)"
argument-hint: "[60|80|100|lite|strict|off|status|default <tier>]"
---

Switch ASD-STE100 Controlled Technical Language mode.
Requested argument: `$ARGUMENTS` (if empty, activate `80%` standard tier).

- `60` or `lite`: 60% ASD-STE100 (short sentences, active voice, zero fluff).
- `80` or `standard` (Default): 80% ASD-STE100 (strict sentence caps EN <=20/25w & CN <=25/35 chars, 100% active voice, 1 instruction/sentence, controlled verbs, ban dummy verbs `进行/加以/予以`, 20% AI/CS domain term exemption).
- `100` or `strict`: 100% ASD-STE100 (hard caps, max 3-noun cluster, strict 1-word-1-meaning lock).
- `off`: Disable ASD-STE100 mode.
- `status`: Report current active tier without changing state.
- `default <60|80|100|off>`: Persist default tier across future sessions.

Confirm the active tier in one compliant sentence and strictly apply the ruleset to all subsequent outputs.