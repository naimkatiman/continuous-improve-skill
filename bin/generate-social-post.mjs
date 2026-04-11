#!/usr/bin/env node

/**
 * Generates platform-specific social media posts from release metadata.
 * Usage: node bin/generate-social-post.mjs --version v3.1.0 --platform x|linkedin|all
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const args = process.argv.slice(2);
const versionIdx = args.indexOf('--version');
const platformIdx = args.indexOf('--platform');

const version = versionIdx !== -1 ? args[versionIdx + 1] : null;
const platform = platformIdx !== -1 ? args[platformIdx + 1] : 'all';

if (!version) {
  console.error('Usage: generate-social-post.mjs --version <tag> --platform <x|linkedin|all>');
  process.exit(1);
}

// Read current stats from package.json
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Count tests dynamically
let testCount = '104';
try {
  const testDir = readFileSync(join(root, 'README.md'), 'utf8');
  const match = testDir.match(/(\d+)\s+tests/);
  if (match) testCount = match[1];
} catch {}

const repoUrl = `https://github.com/naimkatiman/continuous-improvement`;
const releaseUrl = `${repoUrl}/releases/tag/${version}`;

function generateX() {
  return `The 7 Laws of AI Agent Discipline — ${version} just shipped.

Your AI agent says "Done!" but didn't test anything. These 7 laws fix that.

- ${testCount} tests, zero dependencies
- MCP server (beginner + expert modes)
- Works with Claude Code, Cursor, Codex, Gemini CLI
- Auto-leveling instinct learning

npx continuous-improvement install

${releaseUrl}

#ClaudeCode #AIAgent #OpenSource #BuildInPublic`;
}

function generateLinkedIn() {
  return `Shipped ${version} of "The 7 Laws of AI Agent Discipline" — an open-source framework that stops AI coding agents from skipping steps, guessing, and declaring "done" without verifying.

The problem: AI agents lie about completion. They skip research, create duplicate code, and break tests. Every developer using Claude Code, Cursor, or Codex has seen this.

The fix: 7 enforceable laws + an auto-leveling learning system called Mulahazah that builds instincts over time.

What's in ${version}:
- ${testCount} tests, zero npm dependencies
- MCP server with beginner/expert modes (up to 10 tools)
- CodeQL security scanning in CI
- Starter instinct packs for React, Python, Go
- GitHub Action transcript linter (compliance score 0-100)
- Works with Claude Code, Claude Desktop, Cursor, Zed, Windsurf, VS Code, Codex, Gemini CLI

Install in 10 seconds:
npx continuous-improvement install

${releaseUrl}

#AIAgent #ClaudeCode #DevTools #OpenSource #BuildInPublic #MCPServer #AIDiscipline`;
}

const generators = { x: generateX, linkedin: generateLinkedIn };

if (platform === 'all') {
  for (const [name, fn] of Object.entries(generators)) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PLATFORM: ${name.toUpperCase()}`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(fn());
  }
} else if (generators[platform]) {
  console.log(generators[platform]());
} else {
  console.error(`Unknown platform: ${platform}. Use: x, linkedin, all`);
  process.exit(1);
}
