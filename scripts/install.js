#!/usr/bin/env node
// say — Multi-Agent Installer
// Installs the say skills, slash commands, and ASD-STE100 instruction block into:
// Claude Code, ZCode, Codex CLI, Hermes Agent, OpenCode, pi, Gemini CLI.

const fs = require('fs');
const path = require('path');
const { getCoreInstructions } = require('../hooks/say-instructions');
const { normalizeMode } = require('../hooks/say-config');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const BEGIN_MARK = '<!-- say:begin -->';
const END_MARK = '<!-- say:end -->';

function configHome(home) {
  if (process.env.XDG_CONFIG_HOME) return process.env.XDG_CONFIG_HOME;
  return path.join(home, '.config');
}

// Each agent: where skills, commands, and the instruction file live (user level).
const AGENTS = {
  claude: {
    label: 'Claude Code',
    skills: (h) => path.join(h, '.claude', 'skills'),
    commands: (h) => path.join(h, '.claude', 'commands'),
    commandFiles: ['say.md', 'say-check.md'],
    commandTransform: 'claude',
    instructions: (h) => path.join(h, '.claude', 'CLAUDE.md'),
    projectInstructions: 'CLAUDE.md',
    note: 'For auto-injecting hooks, install the full plugin instead:\n  claude plugin marketplace add tianxingjian2406/say\n  claude plugin install say@say'
  },
  zcode: {
    label: 'ZCode',
    skills: (h) => path.join(h, '.zcode', 'skills'),
    commands: (h) => path.join(h, '.zcode', 'commands'),
    commandFiles: ['say.md', 'say-check.md'],
    commandTransform: 'claude',
    instructions: (h) => path.join(h, '.zcode', 'AGENTS.md'),
    projectInstructions: 'AGENTS.md',
    note: 'ZCode also loads the Claude Code plugin format directly, hooks included.'
  },
  codex: {
    label: 'Codex CLI',
    skills: (h) => path.join(h, '.codex', 'skills'),
    commands: (h) => path.join(h, '.codex', 'prompts'),
    commandFiles: ['say.md', 'say-check.md'],
    commandTransform: 'codex',
    instructions: (h) => path.join(h, '.codex', 'AGENTS.md'),
    projectInstructions: 'AGENTS.md'
  },
  hermes: {
    label: 'Hermes Agent',
    skills: (h) => path.join(h, '.hermes', 'skills'),
    commands: null,
    commandFiles: [],
    commandTransform: 'claude',
    instructions: null,
    projectInstructions: 'AGENTS.md',
    note: 'Hermes loads skills from ~/.hermes/skills. For always-on rules in one project, rerun with --project.'
  },
  opencode: {
    label: 'OpenCode',
    skills: (h) => path.join(configHome(h), 'opencode', 'skills'),
    commands: (h) => path.join(configHome(h), 'opencode', 'commands'),
    commandFiles: ['say.md', 'say-check.md'],
    commandTransform: 'opencode',
    instructions: (h) => path.join(configHome(h), 'opencode', 'AGENTS.md'),
    projectInstructions: 'AGENTS.md'
  },
  pi: {
    label: 'pi coding agent',
    skills: (h) => path.join(h, '.pi', 'agent', 'skills'),
    commands: null,
    commandFiles: [],
    commandTransform: 'claude',
    instructions: (h) => path.join(h, '.pi', 'agent', 'AGENTS.md'),
    projectInstructions: 'AGENTS.md'
  },
  gemini: {
    label: 'Gemini CLI',
    skills: null,
    commands: (h) => path.join(h, '.gemini', 'commands'),
    commandFiles: ['say.toml', 'say-check.toml'],
    commandTransform: 'gemini',
    instructions: (h) => path.join(h, '.gemini', 'GEMINI.md'),
    projectInstructions: 'GEMINI.md'
  }
};

const SKILL_DIRS = ['say', 'say-check'];

// --- command file transforms -------------------------------------------------

function stripFrontmatter(text) {
  return text.replace(/^---\n[\s\S]*?\n---\n*/, '');
}

function transformCommand(text, kind) {
  if (kind === 'codex') {
    // Codex prompts are plain text: no YAML frontmatter, no Claude placeholders.
    return stripFrontmatter(text).replace(/\$ARGUMENTS/g, 'the text typed after the command');
  }
  if (kind === 'opencode') {
    // OpenCode keeps description + $ARGUMENTS but has no argument-hint key.
    return text.replace(/^argument-hint:.*\n/m, '');
  }
  return text;
}

// --- instruction block -------------------------------------------------------

function buildBlock(tier) {
  const rules = getCoreInstructions(tier);
  const label = tier === '100' ? '100% strict' : tier === '60' ? '60% lite' : '80% standard';
  return [
    BEGIN_MARK,
    '## say — ASD-STE100 controlled language (' + label + ')',
    '',
    rules,
    '',
    'Change tier: rerun the say installer with `--tier 60|80|100`. Remove: rerun with `--uninstall`.',
    END_MARK
  ].join('\n');
}

