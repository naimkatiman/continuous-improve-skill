# Changelog

All notable changes to this skill are documented here.

---

## [2.0.0] — 2026-04-05

### Added
- Law 7: Learn From Every Session — instinct-based behavioral learning (Mulahazah)
- PreToolUse/PostToolUse hooks for 100% session observation
- Background Haiku observer agent for automatic pattern detection
- Atomic instincts with confidence scoring (0.3-0.9) and natural decay
- Project-scoped learning — prevents cross-project contamination
- Graduated instinct behavior: silent / suggest / auto-apply
- `/continuous-improve` master command (status, analyze, reflect, projects)
- `hooks/observe.sh` — lightweight observation hook (<50ms)
- `agents/observer.md` — background observer agent prompt
- `agents/observer-loop.sh` — periodic analysis runner
- `agents/start-observer.sh` — observer launcher with PID management
- `config.json` — observer configuration

### Changed
- Upgraded from 5-phase framework to 7-Law system
- Law 5 (Reflect) now feeds instinct system — "Rule to add" becomes instinct with 0.6 confidence
- The Loop: Research → Plan → Execute → Verify → Reflect → Learn → Iterate
- Installer now sets up Mulahazah hooks and directory structure for Claude Code
- SKILL.md completely rewritten with instinct behavior and /continuous-improve command

### Improved
- Law 6 (Iterate) now explicit — one change → verify → next change

---

## [1.1.0] — 2026-04-04

### Improved
- README completely rewritten for cleaner onboarding — hook first, install in 30 seconds, first-task prompt
- Added real example of a successful agent run (rate limiting walkthrough)
- Added QUICKSTART.md for step-by-step first-use guide
- Added CHANGELOG.md for version tracking
- Removed internal references from SKILL.md (now works for any user, any project)
- Red flags section now in README for discoverability before install

### Fixed
- Fake Claude Code marketplace install command removed
- Internal variable references (Naim, PROJECT_REGISTRY, STATE_TEMPLATE) made universal

---

## [1.0.0] — 2026-04-04

### Added
- Initial release
- 5-phase framework: Research → Plan → Execute → Verify → Reflect
- Iron Law with 3 hard constraints
- Phase gates (explicit conditions before proceeding)
- Red Flags list (thought patterns that indicate a skip)
- Common Rationalizations table
- Subagent delegation rules with 4 status handlers
- Pre-completion self-review checklist
- marketplace.json for plugin discoverability
