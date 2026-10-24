#!/usr/bin/env node
// say — Stop Hook (reply gate)
// Audits each finished reply against the active tier. Blocks a non-compliant reply once.

const fs = require('fs');
const { getDefaultMode } = require('./say-config');
const { readMode } = require('./say-runtime');
const { evaluateText } = require('../scripts/say-linter');

let input = '';
let done = false;

function readLastAssistantText(transcriptPath) {
  let raw = '';
  try {
    raw = fs.readFileSync(transcriptPath, 'utf8');
  } catch (e) {
    return '';
  }
  const lines = raw.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch (e) {
      continue;
    }
    if (!entry || entry.type !== 'assistant' || !entry.message) continue;
    const content = entry.message.content;
    if (!Array.isArray(content)) continue;
    const text = content
      .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('\n')
      .trim();
    if (text) return text;
  }
  return '';
}

function handleStop() {
  if (done) return;
  done = true;

  let data = {};
  try {
    data = JSON.parse(input.replace(/^﻿/, ''));
  } catch (e) {
    return;
  }

  const active = readMode(data.session_id) || getDefaultMode(data.cwd || process.cwd());
  if (!active || active === 'off') return;

  // Loop guard: stop_hook_active marks a reply that already continued after a block.
  if (data.stop_hook_active) return;

  const text = readLastAssistantText(data.transcript_path);
  if (!text) return;

  let result = null;
  try {
    result = evaluateText(text, active);
  } catch (e) {
    return;
  }
  if (!result || result.passed) return;

  const top = result.violations.slice(0, 5).join('\n');
  process.stdout.write(
    JSON.stringify({
      decision: 'block',
      reason:
        `SAY: your last reply scored ${result.score}% against the ${active}% ASD-STE100 tier. ` +
        'Rewrite the full reply so every sentence complies: short sentences, active voice, controlled verbs, one action per sentence. Violations:\n' +
        top
    })
  );
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
  try {
    JSON.parse(input.replace(/^﻿/, ''));
    handleStop();
    try { process.stdin.pause(); } catch (e) {}
    try { process.stdin.unref(); } catch (e) {}
  } catch (e) {}
});
process.stdin.on('end', () => handleStop());
process.stdin.on('error', () => { handleStop(); process.exit(0); });
setTimeout(() => { handleStop(); process.exit(0); }, 2000).unref();
