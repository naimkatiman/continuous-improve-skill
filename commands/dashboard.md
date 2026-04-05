---
name: dashboard
description: Visual dashboard showing instinct health, observation stats, and learning progress
---

# Instinct Dashboard

Generate a visual dashboard for this project's continuous-improvement status.

## Instructions

1. **Find project hash:** Run `git rev-parse --show-toplevel 2>/dev/null`, then SHA-256 first 12 chars
2. **Read observations:** Count lines in `~/.claude/instincts/<hash>/observations.jsonl`
3. **Read instincts:** Load all `*.yaml` files from project dir + `global/`
4. **Read instinct packs:** Check if any packs from `instinct-packs/` have been loaded

## Display Format

```
╔══════════════════════════════════════════════════════════════╗
║              continuous-improvement Dashboard                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Project: <name>              Level: <CAPTURE|ANALYZE|...>   ║
║  Sessions: ~<obs/10>          Mode: <beginner|expert>        ║
║                                                              ║
║  ┌─ Observations ────────────────────────────────────────┐   ║
║  │  Total: <n>    Unprocessed: <n>    Last: <date>       │   ║
║  └───────────────────────────────────────────────────────┘   ║
║                                                              ║
║  ┌─ Instincts ───────────────────────────────────────────┐   ║
║  │  Total: <n>                                           │   ║
║  │  ████████░░ Auto-apply (0.7+): <n>                    │   ║
║  │  █████░░░░░ Suggest (0.5-0.69): <n>                   │   ║
║  │  ██░░░░░░░░ Silent (< 0.5): <n>                       │   ║
║  │  Global: <n>    Project: <n>                          │   ║
║  └───────────────────────────────────────────────────────┘   ║
║                                                              ║
║  ┌─ Top Instincts ───────────────────────────────────────┐   ║
║  │  <list top 5 instincts by confidence with bars>       │   ║
║  └───────────────────────────────────────────────────────┘   ║
║                                                              ║
║  ┌─ Health ──────────────────────────────────────────────┐   ║
║  │  Stale (30+ days): <n>    Decaying: <n>               │   ║
║  │  Recently reinforced: <n>                             │   ║
║  └───────────────────────────────────────────────────────┘   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## After Display

- If stale instincts > 0: suggest reviewing them
- If unprocessed observations > 20: suggest running analysis
- If no instincts exist: explain the auto-leveling timeline
- Show available instinct packs that haven't been loaded yet
