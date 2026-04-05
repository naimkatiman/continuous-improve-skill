#!/usr/bin/env node

/**
 * continuous-improvement MCP Server
 *
 * Exposes instincts, observations, and reflection as MCP tools + resources.
 * Two modes: beginner (3 tools) and expert (all tools).
 *
 * Usage:
 *   node bin/mcp-server.mjs                  # default: beginner mode
 *   node bin/mcp-server.mjs --mode expert    # all tools
 *   node bin/mcp-server.mjs --mode beginner  # explicit beginner
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const VERSION = "3.0.0";
const INSTINCTS_DIR = join(homedir(), ".claude", "instincts");
const GLOBAL_DIR = join(INSTINCTS_DIR, "global");

const args = process.argv.slice(2);
const modeIdx = args.indexOf("--mode");
const MODE = modeIdx !== -1 && args[modeIdx + 1] ? args[modeIdx + 1] : "beginner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProjectHash() {
  try {
    const root = execSync("git rev-parse --show-toplevel 2>/dev/null", { encoding: "utf8" }).trim();
    const hash = execSync(`printf '%s' "${root}" | sha256sum | cut -c1-12`, {
      encoding: "utf8",
      shell: "/bin/bash",
    }).trim();
    return { root, hash, name: basename(root) };
  } catch {
    return { root: "global", hash: "global", name: "global" };
  }
}

function readInstincts(projectHash) {
  const instincts = [];
  const dirs = [GLOBAL_DIR];
  if (projectHash !== "global") {
    dirs.push(join(INSTINCTS_DIR, projectHash));
  }

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".yaml")) continue;
      try {
        const content = readFileSync(join(dir, file), "utf8");
        const parsed = parseYamlInstinct(content);
        if (parsed) instincts.push(parsed);
      } catch {
        // skip malformed files
      }
    }
  }
  return instincts;
}

function parseYamlInstinct(content) {
  const lines = content.split("\n");
  const meta = {};
  let body = "";
  let inBody = false;

  for (const line of lines) {
    if (line.trim() === "---" && Object.keys(meta).length > 0) {
      inBody = true;
      continue;
    }
    if (inBody) {
      body += line + "\n";
    } else {
      const match = line.match(/^(\w[\w_-]*):\s*(.+)/);
      if (match) {
        let val = match[2].trim().replace(/^["']|["']$/g, "");
        if (!isNaN(val) && val !== "") val = parseFloat(val);
        meta[match[1]] = val;
      }
    }
  }

  if (!meta.id) return null;
  return { ...meta, body: body.trim() };
}

function countObservations(projectHash) {
  const obsFile = join(INSTINCTS_DIR, projectHash, "observations.jsonl");
  if (!existsSync(obsFile)) return 0;
  try {
    const content = readFileSync(obsFile, "utf8");
    return content.split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

function getRecentObservations(projectHash, limit = 50) {
  const obsFile = join(INSTINCTS_DIR, projectHash, "observations.jsonl");
  if (!existsSync(obsFile)) return [];
  try {
    const lines = readFileSync(obsFile, "utf8").split("\n").filter((l) => l.trim());
    return lines.slice(-limit).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function detectLevel(projectHash) {
  const obsCount = countObservations(projectHash);
  const instincts = readInstincts(projectHash);
  const hasHighConfidence = instincts.some((i) => i.confidence >= 0.7);
  const hasMidConfidence = instincts.some((i) => i.confidence >= 0.5 && i.confidence < 0.7);

  if (hasHighConfidence) return "AUTO-APPLY";
  if (hasMidConfidence) return "SUGGEST";
  if (obsCount >= 20 || instincts.length > 0) return "ANALYZE";
  return "CAPTURE";
}

function writeInstinct(projectHash, instinct) {
  const dir = instinct.scope === "global" ? GLOBAL_DIR : join(INSTINCTS_DIR, projectHash);
  mkdirSync(dir, { recursive: true });

  const yaml = [
    `id: ${instinct.id}`,
    `trigger: "${instinct.trigger}"`,
    `confidence: ${instinct.confidence}`,
    `domain: ${instinct.domain || "workflow"}`,
    `source: ${instinct.source || "manual"}`,
    `scope: ${instinct.scope || "project"}`,
    `project_id: ${projectHash}`,
    `created: "${new Date().toISOString().split("T")[0]}"`,
    `last_seen: "${new Date().toISOString().split("T")[0]}"`,
    `observation_count: ${instinct.observation_count || 1}`,
    "---",
    instinct.body,
  ].join("\n");

  writeFileSync(join(dir, `${instinct.id}.yaml`), yaml + "\n");
}

function updateInstinctConfidence(projectHash, instinctId, delta) {
  const instincts = readInstincts(projectHash);
  const instinct = instincts.find((i) => i.id === instinctId);
  if (!instinct) return null;

  const newConf = Math.max(0, Math.min(0.9, (instinct.confidence || 0.5) + delta));
  instinct.confidence = Math.round(newConf * 100) / 100;
  instinct.last_seen = new Date().toISOString().split("T")[0];
  writeInstinct(projectHash, instinct);
  return instinct;
}

// ---------------------------------------------------------------------------
// MCP Protocol (JSON-RPC over stdio, no SDK dependency)
// ---------------------------------------------------------------------------

const BEGINNER_TOOLS = [
  {
    name: "ci_status",
    description: "Show current level, instinct count, and observation count for this project. Good starting point to see what the system has learned.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "ci_instincts",
    description: "List all learned instincts for this project with their confidence levels and behaviors.",
    inputSchema: {
      type: "object",
      properties: {
        min_confidence: { type: "number", description: "Minimum confidence to show (default: 0)", default: 0 },
      },
      required: [],
    },
  },
  {
    name: "ci_reflect",
    description: "Generate a structured reflection for the current session. Provide a summary of what you worked on.",
    inputSchema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Brief summary of what was done this session" },
      },
      required: ["summary"],
    },
  },
];

const EXPERT_TOOLS = [
  {
    name: "ci_reinforce",
    description: "Accept or reject an instinct suggestion. Adjusts confidence: +0.15 for accept, -0.1 for reject.",
    inputSchema: {
      type: "object",
      properties: {
        instinct_id: { type: "string", description: "The instinct ID to reinforce" },
        accepted: { type: "boolean", description: "true = accept (+0.15), false = reject (-0.1)" },
      },
      required: ["instinct_id", "accepted"],
    },
  },
  {
    name: "ci_create_instinct",
    description: "Manually create a new instinct with a trigger, body, and starting confidence.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Unique instinct ID (kebab-case)" },
        trigger: { type: "string", description: "When this instinct applies" },
        body: { type: "string", description: "The behavior to follow" },
        confidence: { type: "number", description: "Starting confidence 0.0-0.9 (default: 0.6)", default: 0.6 },
        domain: { type: "string", description: "Domain: workflow|tooling|testing|patterns|code-style", default: "workflow" },
        scope: { type: "string", description: "Scope: project|global", default: "project" },
      },
      required: ["id", "trigger", "body"],
    },
  },
  {
    name: "ci_observations",
    description: "View recent tool call observations captured by hooks.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of recent observations to return (default: 20)", default: 20 },
      },
      required: [],
    },
  },
  {
    name: "ci_export",
    description: "Export all instincts as a JSON array for sharing or backup.",
    inputSchema: {
      type: "object",
      properties: {
        scope: { type: "string", description: "Which instincts: project|global|all (default: all)", default: "all" },
      },
      required: [],
    },
  },
  {
    name: "ci_import",
    description: "Import instincts from a JSON array. Skips duplicates by ID.",
    inputSchema: {
      type: "object",
      properties: {
        instincts_json: { type: "string", description: "JSON array of instinct objects to import" },
        scope: { type: "string", description: "Import to: project|global (default: project)", default: "project" },
      },
      required: ["instincts_json"],
    },
  },
];

function getAllTools() {
  if (MODE === "expert") return [...BEGINNER_TOOLS, ...EXPERT_TOOLS];
  return BEGINNER_TOOLS;
}

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

function handleTool(name, params) {
  const project = getProjectHash();

  switch (name) {
    case "ci_status": {
      const level = detectLevel(project.hash);
      const obsCount = countObservations(project.hash);
      const instincts = readInstincts(project.hash);
      const byConfidence = {
        silent: instincts.filter((i) => i.confidence < 0.5).length,
        suggest: instincts.filter((i) => i.confidence >= 0.5 && i.confidence < 0.7).length,
        autoApply: instincts.filter((i) => i.confidence >= 0.7).length,
      };

      return text([
        `## continuous-improvement Status`,
        ``,
        `**Project:** ${project.name}`,
        `**Level:** ${level}`,
        `**Observations:** ${obsCount}`,
        `**Instincts:** ${instincts.length} total`,
        `  - Silent (< 0.5): ${byConfidence.silent}`,
        `  - Suggest (0.5-0.69): ${byConfidence.suggest}`,
        `  - Auto-apply (0.7+): ${byConfidence.autoApply}`,
        ``,
        `**Mode:** ${MODE}`,
        level === "CAPTURE" ? `\n_Keep working — hooks are capturing. Analysis begins at 20 observations._` : "",
      ].join("\n"));
    }

    case "ci_instincts": {
      const minConf = params.min_confidence || 0;
      const instincts = readInstincts(project.hash).filter((i) => i.confidence >= minConf);

      if (instincts.length === 0) return text("No instincts found. Keep working — the system learns from your sessions.");

      const lines = instincts
        .sort((a, b) => b.confidence - a.confidence)
        .map((i) => {
          const behavior = i.confidence >= 0.7 ? "AUTO-APPLY" : i.confidence >= 0.5 ? "SUGGEST" : "silent";
          return `- **${i.id}** (${i.confidence}) [${behavior}]\n  Trigger: ${i.trigger}\n  ${i.body}`;
        });

      return text(`## Instincts for ${project.name}\n\n${lines.join("\n\n")}`);
    }

    case "ci_reflect": {
      const summary = params.summary || "No summary provided";
      const reflection = [
        `## Reflection — ${new Date().toISOString().split("T")[0]}`,
        ``,
        `**Session summary:** ${summary}`,
        ``,
        `Use this template to reflect:`,
        `- **What worked:**`,
        `- **What failed:**`,
        `- **What I'd do differently:**`,
        `- **Rule to add:** (becomes an instinct at 0.6 confidence)`,
      ].join("\n");

      return text(reflection);
    }

    case "ci_reinforce": {
      if (MODE !== "expert") return error("ci_reinforce requires expert mode. Start server with --mode expert");
      const delta = params.accepted ? 0.15 : -0.1;
      const updated = updateInstinctConfidence(project.hash, params.instinct_id, delta);
      if (!updated) return error(`Instinct "${params.instinct_id}" not found`);
      return text(`${params.accepted ? "Accepted" : "Rejected"} **${updated.id}** — confidence now ${updated.confidence}`);
    }

    case "ci_create_instinct": {
      if (MODE !== "expert") return error("ci_create_instinct requires expert mode");
      writeInstinct(project.hash, {
        id: params.id,
        trigger: params.trigger,
        body: params.body,
        confidence: params.confidence || 0.6,
        domain: params.domain || "workflow",
        source: "manual",
        scope: params.scope || "project",
        observation_count: 1,
      });
      return text(`Created instinct **${params.id}** with confidence ${params.confidence || 0.6}`);
    }

    case "ci_observations": {
      if (MODE !== "expert") return error("ci_observations requires expert mode");
      const limit = params.limit || 20;
      const obs = getRecentObservations(project.hash, limit);
      if (obs.length === 0) return text("No observations yet. Hooks capture tool calls automatically.");
      const lines = obs.map((o) => `[${o.ts}] ${o.event} — ${o.tool}`);
      return text(`## Recent Observations (${obs.length})\n\n${lines.join("\n")}`);
    }

    case "ci_export": {
      if (MODE !== "expert") return error("ci_export requires expert mode");
      const scope = params.scope || "all";
      let instincts = readInstincts(project.hash);
      if (scope === "project") instincts = instincts.filter((i) => i.scope === "project");
      if (scope === "global") instincts = instincts.filter((i) => i.scope === "global");
      return text(JSON.stringify(instincts, null, 2));
    }

    case "ci_import": {
      if (MODE !== "expert") return error("ci_import requires expert mode");
      let toImport;
      try {
        toImport = JSON.parse(params.instincts_json);
      } catch {
        return error("Invalid JSON. Provide a JSON array of instinct objects.");
      }
      if (!Array.isArray(toImport)) return error("Expected a JSON array");

      const existing = readInstincts(project.hash);
      const existingIds = new Set(existing.map((i) => i.id));
      let imported = 0;

      for (const inst of toImport) {
        if (!inst.id || !inst.trigger || !inst.body) continue;
        if (existingIds.has(inst.id)) continue;
        writeInstinct(project.hash, {
          ...inst,
          scope: params.scope || inst.scope || "project",
          source: "imported",
        });
        imported++;
      }

      return text(`Imported ${imported} instincts (${toImport.length - imported} skipped as duplicates)`);
    }

    default:
      return error(`Unknown tool: ${name}`);
  }
}

function text(t) {
  return { content: [{ type: "text", text: t }] };
}

function error(t) {
  return { content: [{ type: "text", text: t }], isError: true };
}

// ---------------------------------------------------------------------------
// JSON-RPC stdio transport (zero dependencies)
// ---------------------------------------------------------------------------

const rl = createInterface({ input: process.stdin, terminal: false });
let buffer = "";

rl.on("line", (line) => {
  buffer += line;
  try {
    const msg = JSON.parse(buffer);
    buffer = "";
    handleMessage(msg);
  } catch {
    // incomplete JSON, keep buffering
  }
});

function send(response) {
  const json = JSON.stringify(response);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}`);
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case "initialize":
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
          },
          serverInfo: {
            name: "continuous-improvement",
            version: VERSION,
          },
        },
      });
      break;

    case "notifications/initialized":
      // no response needed
      break;

    case "tools/list":
      send({
        jsonrpc: "2.0",
        id,
        result: { tools: getAllTools() },
      });
      break;

    case "tools/call": {
      const result = handleTool(params.name, params.arguments || {});
      send({ jsonrpc: "2.0", id, result });
      break;
    }

    case "resources/list": {
      const project = getProjectHash();
      const resources = [
        {
          uri: `instincts://project/${project.hash}`,
          name: `${project.name} instincts`,
          description: `Learned instincts for ${project.name}`,
          mimeType: "application/json",
        },
        {
          uri: "instincts://global",
          name: "Global instincts",
          description: "Cross-project instincts",
          mimeType: "application/json",
        },
      ];
      send({ jsonrpc: "2.0", id, result: { resources } });
      break;
    }

    case "resources/read": {
      const uri = params.uri;
      const project = getProjectHash();
      let instincts;

      if (uri === "instincts://global") {
        instincts = readInstincts("global").filter((i) => i.scope === "global");
      } else {
        instincts = readInstincts(project.hash);
      }

      send({
        jsonrpc: "2.0",
        id,
        result: {
          contents: [
            {
              uri,
              text: JSON.stringify(instincts, null, 2),
              mimeType: "application/json",
            },
          ],
        },
      });
      break;
    }

    default:
      if (id) {
        send({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
      }
  }
}

console.error(`continuous-improvement MCP server v${VERSION} started (mode: ${MODE})`);
