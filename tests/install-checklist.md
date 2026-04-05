# Install Checklist

Use this checklist when testing `continuous-improvement` installs across Claude Code, Codex, Cursor, OpenClaw, and ChatGPT.

---

## Core install checks

Run:

```bash
npx continuous-improvement install
```

If needed, test explicit targets:

```bash
npx continuous-improvement install --claude
npx continuous-improvement install --codex
npx continuous-improvement install --cursor
npx continuous-improvement install --openclaw
npx continuous-improvement install --chatgpt
```

### Pass criteria

- [ ] Install command runs without crashing
- [ ] Output clearly states what was installed
- [ ] Correct target file or skill folder is created or updated
- [ ] Running install a second time does **not** duplicate content
- [ ] Uninstall removes the installed block cleanly
- [ ] Manual fallback is still obvious from the README if install fails

---

## Claude Code

Command:

```bash
npx continuous-improvement install --claude
```

### Pass criteria

- [ ] `CLAUDE.md` is created or updated
- [ ] The continuous-improvement rules appear once only
- [ ] `npx continuous-improvement uninstall --claude` removes the block cleanly

---

## Codex / AGENTS.md

Command:

```bash
npx continuous-improvement install --codex
```

### Pass criteria

- [ ] `AGENTS.md` is created or updated
- [ ] The continuous-improvement rules appear once only
- [ ] `npx continuous-improvement uninstall --codex` removes the block cleanly

---

## Cursor

Command:

```bash
npx continuous-improvement install --cursor
```

### Pass criteria

- [ ] `.cursorrules` is created or updated
- [ ] The continuous-improvement rules appear once only
- [ ] `npx continuous-improvement uninstall --cursor` removes the block cleanly

---

## OpenClaw

Command:

```bash
npx continuous-improvement install --openclaw
```

### Pass criteria

- [ ] `~/.openclaw/skills/continuous-improvement/SKILL.md` exists after install
- [ ] The installed skill matches the repo skill
- [ ] `npx continuous-improvement uninstall --openclaw` removes the installed skill cleanly

---

## ChatGPT

Command:

```bash
npx continuous-improvement install --chatgpt
```

### Pass criteria

- [ ] Installer prints a clean block to paste into Custom Instructions
- [ ] Output is not wrapped in extra junk or confusing formatting
- [ ] The block is short enough to be practical

---

## Failure reporting format

When install fails, report using this exact format:

```markdown
## Install Test Report
- Tool:
- OS:
- Command run:
- Expected result:
- Actual result:
- Error output:
- Did retrying change anything?
- Suggested fix:
```
