#!/usr/bin/env bash
# continuous-improve-skill — one-line installer (SKILL.md only)
# Usage: curl -fsSL https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/install.sh | bash
#
# For full Mulahazah instinct-learning support (hooks, observer, settings patch):
#   npx continuous-improve-skill --target claude

set -euo pipefail

SKILL_NAME="continuous-improve"
RAW_URL="https://raw.githubusercontent.com/naimkatiman/continuous-improve-skill/main/SKILL.md"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          continuous-improve-skill v2.0 installer             ║"
echo "║   Research → Plan → Execute → Verify → Reflect → Learn →    ║"
echo "║   Iterate  —  7 Laws + Mulahazah instinct learning           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

installed=0

# Claude Code
if [ -d "$HOME/.claude" ]; then
  mkdir -p "$HOME/.claude/skills/$SKILL_NAME"
  curl -fsSL "$RAW_URL" -o "$HOME/.claude/skills/$SKILL_NAME/SKILL.md"
  echo "  ✓ Claude Code → ~/.claude/skills/$SKILL_NAME/SKILL.md"
  installed=$((installed + 1))
fi

# OpenClaw
if [ -d "$HOME/.openclaw" ]; then
  mkdir -p "$HOME/.openclaw/skills/$SKILL_NAME"
  curl -fsSL "$RAW_URL" -o "$HOME/.openclaw/skills/$SKILL_NAME/SKILL.md"
  echo "  ✓ OpenClaw   → ~/.openclaw/skills/$SKILL_NAME/SKILL.md"
  installed=$((installed + 1))
fi

# Cursor
if [ -d "$HOME/.cursor" ]; then
  mkdir -p "$HOME/.cursor/skills/$SKILL_NAME"
  curl -fsSL "$RAW_URL" -o "$HOME/.cursor/skills/$SKILL_NAME/SKILL.md"
  echo "  ✓ Cursor     → ~/.cursor/skills/$SKILL_NAME/SKILL.md"
  installed=$((installed + 1))
fi

# Codex
if [ -d "$HOME/.codex" ]; then
  mkdir -p "$HOME/.codex/skills/$SKILL_NAME"
  curl -fsSL "$RAW_URL" -o "$HOME/.codex/skills/$SKILL_NAME/SKILL.md"
  echo "  ✓ Codex      → ~/.codex/skills/$SKILL_NAME/SKILL.md"
  installed=$((installed + 1))
fi

# Fallback: install to Claude Code if nothing detected
if [ "$installed" -eq 0 ]; then
  mkdir -p "$HOME/.claude/skills/$SKILL_NAME"
  curl -fsSL "$RAW_URL" -o "$HOME/.claude/skills/$SKILL_NAME/SKILL.md"
  echo "  ✓ Claude Code (default) → ~/.claude/skills/$SKILL_NAME/SKILL.md"
  installed=1
fi

echo ""
echo "✅ Installed SKILL.md to $installed target(s)."
echo ""
echo "Next steps:"
echo '  1. Start a new agent session'
echo '  2. Say: "Use the continuous-improve framework to [your task]"'
echo '  3. Watch the 7-Law loop in action'
echo '  4. After your first task, run: /continuous-improve'
echo ""
echo "For full Mulahazah instinct-learning support (Claude Code only):"
echo "  npx continuous-improve-skill --target claude"
echo ""
echo "Docs: https://github.com/naimkatiman/continuous-improve-skill"
echo ""
