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

fs.rmSync(tempClaudeDir, { recursive: true, force: true });
console.log('\nALL ' + passed + ' TESTS PASSED.');