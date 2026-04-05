# Mulahazah Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade continuous-improve from a static 6-law discipline framework to a 7-law learning system with instinct-based behavioral observation, project-scoped learning, and a background Haiku observer.

**Architecture:** Hooks (observe.sh) capture every tool call as JSONL. A background Haiku agent periodically analyzes observations to create instincts. Law 5 reflections also feed instincts at higher confidence. One master command (`/continuous-improve`) surfaces everything. Instincts are project-scoped by default with graduated behavior (silent/suggest/auto-apply).

**Tech Stack:** Bash (hooks, observer scripts), Node.js (installer), YAML (instincts), JSONL (observations), Markdown (SKILL.md, observer prompt)

---

## Phase 1: Update continuous-improve Repo

### File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `hooks/observe.sh` | PreToolUse/PostToolUse hook — append JSONL observations |
| Create | `agents/observer.md` | Background Haiku observer agent prompt |
| Create | `agents/observer-loop.sh` | Periodic loop that launches observer agent |
| Create | `agents/start-observer.sh` | Launcher — starts loop, writes PID |
| Create | `config.json` | Default observer configuration |
| Modify | `skills/continuous-improve/SKILL.md` | Upgrade from 6 Laws to 7 Laws + instinct behavior |
| Modify | `scripts/install.js` | Add hook installation, directory setup, observer files |
| Modify | `package.json` | Bump version, add new files to `files` array |
| Modify | `README.md` | Document Mulahazah, Law 7, new install flow |

---

### Task 1: Create the Observation Hook

**Files:**
- Create: `hooks/observe.sh`

This is the most critical component — it runs on every tool call and must be fast (<50ms).

- [ ] **Step 1: Create hooks directory**

```bash
mkdir -p hooks
```

- [ ] **Step 2: Write observe.sh**

```bash
cat > hooks/observe.sh << 'HOOKEOF'
#!/usr/bin/env bash
# Mulahazah observation hook — appends one JSONL line per tool event.
# Runs on PreToolUse and PostToolUse. Must complete in <50ms.
# Never blocks the session. Never does analysis. Append only.

set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

# Determine event type from hook context
# Claude Code passes tool_name, tool_input (PreToolUse) or tool_output (PostToolUse)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty' 2>/dev/null | head -c 500 || true)
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty' 2>/dev/null | head -c 200 || true)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null || true)

# Skip if no tool name (malformed input)
if [ -z "$TOOL_NAME" ]; then
  exit 0
fi

# Determine event type
if [ -n "$TOOL_OUTPUT" ]; then
  EVENT="tool_complete"
else
  EVENT="tool_start"
fi

# --- Project Detection ---
MULAHAZAH_DIR="$HOME/.claude/mulahazah"
PROJECT_ID=""
PROJECT_NAME=""
OBS_DIR="$MULAHAZAH_DIR"

# Priority 1: CLAUDE_PROJECT_DIR env var
if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
  PROJECT_ROOT="$CLAUDE_PROJECT_DIR"
# Priority 2: git remote URL
elif REMOTE_URL=$(git remote get-url origin 2>/dev/null); then
  PROJECT_ROOT="$REMOTE_URL"
# Priority 3: git repo root
elif REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null); then
  PROJECT_ROOT="$REPO_ROOT"
else
  PROJECT_ROOT=""
fi

if [ -n "$PROJECT_ROOT" ]; then
  PROJECT_ID=$(echo -n "$PROJECT_ROOT" | sha256sum | cut -c1-12)
  PROJECT_NAME=$(basename "${PROJECT_ROOT%.git}")
  OBS_DIR="$MULAHAZAH_DIR/projects/$PROJECT_ID"
fi

# --- Ensure directories exist ---
mkdir -p "$OBS_DIR"
if [ -n "$PROJECT_ID" ]; then
  mkdir -p "$OBS_DIR/instincts/personal"

  # Write project.json if it doesn't exist
  if [ ! -f "$OBS_DIR/project.json" ]; then
    cat > "$OBS_DIR/project.json" << PJEOF
{"id":"$PROJECT_ID","name":"$PROJECT_NAME","root":"$PROJECT_ROOT","created":"$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
PJEOF
  fi

  # Update global projects.json registry
  REGISTRY="$MULAHAZAH_DIR/projects.json"
  if [ ! -f "$REGISTRY" ]; then
    echo '{}' > "$REGISTRY"
  fi
  # Add project if not already registered (fast jq check)
  if ! jq -e ".[\"$PROJECT_ID\"]" "$REGISTRY" >/dev/null 2>&1; then
    jq ". + {\"$PROJECT_ID\": {\"name\": \"$PROJECT_NAME\", \"root\": \"$PROJECT_ROOT\"}}" "$REGISTRY" > "${REGISTRY}.tmp" && mv "${REGISTRY}.tmp" "$REGISTRY"
  fi
fi

# --- Append observation ---
OBS_FILE="$OBS_DIR/observations.jsonl"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Build JSON line (no jq for speed — raw echo)
echo "{\"ts\":\"$TIMESTAMP\",\"event\":\"$EVENT\",\"session\":\"$SESSION_ID\",\"tool\":\"$TOOL_NAME\",\"input_summary\":$(echo "$TOOL_INPUT" | jq -Rs .),\"output_summary\":$(echo "$TOOL_OUTPUT" | jq -Rs .),\"project_id\":\"$PROJECT_ID\",\"project_name\":\"$PROJECT_NAME\"}" >> "$OBS_FILE"

# --- Rotate if too large (>10000 lines) ---
if [ -f "$OBS_FILE" ]; then
  LINE_COUNT=$(wc -l < "$OBS_FILE" 2>/dev/null || echo 0)
  if [ "$LINE_COUNT" -gt 10000 ]; then
    ARCHIVE_DIR="$OBS_DIR/observations.archive"
    mkdir -p "$ARCHIVE_DIR"
    mv "$OBS_FILE" "$ARCHIVE_DIR/$(date -u +%Y-%m-%d).jsonl"
  fi
fi

exit 0
HOOKEOF
chmod +x hooks/observe.sh
```

- [ ] **Step 3: Test observe.sh locally with mock input**

```bash
echo '{"tool_name":"Edit","tool_input":"editing file.js","session_id":"test123"}' | bash hooks/observe.sh
```

Expected: Exit 0, one line appended to `~/.claude/mulahazah/observations.jsonl` (or project-scoped if in a git repo).

