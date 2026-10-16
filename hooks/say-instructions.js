#!/usr/bin/env node
// say — Instruction Builder for 60% / 80% / 100% ASD-STE100 Bilingual Rules

const path = require('path');
const { DEFAULT_MODE, MODE_LABELS, normalizeMode } = require('./say-config');

const SKILL_PATH = path.join(__dirname, '..', 'skills', 'say', 'SKILL.md');

const MODE_SPECIFIC_RULES = {
  '60': [
    '### Active Tier: 60% (LITE — Structural Clarity)',
    '- **Sentence Length**: EN procedural <= 25 words, descriptive <= 30 words; CN procedural <= 35 chars, descriptive <= 45 chars.',
    '- **Voice & Mood**: Use active voice (>= 80% of sentences). Use imperative verbs for action steps.',
    '- **Anti-Fluff**: Remove greetings, filler adverbs (`basically`, `actually`, `大概`, `可能`, `也许`, `基本上`), and hedging.',
    '- **Terminology**: Standard CS/AI/Math terms and common verbs allowed without strict 1-to-1 dictionary lock.'
  ].join('\n'),

  '80': [
    '### Active Tier: 80% (STANDARD — Controlled Technical Language + AI/CS Domain Exemption)',
    '- **Sentence Length (Strict)**:',
    '  - EN: Procedural sentences <= 20 words; Descriptive sentences <= 25 words.',
    '  - CN: 操作指令句 <= 25 汉字；技术陈述句 <= 35 汉字（代码块、路径、数学公式不计入字数）。',
    '- **One Instruction Per Sentence**: Never combine two actions in one sentence unless they happen simultaneously. Split sequential actions into numbered steps.',
    '- **Active Voice Only**: 100% active voice (`The function returns X` / `函数返回 X`). Passive voice (`is returned by` / `被...所返回`) is forbidden.',
    '- **One Word, One Meaning & Controlled Verbs**:',
    '  - Use `use` / `使用` (NEVER `utilize`, `employ`, `leverage`, `采用`, `加以利用`).',
    '  - Use `start` / `启动` (NEVER `initiate`, `commence`, `开启`).',
    '  - Use `check` / `检查` (NEVER `verify`, `ascertain`, `核实`, `加以确认`).',
    '  - Use `change` or `modify` / `修改` (NEVER `alter`, `进行变更`).',
    '  - Use `make sure` / `确保` (NEVER `ensure`, `guarantee`, `务必保证`).',
    '  - Use `show` / `显示` (NEVER `demonstrate`, `exhibit`, `予以展示`).',
    '  - CN: Ban dummy verbs (`进行`、`加以`、`予以`、`作出`). Write `训练模型` instead of `对模型进行训练`.',
    '- **No Ambiguous Pronouns or Gerunds**: Do not use standalone `this`/`that`/`it`/`这`/`其` without a noun (`this tensor`, `该张量`). Avoid `-ing` verbal nouns when a clear noun or clause exists.',
    '- **20% Domain Exemption**: Standard AI, computer science, and mathematical modeling terms (`tensor`, `gradient`, `backpropagation`, `Lookahead`, `attention`, `eigenvalue`, `收敛`, `正则化`, `梯度下降`) and code identifiers are fully permitted.'
  ].join('\n'),

  '100': [
    '### Active Tier: 100% (STRICT — Full ASD-STE100 Rigor)',
    '- **Sentence Length (Hard Cap)**:',
    '  - EN: Procedural <= 20 words; Descriptive <= 25 words. Max 6 sentences per paragraph.',
    '  - CN: 操作句 <= 22 汉字；陈述句 <= 30 汉字。每段最多 6 句。',
    '- **Noun Cluster Limit**: Maximum 3 nouns in a row (`model weight file` / `模型权重文件`). Break longer chains with prepositions (`path of the model weight file`).',
    '- **Strict 1-to-1 Term Lock**: Once you name an entity (e.g., `configuration file` / `配置文件`), use that exact phrase for the entire response. Zero synonym variation.',
    '- **Zero Passive, Zero Metaphor, Zero Idiom**: 100% active voice. Only approved core technical verbs. Unapproved general verbs must be replaced with approved verb + noun.'
  ].join('\n')
};

function getCoreInstructions(mode) {
  const effective = normalizeMode(mode) || DEFAULT_MODE;
  if (effective === 'off') return '';

  const label = MODE_LABELS[effective] || MODE_LABELS[DEFAULT_MODE];
  const tierBlock = MODE_SPECIFIC_RULES[effective] || MODE_SPECIFIC_RULES[DEFAULT_MODE];

  return [
    `SAY (ASD-STE100) MODE ACTIVE — Level: ${label}`,
    '',
    'CRITICAL REQUIREMENT: All outputs from you (and any subagents) MUST comply with ASD-STE100 (Simplified Technical English) adapted for Bilingual Chinese/English technical communication at the active intensity tier.',
    '',
    tierBlock,
    '',
    '### Universal Bilingual ASD-STE100 Rules (Always Enforced)',
    '1. **Conclusion First**: State the direct conclusion first, then give the technical reason, then list the action steps.',
    '2. **Direct Positive Statements**: State what IS true (`X is Y` / `X 是 Y`). Avoid negative framing (`X is not A, it is B` / `不是...而是...`) unless stating a prohibition (`Do not delete X` / `禁止删除 X`).',
    '3. **Tabular / Vertical Lists**: Present 3 or more items, options, or steps as a vertical numbered or bulleted list.',
    '4. **Warning / Caution Before Action**: Any `WARNING` (safety/data loss) or `CAUTION` (error risk) MUST appear BEFORE the step it applies to, never after.',
    '5. **Payload Integrity**: Never alter code blocks, CLI commands, file paths, LaTeX formulas, or exact error messages.',
    '6. **Commands**: Switch anytime with `/say 60`, `/say 80`, `/say 100`, `/say off`, `/say status`, or `/say-check`.'
  ].join('\n');
}

function getReinforcementBanner(mode) {
  const effective = normalizeMode(mode) || DEFAULT_MODE;
  if (effective === 'off') return '';
  if (effective === '60') {
    return '[SAY: 60% LITE (ASD-STE100)] Keep sentences short (EN <=25w / CN <=35c), active voice, imperative steps, zero filler.';
  }
  if (effective === '100') {
    return '[SAY: 100% STRICT (ASD-STE100)] Hard limits: EN <=20w/25w, CN <=22c/30c, max 3-noun clusters, 100% active voice, 1-word-1-meaning, zero dummy verbs (进行/加以/予以), 1 action/sentence.';
  }
  return '[SAY: 80% STANDARD (ASD-STE100)] Enforce STE100: EN <=20w(proc)/25w(desc), CN <=25 chars(proc)/35 chars(desc), 100% active voice, 1 instruction/sentence, controlled verbs (ban utilize/initiate/进行/加以/予以), AI/CS terms allowed.';
}

module.exports = {
  SKILL_PATH,
  getCoreInstructions,
  getReinforcementBanner
};
