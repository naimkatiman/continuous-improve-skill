#!/usr/bin/env node

/**
 * continuous-improvement installer
 *
 * Usage:
 *   npx continuous-improvement install                          # auto-detect & install (beginner)
 *   npx continuous-improvement install --target claude          # install to ~/.claude/skills/ + Mulahazah
 *   npx continuous-improvement install --target openclaw        # install to ~/.openclaw/skills/
 *   npx continuous-improvement install --target cursor          # install to ~/.cursor/skills/
 *   npx continuous-improvement install --target all             # install to all detected targets
 *   npx continuous-improvement install --mode beginner          # hooks only (default)
 *   npx continuous-improvement install --mode expert            # hooks + MCP server + session hooks
 *   npx continuous-improvement install --mode mcp               # MCP server only (any editor)
 *   npx continuous-improvement install --uninstall              # remove from all targets
 */

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  rmSync,
  chmodSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_SOURCE = join(__dirname, "..", "SKILL.md");
const SKILL_NAME = "continuous-improvement";
const REPO_ROOT = join(__dirname, "..");

// Parse --mode flag
const _args = process.argv.slice(2);
const _modeIdx = _args.indexOf("--mode");
const INSTALL_MODE = _modeIdx !== -1 && _args[_modeIdx + 1] ? _args[_modeIdx + 1] : "beginner";

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
    // MCP-only mode: skip skill file copy, just register MCP server
    if (INSTALL_MODE === "mcp") {
      if (key === "claude") {
        setupMulahazah();
        console.log(`  ✓ ${target.label} → MCP server only`);
      } else {
        console.log(`  ⊘ ${target.label} — MCP mode only applies to Claude Code`);
      }
      return true;
    }

    mkdirSync(target.dir, { recursive: true });
    copyFileSync(SKILL_SOURCE, join(target.dir, "SKILL.md"));
    console.log(`  ✓ ${target.label} → ${target.dir}/SKILL.md`);

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
  const instinctsDir = join(home, ".claude", "instincts");
  const globalDir = join(instinctsDir, "global");

  // 1. Create directory structure
  mkdirSync(globalDir, { recursive: true });
  console.log(`  ✓ Instincts dir → ${instinctsDir}/`);

  // 2. Copy observe.sh and make executable
  const observeSrc = join(REPO_ROOT, "hooks", "observe.sh");
  const observeDest = join(instinctsDir, "observe.sh");
  if (existsSync(observeSrc)) {
    copyFileSync(observeSrc, observeDest);
    chmodSync(observeDest, 0o755);
    console.log(`  ✓ observe.sh → ${observeDest}`);
  }

  // 3. Copy session.sh for expert mode
  if (INSTALL_MODE === "expert") {
    const sessionSrc = join(REPO_ROOT, "hooks", "session.sh");
    const sessionDest = join(instinctsDir, "session.sh");
    if (existsSync(sessionSrc)) {
      copyFileSync(sessionSrc, sessionDest);
      chmodSync(sessionDest, 0o755);
      console.log(`  ✓ session.sh → ${sessionDest}`);
    }
  }

  // 4. Copy /continuous-improvement command
  const commandsDir = join(home, ".claude", "commands");
  mkdirSync(commandsDir, { recursive: true });
  const cmdSrc = join(REPO_ROOT, "commands", "continuous-improvement.md");
  const cmdDest = join(commandsDir, "continuous-improvement.md");
  if (existsSync(cmdSrc)) {
    copyFileSync(cmdSrc, cmdDest);
    console.log(`  ✓ /continuous-improvement command → ${cmdDest}`);
  }

  // 5. Patch ~/.claude/settings.json with hooks
  patchClaudeSettings(observeDest);

  // 6. Setup MCP server for expert or mcp mode
  if (INSTALL_MODE === "expert" || INSTALL_MODE === "mcp") {
    setupMcpServer();
  }
}

