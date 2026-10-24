<p align="center">
  <img src="assets/claude6.png" width="128" alt="say">
</p>

<div align="center">
  <h1>say</h1>
  <p><b>让编程智能体按 ASD-STE100 受控技术语言回复。</b></p>
  <p><a href="README.md">English</a> · 简体中文</p>
  <a href="https://github.com/tianxingjian2406/say/stargazers"><img src="https://img.shields.io/github/stars/tianxingjian2406/say?style=flat-square" alt="Stars"></a>
  <img src="https://img.shields.io/badge/version-1.3.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/harnesses-21%20%2B%20AGENTS.md-green?style=flat-square" alt="Harnesses">
  <img src="https://img.shields.io/badge/default%20tier-80%25-orange?style=flat-square" alt="Default tier">
  <img src="https://img.shields.io/badge/platform-Node.js%20%7C%20Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square" alt="Platform">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
</div>

---

**say** 让编程智能体按 ASD-STE100 受控技术语言回复。它强制短句、主动语态、一句一动作、固定动词表。规则同时覆盖英文和简体中文。默认强度 80%。

## 它解决什么问题

智能体的输出会漂移。复合句越写越长，被动语态蔓延，虚化动词（`进行`、`加以`、`予以`、`作出`）把每个步骤搅模糊。你常要读两遍回复才能动手。ASD-STE100 是航空维修业的受控语言标准，专治这个问题。say 把它搬进终端，并给 AI、计算机、数学术语留 20% 豁免，所以 `正则化`、`梯度下降`、`收敛` 原样保留。

## 三档强度

| 档位 | 别名 | 句长上限 | 语态 | 词汇 |
| --- | --- | --- | --- | --- |
| 60% | `lite` | 英文 <=25/30 词。中文 <=35/45 字。 | 主动语态 >=80% | 常规词汇。禁模糊词。 |
| **80%（默认）** | `standard` | 英文 <=20/25 词。中文 <=25/35 字。 | 100% 主动。一句一动作。 | 受控动词。20% AI/CS/数学豁免。 |
| 100% | `strict` | 英文 <=20/25 词。中文 <=22/30 字。每段最多 6 句。 | 100% 主动。名词簇最多 3 个。 | 一词一义。全文锁定。 |

## 支持 21 个智能体 + AGENTS.md 家族

| 智能体 | 规则加载位置 | 技能 | `/say` 命令 |
| --- | --- | --- | --- |
| Claude Code | 插件钩子：会话启动、每轮、回复把关、子智能体 | 有 | 有 |
| ZCode | 插件钩子，同 Claude Code | 有 | 有 |
| Codex CLI | `~/.codex/AGENTS.md` 块 | 有 | 有（prompts） |
| OpenCode | `~/.config/opencode/AGENTS.md` 块 | 有 | 有 |
| Hermes Agent | `~/.hermes/skills/`，项目 `AGENTS.md` | 有 | 直接说：`say 60` |
| pi | `~/.pi/agent/AGENTS.md` 块 | 有 | 直接说：`say 60` |
| Gemini CLI | `~/.gemini/GEMINI.md` 块 | 无 | 有（TOML） |
| Qwen Code | `~/.qwen/QWEN.md` 块 | 无 | 有（TOML） |
| iFlow CLI | `~/.iflow/IFLOW.md` 块 | 无 | 有（TOML） |
| Cursor | `.cursor/rules/say.mdc` | 无 | 无 |
| Windsurf | `.windsurf/rules/say.md` | 无 | 无 |
| Cline | `.clinerules/say.md` | 无 | 无 |
| Roo Code | `.roo/rules/say.md` | 无 | 无 |
| Kilo Code | `.kilocode/rules/say.md` | 无 | 无 |
| Goose | `~/.config/goose/goosehints` | 无 | 无 |
| Crush | `~/.config/AGENTS.md`，项目 `CRUSH.md` | 无 | 无 |
| Amp | 项目 `AGENTS.md` | 无 | 无 |
| Droid (Factory) | 项目 `AGENTS.md` | 无 | 无 |
| Kimi CLI | 项目 `AGENTS.md` | 无 | 无 |
| GitHub Copilot | `.github/copilot-instructions.md` | 无 | 无 |
| Trae | `.trae/rules/say.md` | 无 | 无 |