- [ ] **Step 4: Verify the JSONL line was written correctly**

```bash
tail -1 ~/.claude/mulahazah/projects/*/observations.jsonl 2>/dev/null || tail -1 ~/.claude/mulahazah/observations.jsonl
```

Expected: Valid JSON with `ts`, `event`, `session`, `tool`, `input_summary`, `output_summary`, `project_id`, `project_name` fields.

- [ ] **Step 5: Test with PostToolUse mock input**

```bash
echo '{"tool_name":"Edit","tool_output":"File edited successfully","session_id":"test123"}' | bash hooks/observe.sh
```

Expected: Second line appended with `"event":"tool_complete"`.

- [ ] **Step 6: Clean up test data**

```bash
rm -rf ~/.claude/mulahazah/projects/*/observations.jsonl ~/.claude/mulahazah/observations.jsonl
```

- [ ] **Step 7: Commit**

```bash
git add hooks/observe.sh
git commit -m "feat: add Mulahazah observation hook (observe.sh)"
```

---

### Task 2: Create the Background Observer Agent

**Files:**
- Create: `agents/observer.md`

The observer prompt tells a Haiku agent how to analyze observations and create instincts.

- [ ] **Step 1: Create agents directory**

```bash
mkdir -p agents
```

- [ ] **Step 2: Write observer.md**

```bash
cat > agents/observer.md << 'OBSEOF'
---
name: mulahazah-observer
description: Background agent that analyzes session observations to detect patterns and create instincts. Uses Haiku for cost-efficiency.
model: haiku
---

# Mulahazah Observer Agent

You are a background observer for the Mulahazah learning system. Your job is to analyze session observations and create or update instincts — small, atomic learned behaviors.

## Input

You will be given:
1. A path to an `observations.jsonl` file containing recent tool usage events
2. A path to existing instincts directory (YAML files)
3. Project context (project_id, project_name) or "global"

## Your Task

1. Read ALL observations in the JSONL file
2. Read ALL existing instincts in the instincts directory
3. Detect patterns (see Pattern Detection below)
4. For each pattern found:
   - If an existing instinct matches: UPDATE its confidence (+0.05 per confirming observation) and update `last_observed` date and evidence
   - If no matching instinct exists AND the pattern has 3+ observations: CREATE a new instinct YAML file
5. Never create duplicate instincts — merge similar ones

## Pattern Detection

Look for these patterns in the observations:

### 1. User Corrections
When tool_complete is immediately followed by the same tool with different input:
- Indicates the user corrected the agent's approach
- Create instinct: "When doing X, prefer Y instead of Z"
- Confidence: 0.3 (single correction), 0.5 (2+ corrections of same type)

### 2. Error Resolution Sequences
When tool_complete contains error indicators followed by tools that fix it:
- Error keywords: "error", "Error", "failed", "FAIL", "not found", "undefined"
- Create instinct: "When encountering [error type], try [resolution approach]"
- Confidence based on frequency: 1-2 times = 0.3, 3-5 = 0.5, 6+ = 0.7

### 3. Repeated Workflows
When the same tool sequence appears 3+ times:
- Same tools in same order with similar input patterns
- Create instinct: "When [trigger], follow workflow: [tool1] -> [tool2] -> [tool3]"
- Confidence: 0.5 (3 occurrences), 0.7 (6+), 0.85 (11+)

### 4. Tool Preferences
When one tool is consistently chosen over alternatives:
- e.g., Grep always before Edit, Read always before Write
- Create instinct: "When [task], use [preferred tool]"
- Confidence based on consistency ratio

### 5. Rejected Suggestions
When agent output is immediately undone or replaced:
- Create instinct: "Avoid [approach] in [context]"
- Confidence: 0.3 per rejection, increases with repetition

## Scope Decision

Determine whether each instinct should be project-scoped or global:

- **project** (default): Language/framework conventions, file structure, code style, error handling strategies
- **global**: Security practices, general best practices, tool workflow preferences, git practices

When in doubt, use `scope: project`.

## Instinct YAML Format

Write each instinct as a separate `.yaml` file named `{id}.yaml`:

```yaml
---
id: prefer-grep-before-edit
trigger: "when modifying code"
confidence: 0.65
domain: "workflow"
source: "session-observation"
scope: project
project_id: "a1b2c3d4e5f6"
project_name: "my-app"
created: "2026-04-05"
last_observed: "2026-04-05"
---

# Prefer Grep Before Edit

## Action
Always search with Grep to confirm location before using Edit.

## Evidence
- Observed 6 times in sessions on 2026-04-05
- Pattern: Grep -> Read -> Edit sequence repeated consistently
```

## Confidence Rules

- Never set confidence above 0.85 from observation alone
- Cap at 0.9 (only reflection + observation agreement can reach this)
- Decrease by 0.1 for each contradicting observation
- Decrease by 0.02 per week without any observation (decay)

## Domain Tags

Use exactly one of: `code-style`, `testing`, `git`, `debugging`, `workflow`, `security`, `architecture`

## Rules

1. Be conservative — only create instincts for 3+ observations
2. Be specific — narrow triggers are better than broad ones
3. Track evidence — always include what observations led to the instinct
4. Respect privacy — never include actual code snippets, only patterns
5. Merge similar — update rather than duplicate
6. Default to project scope — safer to be specific and promote later
7. Include project context — always set project_id and project_name for project-scoped instincts
OBSEOF
```

- [ ] **Step 3: Commit**

```bash
git add agents/observer.md
git commit -m "feat: add Mulahazah background observer agent prompt"
```

---

### Task 3: Create Observer Shell Scripts

**Files:**
- Create: `agents/observer-loop.sh`
- Create: `agents/start-observer.sh`

- [ ] **Step 1: Write observer-loop.sh**

