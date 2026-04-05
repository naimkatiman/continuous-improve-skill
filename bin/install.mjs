#!/usr/bin/env node

/**
 * continuous-improve-skill installer
 *
 * Usage:
 *   npx continuous-improve-skill                # auto-detect & install
 *   npx continuous-improve-skill --target claude # install to ~/.claude/skills/ + Mulahazah
 *   npx continuous-improve-skill --target openclaw # install to ~/.openclaw/skills/
 *   npx continuous-improve-skill --target cursor # install to ~/.cursor/skills/
 *   npx continuous-improve-skill --target all    # install to all detected targets
 *   npx continuous-improve-skill --uninstall     # remove from all targets
 */

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  rmSync,
  chmodSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_SOURCE = join(__dirname, "..", "SKILL.md");
const SKILL_NAME = "continuous-improve";
const REPO_ROOT = join(__dirname, "..");

const TARGETS = {
  claude: {
    label: "Claude Code",
    dir: join(homedir(), ".claude", "skills", SKILL_NAME),
  },
  openclaw: {
    label: "OpenClaw",
    dir: join(homedir(), ".openclaw", "skills", SKILL_NAME),
  },
  cursor: {
    label: "Cursor",
    dir: join(homedir(), ".cursor", "skills", SKILL_NAME),
  },
  codex: {
    label: "Codex",
    dir: join(homedir(), ".codex", "skills", SKILL_NAME),
  },
};

function detectTargets() {
  const detected = [];
  for (const [key, target] of Object.entries(TARGETS)) {
    const parentDir = dirname(target.dir);
    const configDir = dirname(parentDir);
    if (existsSync(configDir)) {
      detected.push(key);
    }
  }
  return detected;
}

function installTo(key) {
  const target = TARGETS[key];
  if (!target) {
    console.error(`  Unknown target: ${key}`);
    return false;
  }

  try {
    mkdirSync(target.dir, { recursive: true });
    copyFileSync(SKILL_SOURCE, join(target.dir, "SKILL.md"));
    console.log(`  ✓ ${target.label} → ${target.dir}/SKILL.md`);

    // Mulahazah setup is only for Claude Code
    if (key === "claude") {
      setupMulahazah();
    }

    return true;
  } catch (err) {
    console.error(`  ✗ ${target.label}: ${err.message}`);
    return false;
  }
}

function setupMulahazah() {
  const home = homedir();
  const mulahazahDir = join(home, ".claude", "mulahazah");
  const instinctsDir = join(mulahazahDir, "instincts", "personal");
  const projectsDir = join(mulahazahDir, "projects");
  const agentsDir = join(mulahazahDir, "agents");

  // 1. Create directory structure
  mkdirSync(instinctsDir, { recursive: true });
  mkdirSync(projectsDir, { recursive: true });
  mkdirSync(agentsDir, { recursive: true });
  console.log(`  ✓ Mulahazah dirs → ${mulahazahDir}/`);

  // 2. Copy observe.sh and make executable
  const observeSrc = join(REPO_ROOT, "hooks", "observe.sh");
  const observeDest = join(mulahazahDir, "observe.sh");
  if (existsSync(observeSrc)) {
    copyFileSync(observeSrc, observeDest);
    chmodSync(observeDest, 0o755);
    console.log(`  ✓ observe.sh → ${observeDest}`);
  }

  // 3. Copy observer agent files
  const agentFiles = ["observer.md", "observer-loop.sh", "start-observer.sh"];
  for (const file of agentFiles) {
    const src = join(REPO_ROOT, "agents", file);
    const dest = join(agentsDir, file);
    if (existsSync(src)) {
      copyFileSync(src, dest);
      if (file.endsWith(".sh")) chmodSync(dest, 0o755);
      console.log(`  ✓ ${file} → ${dest}`);
    }
  }

  // 4. Copy config.json
  const configSrc = join(REPO_ROOT, "config.json");
  const configDest = join(mulahazahDir, "config.json");
  if (existsSync(configSrc)) {
    copyFileSync(configSrc, configDest);
    console.log(`  ✓ config.json → ${configDest}`);
  }

  // 5. Patch ~/.claude/settings.json with PreToolUse/PostToolUse hooks
  patchClaudeSettings(observeDest);
}

