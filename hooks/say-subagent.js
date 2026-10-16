#!/usr/bin/env node
// say — SubagentStart Hook
// Ensures all spawned subagents inherit the active ASD-STE100 mode (default 80%).

const { getDefaultMode } = require('./say-config');
const { readMode, writeHookOutput } = require('./say-runtime');
const { getCoreInstructions } = require('./say-instructions');

const mode = readMode() || getDefaultMode();

if (!mode || mode === 'off') {
  process.exit(0);
}

try {
  const instructions = getCoreInstructions(mode);
  writeHookOutput('SubagentStart', instructions);
} catch (e) {}

process.exit(0);