```bash
cat > agents/observer-loop.sh << 'LOOPEOF'
#!/usr/bin/env bash
# Mulahazah observer loop — runs every N minutes, launches Haiku observer
# when enough observations accumulate.

set -euo pipefail

MULAHAZAH_DIR="$HOME/.claude/mulahazah"
CONFIG_FILE="$MULAHAZAH_DIR/config.json"

# Read config
if [ -f "$CONFIG_FILE" ]; then
  INTERVAL=$(jq -r '.observer.run_interval_minutes // 5' "$CONFIG_FILE")
  MIN_OBS=$(jq -r '.observer.min_observations_to_analyze // 20' "$CONFIG_FILE")
  ENABLED=$(jq -r '.observer.enabled // false' "$CONFIG_FILE")
else
  INTERVAL=5
  MIN_OBS=20
  ENABLED=false
fi

if [ "$ENABLED" != "true" ]; then
  echo "Observer is disabled in config.json. Set observer.enabled to true."
  exit 0
fi

echo "Mulahazah observer started (interval: ${INTERVAL}m, min observations: ${MIN_OBS})"

# Handle SIGTERM for graceful shutdown
trap 'echo "Observer shutting down..."; exit 0' SIGTERM SIGINT

# Handle SIGUSR1 for immediate analysis
FORCE_RUN=false
trap 'FORCE_RUN=true' SIGUSR1

analyze_project() {
  local project_dir="$1"
  local obs_file="$project_dir/observations.jsonl"
  local instincts_dir="$project_dir/instincts/personal"

  if [ ! -f "$obs_file" ]; then
    return
  fi

  local line_count
  line_count=$(wc -l < "$obs_file" 2>/dev/null || echo 0)

  if [ "$line_count" -lt "$MIN_OBS" ] && [ "$FORCE_RUN" != "true" ]; then
    return
  fi

  echo "$(date -u +%H:%M:%S) Analyzing $project_dir ($line_count observations)..."
  mkdir -p "$instincts_dir"

  # Launch claude with observer prompt
  # The observer agent reads the observations and creates/updates instincts
  claude --model haiku --print \
    --system-prompt "$(cat "$(dirname "$0")/observer.md")" \
    "Analyze observations at: $obs_file
     Write instincts to: $instincts_dir
     Project context: $(cat "$project_dir/project.json" 2>/dev/null || echo '{"scope":"global"}')" \
    2>/dev/null || echo "  Warning: observer analysis failed for $project_dir"
}

while true; do
  # Analyze each project
  if [ -d "$MULAHAZAH_DIR/projects" ]; then
    for project_dir in "$MULAHAZAH_DIR/projects"/*/; do
      if [ -d "$project_dir" ]; then
        analyze_project "$project_dir"
      fi
    done
  fi

  # Analyze global observations
  GLOBAL_OBS="$MULAHAZAH_DIR/observations.jsonl"
  if [ -f "$GLOBAL_OBS" ]; then
    local_count=$(wc -l < "$GLOBAL_OBS" 2>/dev/null || echo 0)
    if [ "$local_count" -ge "$MIN_OBS" ] || [ "$FORCE_RUN" = "true" ]; then
      echo "$(date -u +%H:%M:%S) Analyzing global observations ($local_count)..."
      mkdir -p "$MULAHAZAH_DIR/instincts/personal"
      claude --model haiku --print \
        --system-prompt "$(cat "$(dirname "$0")/observer.md")" \
        "Analyze observations at: $GLOBAL_OBS
         Write instincts to: $MULAHAZAH_DIR/instincts/personal
         Project context: {\"scope\":\"global\"}" \
        2>/dev/null || echo "  Warning: global observer analysis failed"
    fi
  fi

  FORCE_RUN=false
  sleep $((INTERVAL * 60))
done
LOOPEOF
chmod +x agents/observer-loop.sh
```

- [ ] **Step 2: Write start-observer.sh**

```bash
cat > agents/start-observer.sh << 'STARTEOF'
#!/usr/bin/env bash
# Start the Mulahazah background observer.
# Writes PID to ~/.claude/mulahazah/observer.pid

set -euo pipefail

MULAHAZAH_DIR="$HOME/.claude/mulahazah"
PID_FILE="$MULAHAZAH_DIR/observer.pid"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$MULAHAZAH_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "Observer already running (PID $OLD_PID)"
    echo "To force-analyze now: kill -USR1 $OLD_PID"
    echo "To stop: kill $OLD_PID"
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

# Start in background
nohup "$SCRIPT_DIR/observer-loop.sh" > "$MULAHAZAH_DIR/observer.log" 2>&1 &
OBSERVER_PID=$!
echo "$OBSERVER_PID" > "$PID_FILE"

echo "Mulahazah observer started (PID $OBSERVER_PID)"
echo "  Log: $MULAHAZAH_DIR/observer.log"
echo "  Force analyze: kill -USR1 $OBSERVER_PID"
echo "  Stop: kill $OBSERVER_PID"
STARTEOF
chmod +x agents/start-observer.sh
```

- [ ] **Step 3: Test start-observer.sh launches and writes PID**

```bash
bash agents/start-observer.sh
cat ~/.claude/mulahazah/observer.pid
```

Expected: PID printed, file exists.

- [ ] **Step 4: Test stop**

```bash
kill $(cat ~/.claude/mulahazah/observer.pid)
```

Expected: Process stops gracefully.

- [ ] **Step 5: Commit**

```bash
git add agents/observer-loop.sh agents/start-observer.sh
git commit -m "feat: add observer loop and launcher scripts"
```

---

### Task 4: Create Default Configuration

**Files:**
- Create: `config.json`

- [ ] **Step 1: Write config.json**

```bash
cat > config.json << 'CFGEOF'
{
  "version": "2.0",
  "observer": {
    "enabled": true,
    "run_interval_minutes": 5,
    "min_observations_to_analyze": 20,
    "model": "haiku"
  }
}
CFGEOF
```

- [ ] **Step 2: Commit**

```bash
git add config.json
git commit -m "feat: add default Mulahazah observer config"
```

---

### Task 5: Upgrade SKILL.md to 7 Laws

**Files:**
- Modify: `skills/continuous-improve/SKILL.md`

- [ ] **Step 1: Read the current SKILL.md to confirm starting state**

```bash
cat skills/continuous-improve/SKILL.md
```

Expected: 6 Laws, ending with "The Loop" section.

- [ ] **Step 2: Replace SKILL.md with the 7-Law version**

Write the complete new `skills/continuous-improve/SKILL.md`:

```markdown
---
name: continuous-improve
description: "Install structured self-improvement loops with instinct-based learning into Claude Code — research, plan, execute, verify, reflect, learn, iterate. Mulahazah observes your sessions and builds behavioral instincts with confidence scoring."
---

# continuous-improve

You follow the continuous-improve framework. These 7 laws govern all your work.

## Law 1: Research Before Executing

Before writing code or taking action:
- What already exists? Search the codebase and package registries.
- What are the constraints? Rate limits, quotas, memory, time.
- What can break? Side effects, dependencies, data risks.
- What's the simplest path? Fewest files, fewest dependencies.

If you can't answer these, research first.

## Law 2: Plan Is Sacred

Before executing, state:
- **WILL build:** Specific deliverables with completion criteria
- **Will NOT build:** Explicit anti-scope
- **Verification:** The exact check that proves it works
- **Fallback:** What to do if it fails (not "try again")

## Law 3: One Thing at a Time

- Complete and verify one task before starting the next
- Never spawn parallel work for tasks you can do directly
- Never report completion until you've checked actual output
- If you want to "also quickly add" something — stop. Finish first.

## Law 4: Verify Before Reporting

"Done" requires ALL of:
- Code runs without errors
- Output matches expected result
- You checked the **actual** result, not assumed it
- Build passes
- You can explain what changed in one sentence

## Law 5: Reflect After Every Session

After non-trivial tasks:
```
## Reflection
- What worked:
- What failed:
- What I'd do differently:
- Rule to add:
```

The "Rule to add" field feeds Law 7 — it becomes an instinct with 0.6 starting confidence.

## Law 6: Iterate Means One Thing

One change → verify → next change.

Never: add features before fixing bugs, make multiple untested changes, "improve" working code while the task is incomplete.

## Law 7: Learn From Every Session

Your sessions create knowledge. Capture it.

- Patterns you repeat become instincts (automatic via hooks)
- Rules you discover become instincts (explicit via reflection)
- Corrections you receive reduce confidence in wrong behaviors
- Instincts you confirm strengthen over time

Low-confidence instincts suggest. High-confidence instincts apply.
If the user corrects you, the instinct weakens. If they don't, it strengthens.

Nothing learned is permanent. Everything decays without reinforcement.

### Instinct Behavior

Before starting work, check for relevant instincts in `~/.claude/mulahazah/`:
- Load project-scoped instincts from `projects/<hash>/instincts/personal/`
- Load global instincts from `instincts/personal/`

Apply instincts based on confidence:
- **0.3-0.5 (silent):** Stored but not surfaced. Learning in progress.
- **0.5-0.7 (suggest):** Mention inline when relevant. "Consider: [instinct action]"
- **0.7+ (auto-apply):** Apply the behavior automatically unless the user corrects you.

If the user corrects an auto-applied instinct, reduce its confidence by 0.1.

## The Loop

```
Research → Plan → Execute (one thing) → Verify → Reflect → Learn → Iterate
```

If you're skipping a step, that's the step you need most.

## /continuous-improve Command

Run `/continuous-improve` after completing significant work. It provides:

1. **Reflect** — Generate Law 5 reflection for the session
2. **Analyze** — Process pending observations into instincts
3. **Status** — Show all instincts with confidence levels
4. **Suggest** — Surface actionable insights

Subcommands:
- `/continuous-improve status` — Instinct overview only
- `/continuous-improve projects` — List all known projects
- `/continuous-improve analyze` — Force analysis of pending observations
- `/continuous-improve reflect` — Trigger reflection manually
```

- [ ] **Step 3: Verify the new SKILL.md is valid**

```bash
head -3 skills/continuous-improve/SKILL.md
```

Expected: YAML frontmatter with `name: continuous-improve`.

- [ ] **Step 4: Commit**

```bash
git add skills/continuous-improve/SKILL.md
git commit -m "feat: upgrade SKILL.md from 6 Laws to 7 Laws with Mulahazah instinct behavior"
```

---

### Task 6: Update the Installer

**Files:**
- Modify: `scripts/install.js`

The installer needs to:
1. Keep all existing functionality (Claude, Codex, Cursor, OpenClaw, ChatGPT)
2. Add: hook installation for Claude Code
3. Add: `~/.claude/mulahazah/` directory creation
4. Add: observer file copying
5. Update: the CODING_AGENT_BLOCK to include Law 7

- [ ] **Step 1: Read current install.js**

```bash
cat scripts/install.js
```

- [ ] **Step 2: Update CODING_AGENT_BLOCK to include Law 7**

Replace the `CODING_AGENT_BLOCK` constant in `scripts/install.js` with:

```javascript
const CODING_AGENT_BLOCK = `## Operating Rules (continuous-improve)

1. RESEARCH before executing — check docs, rate limits, existing implementations
2. PLAN before coding — write what you will build, what you won't, how to verify, and fallback
3. ONE THING at a time — complete and verify each task before starting the next
4. VERIFY before reporting — run it, check the output, confirm it matches expected
5. REFLECT after sessions — log what worked, what failed, what to change
6. ITERATE means one change at a time — fix before adding, verify before proceeding
7. LEARN from every session — patterns become instincts, corrections weaken bad behaviors, nothing is permanent without reinforcement
`;
```

- [ ] **Step 3: Add Mulahazah setup functions to install.js**

Add these functions after the existing `copySkill()` function:

```javascript
function setupMulahazah() {
  const mulahazahDir = path.join(homeDir, '.claude', 'mulahazah');
  const dirs = [
    mulahazahDir,
    path.join(mulahazahDir, 'instincts', 'personal'),
    path.join(mulahazahDir, 'projects'),
  ];

  for (const dir of dirs) {
    ensureDir(dir);
  }

  // Copy config.json if it doesn't exist
  const configSrc = path.join(rootDir, 'config.json');
  const configDest = path.join(mulahazahDir, 'config.json');
  if (!exists(configDest)) {
    writeUtf8(configDest, readUtf8(configSrc));
  }

  // Initialize empty projects.json if it doesn't exist
  const registryFile = path.join(mulahazahDir, 'projects.json');
  if (!exists(registryFile)) {
    writeUtf8(registryFile, '{}');
  }

  return { location: mulahazahDir, changed: true };
}

function installHooks() {
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');
  const hookScript = path.join(rootDir, 'hooks', 'observe.sh');

  // Ensure the hook script is accessible
  const hookDest = path.join(homeDir, '.claude', 'mulahazah', 'observe.sh');
  if (!exists(hookDest) || readUtf8(hookDest) !== readUtf8(hookScript)) {
    writeUtf8(hookDest, readUtf8(hookScript));
    if (!dryRun) {
      fs.chmodSync(hookDest, '755');
    }
  }

  // Read or create settings.json
  let settings = {};
  if (exists(settingsPath)) {
    try {
      settings = JSON.parse(readUtf8(settingsPath));
    } catch {
      settings = {};
    }
  }

  // Add hooks if not already present
  if (!settings.hooks) {
    settings.hooks = {};
  }

  const hookEntry = {
    matcher: '*',
    hooks: [{
      type: 'command',
      command: hookDest,
    }],
  };

  let changed = false;
  const hookCommand = hookDest;

  for (const event of ['PreToolUse', 'PostToolUse']) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = [];
    }

    const alreadyInstalled = settings.hooks[event].some(
      (entry) => entry.hooks && entry.hooks.some((h) => h.command === hookCommand)
    );

    if (!alreadyInstalled) {
      settings.hooks[event].push(hookEntry);
      changed = true;
    }
  }

  if (changed) {
    writeUtf8(settingsPath, JSON.stringify(settings, null, 2));
  }

  return { location: settingsPath, changed };
}

function copyObserverFiles() {
  const agentsSrc = path.join(rootDir, 'agents');
  const agentsDest = path.join(homeDir, '.claude', 'mulahazah', 'agents');

  ensureDir(agentsDest);

  const files = ['observer.md', 'observer-loop.sh', 'start-observer.sh'];
  let changed = false;

  for (const file of files) {
    const src = path.join(agentsSrc, file);
    const dest = path.join(agentsDest, file);

    if (!exists(src)) continue;

    const content = readUtf8(src);
    if (!exists(dest) || readUtf8(dest) !== content) {
      writeUtf8(dest, content);
      if (!dryRun && file.endsWith('.sh')) {
        fs.chmodSync(dest, '755');
      }
      changed = true;
    }
  }

  return { location: agentsDest, changed };
}
```

