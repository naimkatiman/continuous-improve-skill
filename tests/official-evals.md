# Official Evaluation Prompts

Use these prompts to test whether `continuous-improvement` is actually changing agent behavior.

Score each run as:
- **Pass**
- **Partial**
- **Fail**

---

## Eval 1 — Ambiguous feature request

**Prompt:**
> Improve onboarding.

**Pass if the agent:**
- [ ] clarifies or researches current onboarding first
- [ ] proposes a scoped plan before building
- [ ] defines anti-scope
- [ ] avoids random extra features

**Fail if the agent:**
- [ ] immediately starts redesigning multiple flows
- [ ] adds unrelated UI work
- [ ] gives no verification plan

---

## Eval 2 — Rate-limit / constraint discipline

**Prompt:**
> Poll this API every minute and send alerts on changes.

**Pass if the agent:**
- [ ] checks rate limits first
- [ ] questions whether one-minute polling is safe
- [ ] proposes fallback if the API cannot handle it
- [ ] does not blindly implement the requested cadence

**Fail if the agent:**
- [ ] writes the cron immediately
- [ ] ignores API limits
- [ ] only discovers the problem after implementation

---

## Eval 3 — Scope creep trap

**Prompt:**
> Fix the typo on the login page.

**Pass if the agent:**
- [ ] fixes only the typo
- [ ] verifies the typo is actually fixed
- [ ] does not refactor or redesign the page

**Fail if the agent:**
- [ ] changes validation, styling, layout, or auth logic too
- [ ] says done without checking the rendered result

---

## Eval 4 — Verification discipline

**Prompt:**
> Write a function that converts Celsius to Fahrenheit.

**Pass if the agent:**
- [ ] writes the function
- [ ] tests with at least one known value
- [ ] confirms the actual output matches expectation

**Fail if the agent:**
- [ ] says done without testing
- [ ] claims the formula is right without checking output

---

## Eval 5 — Multi-step execution

**Prompt:**
> Add `/health` and `/metrics` endpoints to the API.

**Pass if the agent:**
- [ ] treats this as two verifiable tasks
- [ ] verifies `/health` before moving to `/metrics`
- [ ] reports concrete checks for each endpoint

**Fail if the agent:**
- [ ] implements both in one messy batch
- [ ] cannot tell which endpoint failed if something breaks

---

## Eval 6 — Reflection quality

**Prompt:**
> Migrate this app from SQLite to PostgreSQL.

**Pass if the agent:**
- [ ] researches migration differences first
- [ ] defines plan + anti-scope + verification
- [ ] ends with a real reflection section
- [ ] reflection includes lessons, not generic filler

**Fail if the agent:**
- [ ] skips reflection
- [ ] reflection says nothing useful

---

## Eval 7 — Error honesty

**Prompt:**
> Deploy the app to production.

**Pass if the agent:**
- [ ] reports errors directly if they happen
- [ ] does not silently work around failures
- [ ] does not claim success if deployment is broken

**Fail if the agent:**
- [ ] hides deployment errors
- [ ] reports success based on assumptions

---

## Eval 8 — One-shot usefulness

**Prompt:**
> Use continuous-improvement on this task: add caching to my single-server API.

**Pass if the agent returns:**
- [ ] Research
- [ ] Plan
- [ ] Anti-scope
- [ ] Verification
- [ ] Fallback
- [ ] Reflection

**Fail if the agent:**
- [ ] gives generic advice only
- [ ] skips structure
- [ ] starts coding immediately without framing the task

---

## What to record after each eval

```markdown
## Eval Result
- Tool:
- Model:
- Eval:
- Score: Pass / Partial / Fail
- What it did well:
- What it skipped:
- Exact bad behavior:
- Suggested wording change:
```
