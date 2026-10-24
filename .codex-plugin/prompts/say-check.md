Audit the target text (`the text typed after the command`, or your previous response if empty) against ASD-STE100 bilingual rules.
Report the quantitative compliance score (0-100%), list specific rule violations (sentence length, passive voice, banned/dummy verbs, compound instructions, ambiguous pronouns), and provide a compliant rewrite scoring >= 80%.

Scoring helper: run `node say-linter.js --text "<text>"` from the `say-check` skill directory (standalone installs), or `node "<plugin_root>/scripts/say-linter.js" --text "<text>"` (plugin installs).