import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PACKS_DIR = join(__dirname, "..", "instinct-packs");

describe("instinct-packs directory", () => {
  it("exists", () => {
    assert.ok(existsSync(PACKS_DIR), "instinct-packs/ directory should exist");
  });

  it("contains at least 3 packs", () => {
    const packs = readdirSync(PACKS_DIR).filter((f) => f.endsWith(".json"));
    assert.ok(packs.length >= 3, `Expected at least 3 packs, got ${packs.length}`);
  });
});

for (const packName of ["react", "python", "go"]) {
  describe(`instinct-packs/${packName}.json`, () => {
    let instincts;

    it("is valid JSON", () => {
      const content = readFileSync(join(PACKS_DIR, `${packName}.json`), "utf8");
      instincts = JSON.parse(content);
    });

    it("is a non-empty array", () => {
      assert.ok(Array.isArray(instincts), "Should be an array");
      assert.ok(instincts.length >= 5, `Expected at least 5 instincts, got ${instincts.length}`);
    });

    it("each instinct has required fields", () => {
      for (const inst of instincts) {
        assert.ok(inst.id, `Instinct missing id: ${JSON.stringify(inst)}`);
        assert.ok(inst.trigger, `Instinct ${inst.id} missing trigger`);
        assert.ok(inst.body, `Instinct ${inst.id} missing body`);
        assert.ok(typeof inst.confidence === "number", `Instinct ${inst.id} confidence must be a number`);
      }
    });

    it("all IDs are unique", () => {
      const ids = instincts.map((i) => i.id);
      const unique = new Set(ids);
      assert.equal(unique.size, ids.length, `Duplicate IDs found: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);
    });

    it("IDs are kebab-case", () => {
      for (const inst of instincts) {
        assert.match(inst.id, /^[a-z][a-z0-9-]+$/, `ID "${inst.id}" should be kebab-case`);
      }
    });

    it("confidence values are in valid range (0.0-0.9)", () => {
      for (const inst of instincts) {
        assert.ok(inst.confidence >= 0 && inst.confidence <= 0.9, `Instinct ${inst.id} confidence ${inst.confidence} out of range`);
      }
    });

    it("domain is a valid value", () => {
      const validDomains = ["workflow", "patterns", "testing", "tooling", "code-style"];
      for (const inst of instincts) {
        assert.ok(
          validDomains.includes(inst.domain),
          `Instinct ${inst.id} has invalid domain "${inst.domain}". Valid: ${validDomains.join(", ")}`
        );
      }
    });

    it("body is substantive (at least 20 chars)", () => {
      for (const inst of instincts) {
        assert.ok(inst.body.length >= 20, `Instinct ${inst.id} body too short: "${inst.body}"`);
      }
    });

    it("trigger starts with 'when'", () => {
      for (const inst of instincts) {
        assert.match(inst.trigger.toLowerCase(), /^when/, `Instinct ${inst.id} trigger should start with "when": "${inst.trigger}"`);
      }
    });
  });
}
