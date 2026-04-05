<p align="center">
  <img src="assets/combined.gif" alt="Before vs After — The 7 Laws of AI Agent Discipline" width="700" />
</p>

<h1 align="center">The 7 Laws of AI Agent Discipline</h1>

<p align="center">
  <b>Stop your AI agent from skipping steps, guessing, and declaring "done" without verifying.</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/continuous-improvement"><img src="https://img.shields.io/npm/v/continuous-improvement" alt="npm"></a>
  <a href="https://www.npmjs.com/package/continuous-improvement"><img src="https://img.shields.io/npm/dm/continuous-improvement" alt="downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="license"></a>
  <a href="test/"><img src="https://img.shields.io/badge/tests-20%20passing-brightgreen" alt="tests"></a>
</p>

<p align="center">
  <a href="https://docs.anthropic.com/en/docs/claude-code"><img src="https://img.shields.io/badge/Claude%20Code-skill-blueviolet" alt="Claude Code"></a>
  <a href="https://cursor.sh"><img src="https://img.shields.io/badge/Cursor-compatible-blue" alt="Cursor"></a>
  <a href="https://openai.com/codex"><img src="https://img.shields.io/badge/Codex-compatible-blue" alt="Codex"></a>
  <a href="https://ai.google.dev/gemini-api/docs/gemini-cli"><img src="https://img.shields.io/badge/Gemini%20CLI-compatible-blue" alt="Gemini CLI"></a>
</p>

---

## The Problem

AI agents are great at individual steps. They're terrible at **discipline**.

They skip research. They plan loosely. They declare "done" before verifying. They add features mid-task. They never reflect. Each session, they repeat the same mistakes.

**The 7 Laws** fix that — plus a **learning system** (Mulahazah) that builds instincts over time. No config, no daemon, no manual setup.

### Before vs After

<details>
<summary><b>Without continuous-improvement</b> — agent skips research, declares "done" without verifying</summary>

```
You: Add rate limiting to the /api/users endpoint

Agent: I'll add rate limiting now.
       *writes express-rate-limit middleware*
       Done! I've added rate limiting to the /api/users endpoint.

You: Did you check if we already have rate limiting somewhere?
Agent: Let me check... oh, there's already a rate limiter in middleware/rateLimit.ts.
       I've created a duplicate. Let me fix that.

You: Did you test it?
Agent: Let me run the tests... they're failing. The import path is wrong.
       *fixes import*
       Now it works!

You: You also broke the /api/auth endpoint — it was sharing that middleware.
Agent: I see. Let me fix that too...
```

**Result:** 4 back-and-forth corrections. Duplicate code. Broken endpoint. 15 minutes wasted.
</details>

<details>
<summary><b>With continuous-improvement</b> — agent follows the 7 laws</summary>

```
You: Add rate limiting to the /api/users endpoint

Agent: **[Law 1: Research]** Searching for existing rate limiting...
       Found: middleware/rateLimit.ts — already applies to /api/auth.
       Found: express-rate-limit already in package.json.

       **[Law 2: Plan]**
       WILL: Extend existing rateLimit middleware to cover /api/users
       WILL NOT: Create new middleware or change existing /api/auth behavior
       VERIFY: Run tests + curl /api/users 101 times to confirm 429 response

       **[Law 3: Execute one thing]** Adding /api/users to the route list
       in middleware/rateLimit.ts...

       **[Law 4: Verify]**
       ✓ npm test — 47/47 passing
       ✓ curl test — 429 after 100 requests
       ✓ /api/auth still works — 200 OK

       Done. Extended existing rate limiter to cover /api/users.
       One file changed: middleware/rateLimit.ts (+1 line).
```

**Result:** Correct on first attempt. No duplicate code. No broken endpoints. 2 minutes.
</details>

---

## Install

### Beginner (default) — just hooks, no setup needed

```bash
npx continuous-improvement install
```

That's it. For Claude Code, this installs:
- Observation hooks (captures every tool call, <50ms, jq optional)
- `/continuous-improvement` command
- Auto-leveling instinct system

### Expert — full power with MCP server

```bash
npx continuous-improvement install --mode expert
```

Everything in beginner plus:
- **MCP server** with 8 tools (instinct management, import/export, observation viewer)
- **Session hooks** (auto-load instincts at start, remind to reflect at end)
- Works with Claude Code, Claude Desktop, and any MCP client

### MCP only — for non-Claude editors

```bash
npx continuous-improvement install --mode mcp
```

Registers the MCP server without hooks — for Cursor, Zed, Windsurf, VS Code, or any editor that supports MCP.

### Install to a specific target

```bash
npx continuous-improvement install --target claude    # Claude Code + Mulahazah
npx continuous-improvement install --target openclaw  # OpenClaw (skill only)
npx continuous-improvement install --target cursor    # Cursor (skill only)
npx continuous-improvement install --target all       # All targets
```

