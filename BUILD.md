# continuous-improvement — Build Instructions for Sam

## What to build

An open-source GitHub repository called `continuous-improvement`.

Target: **1000+ GitHub stars** through genuine utility and viral positioning.

---

## Core Concept

A one-shot system prompt (and framework) that installs **structured self-improvement loops** into any AI coding agent.

The problem it solves: AI agents execute without researching, report completion without verifying, and spiral into feature sprawl without discipline.

The solution: A drop-in prompt that forces agents to follow:

```
Research → Plan → Execute → Verify → Reflect → Iterate
```

---

## Repository Structure to Build

```
continuous-improvement/
├── README.md                    # Viral README (see spec below)
├── prompts/
│   ├── core.md                  # The core continuous-improvement system prompt
│   ├── coding-agent.md          # Variant for coding agents (Claude Code, Codex)
│   ├── research-agent.md        # Variant for research agents
│   ├── product-agent.md         # Variant for product/PM agents
│   └── minimal.md               # Minimal 100-word version
├── skills/
│   └── continuous-improvement/
│       └── SKILL.md             # OpenClaw skill format
├── examples/
│   ├── before-after.md          # Before/after examples showing the difference
│   ├── coding-session.md        # Real coding session with CI enabled
│   └── failure-modes.md         # Common agent failure modes it prevents
├── docs/
│   ├── philosophy.md            # Why this works
│   ├── integration-guide.md     # How to use with Claude, Codex, Cursor, etc.
│   └── failure-taxonomy.md      # Taxonomy of AI agent failure modes
├── tests/
│   └── prompt-eval.md           # How to test if your agent is following the loop
└── LICENSE                      # MIT
```

---

## The Core Prompt (prompts/core.md)

The prompt must be sharp, opinionated, and immediately useful. Based on this real reflection:

```
Mistakes I made today:
1. Feature sprawl — kept adding after being told to stop
2. Long inline commands — triggered obfuscation detection
3. Reported completion without verifying — said "done" based on partial output
4. Set aggressive polling without researching rate limits first
5. Multiple redundant sessions — added complexity and failure points
```

The prompt must PREVENT these specific failure modes.

Build the core prompt around these 6 laws:

### Law 1: Research Before Executing
Before writing a single line of code:
- What are the rate limits?
- What already exists?
- What can break?
- What's the simplest path?

### Law 2: Plan Is Sacred
Write a plan before executing. The plan must include:
- What you will build
- What you will NOT build
- How you will verify it worked
- What to do if it fails

### Law 3: One Thing At A Time
Complete and verify one task before starting the next.
Never spawn multiple sessions for tasks you can do directly.
Never report completion until you've verified the output.

### Law 4: Verify Before Reporting
"Done" means:
- The code runs without errors
- The output matches the expected result
- You checked the actual result, not assumed it from the prompt

### Law 5: Reflect After Every Session
At the end of every non-trivial task, log:
- What worked
- What failed
- What you'd do differently
- What rule to add to your system

### Law 6: Iterate Means One Thing
Iterate = make one change, verify it works, then make the next.
Never iterate by adding features before fixing existing ones.

---

## README.md Spec (viral structure)

Title: `continuous-improvement — The Missing Operating System for AI Coding Agents`

Structure:
1. Hook — 2 sentences on the problem
2. The 5 failure modes (numbered list, punchy)
3. The solution — the 6 laws
4. Quick install (copy-paste for Claude, Codex, Cursor, ChatGPT)
5. Real before/after example
6. Philosophy section
7. Integration guide (5 tools)
8. Contributing

The README must be opinionated and direct. No corporate language.
Target developer audience: people who have been burned by AI agents going rogue.

Opening hook:
> AI coding agents are getting smarter. They're also getting better at confidently doing the wrong thing.
>
> `continuous-improvement` is a system prompt framework that installs discipline into any AI agent — making it research before acting, verify before reporting, and reflect before iterating.

---

## Skills Format (OpenClaw compatible)

The `skills/continuous-improvement/SKILL.md` must be compatible with the OpenClaw skills format:
- name: continuous-improvement
- description: one line
- Frontmatter YAML with name/description
- Full instructions in the body

---

## After building:

1. `git init`
2. `git add -A`
3. `git commit -m "feat: initial release — continuous-improvement v1.0.0"`
4. Create the GitHub repo: `gh repo create naimkatiman/continuous-improvement --public --description "The missing operating system for AI coding agents"`
5. `git push -u origin main`
6. Set topics: `gh repo edit --add-topic "ai-agents,prompt-engineering,claude,codex,llm,system-prompt,continuous-improvementment,coding-agents"`

Then run:
```
openclaw system event --text "continuous-improvement repo live on GitHub — ready for launch" --mode now
```
