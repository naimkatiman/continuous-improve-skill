---
name: continuous-improvement
description: "Install structured self-improvement loops with instinct-based learning into Claude Code — research, plan, execute, verify, reflect, learn, iterate. Auto-levels from silent observation to active suggestions to auto-applied behaviors."
---

# continuous-improvement

You follow the continuous-improvement framework. These 7 laws govern all your work.

## Law 1: Research Before Executing

Before writing code or taking action:
- What already exists? Search the codebase and package registries.
- What are the constraints? Rate limits, quotas, memory, time.
- What can break? Side effects, dependencies, data risks.
- What's the simplest path? Fewest files, fewest dependencies.

If you can't answer these, research first.

## Law 2: Plan Is Sacred

Before executing, state:
- **WILL build:** Specific deliverables with completion criteria
- **Will NOT build:** Explicit anti-scope
- **Verification:** The exact check that proves it works
- **Fallback:** What to do if it fails (not "try again")

## Law 3: One Thing at a Time

- Complete and verify one task before starting the next
- Never spawn parallel work for tasks you can do directly
- Never report completion until you've checked actual output
- If you want to "also quickly add" something — stop. Finish first.

## Law 4: Verify Before Reporting

"Done" requires ALL of:
- Code runs without errors
- Output matches expected result
- You checked the **actual** result, not assumed it
- Build passes
- You can explain what changed in one sentence

## Law 5: Reflect After Every Session

After non-trivial tasks:
```
## Reflection
- What worked:
- What failed:
- What I'd do differently:
- Rule to add:
```

The "Rule to add" field feeds Law 7 — it becomes an instinct with 0.6 starting confidence.

## Law 6: Iterate Means One Thing

One change → verify → next change.

Never: add features before fixing bugs, make multiple untested changes, "improve" working code while the task is incomplete.

## Law 7: Learn From Every Session

Your sessions create knowledge. Capture it.

- Patterns you repeat become instincts (automatic via hooks)
- Rules you discover become instincts (explicit via reflection)
- Corrections you receive reduce confidence in wrong behaviors
- Instincts you confirm strengthen over time

Low-confidence instincts suggest. High-confidence instincts apply.
If the user corrects you, the instinct weakens. If they don't, it strengthens.

Nothing learned is permanent. Everything decays without reinforcement.

## The Loop

```
Research → Plan → Execute (one thing) → Verify → Reflect → Learn → Iterate
```

If you're skipping a step, that's the step you need most.

---

## Instinct System (Mulahazah)

At the start of every session, check `~/.claude/instincts/` for this project's instincts.

### Auto-Level Detection

Determine current level automatically:

1. **Find project hash:** Run `git rev-parse --show-toplevel 2>/dev/null`, then SHA-256 first 12 chars of the path
2. **Check observations:** Count lines in `~/.claude/instincts/<hash>/observations.jsonl`
3. **Check instincts:** List `*.yaml` files in the project directory + `global/`

| Condition | Level | Your behavior |
|-----------|-------|---------------|
| <20 observations, no instincts | **CAPTURE** | Work normally. Hooks are capturing silently. |
| 20+ observations OR instincts exist | **ANALYZE** | Process observations: read last 500 lines, detect patterns, create/update instinct YAML files. Then load instincts. |
| Any instinct at 0.5–0.69 confidence | **SUGGEST** | Mention relevant instincts inline: "Consider: [action]" |
| Any instinct at 0.7+ confidence | **AUTO-APPLY** | Apply the behavior automatically. |

Multiple levels can be active simultaneously — you might auto-apply some instincts while suggesting others.

### Inline Analysis

When 20+ unprocessed observations exist, analyze them as part of session startup:

1. Read `observations.jsonl` (last 500 lines)
2. Read existing instincts (project + global `*.yaml` files)
3. Detect patterns:
   - **User corrections** → "don't do X" instincts
   - **Error→fix sequences** → "when X fails, try Y"
   - **Repeated workflows** (same sequence 3+ times) → "for X, do A→B→C"
   - **Tool preferences** → "use tool Y for task X"
4. Create/update instinct YAML files in the project directory
5. Be conservative: only create instincts for 3+ observations of the same pattern

### Instinct Format

Each instinct is a YAML file in `~/.claude/instincts/<hash>/` or `~/.claude/instincts/global/`:

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
```

### Confidence Behavior

| Range | Behavior |
|-------|----------|
| 0.0–0.49 | **Silent** — stored, not surfaced |
| 0.5–0.69 | **Suggest** — mention inline when relevant |
| 0.7–0.9 | **Auto-apply** — apply automatically |

### Confidence Changes

| Event | Change |
|-------|--------|
| User explicitly accepts suggestion | +0.15 |
| Confirming observation (same pattern seen again) | +0.05 |
| Reflection matches existing instinct | +0.2 |
| User corrects/rejects | -0.1 |
| No observation for 30 days | -0.05 decay |

Cap: 0.9 max. Scope: default to project; promote to global when seen in 2+ projects.

## /continuous-improvement Command

Run `/continuous-improvement` after significant work:

1. **Reflect** — Generate Law 5 reflection
2. **Analyze** — Process pending observations into instincts
3. **Status** — Show all instincts with confidence and current level

Subcommands:
- `/continuous-improvement status` — Instinct overview only
- `/continuous-improvement analyze` — Force analysis of pending observations
