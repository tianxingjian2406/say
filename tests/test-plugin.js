#!/usr/bin/env node
// say — Automated Verification Suite

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const pluginRoot = path.resolve(__dirname, '..');
const tempClaudeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ste100-test-'));

process.env.CLAUDE_CONFIG_DIR = tempClaudeDir;

const { normalizeMode, getDefaultMode, DEFAULT_MODE } = require('../hooks/say-config');
const { setMode, readMode, clearMode } = require('../hooks/say-runtime');
const { getCoreInstructions, getReinforcementBanner } = require('../hooks/say-instructions');
const { evaluateText } = require('../scripts/say-linter');

let passed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('PASS: ' + name);
    passed++;
  } catch (err) {
    console.error('FAIL: ' + name);
    console.error(err);
    process.exit(1);
  }
}

test('1. Default mode is 80% and aliases resolve accurately', () => {
  assert.strictEqual(DEFAULT_MODE, '80');
  assert.strictEqual(getDefaultMode(pluginRoot), '80');
  assert.strictEqual(normalizeMode('80%'), '80');
  assert.strictEqual(normalizeMode('standard'), '80');
  assert.strictEqual(normalizeMode('lite'), '60');
  assert.strictEqual(normalizeMode('60%'), '60');
  assert.strictEqual(normalizeMode('strict'), '100');
  assert.strictEqual(normalizeMode('100%'), '100');
  assert.strictEqual(normalizeMode('off'), 'off');
});

test('2. Runtime persistence & per-session state management', () => {
  setMode('80', 'sess-001');
  assert.strictEqual(readMode('sess-001'), '80');
  setMode('100', 'sess-001');
  assert.strictEqual(readMode('sess-001'), '100');
  clearMode('sess-001');
  assert.strictEqual(readMode('sess-001'), 'off');
});

test('3. Instructions generator outputs tier-specific bilingual rules', () => {
  const rules80 = getCoreInstructions('80');
  assert.ok(rules80.includes('STANDARD (80% ASD-STE100)'));
  assert.ok(rules80.includes('20% Domain Exemption'));
  assert.ok(rules80.includes('操作指令句 <= 25 汉字'));

  const rules60 = getCoreInstructions('60');
  assert.ok(rules60.includes('LITE (60% ASD-STE100)'));

  const rules100 = getCoreInstructions('100');
  assert.ok(rules100.includes('STRICT (100% ASD-STE100)'));
  assert.ok(rules100.includes('Noun Cluster Limit'));

  assert.ok(getReinforcementBanner('80').includes('80% STANDARD'));
});

test('4. SessionStart hook (say-activate.js) emits 80% rules by default', () => {
  const out = execFileSync(process.execPath, [path.join(pluginRoot, 'hooks', 'say-activate.js')], {
    input: JSON.stringify({ source: 'startup', session_id: 'hook-sess-1', cwd: pluginRoot }),
    env: { ...process.env, CLAUDE_CONFIG_DIR: tempClaudeDir },
    encoding: 'utf8'
  });
  assert.ok(out.includes('SAY (ASD-STE100) MODE ACTIVE'));
  assert.ok(out.includes('STANDARD (80% ASD-STE100)'));
});

test('5. SubagentStart hook (say-subagent.js) injects JSON hookSpecificOutput', () => {
  const out = execFileSync(process.execPath, [path.join(pluginRoot, 'hooks', 'say-subagent.js')], {
    env: { ...process.env, CLAUDE_CONFIG_DIR: tempClaudeDir },
    encoding: 'utf8'
  });
  const parsed = JSON.parse(out);
  assert.strictEqual(parsed.hookSpecificOutput.hookEventName, 'SubagentStart');
  assert.ok(parsed.hookSpecificOutput.additionalContext.includes('STANDARD (80% ASD-STE100)'));
});

