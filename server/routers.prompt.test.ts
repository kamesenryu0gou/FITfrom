/**
 * routers.prompt.test.ts
 *
 * Verifies the 3 Critical Fixes applied to the AI image generation prompts:
 * FIX 1: STRICT NO TEXT — no letters/numbers/captions in generated image
 * FIX 2: STOP AGE REDUCTION — mature adult male (late 30s–50s) enforced
 * FIX 3: HIGH-END TCG THICK PAINT — rich digital painting quality
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const routersSource = readFileSync(
  resolve(__dirname, "./routers.ts"),
  "utf-8"
);

describe("Critical Fix 1: STRICT NO TEXT — zero text in generated image", () => {
  it("NO_TEXT_BLOCK constant is defined", () => {
    expect(routersSource).toContain("const NO_TEXT_BLOCK =");
    expect(routersSource).toContain("PURE ARTWORK ONLY");
  });

  it("explicitly forbids alphabet letters in image", () => {
    expect(routersSource).toContain("Any alphabet letters");
    expect(routersSource).toContain("A-Z, a-z");
  });

  it("explicitly forbids numbers in image", () => {
    expect(routersSource).toContain("Any numbers (0-9)");
  });

  it("explicitly forbids captions and watermarks", () => {
    expect(routersSource).toContain("captions");
    expect(routersSource).toContain("watermarks");
  });

  it("NO TEXT rule applied to all 5 character prompts via MASTER_RULE", () => {
    expect(routersSource).toContain("NO TEXT anywhere in the image");
    // Count per-class "NO TEXT" statements (one per class prompt)
    const noTextCount = (routersSource.match(/NO TEXT anywhere in the image/g) || []).length;
    expect(noTextCount).toBe(5);
  });

  it("NO_TEXT_BLOCK is included in MASTER_RULE", () => {
    expect(routersSource).toContain("${NO_TEXT_BLOCK}");
  });
});

describe("Critical Fix 2: STOP AGE REDUCTION — mature adult male enforced", () => {
  it("AGE_ANCHOR_BLOCK constant is defined", () => {
    expect(routersSource).toContain("const AGE_ANCHOR_BLOCK =");
    expect(routersSource).toContain("CRITICAL AGE & MATURITY RULE");
  });

  it("specifies late 30s to 50s age range", () => {
    expect(routersSource).toContain("late 30s to 50s");
  });

  it("forbids making character look younger", () => {
    expect(routersSource).toContain("Making the character look younger than the photo");
  });

  it("forbids enlarging eyes beyond adult proportions", () => {
    expect(routersSource).toContain("Enlarging the eyes beyond natural adult proportions");
  });

  it("forbids removing or softening facial hair", () => {
    expect(routersSource).toContain("Removing or softening facial hair");
  });

  it("forbids slimming jaw or chin", () => {
    expect(routersSource).toContain("Slimming the jaw or chin");
  });

  it("each class prompt explicitly states subject is NOT a teenager", () => {
    const notTeenagerCount = (routersSource.match(/He is NOT a teenager/g) || []).length;
    expect(notTeenagerCount).toBe(5);
  });

  it("GPT-4o system prompt anchors subject as mature adult male", () => {
    expect(routersSource).toContain("MATURE ADULT MALE (late 30s to 50s)");
    expect(routersSource).toContain("do NOT say young or teenage");
  });

  it("GPT-4o analysis explicitly requests facial hair description", () => {
    expect(routersSource).toContain("FACIAL HAIR (CRITICAL)");
    expect(routersSource).toContain("stubble (density, length, color)");
  });
});

describe("Critical Fix 3: HIGH-END TCG THICK PAINT — rich digital painting quality", () => {
  it("THICK_PAINT_BLOCK constant is defined", () => {
    expect(routersSource).toContain("const THICK_PAINT_BLOCK =");
    expect(routersSource).toContain("HIGH-END TCG DIGITAL PAINTING");
  });

  it("specifies rich thick digital painting style", () => {
    expect(routersSource).toContain("Rich, thick digital painting");
    expect(routersSource).toContain("NOT flat anime cel shading");
  });

  it("specifies fabric texture requirements", () => {
    expect(routersSource).toContain("Visible weave, cloth weight, fold shadows");
  });

  it("specifies skin subsurface scattering", () => {
    expect(routersSource).toContain("Subsurface scattering");
  });

  it("specifies metal texture requirements", () => {
    expect(routersSource).toContain("Specular highlights, scratches, engraving details");
  });

  it("forbids cheap flat line art", () => {
    expect(routersSource).toContain("Cheap flat line art");
  });

  it("specifies grand fantasy landscape background", () => {
    expect(routersSource).toContain("Grand fantasy landscape");
  });
});

describe("All 3 fixes integrated into MASTER_RULE and applied to all 5 classes", () => {
  it("MASTER_RULE includes all 3 fix blocks", () => {
    expect(routersSource).toContain("${NO_TEXT_BLOCK}");
    expect(routersSource).toContain("${AGE_ANCHOR_BLOCK}");
    expect(routersSource).toContain("${THICK_PAINT_BLOCK}");
  });

  it("MASTER_RULE is applied to all 5 character classes", () => {
    const masterRuleCount = (routersSource.match(/\$\{MASTER_RULE\}/g) || []).length;
    expect(masterRuleCount).toBe(5);
  });

  it("all 5 character classes are present", () => {
    expect(routersSource).toContain("Hero:");
    expect(routersSource).toContain("Priest:");
    expect(routersSource).toContain("Mage:");
    expect(routersSource).toContain("DemonLord:");
    expect(routersSource).toContain("Swordsman:");
  });

  it("DALL-E 3 uses style=natural for maximum likeness", () => {
    expect(routersSource).toContain('style: "natural"');
  });

  it("DALL-E 3 uses HD quality", () => {
    expect(routersSource).toContain('quality: "hd"');
  });
});
