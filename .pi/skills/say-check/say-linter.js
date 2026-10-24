#!/usr/bin/env node
// say — Quantitative ASD-STE100 Bilingual Linter & Scorer
// Evaluates Chinese & English technical prose against ASD-STE100 rules.

const fs = require('fs');

const BANNED_EN_WORDS = [
  { pattern: /\butilize[sd]?\b|\butilizing\b/i, replace: 'use', label: 'utilize -> use' },
  { pattern: /\binitiate[sd]?\b|\binitiating\b/i, replace: 'start', label: 'initiate -> start' },
  { pattern: /\bcommence[sd]?\b|\bcommencing\b/i, replace: 'start', label: 'commence -> start' },
  { pattern: /\bterminate[sd]?\b|\bterminating\b/i, replace: 'stop', label: 'terminate -> stop' },
  { pattern: /\bascertain[ed]*\b/i, replace: 'check', label: 'ascertain -> check' },
  { pattern: /\bfacilitate[sd]?\b/i, replace: 'help', label: 'facilitate -> help' },
  { pattern: /\bdemonstrate[sd]?\b/i, replace: 'show', label: 'demonstrate -> show' },
  { pattern: /\bbasically\b|\bactually\b|\bobviously\b|\bclearly\b/i, replace: '(omit filler)', label: 'filler adverb' },
  { pattern: /\bis\s+not\s+[^,.]+,\s*(it\s+is|but)\b/i, replace: '(direct positive statement)', label: 'negative roundabout ("is not A, it is B")' }
];

const BANNED_CN_PATTERNS = [
  { pattern: /加以|予以|作出/, replace: '直接动词 (省去虚化动词)', label: '禁用虚化动词 (加以/予以/作出)' },
  { pattern: /对[^\s，。；,.;]{1,12}进行/, replace: '直接动宾结构 (如: 训练模型)', label: '禁用冗长“对...进行”句式' },
  { pattern: /大概|也许|可能吧|基本上|不言而喻|众所周知|显而易见/, replace: '(删除模糊/填充词)', label: '禁用模糊或填充词' },
  { pattern: /不是[^，。；,.;]+而是/, replace: '直接陈述正结论 (是...)', label: '禁用“不是...而是...”负向绕弯句式' }
];

const PASSIVE_EN_PATTERN = /\b(is|are|was|were|be|been|being)\s+([a-z]+ed|written|shown|taken|given|made|done|run|set|built|found|sent)\b/i;
const PASSIVE_CN_PATTERN = /被[^\s，。；,.;]{1,10}(所|进行|加以|处理|执行|计算|调用|修改|删除)/;

const STANDALONE_PRONOUN_EN = /^(this|that|it)\s+(is|means|causes|shows|will|can|makes)\b/i;
const STANDALONE_PRONOUN_CN = /^(这|那)\s*(是|意味着|会导致|表明|说明|可以|将)/;

function stripCodeAndMath(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, 'CODE')
    .replace(/\$\$[\s\S]*?\$\$/g, 'MATH')
    .replace(/\$[^$\n]+\$/g, 'MATH');
}

