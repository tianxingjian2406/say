<p align="center">
  <img src="assets/claude6.png" width="220" alt="say logo">
</p>

<h1 align="center">say</h1>

<p align="center">
  <b>English</b> · <a href="#中文"><b>中文</b></a>
</p>

---

## English

**say** makes coding agents write in ASD-STE100 controlled technical language. It enforces short sentences, active voice, one action per sentence, and a fixed verb set. Rules cover English and Simplified Chinese. The default intensity is 80%.

### The problem it solves

Agent output drifts. Compound sentences grow, passive voice spreads, and dummy verbs (`utilize`, `initiate`, `进行`, `加以`) blur every step. You reread a reply twice before you can act on it. ASD-STE100, the writing standard from aviation maintenance, removes that friction. say ports it to your terminal and exempts AI, CS, and math terms from the lock, so `tensor`, `gradient`, and `正则化` stay untouched.

### Three intensity tiers

| Tier | Alias | Sentence caps | Voice | Vocabulary |
| --- | --- | --- | --- | --- |
| 60% | `lite` | EN <=25w proc, <=30w desc. CN <=35/45 chars. | >=80% active | Standard terms. No hedging. |
| **80% (default)** | `standard` | EN <=20w proc, <=25w desc. CN <=25/35 chars. | 100% active. 1 action per sentence. | Controlled verbs. 20% AI/CS/math exemption. |
| 100% | `strict` | EN <=20w/25w. CN <=22/30 chars. Max 6 sentences per paragraph. | 100% active. Max 3-noun clusters. | One word, one meaning. Locked for the whole reply. |

### Works with seven agents

| Agent | Rules load from | Tier switching |
| --- | --- | --- |
| Claude Code | plugin hooks: session start, every turn, subagents | `/say` |
| ZCode | plugin hooks, same as Claude Code | `/say` |
| Codex CLI | `~/.codex/AGENTS.md` block + skills | `/say` |
| OpenCode | `~/.config/opencode/AGENTS.md` block + skills | `/say` |
| Gemini CLI | `~/.gemini/GEMINI.md` block + TOML commands | `/say` |
| pi | `~/.pi/agent/AGENTS.md` block + skills | ask: `say 60` |
| Hermes | `~/.hermes/skills/`, project `AGENTS.md` via `--project` | ask: `say 60` |

On Claude Code and ZCode, hooks re-anchor the rules every turn, so the tier holds across long sessions and subagents inherit it. On the other five, the instruction block loads at session start and the `/say` command reloads the ruleset on call.

### Install

Claude Code, full plugin with hooks:

```bash
claude plugin marketplace add tianxingjian2406/say
claude plugin install say@say
```

ZCode loads the same plugin format. Or use the installer below.

Codex CLI, Hermes, OpenCode, pi, Gemini CLI, ZCode, Claude Code (skill mode):

```bash
git clone https://github.com/tianxingjian2406/say
node say/scripts/install.js codex    # one agent: codex | hermes | opencode | pi | gemini | zcode | claude
node say/scripts/install.js all      # every agent at once
```

The installer copies the `say` and `say-check` skills, writes the slash commands in each agent's format, and manages one marked block in the agent's instruction file. It needs Node.js 14 or newer.

Options:

- `--tier 60|80|100` sets the block intensity. Default 80.
- `--project` writes the rules into `<project>/AGENTS.md` (`GEMINI.md` / `CLAUDE.md` for those agents) instead of your home directory.
- `--uninstall` removes the skills, commands, and block. Your own config lines stay.
- `--dry-run` prints every action and writes nothing.

On hook agents, the default tier also follows this priority: env `SAY_DEFAULT_MODE` > repo `.say.json` > user config > 80%.

### Commands

| Command | Effect |
| --- | --- |
| `/say` or `/say 80` | switch to 80% standard |
| `/say 60` / `/say lite` | switch to 60% lite |
| `/say 100` / `/say strict` | switch to 100% strict |
| `/say off` | disable for this session |
| `/say status` | report the active tier |
| `/say default <60\|80\|100\|off>` | persist the startup tier (hook agents) |
| `/say-check [text]` | score the text or your last reply, then rewrite it |

### Scoring

`/say-check` rates text on five weighted metrics: sentence length 25%, active voice 25%, controlled vocabulary 20%, single instruction per sentence 15%, pronoun clarity 15%. Pass mark: 80%. The linter also runs standalone:

```bash
node scripts/say-linter.js --text "对模型进行训练之前必须先读取配置文件并初始化权重矩阵"
```

### Repository layout

```text
say/
├── .claude-plugin/    plugin manifest + marketplace entry
├── hooks/             session hooks (Claude Code, ZCode)
├── skills/            say + say-check, portable SKILL.md
├── commands/          slash commands, .md and .toml
├── scripts/           multi-agent installer + quantitative linter
└── tests/             npm test, 8 suites
```

---

## 中文

