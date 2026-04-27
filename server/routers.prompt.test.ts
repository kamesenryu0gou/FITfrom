/**
 * routers.prompt.test.ts
 *
 * Verifies the "Ultra-Precision Fantasy Illustration" prompt structure:
 * 5 Absolute Rendering Rules applied to all character classes.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const routersSource = readFileSync(
  resolve(__dirname, "./routers.ts"),
  "utf-8"
);

describe("Ultra-Precision Fantasy Illustration — 5 Absolute Rules", () => {

  it("RULE 1: Facial Expression Sync — exact expression mechanics required", () => {
    expect(routersSource).toContain("FACIAL EXPRESSION SYNC");
    expect(routersSource).toContain("RULE 1");
    expect(routersSource).toContain("smile shape");
    expect(routersSource).toContain("eye squint");
    expect(routersSource).toContain("lip corner");
    expect(routersSource).toContain("Not one pixel of the face");
  });

  it("RULE 2: Object Translation — fantasy replacement logic present", () => {
    expect(routersSource).toContain("OBJECT TRANSLATION");
    expect(routersSource).toContain("RULE 2");
    expect(routersSource).toContain("Elemental energy crystal");
    expect(routersSource).toContain("Ancient spellbook");
    expect(routersSource).toContain("Throne of the holy knight");
    expect(routersSource).toContain("Crystal orb");
  });

  it("RULE 3: SSR Quality Standard — no cheap line art", () => {
    expect(routersSource).toContain("SSR QUALITY STANDARD");
    expect(routersSource).toContain("RULE 3");
    expect(routersSource).toContain("High-end 2D game splash art");
    expect(routersSource).toContain("Detailed fabric folds");
    expect(routersSource).toContain("Soft global illumination");
    expect(routersSource).toContain("digital painting");
    expect(routersSource).toContain("NOT flat");
  });

  it("RULE 4: Color Palette Inheritance — photo colors carried into costume", () => {
    expect(routersSource).toContain("COLOR PALETTE INHERITANCE");
    expect(routersSource).toContain("RULE 4");
    expect(routersSource).toContain("dominant colors of the person");
    expect(routersSource).toContain("PRIMARY colors of the fantasy costume");
    expect(routersSource).toContain("warmth or coolness of the photo");
  });

  it("RULE 5: Pose & Face Lock — zero deviation from photo", () => {
    expect(routersSource).toContain("POSE & FACE LOCK");
    expect(routersSource).toContain("RULE 5");
    expect(routersSource).toContain("zero deviation");
    expect(routersSource).toContain("non-negotiable");
  });

  it("MASTER_RULE shared constant is applied to all 5 character classes", () => {
    expect(routersSource).toContain("const MASTER_RULE =");
    const masterRuleUsageCount = (routersSource.match(/\$\{MASTER_RULE\}/g) || []).length;
    expect(masterRuleUsageCount).toBe(5);
  });

  it("GPT-4o performs 6-axis analysis including expression and objects", () => {
    expect(routersSource).toContain("AXIS 1: FACIAL EXPRESSION MECHANICS");
    expect(routersSource).toContain("AXIS 4: HELD OBJECTS & BACKGROUND");
    expect(routersSource).toContain("AXIS 5: COLOR PALETTE & WARMTH");
    expect(routersSource).toContain("AXIS 6: POSE & BODY");
    expect(routersSource).toContain("max_tokens: 1200");
  });

  it("all 5 character classes are defined", () => {
    expect(routersSource).toContain("Hero:");
    expect(routersSource).toContain("Priest:");
    expect(routersSource).toContain("Mage:");
    expect(routersSource).toContain("DemonLord:");
    expect(routersSource).toContain("Swordsman:");
  });

  it("each class prompt specifies Object Translation for held items", () => {
    // Each class should have its own object translation section
    const objectTranslationCount = (routersSource.match(/Object Translation:/g) || []).length;
    expect(objectTranslationCount).toBe(5);
  });

  it("each class prompt specifies Color Palette Inherited from Photo", () => {
    const colorInheritanceCount = (routersSource.match(/Color Palette Inherited from Photo/g) || []).length;
    expect(colorInheritanceCount).toBe(5);
  });

  it("DALL-E 3 uses style=natural for maximum likeness", () => {
    expect(routersSource).toContain('style: "natural"');
  });

  it("SSR quality level is stated in each class prompt", () => {
    const ssrCount = (routersSource.match(/SSR-tier 2D game splash art/g) || []).length;
    expect(ssrCount).toBe(5);
  });
});