test('6. UserPromptSubmit hook (say-mode-tracker.js) handles /say switches & reinforcement', () => {
  const outSwitch = execFileSync(process.execPath, [path.join(pluginRoot, 'hooks', 'say-mode-tracker.js')], {
    input: JSON.stringify({ prompt: '/say 100', session_id: 'hook-sess-1', cwd: pluginRoot }),
    env: { ...process.env, CLAUDE_CONFIG_DIR: tempClaudeDir },
    encoding: 'utf8'
  });
  const parsedSwitch = JSON.parse(outSwitch);
  assert.ok(parsedSwitch.hookSpecificOutput.additionalContext.includes('STRICT (100% ASD-STE100)'));

  const outNormal = execFileSync(process.execPath, [path.join(pluginRoot, 'hooks', 'say-mode-tracker.js')], {
    input: JSON.stringify({ prompt: '请解释梯度下降', session_id: 'hook-sess-1', cwd: pluginRoot }),
    env: { ...process.env, CLAUDE_CONFIG_DIR: tempClaudeDir },
    encoding: 'utf8'
  });
  const parsedNormal = JSON.parse(outNormal);
  assert.ok(parsedNormal.hookSpecificOutput.additionalContext.includes('[SAY: 100% STRICT (ASD-STE100)]'));

  const outOff = execFileSync(process.execPath, [path.join(pluginRoot, 'hooks', 'say-mode-tracker.js')], {
    input: JSON.stringify({ prompt: '/say off', session_id: 'hook-sess-1', cwd: pluginRoot }),
    env: { ...process.env, CLAUDE_CONFIG_DIR: tempClaudeDir },
    encoding: 'utf8'
  });
  const parsedOff = JSON.parse(outOff);
  assert.ok(parsedOff.hookSpecificOutput.additionalContext.includes('SAY MODE OFF'));
});

test('7. Quantitative Linter scores STE100-compliant vs non-compliant bilingual text', () => {
  const compliantText = [
    '模型收敛速度取决于学习率。',
    '1. 读取配置文件。',
    '2. 初始化权重矩阵。',
    '3. 启动训练循环。',
    'The optimizer updates the model weights.'
  ].join('\n');

  const resGood = evaluateText(compliantText, 80);
  assert.ok(resGood.score >= 80, 'Expected compliant score >= 80, got ' + resGood.score);
  assert.strictEqual(resGood.passed, true);

  const nonCompliantText = [
    '这基本上意味着特征向量会被归一化层进行复杂的预处理，而且大概不是最优解而是次优解，因此在你对模型进行训练之前必须先读取配置文件并初始化权重矩阵然后接着开启训练。',
    'This basically means that the gradient is utilized and initiated by the system.'
  ].join('\n');

  const resBad = evaluateText(nonCompliantText, 80);
  assert.ok(resBad.score < 80, 'Expected non-compliant score < 80, got ' + resBad.score);
  assert.strictEqual(resBad.passed, false);
  assert.ok(resBad.violations.length >= 4);
});

