# Before & After: continuous-improvement in Action

Real scenarios showing how the framework changes agent behavior.

---

## Scenario 1: "Add caching to the API"

### Before (No Framework)

```
User: Add a caching layer to the API

Agent: I'll implement a comprehensive caching solution!

[Proceeds to:]
- Add Redis as a dependency
- Create a cache manager class
- Add cache warming on startup
- Build a cache invalidation system
- Add cache monitoring endpoints
- Create a CLI tool for cache management
- Set up distributed cache sync

[45 minutes later]

Agent: Done! I've created 14 new files and modified 6 existing ones.

User: Does it work?

Agent: Let me check... there are some import errors. Also I didn't
configure the Redis connection. And the tests don't pass. But the
architecture is solid!
```

### After (With continuous-improvement)

```
User: Add a caching layer to the API

Agent: Research first:
- Current response times? → avg 340ms on GET /api/products
- Existing caching? → none
- Traffic pattern? → 90% reads, mostly same 50 products
- Redis vs in-memory? → single server, in-memory LRU is simpler

Plan:
- WILL build: In-memory LRU cache for GET /api/products
- Will NOT build: distributed cache, cache warming, monitoring, CLI tools
- Verify: cached response < 50ms, cache miss unchanged, build passes
- Fallback: if memory exceeds 256MB, disable and log

[Implements one file change]

Verified:
- Cached response: 12ms (was 340ms) ✓
- Cache miss: 342ms (unchanged) ✓
- Build passes ✓
- Tests pass ✓

Reflection: In-memory was the right call. If multi-server is needed
later, the cache interface is clean enough to swap to Redis.
```

---

## Scenario 2: "Fix the login bug"

### Before

```
User: Users are getting logged out randomly

Agent: I'll fix the authentication system!

[Proceeds to:]
- Rewrite the session management
- Add refresh token rotation
- Implement "remember me" feature
- Add login analytics
- Refactor the auth middleware
- Add rate limiting to login endpoint

Agent: Done! I've improved the entire auth system.

User: Is the random logout fixed?

Agent: I think so? I rewrote the session handling so it should be
better now. I also added some nice features while I was in there.

User: The logout is still happening. And now the admin panel is broken.
```

### After

```
User: Users are getting logged out randomly

Agent: Research first:
- When does it happen? → checking error logs
- Found: session cookie has 30-min expiry, no refresh mechanism
- The cookie maxAge is set in seconds but the value looks like milliseconds
- 1800000ms = 30min, but cookie interprets as 1800000 seconds = 20 days...
  wait, the opposite: maxAge: 1800 is being set but the comment says "30 min"
  and 1800 seconds = 30 min. Let me check the actual behavior.
- Found it: maxAge is set correctly at 1800, but the session store's TTL
  is set to 1800ms (milliseconds) instead of 1800s. Sessions expire after
  1.8 seconds in the store.

Plan:
- WILL fix: Session store TTL from 1800 (ms) to 1800000 (ms) or 1800 (s)
  depending on the store's expected unit
- Will NOT fix: anything else in the auth system
- Verify: login, wait 5 minutes, refresh page, still logged in
- Fallback: if store expects seconds, use 1800

[One-line fix: ttl: 1800 → ttl: 1800 * 1000]

Verified:
- Logged in, waited 5 minutes, refreshed → still logged in ✓
- Admin panel works ✓
- Build passes ✓

Reflection: The bug was a unit mismatch (seconds vs milliseconds).
Took 5 minutes to research, 1 line to fix. Would have taken hours
if I'd rewritten the auth system.
```

---

## Scenario 3: "Set up monitoring"

### Before

```
User: Add basic health monitoring to the service

Agent: I'll set up a comprehensive observability stack!

- Install Prometheus + Grafana
- Add OpenTelemetry instrumentation
- Create custom metrics for every endpoint
- Set up distributed tracing
- Add alerting rules
- Create monitoring dashboards
- Add log aggregation

[2 hours later, 40 new files, Docker Compose modified]

Agent: The observability stack is ready!

User: I just wanted a health check endpoint.
```

### After

```
User: Add basic health monitoring to the service

Agent: Research:
- What does "basic health monitoring" mean here? Asking for clarification.

User: A /health endpoint that checks the DB connection.

Agent: Plan:
- WILL build: GET /health that returns {status, db, uptime}
- Will NOT build: Prometheus, Grafana, tracing, dashboards, alerting
- Verify: curl /health returns 200 with db: "connected"
- Fallback: if DB check is slow, add 5s timeout

[Adds one route file]

Verified:
- curl localhost:3000/health → {"status":"ok","db":"connected","uptime":1234} ✓
- DB down → {"status":"degraded","db":"disconnected"} ✓
- Build passes ✓

Done. If you need Prometheus/Grafana later, this endpoint is
already compatible with standard health check scrapers.
```

---

## The Pattern

In every before/after:

| Without Framework | With Framework |
|---|---|
| Expanded scope immediately | Researched first |
| Built 10x what was asked | Planned with anti-scope |
| Reported "done" without checking | Verified actual output |
| Created new problems | Fixed the specific problem |
| No reflection | Logged lessons for next time |

The framework doesn't make the agent less capable. It makes the agent less reckless.