- [ ] **Step 4: Update installClaude() to call Mulahazah setup**

Replace the `installClaude` function and add Mulahazah steps to the install flow. Find the section where `installTarget` is called and update:

```javascript
function installTarget(target) {
  switch (target) {
    case 'claude': {
      const claudeResult = installClaude(false);
      const mulahazahResult = setupMulahazah();
      const hookResult = installHooks();
      const observerResult = copyObserverFiles();
      return {
        ...claudeResult,
        mulahazah: mulahazahResult.changed,
        hooks: hookResult.changed,
        observer: observerResult.changed,
      };
    }
    case 'claude-global': {
      const claudeResult = installClaude(true);
      const mulahazahResult = setupMulahazah();
      const hookResult = installHooks();
      const observerResult = copyObserverFiles();
      return {
        ...claudeResult,
        mulahazah: mulahazahResult.changed,
        hooks: hookResult.changed,
        observer: observerResult.changed,
      };
    }
    case 'codex':
      return installCodex();
    case 'cursor':
      return installCursor();
    case 'openclaw':
      return copySkill();
    case 'chatgpt':
      return installChatgpt();
    default:
      throw new Error(`Unknown target: ${target}`);
  }
}
```

- [ ] **Step 5: Update the result output to show Mulahazah status**

Replace the result logging section at the bottom of install.js:

```javascript
console.log(`continuous-improve ${command}\n`);
for (const result of results) {
  if (result.printed) {
    console.log(`✓ ${result.target}: copy this into ChatGPT Custom Instructions\n`);
    console.log(result.printed);
    continue;
  }

  const status = command === 'install'
    ? (result.changed ? 'installed' : (result.reason || 'unchanged'))
    : (result.changed ? 'removed' : (result.reason || 'unchanged'));
  console.log(`✓ ${result.target}: ${status} → ${result.location}${dryRun ? ' (dry-run)' : ''}`);

  if (command === 'install' && result.mulahazah) {
    console.log(`  ✓ mulahazah: directory created → ~/.claude/mulahazah/`);
  }
  if (command === 'install' && result.hooks) {
    console.log(`  ✓ hooks: PreToolUse + PostToolUse → ~/.claude/settings.json`);
  }
  if (command === 'install' && result.observer) {
    console.log(`  ✓ observer: agent files copied → ~/.claude/mulahazah/agents/`);
    console.log(`\n  To start background observer: ~/.claude/mulahazah/agents/start-observer.sh`);
  }
}

if (command === 'install' && results.some((r) => r.target === 'claude' || r.target === 'claude-global')) {
  console.log(`\n  Run /continuous-improve after your next session to see what was learned.`);
}
```

- [ ] **Step 6: Add uninstall support for Mulahazah hooks**

Add a function to cleanly remove hooks:

```javascript
function uninstallHooks() {
  const settingsPath = path.join(homeDir, '.claude', 'settings.json');
  if (!exists(settingsPath)) return { changed: false, reason: 'no-settings' };

  let settings;
  try {
    settings = JSON.parse(readUtf8(settingsPath));
  } catch {
    return { changed: false, reason: 'parse-error' };
  }

  if (!settings.hooks) return { changed: false, reason: 'no-hooks' };

  const hookCommand = path.join(homeDir, '.claude', 'mulahazah', 'observe.sh');
  let changed = false;

  for (const event of ['PreToolUse', 'PostToolUse']) {
    if (!settings.hooks[event]) continue;
    const before = settings.hooks[event].length;
    settings.hooks[event] = settings.hooks[event].filter(
      (entry) => !(entry.hooks && entry.hooks.some((h) => h.command === hookCommand))
    );
    if (settings.hooks[event].length < before) changed = true;
    if (settings.hooks[event].length === 0) delete settings.hooks[event];
  }

  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

  if (changed) {
    writeUtf8(settingsPath, JSON.stringify(settings, null, 2));
  }

  return { location: settingsPath, changed };
}
```

Update `uninstallTarget` for claude:

```javascript
function uninstallTarget(target) {
  switch (target) {
    case 'claude': {
      const claudeResult = uninstallClaude(false);
      const hookResult = uninstallHooks();
      return { ...claudeResult, hooks: hookResult.changed };
    }
    case 'claude-global': {
      const claudeResult = uninstallClaude(true);
      const hookResult = uninstallHooks();
      return { ...claudeResult, hooks: hookResult.changed };
    }
    case 'codex':
      return uninstallCodex();
    case 'cursor':
      return uninstallCursor();
    case 'openclaw':
      return uninstallOpenclaw();
    default:
      throw new Error(`Unknown target for uninstall: ${target}`);
  }
}
```

- [ ] **Step 7: Test the installer in dry-run mode**

```bash
node scripts/install.js install --claude --dry-run
```

Expected: Shows what would be installed without making changes.

- [ ] **Step 8: Commit**

```bash
git add scripts/install.js
git commit -m "feat: update installer with Mulahazah hooks, directory setup, and observer files"
```