function upsertBlock(filePath, block, dry) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  const cleaned = existing.replace(new RegExp(BEGIN_MARK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END_MARK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n*'), '').trimEnd();
  const next = cleaned ? cleaned + '\n\n' + block + '\n' : block + '\n';
  if (dry) {
    console.log('  [dry-run] write instruction block -> ' + filePath);
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next, 'utf8');
  console.log('  instruction block -> ' + filePath);
}

function removeBlock(filePath, dry) {
  if (!fs.existsSync(filePath)) return;
  const existing = fs.readFileSync(filePath, 'utf8');
  const re = new RegExp(BEGIN_MARK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + END_MARK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n*');
  if (!re.test(existing)) return;
  const next = existing.replace(re, '').trimEnd();
  if (dry) {
    console.log('  [dry-run] remove instruction block <- ' + filePath);
    return;
  }
  if (next) {
    fs.writeFileSync(filePath, next + '\n', 'utf8');
  } else {
    fs.unlinkSync(filePath);
  }
  console.log('  instruction block removed <- ' + filePath);
}

// --- file copying ------------------------------------------------------------

function copyFile(src, dest, dry) {
  if (dry) {
    console.log('  [dry-run] copy ' + path.relative(PLUGIN_ROOT, src) + ' -> ' + dest);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('  copy ' + path.relative(PLUGIN_ROOT, src) + ' -> ' + dest);
}

function removeTree(target, dry) {
  if (!fs.existsSync(target)) return;
  if (dry) {
    console.log('  [dry-run] remove ' + target);
    return;
  }
  fs.rmSync(target, { recursive: true, force: true });
  console.log('  remove ' + target);
}

// --- per-agent install -------------------------------------------------------

function installAgent(name, opts) {
  const spec = AGENTS[name];
  const home = opts.home;
  const tier = normalizeMode(opts.tier) || '80';

  console.log('\n== ' + spec.label + ' (' + (opts.uninstall ? 'uninstall' : 'install tier ' + tier + (opts.project ? ', project scope' : '')) + ') ==');

  // skills
  if (spec.skills) {
    for (const skill of SKILL_DIRS) {
      const src = path.join(PLUGIN_ROOT, 'skills', skill);
      const dest = path.join(spec.skills(home), skill);
      if (opts.uninstall) {
        removeTree(dest, opts.dry);
      } else {
        copyDir(src, dest, opts.dry);
      }
    }
    if (!opts.uninstall) {
      // Ship the linter inside say-check so the skill works without the repo.
      copyFile(path.join(PLUGIN_ROOT, 'scripts', 'say-linter.js'), path.join(spec.skills(home), 'say-check', 'say-linter.js'), opts.dry);
    }
  }

  // commands
  if (spec.commands) {
    if (opts.uninstall) {
      for (const file of spec.commandFiles) removeTree(path.join(spec.commands(home), file), opts.dry);
    } else {
      for (const file of spec.commandFiles) {
        const src = path.join(PLUGIN_ROOT, 'commands', file);
        const raw = fs.readFileSync(src, 'utf8');
        const dest = path.join(spec.commands(home), file);
        if (opts.dry) {
          console.log('  [dry-run] write ' + path.relative(PLUGIN_ROOT, src) + ' (transform: ' + spec.commandTransform + ') -> ' + dest);
        } else {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, transformCommand(raw, spec.commandTransform), 'utf8');
          console.log('  command ' + file + ' -> ' + dest);
        }
      }
    }
  }

  // instructions
  const target = opts.project ? path.join(process.cwd(), spec.projectInstructions) : spec.instructions && spec.instructions(home);
  if (target) {
    if (opts.uninstall) {
      removeBlock(target, opts.dry);
    } else {
      upsertBlock(target, buildBlock(tier), opts.dry);
    }
  } else if (!opts.uninstall) {
    console.log('  (no user-level instruction file for this agent)');
  }

  if (!opts.uninstall && spec.note) console.log('  note: ' + spec.note);
}

function copyDir(src, dest, dry) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to, dry);
    } else {
      copyFile(from, to, dry);
    }
  }
}

// --- CLI ---------------------------------------------------------------------

function usage() {
  const names = Object.keys(AGENTS).join(' | ');
  return [
    'say multi-agent installer',
    '',
    'Usage:',
    '  node scripts/install.js <agent> [--tier 60|80|100] [--project] [--uninstall] [--dry-run] [--home <dir>]',
    '  node scripts/install.js all',
    '  node scripts/install.js --list',
    '',
    'Agents: ' + names
  ].join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const opts = { tier: '80', project: false, uninstall: false, dry: false, home: require('os').homedir() };

  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tier') opts.tier = argv[++i];
    else if (a === '--project') opts.project = true;
    else if (a === '--uninstall') opts.uninstall = true;
    else if (a === '--dry-run') opts.dry = true;
    else if (a === '--home') opts.home = path.resolve(argv[++i]);
    else if (a === '--list') {
      for (const [name, spec] of Object.entries(AGENTS)) {
        console.log(name.padEnd(9) + spec.label);
      }
      return;
    } else if (a === '--help' || a === '-h') {
      console.log(usage());
      return;
    } else positional.push(a);
  }

  const target = positional[0];
  if (!target || !AGENTS[target] && target !== 'all') {
    console.error(usage());
    process.exit(1);
  }
  if (opts.tier !== '80' && !normalizeMode(opts.tier)) {
    console.error('Invalid --tier: ' + opts.tier + ' (use 60, 80, or 100)');
    process.exit(1);
  }

  const names = target === 'all' ? Object.keys(AGENTS) : [target];
  for (const name of names) installAgent(name, opts);
  console.log('\nDone.');
}

main();