function setupMcpServer() {
  const home = homedir();
  const mcpServerPath = join(REPO_ROOT, "bin", "mcp-server.mjs");
  const mcpMode = INSTALL_MODE === "mcp" ? "beginner" : "expert";

  // Patch Claude Code settings.json with MCP server config
  const settingsPath = join(home, ".claude", "settings.json");
  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      console.warn(`  ! Could not parse settings.json — skipping MCP setup`);
      return;
    }
  }

  if (!settings.mcpServers) settings.mcpServers = {};

  const alreadySetup = settings.mcpServers["continuous-improvement"];
  if (!alreadySetup) {
    settings.mcpServers["continuous-improvement"] = {
      command: "node",
      args: [mcpServerPath, "--mode", mcpMode],
    };
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    console.log(`  ✓ MCP server registered (mode: ${mcpMode})`);
  } else {
    console.log(`  ✓ MCP server already registered — no change`);
  }

  // Also write claude_desktop_config.json if it exists
  const desktopConfig = join(home, ".claude", "claude_desktop_config.json");
  if (existsSync(desktopConfig)) {
    try {
      const config = JSON.parse(readFileSync(desktopConfig, "utf8"));
      if (!config.mcpServers) config.mcpServers = {};
      if (!config.mcpServers["continuous-improvement"]) {
        config.mcpServers["continuous-improvement"] = {
          command: "node",
          args: [mcpServerPath, "--mode", mcpMode],
        };
        writeFileSync(desktopConfig, JSON.stringify(config, null, 2) + "\n");
        console.log(`  ✓ Claude Desktop MCP config updated`);
      }
    } catch {
      // skip
    }
  }
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

  // Expert mode: add session hooks
  if (INSTALL_MODE === "expert") {
    const sessionPath = join(homedir(), ".claude", "instincts", "session.sh");
    const sessionHook = {
      matcher: "",
      hooks: [{ type: "command", command: `bash "${sessionPath}"` }],
    };

    // Note: SessionStart/SessionEnd hooks may not be supported in all versions.
    // We register them — they'll be silently ignored if unsupported.
    for (const hookType of ["SessionStart", "SessionEnd"]) {
      if (!Array.isArray(settings.hooks[hookType])) {
        settings.hooks[hookType] = [];
      }
      const alreadyPatched = settings.hooks[hookType].some(
        (h) =>
          Array.isArray(h.hooks) &&
          h.hooks.some((hh) => hh.command && hh.command.includes("session.sh"))
      );
      if (!alreadyPatched) {
        settings.hooks[hookType].push(sessionHook);
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    const hookTypes = INSTALL_MODE === "expert"
      ? "PreToolUse/PostToolUse/SessionStart/SessionEnd"
      : "PreToolUse/PostToolUse";
    console.log(`  ✓ Patched ~/.claude/settings.json with ${hookTypes} hooks`);
  } else {
    console.log(`  ✓ settings.json already has hooks — no change needed`);
  }
}

function uninstallAll() {
  console.log("\nUninstalling continuous-improvement skill...\n");
  const home = homedir();
  let removed = 0;

  // 1. Remove skill files from all targets
  for (const [key, target] of Object.entries(TARGETS)) {
    const skillFile = join(target.dir, "SKILL.md");
    if (existsSync(skillFile)) {
      try {
        rmSync(target.dir, { recursive: true });
        console.log(`  ✓ Removed skill from ${target.label}`);
        removed++;
      } catch (err) {
        console.error(`  ✗ ${target.label}: ${err.message}`);
      }
    }
  }

  // 2. Remove /continuous-improvement command
  const cmdFile = join(home, ".claude", "commands", "continuous-improvement.md");
  if (existsSync(cmdFile)) {
    try {
      rmSync(cmdFile);
      console.log(`  ✓ Removed /continuous-improvement command`);
    } catch (err) {
      console.error(`  ✗ Command file: ${err.message}`);
    }
  }

  // 3. Remove observe.sh and session.sh from instincts dir
  for (const hookFile of ["observe.sh", "session.sh"]) {
    const filePath = join(home, ".claude", "instincts", hookFile);
    if (existsSync(filePath)) {
      try {
        rmSync(filePath);
        console.log(`  ✓ Removed ${hookFile}`);
      } catch (err) {
        console.error(`  ✗ ${hookFile}: ${err.message}`);
      }
    }
  }

  // 4. Remove hooks and MCP server from settings.json
  const settingsPath = join(home, ".claude", "settings.json");
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
      let changed = false;

      // Remove all hook types
      for (const hookType of ["PreToolUse", "PostToolUse", "SessionStart", "SessionEnd"]) {
        if (Array.isArray(settings.hooks?.[hookType])) {
          const before = settings.hooks[hookType].length;
          settings.hooks[hookType] = settings.hooks[hookType].filter(
            (h) =>
              !(
                Array.isArray(h.hooks) &&
                h.hooks.some(
                  (hh) => hh.command && (hh.command.includes("observe.sh") || hh.command.includes("session.sh"))
                )
              )
          );
          if (settings.hooks[hookType].length < before) changed = true;
        }
      }

      // Remove MCP server
      if (settings.mcpServers?.["continuous-improvement"]) {
        delete settings.mcpServers["continuous-improvement"];
        changed = true;
      }

      if (changed) {
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
        console.log(`  ✓ Removed hooks and MCP server from settings.json`);
      }
    } catch {
      console.warn(`  ! Could not clean settings.json — remove hooks manually`);
    }
  }

  // 5. Clean claude_desktop_config.json MCP entry
  const desktopConfig = join(home, ".claude", "claude_desktop_config.json");
  if (existsSync(desktopConfig)) {
    try {
      const config = JSON.parse(readFileSync(desktopConfig, "utf8"));
      if (config.mcpServers?.["continuous-improvement"]) {
        delete config.mcpServers["continuous-improvement"];
        writeFileSync(desktopConfig, JSON.stringify(config, null, 2) + "\n");
        console.log(`  ✓ Removed MCP server from Claude Desktop config`);
      }
    } catch {
      // skip
    }
  }

  if (removed === 0) {
    console.log("  No skill installations found.");
  }
  console.log(
    "\n  Note: Instinct data in ~/.claude/instincts/ was preserved.\n" +
      "  To remove learned data too: rm -rf ~/.claude/instincts/\n"
  );
}