test('8. Multi-harness installer (scripts/install.js) installs, updates, and removes', () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'say-install-test-'));
  const exec = (args) =>
    execFileSync(process.execPath, [path.join(pluginRoot, 'scripts', 'install.js'), ...args], {
      encoding: 'utf8',
      env: { ...process.env, XDG_CONFIG_HOME: '' }
    });

  try {
    // Install all 21 harnesses into the temp home.
    exec(['all', '--home', tempHome]);

    // Skills landed for skill-based harnesses.
    for (const rel of [
      ['.claude', 'skills', 'say', 'SKILL.md'],
      ['.zcode', 'skills', 'say', 'SKILL.md'],
      ['.codex', 'skills', 'say', 'SKILL.md'],
      ['.hermes', 'skills', 'say-check', 'SKILL.md'],
      ['.pi', 'agent', 'skills', 'say', 'SKILL.md'],
      ['.config', 'opencode', 'skills', 'say-check', 'SKILL.md']
    ]) {
      assert.ok(fs.existsSync(path.join(tempHome, ...rel)), 'missing skill file: ' + rel.join('/'));
    }

    // Linter shipped inside say-check for standalone installs.
    assert.ok(fs.existsSync(path.join(tempHome, '.codex', 'skills', 'say-check', 'say-linter.js')));

    // Commands landed with per-harness transforms.
    const codexPrompt = fs.readFileSync(path.join(tempHome, '.codex', 'prompts', 'say.md'), 'utf8');
    assert.ok(!codexPrompt.startsWith('---'), 'codex prompt must not carry YAML frontmatter');
    assert.ok(!codexPrompt.includes('$ARGUMENTS'), 'codex prompt must not carry Claude placeholders');
    const opencodeCmd = fs.readFileSync(path.join(tempHome, '.config', 'opencode', 'commands', 'say.md'), 'utf8');
    assert.ok(opencodeCmd.includes('description:'), 'opencode command keeps description frontmatter');
    assert.ok(!opencodeCmd.includes('argument-hint'), 'opencode command drops argument-hint');
    for (const p of [
      ['.gemini', 'commands', 'say.toml'],
      ['.qwen', 'commands', 'say.toml'],
      ['.iflow', 'commands', 'say-check.toml']
    ]) {
      assert.ok(fs.existsSync(path.join(tempHome, ...p)), 'missing command: ' + p.join('/'));
    }

    // Rule files and blocks landed for the rule-file harnesses.
    const mdc = fs.readFileSync(path.join(tempHome, '.cursor', 'rules', 'say.mdc'), 'utf8');
    assert.ok(mdc.includes('alwaysApply: true'), 'cursor rule must set alwaysApply');
    assert.ok(mdc.includes('SAY (ASD-STE100) MODE ACTIVE'));
    assert.ok(fs.existsSync(path.join(tempHome, '.codeium', 'windsurf', 'rules', 'say.md')));
    assert.ok(fs.existsSync(path.join(tempHome, '.clinerules', 'say.md')));
    assert.ok(fs.existsSync(path.join(tempHome, '.roo', 'rules', 'say.md')));
    assert.ok(fs.existsSync(path.join(tempHome, '.kilocode', 'rules', 'say.md')));
    assert.ok(fs.existsSync(path.join(tempHome, '.config', 'goose', 'goosehints')));
    assert.ok(fs.existsSync(path.join(tempHome, '.config', 'AGENTS.md')), 'crush global block missing');
    const copilot = fs.readFileSync(path.join(tempHome, '.github', 'copilot-instructions.md'), 'utf8');
    assert.ok(copilot.includes('STANDARD (80% ASD-STE100)'));

    // Instruction blocks written exactly once per harness.
    const claudeMd = fs.readFileSync(path.join(tempHome, '.claude', 'CLAUDE.md'), 'utf8');
    assert.ok(claudeMd.includes('SAY (ASD-STE100) MODE ACTIVE'));
    assert.strictEqual(claudeMd.split('<!-- say:begin -->').length - 1, 1, 'block must appear once');

    // Re-running with a new tier replaces the block instead of duplicating it.
    exec(['claude', '--home', tempHome, '--tier', '100']);
    const claudeMd2 = fs.readFileSync(path.join(tempHome, '.claude', 'CLAUDE.md'), 'utf8');
    assert.ok(claudeMd2.includes('STRICT (100% ASD-STE100)'));
    assert.strictEqual(claudeMd2.split('<!-- say:begin -->').length - 1, 1, 'block must stay single after re-install');

    // Pre-existing user content survives the block update.
    const claudeMdPath = path.join(tempHome, '.claude', 'CLAUDE.md');
    fs.writeFileSync(claudeMdPath, 'Keep this line.\n\n' + fs.readFileSync(claudeMdPath, 'utf8'), 'utf8');
    const geminiMdPath = path.join(tempHome, '.gemini', 'GEMINI.md');
    fs.writeFileSync(geminiMdPath, 'Keep this line.\n\n' + fs.readFileSync(geminiMdPath, 'utf8'), 'utf8');
    exec(['gemini', '--home', tempHome]);
    const geminiMd = fs.readFileSync(geminiMdPath, 'utf8');
    assert.ok(geminiMd.startsWith('Keep this line.'));
    assert.strictEqual(geminiMd.split('<!-- say:begin -->').length - 1, 1);

    // Uninstall removes skills, commands, and blocks.
    exec(['all', '--home', tempHome, '--uninstall']);
    assert.ok(!fs.existsSync(path.join(tempHome, '.codex', 'skills', 'say')));
    assert.ok(!fs.existsSync(path.join(tempHome, '.gemini', 'commands', 'say.toml')));
    assert.ok(!fs.existsSync(path.join(tempHome, '.cursor', 'rules', 'say.mdc')));
    const claudeMd3 = fs.readFileSync(claudeMdPath, 'utf8');
    assert.ok(!claudeMd3.includes('say:begin'));
    assert.ok(claudeMd3.length > 0, 'uninstall keeps unrelated CLAUDE.md content');
  } finally {
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});

