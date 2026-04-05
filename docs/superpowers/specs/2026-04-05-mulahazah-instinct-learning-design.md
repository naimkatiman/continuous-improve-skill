# Mulahazah: Instinct-Based Learning for continuous-improve

**Date:** 2026-04-05
**Status:** Design approved, pending implementation
**Author:** Naim Katiman

---

## Summary

Upgrade continuous-improve from a static 7-law framework to a learning system. Hooks silently observe every session. When enough data accumulates, the system auto-promotes itself from passive capture to active suggestions to auto-applied behaviors — no user action required.

Codename: **Mulahazah** (Arabic: observation). Self-contained, no external dependencies.

---

## Design Principles

1. **Zero config to start** — `npx continuous-improvement install --claude` and you're done
2. **Auto-level** — the system promotes itself as data accumulates, user never touches a config
3. **One command to inspect** — `/continuous-improve` shows everything
4. **No daemons for v1** — analysis runs inline when Claude loads the skill, not in a background process
5. **Instincts are the only learning unit** — small, atomic, confidence-scored YAML files

---

## Auto-Leveling

The system determines its own level from observation count and instinct maturity. No user action needed.

```
Level 0: CAPTURE (install → first 20 observations)
  Hooks silently record tool calls to JSONL
  No behavior change — agent works normally
  User sees nothing different

Level 1: ANALYZE (20+ observations accumulated)
  Next session: skill prompt tells Claude to run analysis inline
  Claude reads observations, creates first instincts (confidence 0.3-0.5)
  Instincts stored but silent — user still sees nothing different
  Analysis clears the observation backlog

Level 2: SUGGEST (any instinct crosses 0.5 confidence)
  Claude mentions relevant instincts inline: "Consider: [action]"
  User confirms → +0.15 confidence
  User corrects → -0.1 confidence
  This is where the user first notices the system is learning

Level 3: AUTO-APPLY (any instinct crosses 0.7 confidence)
  Claude applies the behavior automatically
  User correction still drops confidence by 0.1
  "It just knows how I work now"
```

**How leveling works in practice:**

The skill prompt (SKILL.md) contains the logic. When Claude loads the skill at session start:
1. Check `~/.claude/instincts/<project>/observations.jsonl` line count
2. If 20+ unprocessed lines → run inline analysis (create/update instincts)
3. Load all instincts for the project + global
4. Apply based on confidence thresholds

No daemon. No cron. No PID files. Claude does the analysis as part of session startup.

---

## Architecture

```
+------------------------------------------+
|          Claude Code Session              |
|                                           |
|  7 Laws govern behavior                   |
|  Instincts loaded at session start        |
|  Applied by confidence threshold          |
+---------+--------------------------------+
          |
          v
+------------------------------------------+
|    observe.sh (PreToolUse/PostToolUse)    |
|                                           |
|  - Detect project (git root → hash)       |
|  - Append 1 JSONL line (<50ms)            |
|  - Pure bash, jq optional                 |
+------------------------------------------+
          |
          v
+------------------------------------------+
|          ~/.claude/instincts/             |
|                                           |
|  +-- global/                              |
|  |   +-- *.yaml          (global)         |
|  +-- <project-hash>/                      |
|      +-- observations.jsonl               |
|      +-- project.json    (metadata)       |
|      +-- *.yaml          (project)        |
+------------------------------------------+
```

Two things feed the instinct store:
1. **Inline analysis** (automatic at session start when 20+ observations pending)
2. **Law 5 reflection** ("Rule to add" → instinct at 0.6 confidence)

One command to inspect: `/continuous-improve`

---

## The Instinct Model

Each instinct is a single YAML file:

```yaml
id: prefer-grep-before-edit
trigger: "when modifying code"
confidence: 0.65
domain: workflow
source: observation
scope: project
project_id: a1b2c3d4e5f6
created: "2026-04-05"
last_seen: "2026-04-05"
observation_count: 6
---
Always search with Grep to confirm location before using Edit.

Evidence:
- Observed 6 times across 3 sessions
- User corrected blind edit on 2026-04-03
```

### Confidence Thresholds

| Range | Behavior |
|-------|----------|
| 0.0–0.49 | **Silent** — stored, not surfaced |
| 0.5–0.69 | **Suggest** — mentioned inline when relevant |
| 0.7–0.9 | **Auto-apply** — applied automatically |

### Confidence Changes

| Event | Change |
|-------|--------|
| New instinct from observations (3-5 obs) | Start at 0.4 |
| New instinct from observations (6-10 obs) | Start at 0.55 |
| New instinct from observations (11+ obs) | Start at 0.7 |
| New instinct from Law 5 reflection | Start at 0.6 |
| Confirming observation | +0.05 |
| User explicitly accepts suggestion | +0.15 |
| User corrects/rejects | -0.1 |
| Reflection matches existing instinct | +0.2 |
| No observation for 30 days | -0.05 decay |

**Cap: 0.9 max.** No instinct exceeds 0.9 without explicit user promotion.

### Scope

| Default | When to go global |
|---------|-------------------|
| **project** (always) | Same pattern confirmed in 2+ projects |

Security practices and tool workflow preferences start global. Everything else starts project-scoped.

---

## Hook: observe.sh

