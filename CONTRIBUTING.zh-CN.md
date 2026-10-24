# 参与贡献

感谢你改进 say。本文件说明开发流程和提交规范。

## 开发流程

需要 Node.js 14 或更高版本。

1. 克隆仓库，跑测试：

```bash
npm test            # 11 组测试
npm run check:readme
```

2. 在源文件里改：`hooks/`、`skills/`、`commands/`、`scripts/`。
3. 如果你改了规则（`hooks/say-instructions.js`）、技能或命令，重新生成各智能体捆绑目录：

```bash
npm run embed
```

源码修改和再生成的捆绑目录放进同一个提交。
4. 保持 `README.md` 和 `README.zh-CN.md` 同步。链接失效或版本号不匹配时，检查器会报错。
5. 再跑一次 `npm test`。两条命令都通过后才能提交。

## 提交规范

每条提交信息按此格式：

```
<type>(<scope>): <subject>

<body>
```

### type

| type | 用途 |
| --- | --- |
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 仅文档 |
| `refactor` | 不改行为的代码调整 |
| `test` | 新增或修改测试 |
| `chore` | 工具、依赖、生成的捆绑目录 |

### scope

scope 写你改的模块：`hooks`、`installer`、`skills`、`commands`、`linter`、`readme`、`tests`。一个提交只碰一个 scope。跨 scope 的改动拆开提交。

### subject

- 英文：祈使语气，50 字符以内，结尾不加句号。写 `add reply gate`，不写 `added reply gate`。
- 中文：25 字以内。
- 写改动本身，不写任务名。

### body

- 说明改了什么、为什么。72 字符换行。
- subject 已经说清时，省略 body。

### 规则

1. 一个提交只含一个逻辑改动。
2. 每次提交前 `npm test` 和 `npm run check:readme` 必须通过。
3. 源码修改和无关注释格式调整不放同一个提交。
4. 密钥和 token 禁止进提交。

### 示例

```
feat(hooks): add reply gate Stop hook
fix(installer): keep user lines when updating the rule block
docs(readme): split install into automatic and manual
chore(embed): regenerate harness bundles for 1.3.0
```

## Pull Request

1. Fork 仓库，从 `main` 拉分支：`feat/<短名>` 或 `fix/<短名>`。
2. 按上述规范提交。
3. 发起 PR。写明改动内容，贴上测试输出。

## 许可证

提交贡献即表示你同意该贡献按 MIT 许可证发布。