function patchClaudeSettings(observePath) {
  const settingsPath = join(homedir(), ".claude", "settings.json");

  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      console.warn(`  ! Could not parse ${settingsPath} — skipping hook patch`);
      return;
    }
  }

  if (!settings.hooks) settings.hooks = {};

  const hookEntry = {
    matcher: "",
    hooks: [
      {
        type: "command",
        command: `bash "${observePath}"`,
      },
    ],
  };

  let changed = false;

  for (const hookType of ["PreToolUse", "PostToolUse"]) {
    if (!Array.isArray(settings.hooks[hookType])) {
      settings.hooks[hookType] = [];
    }
    const alreadyPatched = settings.hooks[hookType].some(
      (h) =>
        Array.isArray(h.hooks) &&
        h.hooks.some((hh) => hh.command && hh.command.includes("observe.sh"))
    );
    if (!alreadyPatched) {
      settings.hooks[hookType].push(hookEntry);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    console.log(`  ✓ Patched ~/.claude/settings.json with PreToolUse/PostToolUse hooks`);
  } else {
    console.log(`  ✓ settings.json already has observe.sh hooks — no change needed`);
  }
}

function uninstallAll() {
  console.log("\n🗑  Uninstalling continuous-improve skill...\n");
  let removed = 0;
  for (const [key, target] of Object.entries(TARGETS)) {
    const skillFile = join(target.dir, "SKILL.md");
    if (existsSync(skillFile)) {
      try {
        rmSync(target.dir, { recursive: true });
        console.log(`  ✓ Removed from ${target.label}`);
        removed++;
      } catch (err) {
        console.error(`  ✗ ${target.label}: ${err.message}`);
      }
    }
  }
  if (removed === 0) {
    console.log("  No installations found.");
  }
  console.log();
}

function printUsage() {
  console.log(`
Usage: npx continuous-improve-skill [options]

Options:
  --target <name>   Install to specific target (claude, openclaw, cursor, codex, all)
  --uninstall       Remove from all targets
  --help            Show this help

Examples:
  npx continuous-improve-skill              # auto-detect & install
  npx continuous-improve-skill --target all # install everywhere
  npx continuous-improve-skill --uninstall  # remove all

Note: Mulahazah instinct-learning setup (hooks, observer, settings patch)
      only applies to the Claude Code target.
`);
}

// --- Main ---

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

if (args.includes("--uninstall")) {
  uninstallAll();
  process.exit(0);
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║          continuous-improve-skill v2.0 installer             ║
║   Research → Plan → Execute → Verify → Reflect → Learn →    ║
║   Iterate  —  7 Laws + Mulahazah instinct learning           ║
╚══════════════════════════════════════════════════════════════╝
`);

const targetIdx = args.indexOf("--target");
let targets;

if (targetIdx !== -1 && args[targetIdx + 1]) {
  const requested = args[targetIdx + 1].toLowerCase();
  if (requested === "all") {
    targets = Object.keys(TARGETS);
  } else if (TARGETS[requested]) {
    targets = [requested];
  } else {
    console.error(`Unknown target: ${requested}`);
    console.error(`Available: ${Object.keys(TARGETS).join(", ")}, all`);
    process.exit(1);
  }
} else {
  targets = detectTargets();
  if (targets.length === 0) {
    console.log("No supported agent configs detected. Installing to Claude Code by default.\n");
    targets = ["claude"];
  } else {
    console.log(`Detected: ${targets.map((t) => TARGETS[t].label).join(", ")}\n`);
  }
}

console.log("Installing...\n");

let installed = 0;
for (const t of targets) {
  if (installTo(t)) installed++;
}

const hasClaude = targets.includes("claude");

console.log(`
${installed > 0 ? "✅" : "❌"} Installed to ${installed}/${targets.length} target(s).
${hasClaude ? "\n✅ Mulahazah instinct-learning system set up for Claude Code." : ""}
Next steps:
  1. Start a new Claude Code session (restart to pick up hook changes)
  2. Say: "Use the continuous-improve framework to [your task]"
  3. Watch the 7-Law loop in action
  4. After your first task, run: /continuous-improve
${hasClaude ? "\nOptional — start background observer (Haiku, cost-efficient):\n  bash ~/.claude/mulahazah/agents/start-observer.sh" : ""}
Docs: https://github.com/naimkatiman/continuous-improve-skill
`);
