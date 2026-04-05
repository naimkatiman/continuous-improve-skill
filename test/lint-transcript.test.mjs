import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { execFileSync, execSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const LINTER = join(__dirname, "..", "bin", "lint-transcript.mjs");

describe("lint-transcript.mjs", () => {
  let tempDir;

  it("shows help with --help", () => {
    const output = execFileSync("node", [LINTER, "--help"], { encoding: "utf8" });
    assert.match(output, /Agent Transcript Linter/);
    assert.match(output, /--stdin/);
    assert.match(output, /--strict/);
    assert.match(output, /--json/);
  });

  it("exits 0 with no events from stdin", () => {
    const output = execSync(`echo '' | node "${LINTER}" --stdin`, { encoding: "utf8" });
    assert.match(output, /No events found/);
  });

  it("detects Law 1 violation (writes without research)", () => {
    const events = [
      { tool: "Write", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Write", event: "tool_start", tool_input: { file_path: "/tmp/b.ts" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin`, { encoding: "utf8" });
    assert.match(output, /Law 1/);
    assert.match(output, /Research Before Executing/);
  });

  it("no Law 1 violation when research precedes writes", () => {
    const events = [
      { tool: "Grep", event: "tool_start", tool_input: { pattern: "test" } },
      { tool: "Read", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Write", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin --json`, { encoding: "utf8" });
    const result = JSON.parse(output);
    const law1Violations = result.violations.filter((v) => v.law === 1);
    assert.equal(law1Violations.length, 0, "Should have no Law 1 violations");
  });

  it("detects Law 4 violation (no verification)", () => {
    const events = [
      { tool: "Read", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Edit", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin`, { encoding: "utf8" });
    assert.match(output, /Law 4/);
    assert.match(output, /Verify Before Reporting/);
  });

  it("no Law 4 violation when tests are run", () => {
    const events = [
      { tool: "Read", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Edit", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Bash", event: "tool_start", tool_input: { command: "npm test" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin --json`, { encoding: "utf8" });
    const result = JSON.parse(output);
    const law4Violations = result.violations.filter((v) => v.law === 4);
    assert.equal(law4Violations.length, 0, "Should have no Law 4 violations");
  });

  it("detects Law 3 violation (too many consecutive edits)", () => {
    const events = [
      { tool: "Read", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      ...Array.from({ length: 7 }, (_, i) => ({
        tool: "Edit",
        event: "tool_start",
        tool_input: { file_path: `/tmp/file${i}.ts` },
      })),
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin`, { encoding: "utf8" });
    assert.match(output, /Law 3/);
  });

  it("outputs JSON with --json flag", () => {
    const events = [
      { tool: "Read", event: "tool_start", tool_input: {} },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin --json`, { encoding: "utf8" });
    const result = JSON.parse(output);
    assert.ok("violations" in result);
    assert.ok("stats" in result);
    assert.ok("score" in result);
    assert.ok(typeof result.score === "number");
  });

  it("calculates discipline score", () => {
    const events = [
      { tool: "Grep", event: "tool_start", tool_input: { pattern: "test" } },
      { tool: "Read", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Edit", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Bash", event: "tool_start", tool_input: { command: "npm test" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin --json`, { encoding: "utf8" });
    const result = JSON.parse(output);
    assert.equal(result.score, 100, "Perfect discipline should score 100");
  });

  it("reads from file path", () => {
    tempDir = join(tmpdir(), `ci-lint-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    const filePath = join(tempDir, "transcript.jsonl");
    writeFileSync(filePath, '{"tool":"Read","event":"tool_start","tool_input":{}}\n');
    const output = execFileSync("node", [LINTER, filePath], { encoding: "utf8" });
    assert.match(output, /Agent Discipline Report/);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("--strict exits 1 on violations", () => {
    const events = [
      { tool: "Write", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    let exitCode = 0;
    try {
      execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin --strict`, { encoding: "utf8" });
    } catch (err) {
      exitCode = err.status;
    }
    assert.equal(exitCode, 1, "Should exit 1 with --strict and violations");
  });

  it("--strict exits 0 on clean transcript", () => {
    const events = [
      { tool: "Grep", event: "tool_start", tool_input: { pattern: "x" } },
      { tool: "Read", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Edit", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Bash", event: "tool_start", tool_input: { command: "npm test" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin --strict`, { encoding: "utf8" });
    assert.match(output, /No law violations/);
  });

  it("tracks stats correctly", () => {
    const events = [
      { tool: "Grep", event: "tool_start", tool_input: {} },
      { tool: "Read", event: "tool_start", tool_input: {} },
      { tool: "Glob", event: "tool_start", tool_input: {} },
      { tool: "Write", event: "tool_start", tool_input: { file_path: "/tmp/a.ts" } },
      { tool: "Edit", event: "tool_start", tool_input: { file_path: "/tmp/b.ts" } },
      { tool: "Bash", event: "tool_start", tool_input: { command: "jest" } },
    ];
    const input = events.map((e) => JSON.stringify(e)).join("\n");
    const output = execSync(`printf '%s' '${input.replace(/'/g, "'\\''")}' | node "${LINTER}" --stdin --json`, { encoding: "utf8" });
    const result = JSON.parse(output);
    assert.equal(result.stats.researchTools, 3);
    assert.equal(result.stats.writeTools, 2);
    assert.equal(result.stats.verifyTools, 1);
  });
});
