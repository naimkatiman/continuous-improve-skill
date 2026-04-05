import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const COMMANDS_DIR = join(__dirname, "..", "commands");

describe("commands/discipline.md", () => {
  let content;

  it("exists", () => {
    const path = join(COMMANDS_DIR, "discipline.md");
    assert.ok(existsSync(path), "discipline.md should exist");
    content = readFileSync(path, "utf8");
  });

  it("has valid frontmatter", () => {
    assert.match(content, /^---\n/);
    assert.match(content, /name: discipline/);
    assert.match(content, /description:/);
  });

  it("references all 7 laws", () => {
    assert.match(content, /Research Before Executing/);
    assert.match(content, /Plan Is Sacred/);
    assert.match(content, /One Thing at a Time/);
    assert.match(content, /Verify Before Reporting/);
    assert.match(content, /Reflect After Sessions/);
    assert.match(content, /Iterate One Change/);
    assert.match(content, /Learn From Every Session/);
  });

  it("contains red flags", () => {
    assert.match(content, /I'll just quickly/);
    assert.match(content, /This should work/);
  });

  it("contains the self-check checklist", () => {
    assert.match(content, /Code runs without errors/);
    assert.match(content, /Build passes/);
  });
});

describe("commands/dashboard.md", () => {
  let content;

  it("exists", () => {
    const path = join(COMMANDS_DIR, "dashboard.md");
    assert.ok(existsSync(path), "dashboard.md should exist");
    content = readFileSync(path, "utf8");
  });

  it("has valid frontmatter", () => {
    assert.match(content, /^---\n/);
    assert.match(content, /name: dashboard/);
  });

  it("contains dashboard display format", () => {
    assert.match(content, /Dashboard/);
    assert.match(content, /Observations/);
    assert.match(content, /Instincts/);
    assert.match(content, /Health/);
  });

  it("references auto-leveling levels", () => {
    assert.match(content, /CAPTURE/);
    assert.match(content, /ANALYZE/);
    // Levels are referenced in the display format template
    assert.match(content, /beginner|expert/);
  });
});

describe("commands/continuous-improvement.md", () => {
  it("exists", () => {
    const path = join(COMMANDS_DIR, "continuous-improvement.md");
    assert.ok(existsSync(path), "continuous-improvement.md should exist");
  });
});
