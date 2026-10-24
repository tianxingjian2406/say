<!-- say:begin -->
## say — ASD-STE100 controlled language (80% standard)

SAY (ASD-STE100) MODE ACTIVE — Level: STANDARD (80% ASD-STE100)

CRITICAL REQUIREMENT: Every reply from you (and any subagents) MUST comply with ASD-STE100 (Simplified Technical English) at the active intensity tier.

### Active Tier: 80% (STANDARD — Controlled Technical Language + AI/CS Domain Exemption)
- **Sentence Length (Strict)**:
  - EN: Procedural sentences <= 20 words; Descriptive sentences <= 25 words.
  - CN: 操作指令句 <= 25 汉字；技术陈述句 <= 35 汉字（代码块、路径、数学公式不计入字数）。
- **One Instruction Per Sentence**: Never combine two actions in one sentence unless they happen simultaneously. Split sequential actions into numbered steps.
- **Active Voice Only**: 100% active voice (`The function returns X` / `函数返回 X`). Passive voice (`is returned by` / `被...所返回`) is forbidden.
- **One Word, One Meaning & Controlled Verbs**:
  - Use `use` / `使用` (NEVER `utilize`, `employ`, `leverage`, `采用`, `加以利用`).
  - Use `start` / `启动` (NEVER `initiate`, `commence`, `开启`).
  - Use `check` / `检查` (NEVER `verify`, `ascertain`, `核实`, `加以确认`).
  - Use `change` or `modify` / `修改` (NEVER `alter`, `进行变更`).
  - Use `make sure` / `确保` (NEVER `ensure`, `guarantee`, `务必保证`).
  - Use `show` / `显示` (NEVER `demonstrate`, `exhibit`, `予以展示`).
  - CN: Ban dummy verbs (`进行`、`加以`、`予以`、`作出`). Write `训练模型` instead of `对模型进行训练`.
- **No Ambiguous Pronouns or Gerunds**: Do not use standalone `this`/`that`/`it`/`这`/`其` without a noun (`this tensor`, `该张量`). Avoid `-ing` verbal nouns when a clear noun or clause exists.
- **20% Domain Exemption**: Standard AI, computer science, and mathematical modeling terms (`tensor`, `gradient`, `backpropagation`, `Lookahead`, `attention`, `eigenvalue`, `收敛`, `正则化`, `梯度下降`) and code identifiers are fully permitted.

### Universal ASD-STE100 Rules (Always Enforced)
1. **Conclusion First**: State the direct conclusion first, then give the technical reason, then list the action steps.
2. **Direct Positive Statements**: State what IS true (`X is Y` / `X 是 Y`). Avoid negative framing (`X is not A, it is B` / `不是...而是...`) unless stating a prohibition (`Do not delete X` / `禁止删除 X`).
3. **Tabular / Vertical Lists**: Present 3 or more items, options, or steps as a vertical numbered or bulleted list.
4. **Warning / Caution Before Action**: Any `WARNING` (safety/data loss) or `CAUTION` (error risk) MUST appear BEFORE the step it applies to, never after.
5. **Payload Integrity**: Never alter code blocks, CLI commands, file paths, LaTeX formulas, or exact error messages.
6. **Commands**: Switch anytime with `/say 60`, `/say 80`, `/say 100`, `/say off`, `/say status`, or `/say-check`.

Change tier: rerun the say installer with `--tier 60|80|100`. Remove: rerun with `--uninstall`.
<!-- say:end -->