test('8b. Embed mode regenerates harness bundles and cleans up', () => {
  const embedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'say-embed-test-'));
  const exec = (args) =>
    execFileSync(process.execPath, [path.join(pluginRoot, 'scripts', 'install.js'), ...args], {
      encoding: 'utf8'
    });

  try {
    exec(['embed', '--out', embedDir]);

    const agentsMd = fs.readFileSync(path.join(embedDir, 'AGENTS.md'), 'utf8');
    assert.ok(agentsMd.includes('SAY (ASD-STE100) MODE ACTIVE'), 'AGENTS.md block missing');
    assert.ok(fs.existsSync(path.join(embedDir, '.codex-plugin', 'skills', 'say', 'SKILL.md')), '.codex-plugin skill missing');
    const codexPrompt = fs.readFileSync(path.join(embedDir, '.codex-plugin', 'prompts', 'say.md'), 'utf8');
    assert.ok(!codexPrompt.startsWith('---'), 'embedded codex prompt must be plain text');
    assert.ok(fs.existsSync(path.join(embedDir, '.gemini', 'commands', 'say.toml')), '.gemini toml missing');
    assert.ok(fs.existsSync(path.join(embedDir, '.qwen', 'commands', 'say.toml')), '.qwen toml missing');
    assert.ok(fs.existsSync(path.join(embedDir, '.iflow', 'commands', 'say.toml')), '.iflow toml missing');
    assert.ok(fs.existsSync(path.join(embedDir, '.hermes', 'skills', 'say', 'SKILL.md')), '.hermes skill missing');
    assert.ok(fs.readFileSync(path.join(embedDir, '.cursor', 'rules', 'say.mdc'), 'utf8').includes('alwaysApply: true'), 'cursor mdc wrong');
    for (const f of ['CLAUDE.md', 'GEMINI.md', 'QWEN.md', 'IFLOW.md']) {
      assert.ok(fs.readFileSync(path.join(embedDir, f), 'utf8').includes('@AGENTS.md'), f + ' must import AGENTS.md');
    }
    assert.ok(fs.existsSync(path.join(embedDir, '.github', 'copilot-instructions.md')), 'copilot file missing');
    assert.ok(fs.existsSync(path.join(embedDir, '.goosehints')), '.goosehints missing');

    exec(['embed', '--out', embedDir, '--uninstall']);
    assert.ok(!fs.existsSync(path.join(embedDir, 'AGENTS.md')), 'uninstall must remove AGENTS.md');
    assert.ok(!fs.existsSync(path.join(embedDir, '.codex-plugin')), 'uninstall must remove .codex-plugin');
    assert.ok(!fs.existsSync(path.join(embedDir, '.cursor')), 'uninstall must remove .cursor');
  } finally {
    fs.rmSync(embedDir, { recursive: true, force: true });
  }
});

test('9. README correctness checker passes on both language files', () => {
  const out = execFileSync(process.execPath, [path.join(pluginRoot, 'scripts', 'check-readme.js')], {
    encoding: 'utf8'
  });
  assert.ok(out.includes('README check passed.'));
});

fs.rmSync(tempClaudeDir, { recursive: true, force: true });
console.log('\nALL ' + passed + ' TESTS PASSED.');