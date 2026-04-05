import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SKILL_PATH = join(__dirname, "..", "SKILL.md");

describe("SKILL.md", () => {
  let content;

  it("exists and is not empty", () => {
    content = readFileSync(SKILL_PATH, "utf8");
    assert.ok(content.length > 100, "SKILL.md should have substantial content");
  });

  it("has valid frontmatter", () => {
    assert.match(content, /^---\n/, "Should start with frontmatter");
    assert.match(content, /name: continuous-improvement/, "Should have name field");
    assert.match(content, /description:/, "Should have description field");
  });

  it("contains all 7 laws", () => {
    assert.match(content, /Law 1.*Research Before Executing/s);
    assert.match(content, /Law 2.*Plan Is Sacred/s);
    assert.match(content, /Law 3.*One Thing at a Time/s);
    assert.match(content, /Law 4.*Verify Before Reporting/s);
    assert.match(content, /Law 5.*Reflect After/s);
    assert.match(content, /Law 6.*Iterate/s);
    assert.match(content, /Law 7.*Learn From Every Session/s);
  });

  it("contains the loop", () => {
    assert.match(
      content,
      /Research.*Plan.*Execute.*Verify.*Reflect.*Learn.*Iterate/s
    );
  });

  it("contains instinct system documentation", () => {
    assert.match(content, /Mulahazah/i, "Should document Mulahazah system");
    assert.match(content, /confidence/i, "Should document confidence scoring");
    assert.match(content, /Auto-Level/i, "Should document auto-leveling");
  });

  it("contains instinct YAML format example", () => {
    assert.match(content, /id:/, "Should show instinct YAML format");
    assert.match(content, /trigger:/, "Should show trigger field");
    assert.match(content, /confidence:/, "Should show confidence field");
  });
});
