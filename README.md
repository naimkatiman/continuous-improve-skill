# continuous-improve

> Your AI agent that learns from every session — not just follows rules, but builds instincts.

[![Version](https://img.shields.io/badge/version-2.0.0-blue)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Inspired by](https://img.shields.io/badge/inspired_by-Superpowers-purple)](https://github.com/obra/superpowers)

---

## The Problem

AI agents are great at individual steps. They're terrible at discipline — and they never improve.

They skip research. They plan loosely. They declare "done" before verifying. They add features mid-task. They never reflect. Each session, they repeat the same mistakes as the last.

This skill fixes that in two layers:

1. **7 Laws** — gates that block forward progress until each phase is complete
2. **Mulahazah** — instinct-based learning that observes every session and builds behavioral memory with confidence scoring

---

## What's New in v2.0: Mulahazah

Mulahazah (Arabic: _observation_) is an instinct-learning system that runs alongside Claude Code, watching every tool call and building behavioral memory automatically.

### How it works

- **Hooks observe every tool call** via PreToolUse/PostToolUse — 100% reliable, <50ms overhead
- **Background Haiku observer** reads observation logs and distills patterns into instincts (optional, cost-efficient)
- **Atomic instincts** are YAML files with confidence scores (0.3–0.9) and natural decay
- **Graduated behavior** based on confidence:
  - 0.3–0.5 (silent): stored but not surfaced — learning in progress
  - 0.5–0.7 (suggest): mentioned inline when relevant
  - 0.7+ (auto-apply): behavior applied automatically unless you correct it
- **Project-scoped learning** — instincts stay in their project context, no cross-contamination
- **Confidence decay** — instincts weaken without reinforcement; corrections reduce them
- **One master command:** `/continuous-improve` — status, analyze, reflect, projects

---

## Install

### Option 1: npx (recommended)

Auto-detects your AI tools and installs to all of them. For Claude Code, also sets up Mulahazah:

```bash
npx continuous-improve-skill
```

Install to a specific target:

```bash
npx continuous-improve-skill --target claude    # Claude Code + full Mulahazah setup
npx continuous-improve-skill --target openclaw  # OpenClaw only (SKILL.md)
npx continuous-improve-skill --target cursor    # Cursor only (SKILL.md)
npx continuous-improve-skill --target all       # All targets
```

Uninstall:

```bash
npx continuous-improve-skill --uninstall
```

### Option 2: One-line shell script

Installs SKILL.md only. For full Mulahazah support, use `npx continuous-improve-skill --target claude`:

```bash
curl -fsSL https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/install.sh | bash
```

### Option 3: Manual

```bash
mkdir -p ~/.claude/skills/continuous-improve && \
curl -fsSL -o ~/.claude/skills/continuous-improve/SKILL.md \
  https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/SKILL.md
```

Replace `~/.claude` with `~/.openclaw`, `~/.cursor`, or `~/.codex` for other tools.

### Option 4: Tell your agent

```
Fetch and follow the skill at: https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/SKILL.md
```

---

## Your First Task (Do This Now)

After installing, give your agent this prompt:

```
Use the continuous-improve framework to [describe your task].
```

Your agent should respond with:
> *"I'm using the continuous-improve framework for this task."*

Then watch it research before planning, plan before executing, and verify before reporting done. After the task, run:

```
/continuous-improve
```

---

## How It Works

Seven laws. Each has a gate. You can't proceed without passing it.

```
Research → Plan → Execute → Verify → Reflect → Learn → Iterate
```

| Law | What happens | Gate |
|-----|-------------|------|
| **1. Research** | Agent checks what exists, constraints, risks, simplest path | Must answer 4 questions |
| **2. Plan** | Explicit plan: scope, anti-scope, verification, fallback | Written plan required |
| **3. Execute** | One task at a time. No scope creep. No parallel work. | Task complete, in-scope only |
| **4. Verify** | Agent runs the actual verification command. No assumptions. | Command ran. Output matched. |
| **5. Reflect** | What worked, what failed, what to do differently, rule to add | Reflection written |
| **6. Iterate** | One change → verify → next change. Never skip ahead. | Each change verified before next |
| **7. Learn** | Patterns → instincts. Corrections → weaker instincts. Repetition → stronger. | Automatic via hooks |

### The Iron Law

```
NO EXECUTION WITHOUT RESEARCH AND PLAN FIRST
NO REPORTING DONE WITHOUT VERIFICATION
NO NEXT TASK WHILE CURRENT TASK IS INCOMPLETE
```

---

## What a Good Run Looks Like

```
You: Use continuous-improve to add rate limiting to the API.

Agent: I'm using the continuous-improve framework for this task.

[Law 1 - Research]
- Checked: middleware/auth.js exists, no rate limiting present
- Constraint: Redis not available — must use in-memory or express-rate-limit
- Risk: Shared state won't work across multiple workers
- Simplest path: express-rate-limit package, single-file middleware

[Law 2 - Plan]
WILL build: rate-limit middleware in middleware/rateLimit.js, applied in app.js
Will NOT build: Redis adapter, per-user limits, admin override
Verification: curl -X POST /api/login 6 times rapidly, expect 429 on 6th
Fallback: manual token bucket if express-rate-limit has issues

[Law 3 - Execute]
Installing express-rate-limit... done
Writing middleware/rateLimit.js... done
Applying in app.js... done

[Law 4 - Verify]
Running: curl loop against /api/login × 6
Result: requests 1-5 → 200, request 6 → 429 ✓

[Law 5 - Reflect]
- What worked: express-rate-limit drop-in, no config needed
- What failed: initially applied to all routes, not just /api
- What I'd do differently: scope middleware more precisely from the start
- Rule to add: always scope rate limiting to specific route prefixes
(Rule saved as instinct with 0.6 confidence)

[Law 6 - Iterate]
One change verified. Task complete. Ready for next.

[Law 7 - Learn]
Instinct updated: "scope rate-limiting middleware to route prefix, not global app"
```

---

## /continuous-improve Command

Run after any significant task:

```
/continuous-improve          # full: reflect + analyze + status
/continuous-improve status   # instinct overview only
/continuous-improve projects # list all known projects
/continuous-improve analyze  # force analysis of pending observations
/continuous-improve reflect  # trigger Law 5 reflection manually
```

---

## Red Flags (Shortcuts the Skill Blocks)

If your agent says any of these — it's skipping the process:

- "I'll research after I start"
- "Just try this and see if it works"
- "It's probably X, let me fix that real quick"
- "While I'm here, I'll also improve..."
- "One more quick fix" *(after 2+ failed attempts)*
- "Done!" *(without running any verification)*

These aren't signs of speed — they're signs of future rework.

---

## Files

```
continuous-improve-skill/
├── SKILL.md              # The skill — load this into your agent
├── QUICKSTART.md         # Step-by-step first-use guide
├── CHANGELOG.md          # What changed between versions
├── README.md             # This file
├── package.json          # npm package for `npx continuous-improve-skill`
├── install.sh            # One-line shell installer (SKILL.md only)
├── config.json           # Observer configuration defaults
├── bin/
│   └── install.mjs       # Node.js CLI installer (with Mulahazah setup)
├── hooks/
│   └── observe.sh        # PreToolUse/PostToolUse observation hook (<50ms)
├── agents/
│   ├── observer.md       # Background observer agent prompt
│   ├── observer-loop.sh  # Periodic analysis runner
│   └── start-observer.sh # Observer launcher with PID management
└── .cloudplugin/
    └── marketplace.json  # Plugin marketplace metadata
```

---

## Contributing

Found a gap? Skill doesn't hold up under pressure? Open an issue or PR.

The best improvements come from real failure cases — describe what the agent did wrong and what rule would have caught it.

---

## Inspired By

[Superpowers by Jesse Vincent](https://github.com/obra/superpowers) — the best agentic skills framework out there. This skill applies the same gate-based philosophy to continuous improvement loops, extended with instinct-based learning.

---

## License

MIT
