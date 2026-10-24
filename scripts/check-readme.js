#!/usr/bin/env node
// say — README Correctness Checker
// Validates README.md and README.zh-CN.md: fences, anchors, file links, tables,
// image sources, language cross-links, and version badge drift.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const READMES = ['README.md', 'README.zh-CN.md'];
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

let failures = 0;

function fail(file, msg) {
  failures++;
  console.log('FAIL [' + file + '] ' + msg);
}

function slug(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff -]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function check(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    fail(file, 'file missing');
    return;
  }
  const text = fs.readFileSync(full, 'utf8');
  const lines = text.split('\n');

  // 1. Balanced code fences.
  const fenceCount = lines.filter((l) => l.trim().startsWith('```')).length;
  if (fenceCount % 2 !== 0) fail(file, 'unbalanced code fences: ' + fenceCount);

  // Headings and anchors.
  const anchors = new Set();
  for (const l of lines) {
    const m = l.match(/^(#{1,6})\s+(.*)$/);
    if (m) anchors.add('#' + slug(m[2]));
  }

  // Track fences so links inside code blocks are ignored.
  let inFence = false;
  let tableBuffer = [];

  const flushTable = (startLine) => {
    if (tableBuffer.length < 2) {
      tableBuffer = [];
      return;
    }
    const cols = tableBuffer[0].split(/(?<!\\)\|/).length;
    tableBuffer.forEach((row, i) => {
      if (row.split(/(?<!\\)\|/).length !== cols) {
        fail(file, 'table column mismatch at line ' + (startLine + i) + ': ' + row.slice(0, 60));
      }
    });
    tableBuffer = [];
  };

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('```')) {
      inFence = !inFence;
      flushTable(idx - tableBuffer.length);
      return;
    }
    if (inFence) return;

    // 2. Table column consistency.
    if (line.trim().startsWith('|')) {
      if (tableBuffer.length === 0) tableBufferStart = idx;
      tableBuffer.push(line.trim());
    } else {
      flushTable(idx - tableBuffer.length);
    }

    // 3. Links: [text](target) and images: ![alt](src).
    for (const m of line.matchAll(/(!?)\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)) {
      const isImage = m[1] === '!';
      const target = m[3];
      if (target.startsWith('#')) {
        if (!anchors.has(target)) fail(file, 'broken anchor ' + target + ' at line ' + (idx + 1));
        continue;
      }
      if (/^https?:\/\//.test(target)) continue; // external, no network check here
      if (target.startsWith('mailto:')) continue;
      const rel = target.split('#')[0];
      if (!rel) continue;
      if (!fs.existsSync(path.join(ROOT, rel))) {
        fail(file, (isImage ? 'missing image ' : 'missing file link ') + target + ' at line ' + (idx + 1));
      }
    }
  });
  flushTable(lines.length - tableBuffer.length);

  // 4. Version badge must match package.json.
  const badge = text.match(/version-(\d+\.\d+\.\d+)-blue/);
  if (!badge) {
    fail(file, 'no version badge found');
  } else if (badge[1] !== pkg.version) {
    fail(file, 'version badge ' + badge[1] + ' != package.json ' + pkg.version);
  }

  console.log('CHECKED ' + file);
}

let tableBufferStart = 0;

for (const f of READMES) check(f);

// 5. Language cross-links between the two READMEs (markdown or HTML form).
const linksTo = (text, file) => text.includes('](' + file + ')') || text.includes('href="' + file + '"');
const en = fs.existsSync(path.join(ROOT, 'README.md')) ? fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8') : '';
const zh = fs.existsSync(path.join(ROOT, 'README.zh-CN.md')) ? fs.readFileSync(path.join(ROOT, 'README.zh-CN.md'), 'utf8') : '';
if (!linksTo(en, 'README.zh-CN.md')) fail('README.md', 'missing link to README.zh-CN.md');
if (!linksTo(zh, 'README.md')) fail('README.zh-CN.md', 'missing link to README.md');
if (!fs.existsSync(path.join(ROOT, 'assets', 'claude6.png'))) fail('README.md', 'assets/claude6.png missing');

if (failures) {
  console.error('\n' + failures + ' README problem(s) found.');
  process.exit(1);
}
console.log('\nREADME check passed.');
