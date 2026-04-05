# Integration Guide

## Fast path

```bash
npx continuous-improvement install
```

If auto-detect does not hit the right target:

```bash
npx continuous-improvement install --claude
npx continuous-improvement install --codex
npx continuous-improvement install --cursor
npx continuous-improvement install --openclaw
npx continuous-improvement install --chatgpt
```

## Targets

### Claude Code

Project-level:

```bash
npx continuous-improvement install --claude
```

Global:

```bash
npx continuous-improvement install --claude --global
```

This appends the continuous-improvement rules to `CLAUDE.md`.

### Codex / AGENTS.md flows

```bash
npx continuous-improvement install --codex
```

This appends the rules to `AGENTS.md` in the current project.

### Cursor

```bash
npx continuous-improvement install --cursor
```

This appends the rules to `.cursorrules`.

### OpenClaw skill

```bash
npx continuous-improvement install --openclaw
```

This installs:

```text
~/.openclaw/skills/continuous-improvement/SKILL.md
```

### ChatGPT

```bash
npx continuous-improvement install --chatgpt
```

This prints the exact text to paste into ChatGPT Custom Instructions.

## Uninstall

```bash
npx continuous-improvement uninstall --claude
npx continuous-improvement uninstall --codex
npx continuous-improvement uninstall --cursor
npx continuous-improvement uninstall --openclaw
```

## Manual fallback

Use these files directly if you do not want the installer:

- `prompts/coding-agent.md`
- `prompts/core.md`
- `prompts/minimal.md`
- `skills/continuous-improvement/SKILL.md`

## How to verify it worked

Give the agent a task like:

> Add a caching layer to the API.

If continuous-improvement is working, the agent should:

1. research first
2. define scope and anti-scope
3. state verification steps
4. execute one thing at a time
5. reflect after the task

If it skips straight to coding and declares victory without checks, it is not installed correctly.