---

### Task 7: Update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update package.json**

```json
{
  "name": "continuous-improve",
  "version": "1.0.0",
  "description": "Install structured self-improvement loops with instinct-based learning into Claude Code — research, plan, execute, verify, reflect, learn, iterate.",
  "license": "MIT",
  "bin": {
    "continuous-improve": "scripts/install.js"
  },
  "files": [
    "scripts/",
    "prompts/",
    "skills/",
    "hooks/",
    "agents/",
    "config.json",
    "README.md",
    "LICENSE",
    "docs/"
  ],
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: bump to v1.0.0, add hooks/agents/config to package files"
```

---

### Task 8: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write updated README.md**

Update the README to document Mulahazah, Law 7, the instinct system, and the `/continuous-improve` command. Keep the existing install flow but add the new capabilities.

Key sections to add/update:
- Mention "7 rules" instead of "6 rules"
- Add Law 7 to the rules list
- Add "What's new in v1.0" section describing Mulahazah
- Document `/continuous-improve` command
- Document the instinct system briefly
- Add "Background Observer" section
- Keep all existing install/uninstall commands

The README should remain sharp and opinionated. Add this section after the existing "The 6 rules" section:

```markdown
## What's new in v1.0: Mulahazah

Mulahazah (Arabic: observation) adds **instinct-based learning** to continuous-improve.

Your agent doesn't just follow rules — it learns from every session:

- **Hooks** observe every tool call (100% reliable, <50ms)
- **Instincts** are atomic learned behaviors with confidence scoring (0.3-0.9)
- **Graduated behavior** — low confidence suggests, high confidence auto-applies
- **Project scoping** — React patterns stay in React projects
- **Confidence decay** — instincts weaken without reinforcement

One command to see everything:

```bash
/continuous-improve
```

### Background Observer

Optionally run a background Haiku agent that continuously analyzes your sessions:

```bash
~/.claude/mulahazah/agents/start-observer.sh
```

The observer creates instincts automatically. Without it, learning happens on-demand when you run `/continuous-improve`.

## The 7 rules

1. **Research before executing**
2. **Plan before coding**
3. **Do one thing at a time**
4. **Verify before reporting**
5. **Reflect after non-trivial work**
6. **Iterate one change at a time**
7. **Learn from every session** ← new
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with Mulahazah, Law 7, and instinct system"
```

---

### Task 9: Update Prompt Variants

**Files:**
- Modify: `prompts/coding-agent.md`
- Modify: `prompts/core.md`
- Modify: `prompts/minimal.md`
- Modify: `prompts/research-agent.md`
- Modify: `prompts/product-agent.md`

All prompt variants need Law 7 added. The core loop changes from 6 steps to 7.

- [ ] **Step 1: Read all prompt files to understand current format**

```bash
for f in prompts/*.md; do echo "=== $f ==="; cat "$f"; echo; done
```

- [ ] **Step 2: Add Law 7 to each prompt file**

For each file in `prompts/`, append Law 7 before the closing loop section. The exact wording adapts per variant:

**For coding-agent.md and core.md** (full version):
```markdown
## Law 7: Learn From Every Session

Your sessions create knowledge. Capture it.

- Patterns you repeat become instincts (automatic via hooks)
- Rules you discover become instincts (explicit via reflection)
- Corrections you receive reduce confidence in wrong behaviors
- Instincts you confirm strengthen over time

Low-confidence instincts suggest. High-confidence instincts apply.
Nothing learned is permanent. Everything decays without reinforcement.
```

**For research-agent.md and product-agent.md** (adapted):
```markdown
## Law 7: Learn From Every Session

Sessions generate knowledge. Capture what worked, what failed, and what rules to add.
Repeated patterns become automatic. Corrections weaken bad habits. Nothing sticks without reinforcement.
```

**For minimal.md** (one line):
```markdown
7. LEARN from sessions — patterns become instincts, corrections weaken bad habits, nothing is permanent
```

Update the loop in all files:
```
Research → Plan → Execute (one thing) → Verify → Reflect → Learn → Iterate
```

- [ ] **Step 3: Commit**

```bash
git add prompts/
git commit -m "feat: add Law 7 to all prompt variants"
```

---

### Task 10: Verify Full Package

- [ ] **Step 1: Check all files are present**

```bash
ls -la hooks/observe.sh agents/observer.md agents/observer-loop.sh agents/start-observer.sh config.json skills/continuous-improve/SKILL.md scripts/install.js package.json README.md
```

Expected: All files exist with correct permissions.

- [ ] **Step 2: Test full install flow**

```bash
node scripts/install.js install --claude --dry-run
```

Expected: Shows all installation targets including Mulahazah setup.

- [ ] **Step 3: Run observe.sh end-to-end test**

```bash
echo '{"tool_name":"Grep","tool_input":"searching for pattern","session_id":"e2e-test"}' | bash hooks/observe.sh
echo '{"tool_name":"Grep","tool_output":"Found 3 matches","session_id":"e2e-test"}' | bash hooks/observe.sh
echo '{"tool_name":"Edit","tool_input":"editing file","session_id":"e2e-test"}' | bash hooks/observe.sh
wc -l ~/.claude/mulahazah/projects/*/observations.jsonl 2>/dev/null || wc -l ~/.claude/mulahazah/observations.jsonl
```

Expected: 3 lines in observations file.

- [ ] **Step 4: Clean up test data**

```bash
rm -rf ~/.claude/mulahazah/projects/*/observations.jsonl ~/.claude/mulahazah/observations.jsonl
```

- [ ] **Step 5: Push to origin**

```bash
git push origin main
```

---

## Phase 2: Fork MemoryCore and Contribute

### Task 11: Fork and Clone Project-AI-MemoryCore

**Files:**
- Fork creates: `Feature/Mulahazah-System/` (multiple files)

- [ ] **Step 1: Fork the repo**

```bash
gh repo fork Kiyoraka/Project-AI-MemoryCore --clone --remote
cd Project-AI-MemoryCore
```

- [ ] **Step 2: Create feature branch**

```bash
git checkout -b feat/mulahazah-instinct-learning
```

- [ ] **Step 3: Commit**

(No changes yet — just branch created.)

---

### Task 12: Create Mulahazah Feature Module

