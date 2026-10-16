#!/usr/bin/env node
// say — Runtime State & Hook Output Helper

const fs = require('fs');
const path = require('path');
const { getClaudeDir, normalizeMode, DEFAULT_MODE } = require('./say-config');

const STATE_FILE = '.say-active';
const SESSION_DIR_NAME = '.say-sessions';

function getStateFilePath() {
  return path.join(getClaudeDir(), STATE_FILE);
}

function getSessionFilePath(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') return null;
  const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeId) return null;
  return path.join(getClaudeDir(), SESSION_DIR_NAME, safeId + '.mode');
}

function setMode(mode, sessionId) {
  const normalized = normalizeMode(mode) || DEFAULT_MODE;
  const statePath = getStateFilePath();
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    if (normalized === 'off') {
      try { fs.unlinkSync(statePath); } catch (e) {}
    } else {
      fs.writeFileSync(statePath, normalized, 'utf8');
    }
  } catch (e) {}

  const sessionPath = getSessionFilePath(sessionId);
  if (sessionPath) {
    try {
      fs.mkdirSync(path.dirname(sessionPath), { recursive: true });
      fs.writeFileSync(sessionPath, normalized, 'utf8');
    } catch (e) {}
  }
}

function clearMode(sessionId) {
  setMode('off', sessionId);
}

function readMode(sessionId) {
  const sessionPath = getSessionFilePath(sessionId);
  if (sessionPath && fs.existsSync(sessionPath)) {
    try {
      const val = normalizeMode(fs.readFileSync(sessionPath, 'utf8'));
      if (val) return val;
    } catch (e) {}
  }
  const statePath = getStateFilePath();
  try {
    if (fs.existsSync(statePath)) {
      const val = normalizeMode(fs.readFileSync(statePath, 'utf8'));
      if (val) return val;
    }
  } catch (e) {}
  return null;
}

function writeHookOutput(event, context) {
  if (!context) return;
  if (event === 'SubagentStart' || event === 'UserPromptSubmit') {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: event,
        additionalContext: context
      }
    }));
    return;
  }
  process.stdout.write(context);
}

module.exports = {
  STATE_FILE,
  getStateFilePath,
  setMode,
  clearMode,
  readMode,
  writeHookOutput
};
