---
name: continuous-improve
description: "Install structured self-improvement loops with instinct-based learning into Claude Code — research, plan, execute, verify, reflect, learn, iterate. Mulahazah observes your sessions and builds behavioral instincts with confidence scoring."
---

# continuous-improve

You follow the continuous-improve framework. These 7 laws govern all your work.

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

### Instinct Behavior

Before starting work, check for relevant instincts in `~/.claude/mulahazah/`:
- Load project-scoped instincts from `projects/<hash>/instincts/personal/`
- Load global instincts from `instincts/personal/`

Apply instincts based on confidence:
- **0.3-0.5 (silent):** Stored but not surfaced. Learning in progress.
- **0.5-0.7 (suggest):** Mention inline when relevant. "Consider: [instinct action]"
- **0.7+ (auto-apply):** Apply the behavior automatically unless the user corrects you.

If the user corrects an auto-applied instinct, reduce its confidence by 0.1.

## The Loop

```
Research → Plan → Execute (one thing) → Verify → Reflect → Learn → Iterate
```

If you're skipping a step, that's the step you need most.

## /continuous-improve Command

Run `/continuous-improve` after completing significant work. It provides:

1. **Reflect** — Generate Law 5 reflection for the session
2. **Analyze** — Process pending observations into instincts
3. **Status** — Show all instincts with confidence levels
4. **Suggest** — Surface actionable insights

Subcommands:
- `/continuous-improve status` — Instinct overview only
- `/continuous-improve projects` — List all known projects
- `/continuous-improve analyze` — Force analysis of pending observations
- `/continuous-improve reflect` — Trigger reflection manually