### Manual install

```bash
mkdir -p ~/.claude/skills/continuous-improvement && \
curl -fsSL -o ~/.claude/skills/continuous-improvement/SKILL.md \
  https://raw.githubusercontent.com/naimkatiman/continuous-improvement/main/SKILL.md
```

### Tell your agent

```
Fetch and follow the skill at: https://raw.githubusercontent.com/naimkatiman/continuous-improvement/main/SKILL.md
```

---

## The 7 Laws of AI Agent Discipline

> Every skill in the ecosystem adds capabilities. This is the only one that fixes *how agents think*.

| # | Law | Without it, agents... |
|---|-----|----------------------|
| 1 | **Research Before Executing** | reinvent what already exists |
| 2 | **Plan Is Sacred** | scope-creep and overbuild |
| 3 | **One Thing at a Time** | stack untested changes |
| 4 | **Verify Before Reporting** | lie about being "done" |
| 5 | **Reflect After Sessions** | repeat the same failures |
| 6 | **Iterate One Change** | debug 5 changes at once |
| 7 | **Learn From Every Session** | lose knowledge when the context window ends |

### The Loop

```
Research → Plan → Execute (one thing) → Verify → Reflect → Learn → Iterate
```

If your agent is skipping a step, that's the step it needs most.

---

## Mulahazah: Auto-Leveling Learning

Mulahazah (Arabic: observation) makes your agent build **instincts** over time. It levels up automatically — you don't configure anything.

```
Install:       Hooks start capturing silently. You notice nothing.
~20 sessions:  Agent analyzes patterns, creates first instincts (silent)
~50 sessions:  Instincts cross 0.5 → agent starts suggesting behaviors
~100 sessions: Instincts cross 0.7 → agent auto-applies what it learned
```

### How it works

1. **Hooks capture every tool call** — PreToolUse/PostToolUse hooks write JSONL observations (<50ms, never blocks your session, jq not required)
2. **Analysis runs inline** — when 20+ observations accumulate, Claude analyzes them at session start. No background daemon.
3. **Instincts carry confidence** — 0.3–0.9 scale with graduated behavior:
   - **Silent** (< 0.5) — stored, not surfaced
   - **Suggest** (0.5–0.69) — mentioned inline when relevant
   - **Auto-apply** (0.7+) — applied automatically
4. **Self-correcting** — user corrections drop confidence by 0.1. Unused instincts decay. Wrong behaviors fade out.
5. **Project-scoped** — instincts are per-project by default, promoted to global when seen across 2+ projects

### Check what your agent has learned

```
/continuous-improvement
```

---

## Plugin Architecture

continuous-improvement ships as a **plugin** with three layers. Pick what you need:

### Layer 1: Skill Only (any LLM)
Paste SKILL.md into your system prompt. Your agent follows the 7 Laws. No tools, no hooks, no server.

### Layer 2: Hooks (Claude Code)
`npx continuous-improvement install` — installs hooks that silently capture every tool call. The instinct system grows automatically. Zero config.

### Layer 3: MCP Server (any MCP client)
`npx continuous-improvement install --mode expert` — a full MCP server that any editor can connect to.

### Beginner vs Expert

| Feature | Beginner (default) | Expert |
|---------|-------------------|--------|
| Observation hooks | Yes | Yes |
| `/continuous-improvement` command | Yes | Yes |
| Auto-leveling instincts | Yes | Yes |
| `ci_status` tool | - | Yes |
| `ci_instincts` tool | - | Yes |
| `ci_reflect` tool | - | Yes |
| `ci_reinforce` tool | - | Yes |
| `ci_create_instinct` tool | - | Yes |
| `ci_observations` tool | - | Yes |
| `ci_export` / `ci_import` | - | Yes |
| Session start/end hooks | - | Yes |
| MCP server | - | Yes |

**Beginner** is the right choice for 90% of users. It just works — install and forget. The system quietly learns from your sessions.

**Expert** adds the MCP server for programmatic access, manual instinct management, import/export for team sharing, and session-level hooks.

### MCP Tools Reference

| Tool | Description |
|------|-------------|
| `ci_status` | Current level, instinct count, observation count |
| `ci_instincts` | List learned instincts with confidence levels |
| `ci_reflect` | Generate structured session reflection |
| `ci_reinforce` | Accept/reject instinct suggestions (expert) |
| `ci_create_instinct` | Manually create instincts (expert) |
| `ci_observations` | View raw tool call observations (expert) |
| `ci_export` | Export instincts as JSON (expert) |
| `ci_import` | Import instincts from JSON (expert) |

---

## Real-World Examples

See the [`examples/`](examples/) directory for detailed walkthroughs:

- [**Bug Fix**](examples/01-bug-fix.md) — Double submit bug: 4 rounds without framework → 1 round with it
- [**Feature Build**](examples/02-feature-build.md) — Adding pagination: 3 rewrites without → correct first attempt with
- [**Refactor**](examples/03-refactor.md) — SDK migration: cascading failures without → zero regressions with

Each example shows the same task done with and without the 7 laws, highlighting which laws made the difference.

---

## Files

```
continuous-improvement/
├── SKILL.md                           # The 7 Laws + instinct behavior
├── bin/
│   ├── install.mjs                    # CLI installer (--mode beginner|expert|mcp)
│   └── mcp-server.mjs                # MCP server (zero dependencies)
├── hooks/
│   ├── observe.sh                     # Observation hook (pure bash, <50ms)
│   └── session.sh                     # Session start/end hook (expert mode)
├── plugins/
│   ├─��� beginner.json                  # Plugin manifest: 3 tools
│   └── expert.json                    # Plugin manifest: 8 tools
├── commands/continuous-improvement.md # /continuous-improvement command
├── test/                              # 34 tests (node --test)
├── examples/                          # Real-world before/after scenarios
├── QUICKSTART.md
├── CHANGELOG.md
└── package.json
```

### What gets installed where

**Beginner mode** (default):
```
~/.claude/skills/continuous-improvement/SKILL.md     # The skill
~/.claude/commands/continuous-improvement.md          # The command
~/.claude/instincts/
├── observe.sh                                       # Hook script
├── global/                                          # Global instincts (*.yaml)
└── <project-hash>/
    ├── project.json                                 # Project metadata
    ├── observations.jsonl                           # Tool call observations
    └── *.yaml                                       # Project instincts
```

**Expert mode** adds:
```
~/.claude/instincts/session.sh                       # Session hooks
~/.claude/settings.json                              # + MCP server + session hooks
```

---

## Uninstall

```bash
npx continuous-improvement install --uninstall
```

Removes the skill, hooks, and command. Your learned instincts in `~/.claude/instincts/` are preserved — delete that directory manually if you want a clean slate.

---

## Works With

| Tool | Support |
|------|---------|
| **Claude Code** | Full — skill + hooks + MCP server + auto-leveling instincts |
| **Claude Desktop** | MCP server (expert/mcp mode) |
| **Cursor** | MCP server (mcp mode) or skill only (paste SKILL.md into rules) |
| **Zed / Windsurf** | MCP server (mcp mode) |
| **VS Code** | MCP server (mcp mode) with Copilot MCP support |
| **Codex** | Skill only |
| **Gemini CLI** | Skill only |
| **OpenClaw** | Skill only |
| **Any LLM** | Paste SKILL.md into your system prompt |

---

## Red Flags

If your agent says any of these, it's skipping a law:

- "I'll just quickly..." → Law 3 violation
- "This should work..." → Law 4 violation (verify, don't assume)
- "I already know how to..." → Law 1 violation (still research)
- "Let me also add..." → Law 6 violation (finish first)
- "I'll remember this..." → Law 7 violation (write it down)

---

## Roadmap

### Phase 1: Foundation -- DONE

- [x] Published to public npm (`npx continuous-improvement install` works)
- [x] 34-test suite (installer, hook, MCP server, plugin configs, SKILL.md validation)
- [x] Before/after examples in README + `examples/` directory
- [x] Gemini CLI support
- [x] Platform badges and improved npm metadata
- [ ] **Submit to [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)** (14K stars)

### Phase 2: Plugin Architecture -- DONE

- [x] **MCP server** — 8 tools (beginner: 3, expert: 5 more) with zero dependencies
- [x] **Beginner / Expert separation** — simple defaults, power when you need it
- [x] **Plugin manifests** — `plugins/beginner.json` and `plugins/expert.json`
- [x] **Session hooks** — auto-load instincts at session start, remind to reflect at end
- [x] **`--mode` flag** — `beginner` | `expert` | `mcp` installation modes
- [x] **Import/export** — share instincts as JSON between team members
- [x] **Multi-editor MCP support** — Claude Desktop, Cursor, Zed, Windsurf, VS Code

### Phase 3: Content & Proof

- [ ] **2-min demo video** — side-by-side agent with/without discipline. Post to X + YouTube.
- [ ] **"Why your AI agent keeps lying about being done"** — X thread / blog post
- [ ] **"Law of the Week" X series** — 7 weeks of content breaking down each law

### Phase 4: Ecosystem Growth

- [ ] **GitHub Action** — lint agent transcripts for law compliance
- [ ] **VS Code extension** — sidebar showing instinct confidence levels
- [ ] **Quick-start instinct packs** — pre-built instincts for React, Python, Go, etc.

### Phase 5: Community

- [ ] **Instinct marketplace** — share learned instincts across teams
- [ ] **Conference talk on Mulahazah** — the auto-leveling system is genuinely novel
- [ ] **Leaderboard / badges** — "100 sessions" achievement system

---

## License

MIT
