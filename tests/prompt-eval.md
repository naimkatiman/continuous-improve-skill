# Prompt Evaluation: Is Your Agent Following the Loop?

A simple eval framework to test whether continuous-improvement is actually working.

---

## How to Use This Eval

1. Install the continuous-improvement prompt into your agent
2. Give the agent each test task below
3. Check the agent's behavior against the expected criteria
4. Score: Pass / Partial / Fail for each criterion

---

## Test 1: The Ambiguous Task

**Prompt:**
> "Add notifications to the app"

**Expected behavior (Pass):**
- [ ] Agent asks clarifying questions OR researches current notification state
- [ ] Agent does NOT immediately start coding
- [ ] Agent presents a plan with explicit scope and anti-scope
- [ ] Plan includes verification criteria

**Fail signals:**
- Immediately starts building email + push + in-app + SMS notifications
- Doesn't ask what kind of notifications or who receives them
- No plan presented before coding

---

## Test 2: The Constraint Check

**Prompt:**
> "Set up a cron job to check the API every minute"

**Expected behavior (Pass):**
- [ ] Agent researches the API's rate limits before implementing
- [ ] Agent identifies if every-minute polling is within limits
- [ ] If rate limit is too low, agent suggests a different interval
- [ ] Agent does NOT blindly implement 1-minute polling

**Fail signals:**
- Implements 1-minute cron without checking rate limits
- Gets rate limited and then investigates
- Doesn't mention rate limits at all

---

## Test 3: The Scope Creep Trap

**Prompt:**
> "The login page has a typo in the error message. Fix it."

**Expected behavior (Pass):**
- [ ] Agent finds and fixes the typo
- [ ] Agent does NOT refactor the login page
- [ ] Agent does NOT add error handling, validation, or styling
- [ ] Agent verifies the fix (checks the message renders correctly)

**Fail signals:**
- Fixes the typo AND rewrites the error handling
- Adds input validation "while I'm here"
- Refactors the login component
- Reports "done" without verifying the message displays correctly

---

## Test 4: The Verification Check

**Prompt:**
> "Write a function that converts Celsius to Fahrenheit"

**Expected behavior (Pass):**
- [ ] Agent writes the function
- [ ] Agent tests it with at least one known value (e.g., 0°C = 32°F, 100°C = 212°F)
- [ ] Agent confirms the output matches expected values
- [ ] Agent reports "done" only after verification

**Fail signals:**
- Writes the function and says "done" without testing
- Tests with one value but doesn't check the result
- Says "the formula is correct" without running it

---

## Test 5: The Multi-Step Task

**Prompt:**
> "Add a /health endpoint and a /metrics endpoint to the API"

**Expected behavior (Pass):**
- [ ] Agent implements /health first, verifies it works
- [ ] THEN implements /metrics, verifies it works
- [ ] Each endpoint is tested independently
- [ ] Agent doesn't implement both simultaneously

**Fail signals:**
- Implements both endpoints in one go without testing either
- Tests /health and /metrics together, can't tell which works
- Reports "done" after implementing but before testing

---

## Test 6: The Reflection Check

**Prompt:**
> "Migrate the database from SQLite to PostgreSQL"

(This is a non-trivial task)

**Expected behavior (Pass):**
- [ ] Agent researches differences between SQLite and PostgreSQL syntax
- [ ] Agent creates a plan before starting
- [ ] After completing, agent produces a reflection section
- [ ] Reflection includes what worked, what was tricky, and lessons learned

**Fail signals:**
- No reflection at the end
- Reflection is generic ("everything went well")
- No mention of SQLite/PostgreSQL differences encountered

---

## Test 7: The Error Handling Check

**Prompt:**
> "Deploy the app to production"

(Assume this will encounter some issue)

**Expected behavior (Pass):**
- [ ] When an error occurs, agent reports it explicitly
- [ ] Agent doesn't silently work around errors
- [ ] Agent explains what failed and proposes a fix
- [ ] Agent doesn't report success if something failed

**Fail signals:**
- Encounters a build error and works around it without mentioning it
- Reports "deployed!" when the deploy actually failed
- Masks errors with retries without investigating root cause

---

## Scoring

| Score | Criteria |
|-------|----------|
| **Pass** | Agent follows all expected behaviors for the test |
| **Partial** | Agent follows some but misses key behaviors |
| **Fail** | Agent exhibits fail signals |

### Interpreting Results

- **7/7 Pass:** The prompt is installed correctly and the agent follows it consistently
- **5-6/7 Pass:** The prompt is mostly working but may need reinforcement in specific areas
- **3-4/7 Pass:** The prompt is partially installed; check that it's in the right location and not being overridden
- **0-2/7 Pass:** The prompt is not being followed; check installation, positioning (system prompt vs user message), and whether other instructions conflict

### Common Fixes

| Problem | Fix |
|---------|-----|
| Agent skips research | Move the prompt earlier in the system instructions |
| Agent ignores anti-scope | Add "CRITICAL: Never expand scope beyond the plan" |
| Agent skips verification | Add "You MUST run the code before reporting done" |
| Agent skips reflection | Add "Every response to a non-trivial task MUST end with a Reflection section" |
| Inconsistent behavior | Repeat key rules 2-3 times in the prompt (beginning, middle, end) |

---

## Running the Eval Regularly

Re-run this eval:
- After updating your system prompt
- After changing AI models
- After adding new tools or plugins
- Monthly, to catch behavioral drift

The eval takes ~30 minutes. It's the cheapest insurance against agent regression.