function splitSentences(text) {
  const cleaned = stripCodeAndMath(text);
  const rawParts = cleaned
    .split(/(?<=[.!?。！？；;\n])\s*/)
    .map(s => s.replace(/^[-*+]\s+|\d+\.\s+/, '').trim())
    .filter(s => s.length > 2 && !/^#+\s/.test(s) && !/^\|.*\|$/.test(s));
  return rawParts;
}

function countChineseChars(str) {
  const matches = str.match(/[一-龥]/g);
  return matches ? matches.length : 0;
}

function countEnglishWords(str) {
  const withoutCn = str.replace(/[一-龥]/g, ' ');
  const words = withoutCn.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function isProceduralSentence(s) {
  return /^(run|execute|set|open|create|delete|update|check|use|start|stop|install|configure|click|type|enter|load|save|build|请|执行|运行|设置|打开|创建|删除|更新|检查|使用|启动|停止|安装|配置|输入|加载|保存|读取|初始化|修改)\b/i.test(s.trim());
}

function evaluateText(text, targetTier = 80) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return {
      score: 100,
      targetTier: Number(targetTier),
      passed: true,
      sentenceCount: 0,
      metrics: { length: 100, activeVoice: 100, vocabulary: 100, singleAction: 100, clarity: 100 },
      violations: []
    };
  }

  const limits = Number(targetTier) === 100
    ? { enProc: 20, enDesc: 25, cnProc: 22, cnDesc: 30 }
    : Number(targetTier) === 60
      ? { enProc: 25, enDesc: 30, cnProc: 35, cnDesc: 45 }
      : { enProc: 20, enDesc: 25, cnProc: 25, cnDesc: 35 };

  let lengthPass = 0;
  let activePass = 0;
  let vocabPass = 0;
  let singleActionPass = 0;
  let clarityPass = 0;
  const violations = [];

  sentences.forEach((s, idx) => {
    const cnCount = countChineseChars(s);
    const enCount = countEnglishWords(s);
    const isCnPrimary = cnCount >= enCount;
    const isProc = isProceduralSentence(s);

    // 1. Length check
    let lenOk = true;
    if (isCnPrimary) {
      const totalLen = cnCount + enCount;
      const cap = isProc ? limits.cnProc : limits.cnDesc;
      if (totalLen > cap) {
        lenOk = false;
        violations.push(`[S${idx + 1} 句长超限] ${totalLen}字/词 (上限 ${cap}): "${s.slice(0, 40)}..."`);
      }
    } else {
      const cap = isProc ? limits.enProc : limits.enDesc;
      if (enCount > cap) {
        lenOk = false;
        violations.push(`[S${idx + 1} Length Exceeded] ${enCount} words (max ${cap}): "${s.slice(0, 50)}..."`);
      }
    }
    if (lenOk) lengthPass++;

    // 2. Active voice check
    let voiceOk = true;
    if (PASSIVE_EN_PATTERN.test(s) || PASSIVE_CN_PATTERN.test(s)) {
      voiceOk = false;
      violations.push(`[S${idx + 1} 被动语态/Passive Voice]: "${s.slice(0, 45)}..."`);
    }
    if (voiceOk) activePass++;

    // 3. Controlled Vocabulary check
    let vocabOk = true;
    for (const rule of BANNED_EN_WORDS) {
      if (rule.pattern.test(s)) {
        vocabOk = false;
        violations.push(`[S${idx + 1} 禁用词/Banned Term (${rule.label})]: "${s.slice(0, 45)}..."`);
      }
    }
    for (const rule of BANNED_CN_PATTERNS) {
      if (rule.pattern.test(s)) {
        vocabOk = false;
        violations.push(`[S${idx + 1} ${rule.label}]: "${s.slice(0, 45)}..."`);
      }
    }
    if (vocabOk) vocabPass++;

    // 4. Single Instruction per Sentence check
    let singleOk = true;
    if (isProc && (/\band\s+then\b|\bbefore\s+\w+ing\b/i.test(s) || /并.*然后|先.*再.*接着/.test(s))) {
      singleOk = false;
      violations.push(`[S${idx + 1} 复合指令/Multi-action Sentence]: "${s.slice(0, 45)}..."`);
    }
    if (singleOk) singleActionPass++;

    // 5. Clarity (Standalone pronoun)
    let clarityOk = true;
    if (STANDALONE_PRONOUN_EN.test(s) || STANDALONE_PRONOUN_CN.test(s)) {
      clarityOk = false;
      violations.push(`[S${idx + 1} 指代不明/Standalone Pronoun]: "${s.slice(0, 45)}..."`);
    }
    if (clarityOk) clarityPass++;
  });

  const n = sentences.length;
  const metrics = {
    length: Math.round((lengthPass / n) * 100),
    activeVoice: Math.round((activePass / n) * 100),
    vocabulary: Math.round((vocabPass / n) * 100),
    singleAction: Math.round((singleActionPass / n) * 100),
    clarity: Math.round((clarityPass / n) * 100)
  };

  const weightedScore = Math.round(
    metrics.length * 0.25 +
    metrics.activeVoice * 0.25 +
    metrics.vocabulary * 0.20 +
    metrics.singleAction * 0.15 +
    metrics.clarity * 0.15
  );

  return {
    score: weightedScore,
    targetTier: Number(targetTier),
    passed: weightedScore >= Number(targetTier),
    sentenceCount: n,
    metrics,
    violations
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let text = '';
  let tier = 80;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier' && args[i + 1]) {
      tier = Number(args[++i]) || 80;
    } else if (args[i] === '--file' && args[i + 1]) {
      text = fs.readFileSync(args[++i], 'utf8');
    } else if (args[i] === '--text' && args[i + 1]) {
      text = args[++i];
    }
  }

  if (!text && !process.stdin.isTTY) {
    text = fs.readFileSync(0, 'utf8');
  }

  const result = evaluateText(text, tier);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

module.exports = { evaluateText, splitSentences };