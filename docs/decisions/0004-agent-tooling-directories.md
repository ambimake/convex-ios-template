# 0004 — Agent tooling directories

Status: Accepted (template default)

## Context

Coding agents work better with checked-in, reviewable local instructions than
with per-developer local config. This repo keeps agent workflow skills and
agent/subagent configuration in the repository so every agent (and every
Conductor worktree) shares the same bundle, and changes are reviewed alongside
the code they depend on.

## Decision

Allow top-level agent-tooling directories, each limited to development-agent
tooling — never product logic, runtime config, or deployed app code:

- `.agents/skills/` — harness-neutral workflow skills (Markdown `SKILL.md`).
- `.agents/learnings/` or `docs/learnings/` — reusable lessons (this template
  uses `docs/learnings/`).
- `.codex/agents/` and `.claude/agents/` — harness-specific subagent config
  (Codex reads TOML, Claude Code reads Markdown+frontmatter, so the config files
  themselves cannot be shared — but the workflow prose in `.agents/skills/`
  stays harness-neutral so either harness can slot in).

## Consequences

- Agent behavior is reviewed and versioned with repo rules.
- These directories are tooling only; durable product decisions belong in
  decision records and product-context docs, not in skills or agent config.
- Adding a new harness's config home is a documentation change, not a rewrite of
  the workflow skills.
