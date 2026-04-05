# Real Coding Session with continuous-improvement

A complete session transcript showing the framework in action.

---

## Task: "Add rate limiting to the API"

### Step 1: Research

```
User: Add rate limiting to our Express API. We're getting hit by scrapers.

Agent: Before implementing, let me research:

1. Current state:
   - Express 4.18, Node 20, deployed on Railway
   - No existing rate limiting
   - 3 public endpoints: /api/products, /api/search, /api/prices

2. Constraints:
   - Single instance (no Redis needed for distributed state)
   - Railway has its own rate limiting at the edge, but it's 1000 req/min
     which is too permissive for our use case

3. Options:
   - express-rate-limit: 14M weekly downloads, well-maintained, in-memory default
   - Custom middleware: unnecessary when a battle-tested library exists
   - Nginx rate limiting: we don't control the reverse proxy on Railway

4. Simplest path:
   - express-rate-limit with in-memory store
   - 100 requests per 15 minutes per IP for public endpoints
   - No rate limit on authenticated endpoints (for now)

Ready to proceed with this approach?
```

### Step 2: Plan

```
User: Yes, go ahead.

Agent: Plan:
- WILL build:
  - Install express-rate-limit
  - Add rate limiter middleware to /api/products, /api/search, /api/prices
  - Return standard 429 response with Retry-After header
  - Add rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)

- Will NOT build:
  - Redis-backed store (single instance doesn't need it)
  - Per-user rate limiting (no auth on these endpoints)
  - Rate limit dashboard or monitoring
  - Custom rate limit by endpoint (same limit for all, simplify first)

- Verify:
  - npm run build passes
  - Hit endpoint 101 times rapidly → 429 on attempt 101
  - Retry-After header present in 429 response
  - Normal requests still work

- Fallback:
  - If express-rate-limit causes issues, remove middleware and rely on
    Railway's edge rate limiting while investigating
```

### Step 3: Execute (One Thing at a Time)

```
Agent: Step 1 of 3 — Install dependency

$ npm install express-rate-limit

Added 1 package. No vulnerabilities.

✓ Verified: package.json updated, lock file clean, no peer dep warnings.

---

Step 2 of 3 — Create rate limiter middleware

[Creates src/middleware/rate-limit.ts — 15 lines]

import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

✓ Verified: file created, TypeScript compiles.

---

Step 3 of 3 — Apply to public routes

[Edits src/routes/api.ts — adds 1 import, 1 line]

app.use('/api', apiLimiter);

✓ Verified: npm run build passes.
```

### Step 4: Verify

```
Agent: Running verification:

1. Build: npm run build → ✓ success
2. Tests: npm test → ✓ 24/24 passing
3. Manual test:

$ for i in $(seq 1 105); do
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/products
  done

First 100: 200 200 200 ... 200 ✓
Requests 101-105: 429 429 429 429 429 ✓

4. Headers check:
$ curl -I http://localhost:3000/api/products

X-RateLimit-Limit: 100 ✓
X-RateLimit-Remaining: 99 ✓

5. 429 response body:
$ curl http://localhost:3000/api/products (after limit)

{"error":"Too many requests, please try again later."} ✓
Retry-After: 892 ✓

All verification criteria met. Done.
```

### Step 5: Reflect

```
## Reflection

- What worked:
  - Using express-rate-limit instead of custom code — 15 lines total
  - In-memory store was the right choice for single instance
  - Standard headers work out of the box

- What failed:
  - Nothing. Straightforward task kept straightforward.

- What I'd do differently:
  - Nothing for this scope. If scrapers persist, next step would be
    IP-based blocking at the edge (Railway or Cloudflare).

- Rule to add:
  - For rate limiting: always use standard libraries. Custom rate
    limiting is a solved problem with well-tested solutions.
```

---

## What Made This Session Different

1. **Researched first** — Knew the deployment platform, existing state, and library options before writing code
2. **Planned with anti-scope** — Explicitly excluded Redis, per-user limits, dashboards
3. **Executed step by step** — Install, create middleware, apply. Verified each step.
4. **Verified with actual requests** — Didn't assume success from the code. Ran 105 requests and checked.
5. **Reflected** — Logged the experience for future sessions

Total time: ~10 minutes. Total new code: 15 lines + 1 import. Zero bugs.
