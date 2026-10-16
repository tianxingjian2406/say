#!/usr/bin/env node
// say — SessionStart Hook
// Initializes session mode (default 80%) and injects ASD-STE100 bilingual ruleset.

const { getDefaultMode, normalizeMode } = require('./say-config');
const { setMode, readMode, clearMode, writeHookOutput } = require('./say-runtime');
const { getCoreInstructions } = require('./say-instructions');

const RESET_SOURCES = new Set(['startup', 'clear']);

function runActivation(payloadStr, timedOut) {
  let source = timedOut ? 'unknown' : 'startup';
  let sessionCwd = process.cwd();
  let sessionId = null;

  try {
    if (payloadStr) {
      const cleaned = payloadStr.replace(/^﻿/, '').trim();
      if (cleaned) {
        const data = JSON.parse(cleaned);
        if (data && typeof data.source === 'string') source = data.source;
        if (data && typeof data.cwd === 'string') sessionCwd = data.cwd;
        if (data && typeof data.session_id === 'string') sessionId = data.session_id;
      }
    }
  } catch (e) {}

  let mode;
  if (RESET_SOURCES.has(source)) {
    mode = getDefaultMode(sessionCwd);
  } else {
    const stored = readMode(sessionId);
    mode = stored ? normalizeMode(stored) : getDefaultMode(sessionCwd);
  }

  if (!mode || mode === 'off') {
    clearMode(sessionId);
    writeHookOutput('SessionStart', 'OK');
    process.exit(0);
  }

  setMode(mode, sessionId);
  const instructions = getCoreInstructions(mode);
  writeHookOutput('SessionStart', instructions);
  process.exit(0);
}

if (process.stdin.isTTY) {
  runActivation('', false);
} else {
  let input = '';
  let done = false;
  const finish = (timedOut) => {
    if (done) return;
    done = true;
    clearTimeout(watchdog);
    try { process.stdin.pause(); } catch (e) {}
    try { process.stdin.unref(); } catch (e) {}
    runActivation(input, Boolean(timedOut));
  };

  const watchdog = setTimeout(() => finish(true), 1500);
  watchdog.unref();

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
    try {
      JSON.parse(input.replace(/^﻿/, ''));
      finish(false);
    } catch (e) {}
  });
  process.stdin.on('end', () => finish(false));
  process.stdin.on('error', () => finish(false));
}