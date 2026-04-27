/**
 * routers.prompt.test.ts
 *
 * Verifies that the Likeness-First prompt structure is correctly applied
 * to all 5 character classes in the AI anime conversion feature.
 *
 * These tests do NOT call external APIs — they validate the prompt
 * construction logic by inspecting the exported CHARACTER_PROMPTS structure
 * via a white-box approach through the router module.
 */

import { describe, it, expect } from "vitest";

// We test the prompt logic by importing the module and checking the
// generated prompt strings contain the required identity preservation markers.

// Since CHARACTER_PROMPTS is not exported, we validate through the
// card.convertToAnime procedure's input validation and the module structure.
// The actual prompt content is validated by parsing the source file.

import { readFileSync } from "fs";
import { resolve } from "path";

const routersSource = readFileSync(
  resolve(__dirname, "./routers.ts"),
  "utf-8"
);

describe("Likeness-First Prompt Structure", () => {
  it("contains the IDENTITY PRESERVATION RULE block", () => {
    expect(routersSource).toContain("[IDENTITY PRESERVATION RULE]");
    expect(routersSource).toContain("Primary Goal: Create a \"Stylized Anime Portrait\"");
    expect(routersSource).toContain("Face Mapping (HIGHEST PRIORITY)");
    expect(routersSource).toContain("Caricature Approach");
  });

  it("uses Semi-chibi instead of plain Chibi", () => {
    expect(routersSource).toContain("Semi-chibi");
    // Should NOT have standalone "chibi HERO" / "chibi PRIEST" etc. (old style)
    expect(routersSource).not.toContain("chibi HERO");
    expect(routersSource).not.toContain("chibi PRIEST");
    expect(routersSource).not.toContain("chibi MAGE");
    expect(routersSource).not.toContain("chibi DEMON");
    expect(routersSource).not.toContain("chibi SWORDSMAN");
  });

  it("uses Dragon Quest-style Cosplay/Outfit instead of Dragon Quest-inspired", () => {
    expect(routersSource).toContain("Dragon Quest-style Cosplay/Outfit");
  });

  it("sets DALL-E 3 style to natural for better likeness", () => {
    expect(routersSource).toContain('style: "natural"');
  });

  it("contains all 5 character class prompts", () => {
    expect(routersSource).toContain("Hero:");
    expect(routersSource).toContain("Priest:");
    expect(routersSource).toContain("Mage:");
    expect(routersSource).toContain("DemonLord:");
    expect(routersSource).toContain("Swordsman:");
  });

  it("GPT-4o system prompt prioritizes facial identity", () => {
    expect(routersSource).toContain("LIKENESS-FIRST analysis");
    expect(routersSource).toContain("INSTANTLY RECOGNIZABLE");
    expect(routersSource).toContain("FACE (HIGHEST PRIORITY)");
  });

  it("GPT-4o max_tokens increased to 900 for richer description", () => {
    expect(routersSource).toContain("max_tokens: 900");
  });

  it("IDENTITY_RULE is shared and applied to all character prompts", () => {
    // The shared constant should appear once as a definition
    expect(routersSource).toContain("const IDENTITY_RULE =");
    // And be referenced in each character prompt template
    const identityRuleUsageCount = (routersSource.match(/\$\{IDENTITY_RULE\}/g) || []).length;
    expect(identityRuleUsageCount).toBe(5); // One per character class
  });

  it("Likeness Over Style principle is stated", () => {
    expect(routersSource).toContain("Likeness Over Style");
    expect(routersSource).toContain("ALWAYS prioritize facial likeness");
  });
});
