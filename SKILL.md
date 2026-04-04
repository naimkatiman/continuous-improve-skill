---
name: continuous-improve
description: Install structured self-improvement loops into any AI agent — research, plan, execute, verify, reflect, iterate
---

# Continuous Improve

## Overview

Skipping steps doesn't save time — it creates rework. The loop below is non-negotiable.

**Core principle:** Every non-trivial task follows the same 5-phase process. No shortcuts. No "just this once."

**Announce at start:** "I'm using the continuous-improve framework for this task."

---

## The Iron Law

```
NO EXECUTION WITHOUT RESEARCH AND PLAN FIRST
NO REPORTING DONE WITHOUT VERIFICATION
NO NEXT TASK WHILE CURRENT TASK IS INCOMPLETE
```

Violating any of these is not a shortcut — it's a guarantee of rework.

---

## When to Use

Use for ANY non-trivial task:
- Building or modifying code
- Spawning subagents for a project
- Making config or infrastructure changes
- Writing content with downstream dependencies
- Debugging unexpected behavior
- Any task that could affect production or other humans

**Use this ESPECIALLY when:**
- You're in a hurry (urgency makes shortcuts tempting — don't)
- The task "seems simple" (simple tasks have root causes and failure modes too)
- You've already started and hit a wall (stop, return to Phase 1)
- You're about to spawn multiple agents at once

---

## The Five Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Research

**Before writing code, spawning agents, or making changes:**

1. **What already exists?**
   - Check the codebase, workspace files, registries
   - Is there an active PM or STATE.yaml for this project?
   - Has this been built before (partially or fully)?

2. **What are the constraints?**
   - Rate limits, quotas, API limits
   - Memory, time, token budgets
   - Auth requirements, environment variables
   - Deployment targets (Railway, Vercel, local, etc.)

3. **What can break?**
   - Side effects on other features
   - Dependencies that could conflict
   - Data risks (destructive ops, prod databases)
   - External services that could fail

4. **What's the simplest path?**
   - Fewest files, fewest dependencies
   - Reuse existing patterns in the codebase
   - Don't invent what already exists

**Gate:** If you can't answer all four, keep researching. Do not proceed.

---

### Phase 2: Plan

**State your plan explicitly before executing:**

