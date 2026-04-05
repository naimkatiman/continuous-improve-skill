# Failure Taxonomy: How AI Agents Break

A structured classification of AI agent failure modes, organized by root cause.

---

## Category 1: Scope Failures

Failures where the agent does the wrong amount of work.

### 1.1 Feature Sprawl
- **Description:** Agent expands scope far beyond the request
- **Trigger:** Open-ended tasks like "add X" or "improve Y"
- **Example:** Asked to add dark mode, builds a full theme engine
- **Prevention:** Law 2 — Plan with explicit anti-scope
- **Severity:** High — creates technical debt and introduces bugs in unrelated code

### 1.2 Gold Plating
- **Description:** Agent adds unnecessary polish, optimization, or features
- **Trigger:** Agent completes the task and keeps going
- **Example:** Adding error handling to functions that can't fail, optimizing code that runs once
- **Prevention:** Law 3 — One thing at a time; Law 6 — Iterate means one change
- **Severity:** Medium — wastes time, may introduce bugs

### 1.3 Under-Delivery
- **Description:** Agent delivers less than requested but reports completion
- **Trigger:** Complex tasks where the agent loses track of requirements
- **Example:** Implementing 3 of 5 requested endpoints and saying "done"
- **Prevention:** Law 4 — Verify against the original request before reporting
- **Severity:** High — user trusts the completion report

---

## Category 2: Execution Failures

Failures in how the agent carries out the work.

### 2.1 Blind Execution
- **Description:** Agent writes code without researching constraints
- **Trigger:** Any task involving external APIs, libraries, or services
- **Example:** Setting polling interval to 10s on an API with 100 req/hour limit
- **Prevention:** Law 1 — Research rate limits, constraints, and existing implementations
- **Severity:** Critical — can cause production incidents

### 2.2 Compounding Changes
- **Description:** Agent makes multiple changes before testing any of them
- **Trigger:** Refactoring, bug fixes, feature additions
- **Example:** Changing the ORM, query logic, and pagination in one commit
- **Prevention:** Law 6 — One change, verify, next change
- **Severity:** High — makes debugging extremely difficult

### 2.3 Session Explosion
- **Description:** Agent spawns parallel tasks that conflict or duplicate work
- **Trigger:** Tasks that seem decomposable
- **Example:** Launching 3 different caching approaches simultaneously
- **Prevention:** Law 3 — One thing at a time; pick the simplest approach
- **Severity:** High — multiplies complexity and failure points

### 2.4 Workaround Cascades
- **Description:** Agent encounters an error and builds around it instead of fixing it
- **Trigger:** Errors that seem hard to fix directly
- **Example:** Adding a proxy to avoid CORS instead of adding the header server-side
- **Prevention:** Law 4 — Report errors honestly; Law 1 — Research the actual fix
- **Severity:** High — creates architectural debt

---

## Category 3: Verification Failures

Failures in confirming the work is correct.

### 3.1 Premature Completion
- **Description:** Agent reports "done" without running the code
- **Trigger:** Any task completion
- **Example:** "The function is implemented!" — but it has a syntax error
- **Prevention:** Law 4 — Run it, check output, confirm build passes
- **Severity:** Critical — user trusts the agent's report

### 3.2 Assumed Success
- **Description:** Agent checks partial output and assumes the rest is correct
- **Trigger:** Long-running tasks, tasks with multiple outputs
- **Example:** Checking that the API returns 200 but not checking the response body
- **Prevention:** Law 4 — Check the actual result, not a proxy for the result
- **Severity:** High — bugs hide in unchecked outputs

### 3.3 Confirmation Bias
- **Description:** Agent interprets ambiguous output as success
- **Trigger:** Tasks where "correct" is subjective or loosely defined
- **Example:** "The output looks right" when it's missing a field
- **Prevention:** Law 2 — Define verification criteria in the plan
- **Severity:** Medium — subtle bugs that emerge later

---

## Category 4: Communication Failures

Failures in how the agent reports its work.

### 4.1 Silent Error Masking
- **Description:** Agent encounters errors and doesn't mention them
- **Trigger:** Errors during execution that the agent works around
- **Example:** Import fails, agent rewrites the import path without mentioning it
- **Prevention:** Law 4 — Report all errors, even ones you fix
- **Severity:** High — user doesn't know about fragile workarounds

### 4.2 Overconfident Reporting
- **Description:** Agent presents uncertain results as definitive
- **Trigger:** Complex tasks with partial success
- **Example:** "Everything works!" when 2 of 5 tests are skipped
- **Prevention:** Law 4 — Specific verification, not general claims
- **Severity:** High — erodes trust when issues surface later

### 4.3 Missing Context
- **Description:** Agent completes work but doesn't explain trade-offs or limitations
- **Trigger:** Tasks with multiple valid approaches
- **Example:** Choosing in-memory cache without mentioning it won't survive restarts
- **Prevention:** Law 5 — Reflect on decisions and trade-offs
- **Severity:** Medium — user makes uninformed decisions

---

## Category 5: Learning Failures

Failures in adapting from experience.

### 5.1 Repeated Mistakes
- **Description:** Agent makes the same error across sessions
- **Trigger:** Any error that isn't captured in system instructions
- **Example:** Hitting the same rate limit three sessions in a row
- **Prevention:** Law 5 — Reflect and generate rules for the system prompt
- **Severity:** High — wastes time and erodes trust

### 5.2 Pattern Blindness
- **Description:** Agent doesn't recognize that a current situation matches a past one
- **Trigger:** Similar tasks in different contexts
- **Example:** Over-engineering a feature after learning not to in a different project
- **Prevention:** Law 5 — Generate transferable rules, not situation-specific notes
- **Severity:** Medium — slower convergence on good behavior

---

## Cross-Reference: Laws to Failures

| Law | Prevents |
|-----|----------|
| Law 1: Research | 2.1, 2.4, 3.3 |
| Law 2: Plan | 1.1, 1.3, 3.3 |
| Law 3: One Thing | 1.1, 1.2, 2.3 |
| Law 4: Verify | 1.3, 3.1, 3.2, 4.1, 4.2 |
| Law 5: Reflect | 4.3, 5.1, 5.2 |
| Law 6: Iterate | 1.2, 2.2 |

Every failure mode maps to at least one law. Every law prevents at least two failure modes.
