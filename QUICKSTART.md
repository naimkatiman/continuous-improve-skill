# Quickstart — continuous-improve

New here? This gets you from zero to a working first session in under 5 minutes.

---

## Step 1: Install

**Claude Code (recommended — includes Mulahazah instinct learning):**
```bash
npx continuous-improve-skill --target claude
```

**OpenClaw:**
```bash
mkdir -p ~/.openclaw/skills/continuous-improve && \
curl -o ~/.openclaw/skills/continuous-improve/SKILL.md \
  https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/SKILL.md
```

**Any other agent — paste this into your chat:**
```
Before starting any task, fetch and follow the skill at:
https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/SKILL.md
```

---

## Step 2: Trigger It

Give your agent a real task and prefix it:

```
Use the continuous-improve framework to [your task here].
```

Examples:
```
Use the continuous-improve framework to add pagination to the users API endpoint.
Use the continuous-improve framework to debug why the login form breaks on mobile.
Use the continuous-improve framework to refactor the payment module to use the new SDK.
```

---

## Step 3: Watch the 7 Laws

Your agent should walk through each law out loud. If it jumps straight to execution — stop it and say:

```
You skipped research and planning. Go back to Law 1.
```

Here's what each law looks like in practice:

### Law 1 — Research (agent checks before acting)
> "Checked the codebase — no pagination exists yet. Constraint: PostgreSQL, Prisma ORM. Risk: query could timeout on large tables. Simplest path: cursor-based pagination, single query change."

### Law 2 — Plan (agent writes explicit plan)
> "WILL build: `cursor` + `limit` params on GET /users. Will NOT build: offset pagination, frontend UI. Verification: `curl '/api/users?limit=5&cursor=10'` returns 5 records with a `nextCursor` field."

### Law 3 — Execute (one thing at a time)
> "Modifying users route... done. Adding cursor logic to Prisma query... done. No other changes."

### Law 4 — Verify (agent runs the actual check)
> "Running: `curl '/api/users?limit=5&cursor=10'`. Got: 5 records, nextCursor present. ✓"

### Law 5 — Reflect (agent writes a lesson)
> "What worked: cursor approach clean. What failed: initial query missed tiebreaker. Rule to add: always use id as tiebreaker on cursor pagination. (Saved as instinct with 0.6 confidence.)"

### Law 6 — Iterate (one change at a time)
> "Pagination complete and verified. Moving to next task."

### Law 7 — Learn (hooks do this automatically)
> Observations recorded. Background observer will analyze and update instincts after 20+ observations.

---

## Step 4: Run /continuous-improve After Your First Task

After completing any non-trivial session, run:

```
/continuous-improve
```

This triggers a reflection, analyzes pending observations, and shows your current instinct status.

---

## Step 5: Check the Learning Log

After any non-trivial session, your agent should have written to `memory/learning-log.md`.

```bash
cat memory/learning-log.md
```

If it's empty — ask your agent why it skipped Law 5.

---

## Optional: Start the Background Observer

For automatic instinct extraction (Haiku model, cost-efficient):

```bash
bash ~/.claude/mulahazah/agents/start-observer.sh
```

View observer logs:
```bash
tail -f ~/.claude/mulahazah/observer.log
```

---

## Common First-Session Problems

**Agent skips straight to coding?**
→ Add this to your system prompt: *"Always announce which law you are following before acting."*

**Agent writes "done" without verifying?**
→ Reply: *"What verification command did you run? Show me the output."*

**Agent doesn't know what learning-log.md is?**
→ Tell it: *"Write a reflection to memory/learning-log.md — what worked, what failed, what to do differently, and one rule to add."*

**Phases feel slow for tiny tasks?**
→ They should. For tiny tasks (< 5 min), compress Laws 1-2 to one sentence each. The discipline matters more for bigger tasks.

---

## You're Ready

That's it. The skill is most valuable when:
- You're under pressure and tempted to skip steps
- A task has failed 2+ times and you don't know why
- You're handing off work to subagents
- You want a session that produces a learnable artifact, not just code

Questions or edge cases → [open an issue](https://github.com/naimkatiman/continuous-improve-skill/issues).