所有读取 [AGENTS.md](https://agents.md) 标准的工具同样支持：Zed、Jules、Warp、VS Code、Junie、Devin、Aider。用 `--project` 安装，规则块落进项目 `AGENTS.md`。

Claude Code 和 ZCode 上，钩子全程执行档位。会话启动注入规则。每轮重新锚定。回复把关器审计每条完成的回复，低于档位的回复强制重写一次。子智能体继承档位。其余智能体在会话启动时加载规则，调用 `/say` 时重载。

## 安装

### 自动安装

一个安装器覆盖上表全部 21 个智能体。需要 Node.js 14 或更高版本：

```bash
git clone https://github.com/tianxingjian2406/say
node say/scripts/install.js <agent>   # 装一个：codex、gemini、cursor 等
node say/scripts/install.js all       # 装本机全部
node say/scripts/install.js --list    # 列出全部支持的智能体
```

Claude Code 和 ZCode 也可以直接装带钩子的完整插件：

```bash
claude plugin marketplace add tianxingjian2406/say
claude plugin install say@say
```

每次安装复制同样的三样东西：`say` 和 `say-check` 两个技能、按你智能体格式写入的斜杠命令、一个带标记的规则块。参数：

- `--tier 60|80|100` 设定块强度。默认 80。
- `--project` 写进当前项目（`.cursor/rules/say.mdc`、`GEMINI.md`、`AGENTS.md` 等），不写用户目录。
- `--uninstall` 删除技能、命令和规则块。你自己的配置内容保留。
- `--dry-run` 只打印动作，不写文件。

钩子智能体上，默认档位按此优先级解析：环境变量 `SAY_DEFAULT_MODE` > 仓库 `.say.json` > 用户配置 > 80%。

### 手动安装

同样三样东西，手动复制：

1. 规则。把 [`AGENTS.md`](AGENTS.md) 里的标记块复制进你智能体的指令文件（`CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 或其规则目录）。
2. 技能。把 `skills/say` 和 `skills/say-check` 复制进你智能体的技能目录。
3. 命令。把 `commands/say.md` 和 `commands/say-check.md`（Gemini 系用同名 `.toml`）复制进你智能体的命令目录。

仓库还内置各智能体的现成捆绑目录（`.claude/`、`.zcode/`、`.codex-plugin/`、`.cursor/` 等），由 `node scripts/install.js embed` 生成。把对应目录复制进你的用户目录或项目根目录即可。

## 命令

| 命令 | 作用 |
| --- | --- |
| `/say` 或 `/say 80` | 切到 80% 标准档 |
| `/say 60` / `/say lite` | 切到 60% 轻量档 |
| `/say 100` / `/say strict` | 切到 100% 严苛档 |
| `/say off` | 本会话关闭 |
| `/say status` | 报告当前档位 |
| `/say default <60\|80\|100\|off>` | 持久化启动档位（钩子智能体） |
| `/say-check [文本]` | 给文本或上一条回复打分，并重写 |

## 评分

`/say-check` 按五个加权维度评分：句长 25%、主动语态 25%、受控词汇 20%、一句一指令 15%、指代清晰 15%。及格线 80%。评分器也可独立运行：

```bash
node scripts/say-linter.js --text "对模型进行训练之前必须先读取配置文件并初始化权重矩阵"
```

## 仓库结构

```text
say/
├── .claude-plugin/       插件清单 + 市场条目
├── hooks/                会话、每轮、回复把关钩子（Claude Code、ZCode）
├── skills/               say + say-check，可移植 SKILL.md
├── commands/             斜杠命令，.md 与 .toml
├── scripts/              安装器、embed 模式、量化评分器
├── tests/                npm test，11 组测试
├── AGENTS.md ...         生成的规则文件与 harness 捆绑目录
└── .codex-plugin/ ...    修改后重跑 node scripts/install.js embed
```

## 参与贡献

见 [CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)。内容包括开发流程和提交信息规范。

## 许可证

MIT
