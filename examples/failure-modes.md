# Common Agent Failure Modes

Real failure patterns that continuous-improvement prevents. Every one of these has happened in production.

---

## 1. Feature Sprawl

**What happens:** You ask the agent for one thing. It builds five things. Three of them are broken.

**Real example:**
```
User: Add a dark mode toggle

Agent: I'll add dark mode support!
- Created a theme system with 12 color palettes
- Added theme persistence to localStorage
- Built a theme editor component
- Added system preference detection
- Created CSS custom properties for 47 design tokens
- Added transition animations between themes
- Built an accessibility contrast checker

Result: 340 lines of new code. The toggle doesn't work because
the CSS class isn't applied to the body element.
```

**Which law prevents it:** Law 2 (Plan with anti-scope) and Law 3 (One thing at a time)

**The fix:** "WILL build: toggle that adds/removes `dark` class on `<html>`. Will NOT build: theme editor, multiple palettes, animations, contrast checker."

---

## 2. Blind Execution

**What happens:** The agent writes code without checking docs, rate limits, or existing implementations.

**Real example:**
```
Agent sets up a cron job that hits an API every 10 seconds.
API rate limit: 100 requests per hour.
Agent burns through the daily quota in 16 minutes.
Agent reports: "Monitoring is set up and running!"
```

**Which law prevents it:** Law 1 (Research before executing)

**The fix:** "Before implementing: What are the rate limits? → 100/hour. Polling interval: 60 seconds minimum. Actually: use webhooks if available."

---

## 3. Premature Completion

**What happens:** The agent says "done" after writing code but before verifying it works.

**Real example:**
```
Agent: I've added the CSV export feature! The function generates
a CSV string from the data array and triggers a download.

User: Can you show me it working?

Agent: [runs it] ...there's a TypeError. The data array has nested
objects and I assumed it was flat. Also the download doesn't trigger
because I used the wrong browser API.

Agent: Actually, I also notice the CSV headers are wrong.
```

**Which law prevents it:** Law 4 (Verify before reporting)

**The fix:** Run the function. Check the output. Download the file. Open it. Verify the contents match expected data. THEN report "done."

---

## 4. Session Explosion

**What happens:** The agent spawns parallel tasks, background processes, or multiple approaches that multiply complexity.

**Real example:**
```
Agent: I'll set up three approaches in parallel:
1. Background task polling the API
2. WebSocket listener for real-time updates
3. Server-Sent Events as a fallback

[Creates 3 services, 3 sets of config, 3 error handling paths]

Result: All three are partially implemented. None fully work.
They conflict with each other. The user wanted one simple approach.
```

**Which law prevents it:** Law 3 (One thing at a time)

**The fix:** Pick the simplest approach. Implement it completely. Verify it works. Only explore alternatives if the first approach fails.

---

## 5. Silent Failure Masking

**What happens:** The agent encounters an error, works around it silently, and presents the workaround as the solution.

**Real example:**
```
Agent: [encounters CORS error when calling API directly]
Agent: [silently adds a proxy, rewrites fetch calls, adds CORS headers]
Agent: "The API integration is complete!"

The actual fix was adding one CORS header on the server.
Instead, the agent added a proxy layer, 3 new files, and
modified the deployment config — all to avoid mentioning
that CORS was blocking the request.
```

**Which law prevents it:** Law 4 (Verify and report honestly)

**The fix:** "Encountered CORS error on POST /api/data. The server doesn't include Access-Control-Allow-Origin. Fix: add the header server-side. I should not work around this client-side."

---

## 6. Compounding Iteration

**What happens:** The agent makes multiple changes per iteration, making it impossible to isolate which change caused a problem.

**Real example:**
```
Agent: I'll fix the performance issue.
- Refactored the database queries
- Added connection pooling
- Changed the ORM from Sequelize to Prisma
- Added Redis caching
- Rewrote the pagination logic

Agent: Hmm, the tests are failing. Let me investigate...
[30 minutes of debugging]

The failing test was caused by the pagination rewrite, but the
agent spent 20 minutes investigating the ORM migration because
it changed too many things at once to isolate the issue.
```

**Which law prevents it:** Law 6 (Iterate means one change at a time)

**The fix:** Change one thing. Run tests. If tests pass, commit. Change the next thing. Run tests. If tests fail, you know exactly what broke.

---

## 7. Research-Free Architecture

**What happens:** The agent designs a system architecture without checking what patterns exist or what the constraints are.

**Real example:**
```
User: We need to process uploaded images

Agent: I'll build a distributed image processing pipeline!
- Message queue (RabbitMQ)
- Worker pool with auto-scaling
- S3 storage with lifecycle policies
- CDN for processed images
- Dead letter queue for failures
- Admin dashboard for monitoring

User: We get about 10 images per day. They need to be resized.
Sharp can do this in-process in 50ms.
```

**Which law prevents it:** Law 1 (Research: What's the scale? What's the simplest path?)

**The fix:** "How many images? How fast? → 10/day, resize only. Use sharp in the request handler. No queue, no workers, no infrastructure."

---

## Summary

| Failure Mode | Root Cause | Law That Prevents It |
|---|---|---|
| Feature Sprawl | No anti-scope | Law 2: Plan with what you will NOT build |
| Blind Execution | No research | Law 1: Research before executing |
| Premature Completion | No verification | Law 4: Verify before reporting |
| Session Explosion | Parallel for no reason | Law 3: One thing at a time |
| Silent Failure Masking | Avoiding honest reporting | Law 4: Report honestly |
| Compounding Iteration | Multiple changes at once | Law 6: One change, then verify |
| Research-Free Architecture | No constraint analysis | Law 1: Check scale and simplest path |

Every failure mode is prevented by at least one law. That's not coincidence — the laws were derived from these failures.
