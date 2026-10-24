# Contributing

Thanks for improving say. This file covers the dev loop and the commit convention.

## Dev loop

You need Node.js 14 or newer.

1. Clone the repo and run the test suite:

```bash
npm test            # 11 suites
npm run check:readme
```

2. Make your change in the source files: `hooks/`, `skills/`, `commands/`, `scripts/`.
3. If you changed the rules (`hooks/say-instructions.js`), the skills, or the commands, regenerate the harness bundles:

```bash
npm run embed
```

Commit the source change and the regenerated bundles together.
4. Keep `README.md` and `README.zh-CN.md` in sync. The checker fails on a broken link or a version mismatch.
5. Run `npm test` again. Both commands must pass before you commit.

## Commit convention

Every commit message follows this format:

```
<type>(<scope>): <subject>

<body>
```

### Type

| Type | Use for |
| --- | --- |
| `feat` | new feature |
| `fix` | bug fix |
| `docs` | documentation only |
| `refactor` | code change with no behavior change |
| `test` | add or change tests |
| `chore` | tooling, dependencies, generated bundles |

### Scope

The scope names the module you touched: `hooks`, `installer`, `skills`, `commands`, `linter`, `readme`, `tests`. One commit touches one scope. Split a change that spans scopes.

### Subject

- English: imperative mood, 50 characters or fewer, no trailing period. Example: `add reply gate`, not `added reply gate`.
- Chinese: 25 characters or fewer.
- State the change, not the task.

### Body

- Explain what changed and why. Wrap at 72 characters.
- Skip the body when the subject says it all.

### Rules

1. One commit carries one logical change.
2. `npm test` and `npm run check:readme` pass before every commit.
3. Never mix source edits and unrelated reformatting in one commit.
4. Never push secrets or tokens.

### Examples

```
feat(hooks): add reply gate Stop hook
fix(installer): keep user lines when updating the rule block
docs(readme): split install into automatic and manual
chore(embed): regenerate harness bundles for 1.3.0
```

## Pull requests

1. Fork the repo and branch from `main`: `feat/<short-name>` or `fix/<short-name>`.
2. Commit with the convention above.
3. Open the PR. Describe the change and paste the test output.

## License

By contributing, you agree that your contributions ship under the MIT License.
