# Hacker News

## Show HN Submission

**Title:** Show HN: continuous-improvement – Install a research-plan-verify loop into AI coding agents

**URL:** https://github.com/naimkatiman/continuous-improvement

## Top Comment (post immediately after submission)

Hi HN, I built this after tracking how AI coding agents (Claude Code, Codex, Cursor, ChatGPT) fail repeatedly in the same ways: they skip existing code, overbuild, don't verify, and don't learn.

continuous-improvement injects a 7-rule operating loop into your agent's config file. No framework, no wrapper — just rules appended to CLAUDE.md, AGENTS.md, .cursorrules, or Custom Instructions.

The rules enforce: research before executing, plan before coding, one change at a time, verify before reporting done, and reflect after non-trivial work.

v1.0 adds instinct-based learning (Mulahazah): the agent observes its own tool calls, builds patterns with confidence scores, and graduates from suggesting to auto-applying as patterns prove reliable. Wrong patterns decay.

Technical details:
- Hooks run on every tool call with <50ms overhead
- Instincts carry confidence 0.3-0.9
- Project-scoped or global
- All prompt variants in prompts/ are model-agnostic

Happy to discuss the approach. The failure taxonomy that motivated this is in docs/failure-taxonomy.md.

---

## Posting Notes

- Best time: 8am-10am ET on weekdays (Tuesday-Thursday optimal)
- HN values technical depth — lead with the "how" not the "what"
- Don't use marketing language
- Engage deeply with technical questions
- Point people to docs/failure-taxonomy.md and docs/philosophy.md for depth
