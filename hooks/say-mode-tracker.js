#!/usr/bin/env node
// say — UserPromptSubmit Hook
// Tracks /say mode switches (60, 80, 100, off, default, status) and injects per-turn reinforcement.

const {
  getDefaultMode,
  normalizeMode,
  writeDefaultMode,
  isDeactivationPhrase,
  MODE_LABELS
} = require('./say-config');
const { setMode, clearMode, readMode, writeHookOutput } = require('./say-runtime');
const { getCoreInstructions, getReinforcementBanner } = require('./say-instructions');

let input = '';
let done = false;

function handlePrompt() {
  if (done) return;
  done = true;

  try {
    const cleaned = input.replace(/^﻿/, '').trim();
    if (!cleaned) return;
    const data = JSON.parse(cleaned);
    const rawPrompt = String(data.prompt || '').trim();
    const promptLower = rawPrompt.toLowerCase();
    const sessionId = data.session_id || null;
    const cwd = data.cwd || process.cwd();

    if (/^[/@$](say:)?(say|ste)(-check)?(\s|$)/i.test(promptLower)) {
      const parts = promptLower.split(/\s+/);
      const cmd = parts[0].replace(/^[@$]/, '/');
      const arg1 = parts[1] || '';
      const arg2 = parts[2] || '';

      if (cmd.endsWith('-check')) {
        const active = readMode(sessionId) || getDefaultMode(cwd);
        writeHookOutput(
          'UserPromptSubmit',
          `SAY (ASD-STE100) CHECKER INVOKED (Target tier: ${active}%). Evaluate text against sentence length, active voice, controlled verbs, one-instruction-per-sentence, and compute compliance percentage.`
        );
        return;
      }

      if (arg1 === 'status') {
        const active = readMode(sessionId) || getDefaultMode(cwd);
        const label = MODE_LABELS[active] || active;
        writeHookOutput('UserPromptSubmit', `SAY STATUS — Current mode: ${label}`);
        return;
      }

      if (arg1 === 'default') {
        const targetDefault = normalizeMode(arg2);
        if (targetDefault) {
          writeDefaultMode(targetDefault);
          setMode(targetDefault, sessionId);
          const rules = targetDefault === 'off' ? '' : '\n\n' + getCoreInstructions(targetDefault);
          writeHookOutput(
            'UserPromptSubmit',
            `SAY DEFAULT UPDATED — New default and current session mode: ${MODE_LABELS[targetDefault]}.${rules}`
          );
        }
        return;
      }

      const targetMode = arg1 === '' ? '80' : normalizeMode(arg1);
      if (targetMode === 'off') {
        clearMode(sessionId);
        writeHookOutput('UserPromptSubmit', 'SAY MODE OFF — Reverted to standard output.');
        return;
      }
      if (targetMode) {
        setMode(targetMode, sessionId);
        writeHookOutput(
          'UserPromptSubmit',
          `SAY MODE SWITCHED — Now at ${MODE_LABELS[targetMode]}\n\n${getCoreInstructions(targetMode)}`
        );
        return;
      }
    }

    if (isDeactivationPhrase(promptLower)) {
      clearMode(sessionId);
      writeHookOutput('UserPromptSubmit', 'SAY MODE OFF — Reverted to standard output.');
      return;
    }

    const activeMode = readMode(sessionId) || getDefaultMode(cwd);
    if (activeMode && activeMode !== 'off') {
      const banner = getReinforcementBanner(activeMode);
      if (banner) {
        writeHookOutput('UserPromptSubmit', banner);
      }
    }
  } catch (e) {}
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
  try {
    JSON.parse(input.replace(/^﻿/, ''));
    handlePrompt();
    try { process.stdin.pause(); } catch (e) {}
    try { process.stdin.unref(); } catch (e) {}
  } catch (e) {}
});
process.stdin.on('end', () => handlePrompt());
process.stdin.on('error', () => { handlePrompt(); process.exit(0); });
setTimeout(() => { handlePrompt(); process.exit(0); }, 1000).unref();