# say — ASD-STE100 受控技术语言中英双语插件 (Claude Code Plugin)

强制 Claude Code 主 Agent 与所有子 Agent (Subagents) 的输出符合 **ASD-STE100 (Simplified Technical English / 简化技术英语与受控中文)** 标准，默认执行 **80% 强度档位**。

---

## 一、核心特性

1. **三档强度动态控制（默认 80%）**
   - **60% (lite)**：轻量受控。控制句长（英 <=25/30词，中 <=35/45字），主动语态 >=80%，剔除寒暄与模糊副词（大概、可能、basically）。
   - **80% (standard，默认)**：核心语法 100% 严格执行 + 20% 专业领域词汇豁免。
     - **句长硬上限**：英文指令句 <=20 词、陈述句 <=25 词；中文操作句 <=25 字、陈述句 <=35 字（代码、路径、公式豁免）。
     - **单句单指令**：一句只包含一个动作。
     - **100% 主动语态**：严禁被动句（is processed by / 被...所处理）。
     - **受控动词与一词一义**：禁用 utilize/initiate/facilitate 及中文虚化动词（对...进行、加以、予以、作出），强制使用直接动词（使用、启动、训练模型）。
     - **20% 专业术语豁免**：完全放行人工智能、计算机科学、数学建模术语（如 tensor、gradient、Lookahead、正则化、特征值）。
   - **100% (strict)**：完全严苛模式。中文操作句 <=22 字、陈述句 <=30 字，每段 <=6 句，连续名词簇 <=3 个，全文同一概念严格锁定唯一词汇。
2. **全生命周期 Hook 注入**
   - SessionStart：会话启动自动激活默认 80% 档位并注入规则。
   - SubagentStart：派生的所有子 Agent 自动继承当前会话的 STE100 档位。
   - UserPromptSubmit：实时拦截 /say 切换指令，并在每轮对话注入精简强化锚点防止长对话漂移。
3. **量化合规评分器 (scripts/say-linter.js & /say-check)**
   - 按句长 (25%)、主动语态 (25%)、受控词汇 (20%)、单句单指令 (15%)、指代清晰度 (15%) 五维加权打分，量化验证输出是否 >= 80%。

---

## 二、命令列表

| 命令 | 功能说明 |
| :--- | :--- |
| `/say` 或 `/say 80` | 切换至 **80% 标准模式**（默认） |
| `/say 60` 或 `/say lite` | 切换至 **60% 轻量模式** |
| `/say 100` 或 `/say strict` | 切换至 **100% 严苛模式** |
| `/say off`（或输入 `关闭ste`） | 关闭受控语言模式，恢复普通输出 |
| `/say status` | 查看当前会话激活的 STE100 档位 |
| `/say default <60|80|100|off>` | 修改全局默认启动档位（持久化保存） |
| `/say-check [文本]` | 对指定文本或上一条回复执行量化 STE100 合规打分并重写至 >=80% |

---

## 三、目录结构

```text
say/
├── .claude-plugin/
│   ├── plugin.json           # Claude Code 插件清单
│   └── marketplace.json      # 本地插件市场描述文件
├── hooks/
│   ├── claude-hooks.json     # SessionStart / SubagentStart / UserPromptSubmit 钩子配置
│   ├── say-activate.js       # 会话启动激活钩子
│   ├── say-subagent.js       # 子 Agent 规则继承钩子
│   ├── say-mode-tracker.js   # 命令解析与每轮提示强化钩子
│   ├── say-instructions.js   # 60% / 80% / 100% 中英双语规则生成器
│   ├── say-config.js         # 配置优先级解析 (环境变量 > 仓库 .ste100.json > 用户配置 > 80%)
│   ├── say-runtime.js        # 会话状态读写与输出封装
│   ├── say-statusline.ps1    # Windows 状态栏徽标脚本 [SAY:80%]
│   └── say-statusline.sh     # POSIX 状态栏徽标脚本
├── skills/
│   ├── say/SKILL.md          # 核心受控语言技能定义
│   └── say-check/SKILL.md    # 合规审计与重写技能定义
├── commands/
│   ├── say.md / say.toml     # /say 斜杠命令定义
│   └── say-check.md / .toml  # /say-check 斜杠命令定义
├── scripts/
│   └── say-linter.js         # CLI 量化评分器 (node scripts/say-linter.js --text "...")
└── tests/
    └── test-plugin.js        # 自动化测试套件 (npm test)
```

---

## 四、按需安装方式

从 GitHub 仓库注册（推荐）：

```bash
claude plugin marketplace add tianxingjian2406/say
claude plugin install say@say
```

从本地克隆目录注册（将 `<repo>` 替换为本仓库的绝对路径）：

```bash
claude plugin marketplace add "<repo>"
claude plugin install say@say
```

或在启动单次会话时直接加载：

```bash
claude --plugin-dir "<repo>"
```