function printUsage() {
  console.log(`
Usage: npx continuous-improvement install [options]

Options:
  --target <name>   Install to specific target (claude, openclaw, cursor, codex, all)
  --mode <mode>     Installation mode:
                      beginner  — hooks only, no MCP server (default)
                      expert    — hooks + MCP server + session hooks + all tools
                      mcp       — MCP server only (works with any MCP client)
  --uninstall       Remove from all targets
  --help            Show this help

Modes explained:
  BEGINNER (default)   Just works. Hooks capture silently, instincts grow over time.
                       3 tools via /continuous-improvement command.

  EXPERT               Everything in beginner + MCP server with 8 tools:
                       import/export, manual instinct creation, observation viewer,
                       confidence tuning. Plus session start/end hooks.

  MCP                  MCP server only — for editors that support MCP but not
                       Claude Code hooks (Cursor, Zed, Windsurf, VS Code).

Examples:
  npx continuous-improvement install                        # beginner (default)
  npx continuous-improvement install --mode expert          # full power
  npx continuous-improvement install --mode mcp             # MCP server only
  npx continuous-improvement install --target all            # install everywhere
  npx continuous-improvement install --uninstall             # remove all
`);
}

// --- Main ---

const args = process.argv.slice(2);
const command = args[0];

if (args.includes("--help") || args.includes("-h")) {
  printUsage();
  process.exit(0);
}

if (!command || !["install", "--help", "-h", "--uninstall"].includes(command)) {
  printUsage();
  process.exit(command ? 1 : 0);
}

if (args.includes("--uninstall")) {
  uninstallAll();
  process.exit(0);
}

console.log(`
continuous-improvement v3.0 (mode: ${INSTALL_MODE})
Research → Plan → Execute → Verify → Reflect → Learn → Iterate
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

const modeInfo = {
  beginner: "Hooks are capturing silently. System auto-levels as you use it.",
  expert: "Full plugin active: hooks + MCP server + session hooks. 8 tools available.",
  mcp: "MCP server registered. Connect from any MCP-compatible editor.",
};

console.log(`
${installed > 0 ? "Done." : "Failed."} Installed to ${installed}/${targets.length} target(s).
${hasClaude ? `\n${modeInfo[INSTALL_MODE] || modeInfo.beginner}` : ""}
Next steps:
  1. Start a new Claude Code session
  2. Say: "Use the continuous-improvement framework to [your task]"
  3. After your first task, run: /continuous-improvement
${INSTALL_MODE === "expert" ? "\nMCP tools available: ci_status, ci_instincts, ci_reflect, ci_reinforce,\n  ci_create_instinct, ci_observations, ci_export, ci_import" : ""}
${INSTALL_MODE === "mcp" ? "\nMCP tools available: ci_status, ci_instincts, ci_reflect" : ""}
`);
