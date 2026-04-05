# Contributing to continuous-improvement

Thanks for your interest in making AI agents more disciplined! Here's how to contribute.

## Quick Start

```bash
git clone https://github.com/naimkatiman/continuous-improvement.git
cd continuous-improvement
npm test
```

## Ways to Contribute

### Report Issues
- Bug reports with reproduction steps
- Feature requests with use cases
- Documentation improvements

### Submit PRs
1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Write tests for new functionality
4. Run `npm test` — all tests must pass
5. Commit with conventional format (`feat:`, `fix:`, `docs:`, etc.)
6. Open a PR against `main`

### Share Instinct Packs
Have a set of instincts that work well for a specific stack? Add them to `instinct-packs/`:

```json
[
  {
    "id": "your-instinct-id",
    "trigger": "when this happens",
    "body": "do this instead",
    "confidence": 0.6,
    "domain": "workflow"
  }
]
```

### Translate
Add translations to `docs/` following the pattern `README.<lang-code>.md`.

## Code Style

- Zero external dependencies (Node.js built-ins only)
- Tests use `node:test` and `node:assert/strict`
- Hooks must complete in <200ms
- MCP server must work without any npm packages

## Architecture

```
SKILL.md          → The rules (any LLM can follow these)
hooks/observe.sh  → Captures tool calls to JSONL (<50ms)
hooks/session.sh  → Session start/end events (expert mode)
bin/install.mjs   → CLI installer (multi-target)
bin/mcp-server.mjs → MCP protocol server (zero deps)
```

## Testing

```bash
npm test                    # Run all tests
node --test test/hook.test.mjs  # Run specific test file
```

Tests must:
- Use temp directories (never touch real `~/.claude/`)
- Clean up after themselves
- Complete within 30 seconds

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
