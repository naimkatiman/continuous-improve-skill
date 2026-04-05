import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const HOOK_SCRIPT = join(__dirname, "..", "hooks", "observe.sh");

describe("observe.sh hook", () => {
  let tempHome;

  before(() => {
    tempHome = join(tmpdir(), `ci-hook-test-${Date.now()}`);
    mkdirSync(tempHome, { recursive: true });
  });

  after(() => {
    rmSync(tempHome, { recursive: true, force: true });
  });

  it("exits 0 with empty input", () => {
    const result = execSync(`echo '' | bash "${HOOK_SCRIPT}"`, {
      env: { ...process.env, HOME: tempHome },
      encoding: "utf8",
      timeout: 5000,
    });
    // Should not throw
    assert.ok(true, "Hook should exit 0 with empty input");
  });

  it("exits 0 with valid tool call JSON", () => {
    const payload = JSON.stringify({
      tool_name: "Read",
      session_id: "test-session-123",
      tool_input: { file_path: "/tmp/test.txt" },
    });

    execSync(`printf '%s' '${payload.replace(/'/g, "'\\''")}' | bash "${HOOK_SCRIPT}"`, {
      env: { ...process.env, HOME: tempHome },
      encoding: "utf8",
      timeout: 5000,
    });
    assert.ok(true, "Hook should exit 0 with valid input");
  });

  it("writes observation to JSONL file", () => {
    const payload = JSON.stringify({
      tool_name: "Bash",
      session_id: "test-session-456",
      tool_input: { command: "ls" },
    });

    execSync(
      `printf '%s' '${payload.replace(/'/g, "'\\''")}' | bash "${HOOK_SCRIPT}"`,
      {
        env: {
          ...process.env,
          HOME: tempHome,
          CLAUDE_PROJECT_DIR: "/tmp/test-project",
        },
        encoding: "utf8",
        timeout: 5000,
      }
    );

    // Find the observations file
    const instinctsDir = join(tempHome, ".claude", "instincts");
    assert.ok(existsSync(instinctsDir), "instincts dir should be created");

    // Check that some project directory was created with observations

    const dirs = readdirSync(instinctsDir).filter(
      (d) => d !== "global" && d !== "observe.sh"
    );
    assert.ok(dirs.length > 0, "Should have created a project directory");

    const obsFile = join(instinctsDir, dirs[0], "observations.jsonl");
    assert.ok(existsSync(obsFile), "observations.jsonl should exist");

    const content = readFileSync(obsFile, "utf8").trim();
    const lines = content.split("\n");
    assert.ok(lines.length >= 1, "Should have at least one observation");

    const obs = JSON.parse(lines[lines.length - 1]);
    assert.equal(obs.tool, "Bash", "Tool name should be Bash");
    assert.equal(obs.event, "tool_start", "Event should be tool_start");
    assert.ok(obs.ts, "Should have timestamp");
    assert.ok(obs.project_id, "Should have project_id");
  });

  it("writes project.json for new projects", () => {
    const instinctsDir = join(tempHome, ".claude", "instincts");

    const dirs = readdirSync(instinctsDir).filter(
      (d) => d !== "global" && d !== "observe.sh"
    );

    const projectJson = join(instinctsDir, dirs[0], "project.json");
    assert.ok(existsSync(projectJson), "project.json should exist");

    const project = JSON.parse(readFileSync(projectJson, "utf8"));
    assert.ok(project.id, "Should have id");
    assert.ok(project.name, "Should have name");
    assert.ok(project.created_at, "Should have created_at");
  });

  it("handles tool_complete events", () => {
    const payload = JSON.stringify({
      tool_name: "Read",
      session_id: "test-session-789",
      tool_input: { file_path: "/tmp/test.txt" },
      tool_output: { content: "file contents here" },
    });

    execSync(
      `printf '%s' '${payload.replace(/'/g, "'\\''")}' | bash "${HOOK_SCRIPT}"`,
      {
        env: {
          ...process.env,
          HOME: tempHome,
          CLAUDE_PROJECT_DIR: "/tmp/test-project",
        },
        encoding: "utf8",
        timeout: 5000,
      }
    );

    const instinctsDir = join(tempHome, ".claude", "instincts");

    const dirs = readdirSync(instinctsDir).filter(
      (d) => d !== "global" && d !== "observe.sh"
    );
    const obsFile = join(instinctsDir, dirs[0], "observations.jsonl");
    const lines = readFileSync(obsFile, "utf8").trim().split("\n");
    const lastObs = JSON.parse(lines[lines.length - 1]);
    assert.equal(lastObs.event, "tool_complete", "Should detect tool_complete event");
  });

  it("completes within 200ms", () => {
    const payload = JSON.stringify({
      tool_name: "Grep",
      session_id: "perf-test",
      tool_input: { pattern: "test" },
    });

    const start = performance.now();
    execSync(
      `printf '%s' '${payload.replace(/'/g, "'\\''")}' | bash "${HOOK_SCRIPT}"`,
      {
        env: {
          ...process.env,
          HOME: tempHome,
          CLAUDE_PROJECT_DIR: "/tmp/test-project",
        },
        encoding: "utf8",
        timeout: 5000,
      }
    );
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 200, `Hook should complete within 200ms (took ${elapsed.toFixed(0)}ms)`);
  });
});