**WILL build:** Specific deliverables with completion criteria
**Will NOT build:** Explicit anti-scope (what you're intentionally skipping)
**Verification:** The exact check that proves it works (command, URL, output, test)
**Fallback:** What to do if it fails — not "try again", a real alternative

**Plan format for coding tasks:**

```markdown
## Plan: [Task Name]

**Goal:** [One sentence]
**Scope:** [Files to create/modify — exact paths]
**Anti-scope:** [What we're NOT doing]
**Verification:** Run `[exact command]`, expect `[exact output]`
**Fallback:** [Concrete alternative if this approach fails]
```

**Gate:** No plan = no execution. A vague plan is not a plan.

---

### Phase 3: Execute (One Thing at a Time)

**Execute exactly what the plan says. Nothing more.**

- Complete and verify one task before starting the next
- Never add "while I'm here" improvements mid-task
- If you want to also quickly add something — STOP. Finish first.
- If spawning subagents: provide full task text + context. Never make them guess.
- Write files before executing long commands — don't inline 50-line scripts in exec calls

**For coding tasks, every step is explicit:**
- Write the failing test → run it → confirm it fails
- Write minimal implementation → run it → confirm it passes
- Commit with a descriptive message
- Repeat

**Gate:** One task in flight at a time. No parallelism for dependent work.

---

### Phase 4: Verify

**"Done" requires ALL of:**

- [ ] Code runs without errors
- [ ] Output matches expected result (not assumed — you checked)
- [ ] You ran the exact verification command from Phase 2
- [ ] Build passes (if applicable)
- [ ] You can explain what changed in one sentence

**If verification fails:**
- Stop. Do not add more changes on top.
- Return to Phase 1 with new information.
- If you've failed verification 3+ times: the approach is wrong. Question it.

**Gate:** Never report "done" based on assumed output. Verify the actual result.

---

### Phase 5: Reflect

After every non-trivial task, write a reflection:

```markdown
## Reflection — [Task Name] — [Date]
- What worked:
- What failed or was weak:
- What I'd do differently:
- Rule to make default next time:
- Naim's preference observed (if any):
```

Save to: `memory/learning-log.md`

Periodically (weekly), promote recurring lessons into:
- Agent persona files (`agents/<name>.md`)
- This skill file
- `AGENTS.md` delegation rules

**Gate:** Skip the reflection and the lesson is lost. Write it down.

---

## The Loop

```
Research → Plan → Execute (one thing) → Verify → Reflect → Iterate
```

If you're skipping a step — that step is exactly what you need.

---

## Red Flags — STOP and Return to Phase 1

If you catch yourself thinking any of these:

- "I'll research after I start"
- "Just try this and see if it works"
- "I'll add multiple changes and run tests"
- "It's probably X, let me fix that real quick"
- "I'll verify manually, no need to run the command"
- "While I'm here, I'll also improve..."
- "One more quick fix" (after 2+ failed attempts)
- "I don't fully understand but this might work"
- About to spawn 3+ agents without a written plan

**ALL of these mean: STOP. Return to Phase 1.**

If you've tried 3+ fixes and it's still broken: the **architecture** is wrong. Don't fix again — question the approach and discuss with Naim.

---

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "This is simple, no process needed" | Simple tasks have failure modes too. Process is fast for simple work. |
| "We're in a hurry" | Systematic is faster than thrashing. Always. |
| "I'll plan while I execute" | Unplanned execution = guaranteed rework. |
| "I'll verify after the next change too" | Each unverified step compounds debt. Verify now. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = wrong approach. Stop fixing, question design. |
| "I'll reflect later" | Later never comes. Write it now. |
| "I know this codebase, don't need to research" | Assumptions are how bugs get introduced. Still check. |

---

## Subagent Execution Rules

When delegating to subagents:

1. **Provide full task text** — never make them read from a file or infer context
2. **One subagent per independent task** — no context pollution between tasks
3. **Two-stage review for important output:** spec compliance first, code quality second
4. **Handle escalations explicitly:**
   - `DONE` → proceed to verify
   - `DONE_WITH_CONCERNS` → read concerns before proceeding
   - `NEEDS_CONTEXT` → provide context, re-dispatch
   - `BLOCKED` → assess blocker, escalate to Naim if architecture is wrong
5. **Never force a stuck subagent to retry without changing the task/context**

---

## Self-Review Checklist (Before Reporting Complete)

Run this yourself — not a subagent:

1. **Scope coverage:** Does the output cover everything in the plan? List any gaps.
2. **Anti-scope check:** Did I build anything outside scope? Remove it.
3. **Verification ran:** Did I run the actual verification command and see the expected output?
4. **Reflection written:** Is there a reflection in `memory/learning-log.md`?
5. **Registry updated:** If this created or completed a project, is `PROJECT_REGISTRY.md` current?

---

## Quick Reference

| Phase | Key Question | Gate to Next Phase |
|-------|-------------|-------------------|
| **1. Research** | What exists? What breaks? Simplest path? | Can answer all four questions |
| **2. Plan** | What will I build, verify, and fall back to? | Written plan with exact verification |
| **3. Execute** | One task at a time — code, test, commit | Task complete, nothing added out of scope |
| **4. Verify** | Did the actual output match expected? | Verification command ran and passed |
| **5. Reflect** | What did I learn? What should be default next time? | Reflection written to learning-log.md |

---

## Supporting Techniques

- **`memory/learning-log.md`** — running log of lessons learned per task
- **`memory/agent-scores.md`** — track which agents perform well on which task types
- **`PROJECT_REGISTRY.md`** — all active PMs, state files, and project links
- **`STATE_TEMPLATE.yaml`** — copy when starting a new project PM

**Related skills (use when relevant):**
- `skill-creator` — when creating or improving a skill file itself
- `coding-agent` — when spawning Claude Code or Codex for implementation
- `gh-issues` — when executing against a GitHub issue backlog
