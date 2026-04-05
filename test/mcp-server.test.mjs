import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const MCP_SERVER = join(__dirname, "..", "bin", "mcp-server.mjs");

/**
 * Reliable MCP stdio client for testing.
 * Buffers all stdout and extracts Content-Length framed messages.
 */
class McpTestClient {
  constructor(proc) {
    this.proc = proc;
    this.buffer = Buffer.alloc(0);
    this.resolvers = []; // queue of {resolve, reject, timer}

    proc.stdout.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this._drain();
    });
  }

  _drain() {
    while (this.resolvers.length > 0) {
      const str = this.buffer.toString("utf8");
      const headerMatch = str.match(/^Content-Length: (\d+)\r\n\r\n/);
      if (!headerMatch) break;

      const headerLen = headerMatch[0].length;
      const bodyLen = parseInt(headerMatch[1]);
      if (this.buffer.length < headerLen + bodyLen) break;

      const bodyStr = this.buffer.slice(headerLen, headerLen + bodyLen).toString("utf8");
      this.buffer = this.buffer.slice(headerLen + bodyLen);

      const { resolve, timer } = this.resolvers.shift();
      clearTimeout(timer);
      try {
        resolve(JSON.parse(bodyStr));
      } catch (e) {
        resolve({ error: { message: `JSON parse failed: ${e.message}` } });
      }
    }
  }

  send(msg) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.resolvers.findIndex((r) => r.timer === timer);
        if (idx !== -1) this.resolvers.splice(idx, 1);
        reject(new Error(`Timeout waiting for response to ${msg.method || msg.id}`));
      }, 8000);

      this.resolvers.push({ resolve, reject, timer });
      this.proc.stdin.write(JSON.stringify(msg) + "\n");

      // Try draining immediately in case data already buffered
      this._drain();
    });
  }

  destroy() {
    for (const r of this.resolvers) clearTimeout(r.timer);
    this.resolvers = [];
    this.proc.kill();
  }
}

describe("MCP server — beginner mode", () => {
  let client;
  let tempHome;

  before(async () => {
    tempHome = join(tmpdir(), `ci-mcp-test-${Date.now()}`);
    mkdirSync(join(tempHome, ".claude", "instincts", "global"), { recursive: true });

    const proc = spawn("node", [MCP_SERVER, "--mode", "beginner"], {
      env: { ...process.env, HOME: tempHome },
      stdio: ["pipe", "pipe", "pipe"],
    });
    client = new McpTestClient(proc);

    // Wait a moment for server to start
    await new Promise((r) => setTimeout(r, 200));
  });

  after(() => {
    client.destroy();
    rmSync(tempHome, { recursive: true, force: true });
  });

  it("responds to initialize", async () => {
    const resp = await client.send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
    assert.equal(resp.result.serverInfo.name, "continuous-improvement");
    assert.equal(resp.result.serverInfo.version, "3.0.0");
  });

  it("lists beginner tools only (3 tools)", async () => {
    const resp = await client.send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    const names = resp.result.tools.map((t) => t.name);
    assert.equal(names.length, 3);
    assert.ok(names.includes("ci_status"));
    assert.ok(names.includes("ci_instincts"));
    assert.ok(names.includes("ci_reflect"));
    assert.ok(!names.includes("ci_reinforce"), "Should NOT include expert tools");
  });

  it("ci_status returns project info", async () => {
    const resp = await client.send({
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "ci_status", arguments: {} },
    });
    const text = resp.result.content[0].text;
    assert.match(text, /Level:/, "Should include level");
    assert.match(text, /Observations:/, "Should include observation count");
    assert.match(text, /beginner/, "Should show beginner mode");
  });

  it("ci_instincts returns empty message when no instincts", async () => {
    const resp = await client.send({
      jsonrpc: "2.0", id: 4, method: "tools/call",
      params: { name: "ci_instincts", arguments: {} },
    });
    const text = resp.result.content[0].text;
    assert.match(text, /No instincts found/i);
  });

  it("ci_reflect returns reflection template", async () => {
    const resp = await client.send({
      jsonrpc: "2.0", id: 5, method: "tools/call",
      params: { name: "ci_reflect", arguments: { summary: "Fixed a login bug" } },
    });
    const text = resp.result.content[0].text;
    assert.match(text, /Fixed a login bug/);
    assert.match(text, /What worked/);
    assert.match(text, /What failed/);
  });

  it("rejects expert tools in beginner mode", async () => {
    const resp = await client.send({
      jsonrpc: "2.0", id: 6, method: "tools/call",
      params: { name: "ci_reinforce", arguments: { instinct_id: "test", accepted: true } },
    });
    assert.ok(resp.result.isError, "Should return error for expert tool in beginner mode");
  });

  it("lists resources", async () => {
    const resp = await client.send({ jsonrpc: "2.0", id: 7, method: "resources/list", params: {} });
    assert.ok(resp.result.resources.length >= 1, "Should list at least 1 resource");
    const uris = resp.result.resources.map((r) => r.uri);
    assert.ok(uris.some((u) => u.includes("instincts://")));
  });
});

