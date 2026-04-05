# Reddit Posts

---

## r/ClaudeAI

**Title:** I built an open-source tool that makes Claude Code research before coding, verify before reporting, and learn from its mistakes

**Body:**

I've been using Claude Code daily for months. It's powerful, but it has predictable failure modes:

- Jumps into writing code without checking what exists
- Builds 300 lines before verifying the first change
- Says "done" without actually testing
- Repeats the exact same mistake in the next session

So I built `continuous-improvement` — it appends a structured operating loop to your CLAUDE.md:

```
npx continuous-improvement install --claude
```

It injects 7 rules:

1. Research before executing
2. Plan before coding
3. Do one thing at a time
4. Verify before reporting
5. Reflect after non-trivial work
6. Iterate one change at a time
7. Learn from every session

v1.0 adds Mulahazah (instinct-based learning) — the agent builds up patterns over time with confidence scores. Low confidence = it suggests. High confidence = it auto-applies. Wrong patterns decay.

Open source, MIT licensed: https://github.com/naimkatiman/continuous-improvement

Happy to answer questions about the approach. Would love feedback from anyone who tries it.

---

## r/ChatGPTPro

**Title:** Open-source tool that stops ChatGPT from overbuilding and skipping verification — works with Custom Instructions

**Body:**

If you use ChatGPT for coding, you've probably noticed it:

- Writes way more code than needed
- Doesn't check existing code first
- Claims it's done before testing
- Doesn't remember corrections between sessions

I built `continuous-improvement` to fix this. For ChatGPT, it generates the exact block to paste into Custom Instructions.

```
npx continuous-improvement install --chatgpt
```

It prints a structured set of rules that tell the model to:
- Research before executing
- Plan before coding
- Do one thing at a time
- Verify before reporting done
- Reflect and learn

Also works with Claude Code, Codex, and Cursor.

GitHub: https://github.com/naimkatiman/continuous-improvement

MIT licensed. Feedback welcome.

---

## r/LocalLLaMA

**Title:** Structured self-improvement loop for coding agents — works with any model that reads a system prompt

**Body:**

Built an open-source tool that injects a disciplined operating loop into AI coding agents.

The core idea: most agent failures aren't capability problems — they're discipline problems. The model can research, plan, and verify. It just doesn't unless you tell it to.

`continuous-improvement` installs 7 rules into your agent's config:

1. Research before executing
2. Plan before coding
3. Do one thing at a time
4. Verify before reporting
5. Reflect after non-trivial work
6. Iterate one change at a time
7. Learn from every session

It has installers for Claude Code, Codex, Cursor, and ChatGPT — but the prompts in `prompts/` work with any model that reads a system prompt or custom instructions.

The latest version adds instinct-based learning: the agent builds up patterns with confidence scores that strengthen or decay based on outcomes.

GitHub: https://github.com/naimkatiman/continuous-improvement

The prompt variants are in `prompts/core.md`, `prompts/minimal.md`, and `prompts/coding-agent.md` if you want to adapt them for your local setup.

---

## Posting Notes

- Post to r/ClaudeAI first (most aligned audience)
- Wait 1-2 days between subreddits to avoid looking spammy
- Engage genuinely with every comment
- Don't cross-post — each post is tailored
- If it gains traction, follow up with a "lessons learned" post in 2 weeks