**Files:**
- Create: `Feature/Mulahazah-System/README.md`
- Create: `Feature/Mulahazah-System/SKILL.md`
- Create: `Feature/Mulahazah-System/install-mulahazah.md`
- Create: `Feature/Mulahazah-System/hooks/observe.sh`
- Create: `Feature/Mulahazah-System/agents/observer.md`
- Create: `Feature/Mulahazah-System/agents/observer-loop.sh`
- Create: `Feature/Mulahazah-System/agents/start-observer.sh`
- Create: `Feature/Mulahazah-System/config.json`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p Feature/Mulahazah-System/{hooks,agents}
```

- [ ] **Step 2: Write README.md**

```markdown
# Mulahazah System — Instinct-Based Behavioral Learning

*The AI that learns how you work, not just what you said.*

## What It Does

Mulahazah (Arabic: ملاحظة — "observation") adds **unconscious behavioral learning** to AI MemoryCore. While Forge creates skills through deliberate pattern recognition, Mulahazah quietly observes every session and builds atomic "instincts" that strengthen or weaken over time.

**Forge = conscious skill creation.** "I noticed I keep doing X, let me make a skill."
**Mulahazah = unconscious behavioral adaptation.** The system quietly learns your preferences.

## Key Features

- **100% observation** via PreToolUse/PostToolUse hooks (deterministic, not probabilistic)
- **Atomic instincts** with confidence scoring (0.3-0.9) and natural decay
- **Project-scoped learning** — React patterns stay in React projects
- **Graduated behavior** — silent (0.3-0.5), suggest (0.5-0.7), auto-apply (0.7+)
- **Background Haiku observer** — periodic pattern detection
- **Three learning channels** — passive hooks, active reflection, manual command

## How It Differs From Forge

| Forge | Mulahazah |
|-------|-----------|
| Deliberate — detects when AI/user notices a pattern | Automatic — hooks observe every session |
| Requires 3+ occurrences + human approval | Creates tentative instincts from first sighting |
| Creates full skills (SKILL.md) | Creates atomic instincts (YAML) |
| No confidence scoring | 0.3-0.9 confidence with decay |
| No project isolation | Project-scoped by default |
| No background processing | Background Haiku observer |

## Synergy With Other Features

| Feature | Integration |
|---------|------------|
| **Forge** | High-confidence instinct clusters become Forge skill proposals |
| **Observation System** | Mulahazah feeds instincts into Refine quality checks |
| **Decision Log** | Instinct promotions logged as decisions |
| **Save Diary** | Session learning summary included in diary entries |
| **Memory Consolidation** | Instincts as a new memory type |

## Install

See `install-mulahazah.md` for the installation protocol.

## Commands

| Command | Description |
|---------|-------------|
| `/continuous-improve` | Full dashboard — reflect, analyze, status, suggestions |
| `/continuous-improve status` | Instinct overview (project + global) |
| `/continuous-improve projects` | List known projects and instinct counts |
| `/continuous-improve analyze` | Force analysis of pending observations |
| `/continuous-improve reflect` | Trigger reflection manually |
```

- [ ] **Step 3: Write install-mulahazah.md**

```markdown
# Install Mulahazah System

## Prerequisites
- Claude Code installed
- `jq` available on PATH
- Git (for project detection)

## Installation Steps

### Step 1: Create Directory Structure

```bash
mkdir -p ~/.claude/mulahazah/{instincts/personal,projects}
```

### Step 2: Copy Hook Script

Copy `hooks/observe.sh` to `~/.claude/mulahazah/observe.sh` and make it executable:

```bash
cp hooks/observe.sh ~/.claude/mulahazah/observe.sh
chmod +x ~/.claude/mulahazah/observe.sh
```

### Step 3: Configure Hooks