describe("MCP server — expert mode", () => {
  let client;
  let tempHome;

  before(async () => {
    tempHome = join(tmpdir(), `ci-mcp-expert-${Date.now()}`);
    mkdirSync(join(tempHome, ".claude", "instincts", "global"), { recursive: true });

    const proc = spawn("node", [MCP_SERVER, "--mode", "expert"], {
      env: { ...process.env, HOME: tempHome },
      stdio: ["pipe", "pipe", "pipe"],
    });
    client = new McpTestClient(proc);
    await new Promise((r) => setTimeout(r, 200));
  });

  after(() => {
    client.destroy();
    rmSync(tempHome, { recursive: true, force: true });
  });

  it("lists all 8 tools in expert mode", async () => {
    await client.send({ jsonrpc: "2.0", id: 10, method: "initialize", params: {} });
    const resp = await client.send({ jsonrpc: "2.0", id: 11, method: "tools/list", params: {} });
    const names = resp.result.tools.map((t) => t.name);
    assert.equal(names.length, 8, `Expected 8 tools, got ${names.length}: ${names.join(", ")}`);
    assert.ok(names.includes("ci_reinforce"));
    assert.ok(names.includes("ci_create_instinct"));
    assert.ok(names.includes("ci_observations"));
    assert.ok(names.includes("ci_export"));
    assert.ok(names.includes("ci_import"));
  });

  it("ci_export returns JSON array", async () => {
    const resp = await client.send({
      jsonrpc: "2.0", id: 12, method: "tools/call",
      params: { name: "ci_export", arguments: { scope: "all" } },
    });
    const text = resp.result.content[0].text;
    const parsed = JSON.parse(text);
    assert.ok(Array.isArray(parsed), "Export should return JSON array");
  });

  it("ci_create_instinct creates a new instinct", async () => {
    const resp = await client.send({
      jsonrpc: "2.0", id: 13, method: "tools/call",
      params: {
        name: "ci_create_instinct",
        arguments: {
          id: "new-test-instinct",
          trigger: "when writing code",
          body: "Write tests first",
          confidence: 0.7,
        },
      },
    });
    const text = resp.result.content[0].text;
    assert.match(text, /Created instinct/);
    assert.match(text, /new-test-instinct/);
  });

  it("ci_import imports and reports count", async () => {
    const importData = JSON.stringify([
      { id: "imported-unique-1", trigger: "when deploying", body: "Check CI first", confidence: 0.5 },
      { id: "imported-unique-2", trigger: "when reviewing", body: "Check coverage", confidence: 0.5 },
    ]);

    const resp = await client.send({
      jsonrpc: "2.0", id: 14, method: "tools/call",
      params: { name: "ci_import", arguments: { instincts_json: importData } },
    });
    const text = resp.result.content[0].text;
    assert.match(text, /Imported \d+/);
  });

  it("returns error for unknown method", async () => {
    const resp = await client.send({ jsonrpc: "2.0", id: 15, method: "nonexistent/method", params: {} });
    assert.ok(resp.error, "Should return error for unknown method");
    assert.equal(resp.error.code, -32601);
  });
});

describe("Plugin configs", () => {
  it("beginner.json is valid and has 3 tools", () => {
    const config = JSON.parse(
      readFileSync(join(__dirname, "..", "plugins", "beginner.json"), "utf8")
    );
    assert.equal(config.mode, "beginner");
    assert.equal(config.tools.length, 3);
    assert.equal(config.version, "3.0.0");
  });

  it("expert.json is valid and has 8 tools", () => {
    const config = JSON.parse(
      readFileSync(join(__dirname, "..", "plugins", "expert.json"), "utf8")
    );
    assert.equal(config.mode, "expert");
    assert.equal(config.tools.length, 8);
    assert.equal(config.version, "3.0.0");
  });
});
