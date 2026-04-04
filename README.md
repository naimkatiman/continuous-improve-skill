# continuous-improve

> A structured self-improvement loop for AI agents — research, plan, execute, verify, reflect, iterate.

## What It Does

Installs a 5-phase discipline into any AI agent so it stops skipping steps, stops reporting "done" without verifying, and stops accumulating technical debt from unplanned execution.

Inspired by [Superpowers](https://github.com/obra/superpowers) — built for OpenClaw agents.

---

## When to Use

Trigger phrases:
- "use the continuous-improve framework"
- "follow the improvement loop"
- Any non-trivial coding, building, or debugging task

The agent should announce: *"I'm using the continuous-improve framework for this task."*

---

## The Five Phases

| Phase | Key Question | Gate |
|-------|-------------|------|
| **1. Research** | What exists? What breaks? Simplest path? | Answer all four questions |
| **2. Plan** | What will I build, verify, fall back to? | Written plan with exact verification |
| **3. Execute** | One task at a time | Task complete, nothing out of scope |
| **4. Verify** | Did actual output match expected? | Verification command ran and passed |
| **5. Reflect** | What did I learn? | Reflection written to learning-log |

Each phase has an explicit **gate** — you cannot proceed until the gate is met.

---

## The Iron Law

```
NO EXECUTION WITHOUT RESEARCH AND PLAN FIRST
NO REPORTING DONE WITHOUT VERIFICATION
NO NEXT TASK WHILE CURRENT TASK IS INCOMPLETE
```

---

## Installation

### OpenClaw
```bash
# Copy SKILL.md into your skills directory
mkdir -p ~/.openclaw/skills/continuous-improve
curl -o ~/.openclaw/skills/continuous-improve/SKILL.md \
  https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/SKILL.md
```

### Claude Code
```
/plugin install continuous-improve@naimkatiman
```

### Codex / OpenCode
Tell your agent:
```
Fetch and follow instructions from https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/SKILL.md
```

---

## Files

```
continuous-improve-skill/
├── SKILL.md                    # The skill — all phases, gates, red flags
├── README.md                   # This file
└── .cloudplugin/
    └── marketplace.json        # Plugin marketplace metadata
```

---

## Why This Exists

Most AI agents are good at individual steps but terrible at discipline. They skip research, plan loosely, execute in parallel, declare done without verifying, and never reflect. This skill fixes that — not by adding principles, but by adding **gates** that block forward progress until each phase is actually complete.

Inspired by [Jesse Vincent's Superpowers framework](https://github.com/obra/superpowers).

---

## License

MIT