**say** 让编程智能体按 ASD-STE100 受控技术语言写作。它强制短句、主动语态、一句一动作、固定动词表。规则同时覆盖英文和简体中文。默认强度 80%。

### 它解决什么问题

智能体的输出会漂移。复合句越写越长，被动语态蔓延，虚化动词（`utilize`、`initiate`、`进行`、`加以`）把每个步骤搅模糊。你常要读两遍回复才能动手。ASD-STE100 是航空维修业的写作标准，专治这个问题。say 把它搬进终端，并给 AI、计算机、数学术语留 20% 豁免，所以 `tensor`、`gradient`、`正则化` 原样保留。

### 三档强度

| 档位 | 别名 | 句长上限 | 语态 | 词汇 |
| --- | --- | --- | --- | --- |
| 60% | `lite` | 英文 <=25/30 词。中文 <=35/45 字。 | 主动语态 >=80% | 常规词汇。禁模糊词。 |
| **80%（默认）** | `standard` | 英文 <=20/25 词。中文 <=25/35 字。 | 100% 主动。一句一动作。 | 受控动词。20% AI/CS/数学豁免。 |
| 100% | `strict` | 英文 <=20/25 词。中文 <=22/30 字。每段最多 6 句。 | 100% 主动。名词簇最多 3 个。 | 一词一义。全文锁定。 |

### 支持七个智能体

| 智能体 | 规则加载方式 | 切换方式 |
| --- | --- | --- |
| Claude Code | 插件钩子：会话启动、每轮、子智能体 | `/say` |
| ZCode | 插件钩子，同 Claude Code | `/say` |
| Codex CLI | `~/.codex/AGENTS.md` 块 + 技能 | `/say` |
| OpenCode | `~/.config/opencode/AGENTS.md` 块 + 技能 | `/say` |
| Gemini CLI | `~/.gemini/GEMINI.md` 块 + TOML 命令 | `/say` |
| pi | `~/.pi/agent/AGENTS.md` 块 + 技能 | 直接说：`say 60` |
| Hermes | `~/.hermes/skills/`，加 `--project` 写项目 `AGENTS.md` | 直接说：`say 60` |

Claude Code 和 ZCode 上，钩子每轮重新锚定规则，长会话不漂移，子智能体自动继承当前档位。其余五个智能体在会话启动时加载指令块，调用 `/say` 时重载规则。

### 安装

Claude Code，带钩子的完整插件：

```bash
claude plugin marketplace add tianxingjian2406/say
claude plugin install say@say
```

ZCode 直接支持同一插件格式，也可用下面的安装器。

Codex CLI、Hermes、OpenCode、pi、Gemini CLI、ZCode、Claude Code（技能模式）：

```bash
git clone https://github.com/tianxingjian2406/say
node say/scripts/install.js codex    # 单个：codex | hermes | opencode | pi | gemini | zcode | claude
node say/scripts/install.js all      # 一次装全部
```

安装器复制 `say` 和 `say-check` 两个技能，按各智能体的格式写入斜杠命令，并在指令文件里维护一个带标记的规则块。需要 Node.js 14 或更高版本。

参数：

- `--tier 60|80|100` 设定块强度。默认 80。
- `--project` 把规则写进当前项目的 `AGENTS.md`（Gemini 用 `GEMINI.md`，Claude 用 `CLAUDE.md`），不写用户目录。
- `--uninstall` 删除技能、命令和规则块。你自己的配置内容保留。
- `--dry-run` 只打印动作，不写文件。

钩子智能体上，默认档位按此优先级解析：环境变量 `SAY_DEFAULT_MODE` > 仓库 `.say.json` > 用户配置 > 80%。

### 命令

| 命令 | 作用 |
| --- | --- |
| `/say` 或 `/say 80` | 切到 80% 标准档 |
| `/say 60` / `/say lite` | 切到 60% 轻量档 |
| `/say 100` / `/say strict` | 切到 100% 严苛档 |
| `/say off` | 本会话关闭 |
| `/say status` | 报告当前档位 |
| `/say default <60\|80\|100\|off>` | 持久化启动档位（钩子智能体） |
| `/say-check [文本]` | 给文本或上一条回复打分，并重写 |

### 评分

`/say-check` 按五个加权维度评分：句长 25%、主动语态 25%、受控词汇 20%、一句一指令 15%、指代清晰 15%。及格线 80%。评分器也可独立运行：

```bash
node scripts/say-linter.js --text "对模型进行训练之前必须先读取配置文件并初始化权重矩阵"
```

### 仓库结构

```text
say/
├── .claude-plugin/    插件清单 + 市场条目
├── hooks/             会话钩子（Claude Code、ZCode）
├── skills/            say + say-check，可移植 SKILL.md
├── commands/          斜杠命令，.md 与 .toml
├── scripts/           多智能体安装器 + 量化评分器
└── tests/             npm test，8 组测试
```

---

## License

MIT