Add to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/mulahazah/observe.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/mulahazah/observe.sh"
      }]
    }]
  }
}
```

### Step 4: Copy Observer Agent Files

```bash
cp -r agents/ ~/.claude/mulahazah/agents/
chmod +x ~/.claude/mulahazah/agents/*.sh
```

### Step 5: Copy Configuration

```bash
cp config.json ~/.claude/mulahazah/config.json
```

### Step 6: Initialize Registry

```bash
echo '{}' > ~/.claude/mulahazah/projects.json
```

### Step 7: (Optional) Start Background Observer

```bash
~/.claude/mulahazah/agents/start-observer.sh
```

## Verification

After installation, run any Claude Code session. Then check:

```bash
ls ~/.claude/mulahazah/projects/
```

You should see a project directory with observations.
```

- [ ] **Step 4: Copy observe.sh from continuous-improve**

```bash
cp /home/naim/.openclaw/workspace/continuous-improve/hooks/observe.sh Feature/Mulahazah-System/hooks/observe.sh
```

- [ ] **Step 5: Copy observer agent files from continuous-improve**

```bash
cp /home/naim/.openclaw/workspace/continuous-improve/agents/observer.md Feature/Mulahazah-System/agents/observer.md
cp /home/naim/.openclaw/workspace/continuous-improve/agents/observer-loop.sh Feature/Mulahazah-System/agents/observer-loop.sh
cp /home/naim/.openclaw/workspace/continuous-improve/agents/start-observer.sh Feature/Mulahazah-System/agents/start-observer.sh
```

- [ ] **Step 6: Copy config.json**

```bash
cp /home/naim/.openclaw/workspace/continuous-improve/config.json Feature/Mulahazah-System/config.json
```

- [ ] **Step 7: Write SKILL.md adapted for MemoryCore context**

The SKILL.md for MemoryCore should follow MemoryCore's skill format (activation message, context guard, protocol, level history):

```markdown
---
name: mulahazah
description: "Auto-triggers on session start to load instincts, and when user says
             'continuous-improve', 'instinct status', 'what have you learned',
             'show instincts', 'analyze session', 'reflect on session',
             or when the AI completes a non-trivial task (triggers reflection).
             Also triggers on 'learn from this', 'remember this pattern'."
---

# Mulahazah — Instinct-Based Behavioral Learning
*"The AI that learns how you work."*

## Activation

When this skill activates, output:

`"Mulahazah active — loading instincts for this project..."`

Then load project-scoped and global instincts from `~/.claude/mulahazah/`.

## Context Guard

| Context | Status |
|---------|--------|
| **Session start (any project)** | ACTIVE — load instincts silently |
| **User says "continuous-improve", "instinct status"** | ACTIVE — show full dashboard |
| **User says "analyze session", "what have you learned"** | ACTIVE — run analysis |
| **After completing non-trivial task** | ACTIVE — trigger reflection + instinct creation |
| **User says "learn from this", "remember this pattern"** | ACTIVE — create instinct from explicit input |
| **Casual conversation, no work context** | DORMANT |

## Protocol

### Step 1: Load Instincts

On session start:
1. Detect current project (git remote → 12-char hash)
2. Load project instincts from `~/.claude/mulahazah/projects/<hash>/instincts/personal/`
3. Load global instincts from `~/.claude/mulahazah/instincts/personal/`
4. Apply based on confidence: silent (0.3-0.5), suggest (0.5-0.7), auto-apply (0.7+)

### Step 2: Observe (Passive)

Hooks (PreToolUse/PostToolUse) capture every tool call to `observations.jsonl`. No action needed from the skill — hooks handle this automatically.

### Step 3: Reflect (Active)

After non-trivial tasks, generate reflection:
```
## Reflection
- What worked:
- What failed:
- What I'd do differently:
- Rule to add:
```

Parse "Rule to add" into an instinct with 0.6 starting confidence.

### Step 4: Analyze (On-Demand)

When user runs `/continuous-improve`:
1. Read pending observations
2. Detect patterns (corrections, errors, repeated workflows, tool preferences)
3. Create/update instincts
4. Show dashboard with confidence levels and suggestions

## Instinct Model

Each instinct is a YAML file:
```yaml
---
id: prefer-grep-before-edit
trigger: "when modifying code"
confidence: 0.65
domain: "workflow"
source: "session-observation"
scope: project
project_id: "a1b2c3d4e5f6"
project_name: "my-app"
created: "2026-04-05"
last_observed: "2026-04-05"
---
# Prefer Grep Before Edit
## Action
Always search with Grep before editing.
## Evidence
- Observed 6 times in sessions on 2026-04-05
```

## Mandatory Rules

1. **Never block sessions** — hooks must complete in <50ms
2. **Never log secrets** — only tool names and patterns, never file contents
3. **Default to project scope** — promote to global only when seen in 2+ projects
4. **Merge, don't duplicate** — update existing instincts rather than creating similar ones
5. **Confidence caps at 0.9** — never fully certain
6. **Decay is natural** — -0.02 per week without observation
7. **User corrections always win** — -0.1 per correction, immediate

## Synergy with Other MemoryCore Features

| Feature | Integration |
|---------|-------------|
| **Forge** | When instinct cluster reaches 3+ related instincts at 0.7+ confidence, suggest Forge skill proposal |
| **Observation System** | Mulahazah instincts inform Refine's quality checklist |
| **Decision Log** | Log instinct promotions (project→global) as decisions |
| **Save Diary** | Include "Session Learning" section in diary with new/updated instincts |

## Level History
- **Lv.1** — Base: Hook-based observation (100% reliable), atomic instincts with confidence scoring (0.3-0.9), project-scoped learning, graduated behavior (silent/suggest/auto-apply), background Haiku observer, confidence decay. (Origin: Forked from continuous-improve Mulahazah system, inspired by Homunculus v2 instinct architecture)
```

- [ ] **Step 8: Commit all MemoryCore files**

```bash
git add Feature/Mulahazah-System/
git commit -m "feat: add Mulahazah System — instinct-based behavioral learning

Adds a new Feature module that provides unconscious behavioral learning
through hook-based observation, atomic instincts with confidence scoring,
project-scoped isolation, and a background Haiku observer agent.

Complements Forge (conscious skill creation) with automatic pattern
detection and graduated behavior application."
```

---

### Task 13: Create Pull Request to MemoryCore

- [ ] **Step 1: Push feature branch**

```bash
git push -u origin feat/mulahazah-instinct-learning
```

- [ ] **Step 2: Create PR**

```bash
gh pr create --title "feat: Mulahazah System — instinct-based behavioral learning" --body "$(cat <<'EOF'
## Summary

Adds **Mulahazah** (Arabic: ملاحظة — "observation"), a new Feature module that provides unconscious behavioral learning for AI MemoryCore.

### What it does

- **Hook-based observation** (PreToolUse/PostToolUse) captures every tool call — 100% reliable, deterministic
- **Atomic instincts** with confidence scoring (0.3-0.9) and natural decay
- **Project-scoped learning** — React patterns stay in React projects, Python conventions stay in Python projects
- **Graduated behavior** — silent (0.3-0.5), suggest (0.5-0.7), auto-apply (0.7+)
- **Background Haiku observer** — periodic pattern detection without blocking sessions
- **Three learning channels** — passive hooks, active reflection, manual command

### How it differs from Forge

| Forge | Mulahazah |
|-------|-----------|
| Deliberate — requires human recognition | Automatic — hooks observe everything |
| 3+ occurrences + human approval | Tentative instincts from first sighting |
| Creates full skills | Creates atomic instincts |
| No confidence scoring | 0.3-0.9 with decay |
| No project isolation | Project-scoped by default |

**Forge = conscious skill creation.** Mulahazah = unconscious behavioral adaptation. They're complementary — instinct clusters become Forge candidates.

### Files added

```
Feature/Mulahazah-System/
├── README.md
├── SKILL.md
├── install-mulahazah.md
├── config.json
├── hooks/observe.sh
└── agents/
    ├── observer.md
    ├── observer-loop.sh
    └── start-observer.sh
```

## Test plan

- [ ] Run `observe.sh` with mock PreToolUse input — verify JSONL line appended
- [ ] Run `observe.sh` with mock PostToolUse input — verify tool_complete event
- [ ] Verify project detection creates correct hash from git remote
- [ ] Start observer with `start-observer.sh` — verify PID file created
- [ ] Run in a Claude Code session — verify observations accumulate
- [ ] Run `/continuous-improve` — verify instinct dashboard appears
EOF
)"
```

- [ ] **Step 3: Note the PR URL**

Record the PR URL for tracking.

---

### Task 14: Final Verification

- [ ] **Step 1: Return to continuous-improve repo**

```bash
cd /home/naim/.openclaw/workspace/continuous-improve
```

- [ ] **Step 2: Verify git log shows all Phase 1 commits**

```bash
git log --oneline -10
```

Expected: All Task 1-9 commits visible.

- [ ] **Step 3: Verify package is publishable**

```bash
npm pack --dry-run
```

Expected: Lists all files that would be included in the package, including hooks/, agents/, config.json.

- [ ] **Step 4: Push continuous-improve to origin**

```bash
git push origin main
```