Must complete in <50ms. Always exits 0. Never blocks the session.

```
1. Read hook JSON from stdin
2. Detect project:
   - $CLAUDE_PROJECT_DIR (highest priority)
   - git rev-parse --show-toplevel → SHA-256 first 12 chars
   - fallback: "global"
3. Append one JSONL line to ~/.claude/instincts/<hash>/observations.jsonl:
   {"ts","event","session","tool","input_summary","project_id","project_name"}
4. Exit 0
```

**Rules:**
- Append only — no analysis in the hook
- Truncate input to 500 chars, output to 200 chars
- Never log file contents or secrets
- Auto-create project directory on first observation
- Rotate observations.jsonl at 10,000 lines → `observations.YYYY-MM-DD.jsonl`
- jq optional: use it if available for speed, fall back to printf/sed if not

---

## Inline Analysis (replaces background daemon)

When Claude loads the skill at session start and finds 20+ unprocessed observations:

1. Read `observations.jsonl` (last 500 lines)
2. Read existing instincts (project + global)
3. Detect patterns:
   - **User corrections** → "don't do X" instincts
   - **Error→fix sequences** → "when X fails, try Y" instincts
   - **Repeated workflows** (3+ times) → "for X, do A→B→C" instincts
   - **Tool preferences** → "use tool Y for task X" instincts
4. Create/update instinct YAML files
5. Mark observations as processed (rename to `.processed.jsonl` or track line offset)

This runs as part of the session, not a separate process. Uses the same model that's running the session — no separate Haiku call needed.

**Conservative rules:**
- Only create instincts for 3+ observations of the same pattern
- Merge similar — update existing rather than duplicate
- Default to project scope
- No raw code in instincts, only patterns
- Never contradict existing instincts without strong counter-evidence

---

## Law 5 → Law 7 Bridge

Law 5 still produces the reflection block. The "Rule to add" field feeds Law 7:

```
## Reflection
- What worked: In-memory cache was simpler than Redis
- What failed: nothing
- What I'd do differently: nothing
- Rule to add: For single-server, start with in-memory cache
```

The "Rule to add" becomes an instinct at 0.6 confidence. If a matching instinct already exists from observation, it gets a +0.2 boost.

---

## /continuous-improve Command

```
/continuous-improve              # Full: reflect + analyze + status
/continuous-improve status       # Show instincts only
/continuous-improve analyze      # Force analysis now
```

### Example output

```
=== continuous-improve ===

## Level: SUGGEST (12 instincts, 3 suggesting)

## Session Reflection (Law 5)
- What worked: TDD approach caught the auth bug early
- What failed: First caching attempt hit rate limit
- Rule to add: Check rate limits before setting intervals

## Learning (Law 7)
  NEW  check-rate-limits     workflow   0.60  (from reflection)
   ↑   grep-before-edit      workflow   0.65→0.70  (+3 observations)
   ↑   use-react-hooks       code-style 0.60→0.65  (+2 observations)

## Instincts — my-app (a1b2c3d4e5f6)
  ● [0.85] prefer-functional-style   code-style   auto-apply
  ● [0.70] grep-before-edit          workflow     auto-apply
  ◐ [0.65] use-react-hooks           code-style   suggest
  ◐ [0.60] check-rate-limits         workflow     suggest
  ○ [0.35] prefer-barrel-exports     architecture silent

## Instincts — global
  ● [0.90] validate-user-input       security     auto-apply
  ○ [0.45] conventional-commits      git          silent
```

---

## File Structure

### What ships in the package

```
continuous-improve/
├── skills/continuous-improvement/SKILL.md   # 7 Laws + instinct behavior
├── hooks/observe.sh                         # PreToolUse/PostToolUse hook
├── scripts/install.js                       # npx continuous-improvement install
├── config.json                              # Default settings
├── package.json
└── README.md
```

### Runtime directory

```
~/.claude/instincts/
├── global/                    # Global instincts (*.yaml)
└── <project-hash>/
    ├── project.json           # {id, name, root, created_at}
    ├── observations.jsonl     # Raw events (append-only)
    └── *.yaml                 # Project instincts
```

That's it. One directory, flat structure.

### Install flow

```bash
npx continuous-improvement install --claude
```

1. Append 7 Laws to CLAUDE.md
2. Copy observe.sh → `~/.claude/instincts/observe.sh`
3. Patch `~/.claude/settings.json` with PreToolUse/PostToolUse hooks
4. Create `~/.claude/instincts/` directory
5. Print: "Installed. Hooks are capturing. System auto-levels as you use it."

No daemon to start. No config to edit. No "run this after your session."

---

## Future (not v1)

| Feature | Version |
|---------|---------|
| Background Haiku observer (opt-in daemon) | v1.1 |
| `/promote` — project→global instinct promotion | v1.1 |
| `/evolve` — cluster instincts into skills | v1.2 |
| Export/import instinct libraries | v1.2 |
| Cross-project instinct inheritance | v2.0 |
| IDE panel showing active instincts | v2.0 |

---

## Out of Scope (v1)

- Background daemon (analysis is inline)
- MemoryCore integration (separate effort)
- Multi-agent support beyond Claude Code
- Analytics dashboard
- Cross-machine sync
