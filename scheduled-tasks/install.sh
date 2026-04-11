#!/bin/bash
# Install scheduled tasks for Claude Code (desktop/local)
#
# Usage: bash scheduled-tasks/install.sh
#
# This copies task SKILL.md files to ~/.claude/scheduled-tasks/
# After running, open Claude Code and type:
#   /schedule update daily-social-improvement
# to set the schedule (e.g., daily at 10am).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_TASKS="$HOME/.claude/scheduled-tasks"

for task_dir in "$SCRIPT_DIR"/*/; do
  task_name="$(basename "$task_dir")"
  [ "$task_name" = "install.sh" ] && continue

  if [ -f "$task_dir/SKILL.md" ]; then
    mkdir -p "$CLAUDE_TASKS/$task_name"
    cp "$task_dir/SKILL.md" "$CLAUDE_TASKS/$task_name/SKILL.md"
    echo "Installed: $task_name -> $CLAUDE_TASKS/$task_name/"
  fi
done

echo ""
echo "Done. Now open Claude Code and run:"
echo "  /schedule update daily-social-improvement"
echo "  to set your preferred schedule."
