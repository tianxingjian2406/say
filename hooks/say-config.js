#!/usr/bin/env node
// say — Configuration & Mode Normalization (ASD-STE100 Bilingual Controlled Language)

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_MODE = '80';
const VALID_MODES = ['off', '60', '80', '100'];

const MODE_ALIASES = {
  'off': 'off',
  'stop': 'off',
  'disable': 'off',
  'normal': 'off',
  '0': 'off',
  '0%': 'off',
  '60': '60',
  '60%': '60',
  'lite': '60',
  'low': '60',
  '80': '80',
  '80%': '80',
  'standard': '80',
  'default': '80',
  'full': '80',
  'on': '80',
  '100': '100',
  '100%': '100',
  'strict': '100',
  'ultra': '100',
  'max': '100'
};

const MODE_LABELS = {
  'off': 'OFF (0% - Normal Prose)',
  '60': 'LITE (60% ASD-STE100)',
  '80': 'STANDARD (80% ASD-STE100)',
  '100': 'STRICT (100% ASD-STE100)'
};

function normalizeMode(raw) {
  if (raw === null || raw === undefined) return null;
  const key = String(raw).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(MODE_ALIASES, key) ? MODE_ALIASES[key] : null;
}

function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function getUserConfigPath() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'say', 'config.json');
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'say', 'config.json');
  }
  return path.join(os.homedir(), '.config', 'say', 'config.json');
}

function readConfigMode(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^﻿/, '');
    const parsed = JSON.parse(raw);
    return normalizeMode(parsed && parsed.defaultMode);
  } catch (e) {
    return null;
  }
}

function findRepoConfigMode(startDir) {
  try {
    let dir = path.resolve(startDir || process.cwd());
    for (let i = 0; i < 32; i++) {
      for (const rel of ['.say.json', '.claude/say.json', '.ste100.json']) {
        const mode = readConfigMode(path.join(dir, rel));
        if (mode) return mode;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch (e) {}
  return null;
}

function getDefaultMode(startDir) {
  const envMode = normalizeMode(process.env.SAY_DEFAULT_MODE || process.env.STE100_DEFAULT_MODE);
  if (envMode) return envMode;

  const repoMode = findRepoConfigMode(startDir);
  if (repoMode) return repoMode;

  const userMode = readConfigMode(getUserConfigPath());
  if (userMode) return userMode;

  return DEFAULT_MODE;
}

function writeDefaultMode(mode) {
  const normalized = normalizeMode(mode);
  if (!normalized) return false;
  const cfgPath = getUserConfigPath();
  try {
    fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
    fs.writeFileSync(cfgPath, JSON.stringify({ defaultMode: normalized }, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

function isDeactivationPhrase(prompt) {
  const text = String(prompt || '').trim().toLowerCase();
  return /^(stop\s+(say|ste(100)?)|disable\s+(say|ste(100)?)|(say|ste(100)?)\s+off|关闭\s*(say|ste(100)?)|退出\s*(say|ste(100)?))$/i.test(text);
}

module.exports = {
  DEFAULT_MODE,
  VALID_MODES,
  MODE_ALIASES,
  MODE_LABELS,
  normalizeMode,
  getClaudeDir,
  getUserConfigPath,
  getDefaultMode,
  writeDefaultMode,
  isDeactivationPhrase
};
